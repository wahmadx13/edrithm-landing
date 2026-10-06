const PINNED_REF = /^[0-9a-f]{40}$/;
const BLOCKING_SEVERITIES = new Set(['high', 'critical']);
const MAX_WAIVER_DAYS = 90;
const DAY_MS = 86_400_000;
const WAIVER_FIELDS = ['advisory', 'package', 'reason', 'owner', 'expires'];

const USES_KEY = /(?:^|[\s{,[-])["']?uses["']?\s*:\s*["']?([^"'\s#,}\]]*)/g;
const SAFE_NPM_COMMANDS = new Set(['ci', 'run', 'run-script', 'test', 'audit', 'sbom', 'ls', 'outdated']);
const OTHER_PACKAGE_RUNNERS = /\b(?:npx|pnpm|yarn|bun)\b/;

function codeLines(workflowText) {
  return workflowText.split(/\r?\n/).map((text, index) => ({ line: index + 1, text: text.replace(/(?:^|\s)#.*$/, '') }));
}

function usesReferences(workflowText) {
  return codeLines(workflowText).flatMap(({ line, text }) =>
    [...text.matchAll(USES_KEY)].map((match) => ({ line, reference: match[1] })),
  );
}

function isPinnedReference(reference) {
  if (reference.startsWith('./')) return true;
  if (reference.startsWith('docker://')) return /@sha256:[0-9a-f]{64}$/.test(reference);
  const at = reference.lastIndexOf('@');
  return at > 0 && PINNED_REF.test(reference.slice(at + 1));
}

export function findUnpinnedActions(workflowText) {
  return usesReferences(workflowText).filter(({ reference }) => !isPinnedReference(reference));
}

const SHELL_SEPARATORS = /&&|\|\||\$\(|[;|&`()]/;
const NPM_EXECUTABLE = /^(?:.*\/)?npm(?:\.cmd)?$/;
const BOOLEAN_NPM_FLAGS = new Set([
  '-s', '--silent', '-q', '--quiet', '-d', '--verbose',
  '--prefer-offline', '--prefer-online', '--offline', '--ignore-scripts', '--foreground-scripts',
]);

function npmSubcommand(tokens) {
  for (const token of tokens) {
    if (!token.startsWith('-')) return { command: token };
    const selfContained = token.includes('=') || token.startsWith('--no-') || BOOLEAN_NPM_FLAGS.has(token);
    if (!selfContained) return { ambiguousFlag: token };
  }
  return {};
}

function npmInvocations(text) {
  return text.split(SHELL_SEPARATORS).flatMap((segment) => {
    const tokens = segment.replace(/["']/g, ' ').trim().split(/\s+/);
    return tokens.flatMap((token, index) => (NPM_EXECUTABLE.test(token) ? [npmSubcommand(tokens.slice(index + 1))] : []));
  });
}

function npmCommands(text) {
  return npmInvocations(text).flatMap(({ command }) => (command ? [command] : []));
}

function isUnfrozen(text) {
  const invocations = npmInvocations(text);
  const unsafe = invocations.some(({ command, ambiguousFlag }) => ambiguousFlag || (command && !SAFE_NPM_COMMANDS.has(command)));
  return OTHER_PACKAGE_RUNNERS.test(text) || unsafe;
}

export function findInstallViolations(workflowText) {
  const lines = codeLines(workflowText);
  const violations = lines
    .filter(({ text }) => isUnfrozen(text))
    .map(({ line, text }) => `line ${line} unfrozen install or unreviewed npm command: ${text.trim()}`);
  const installs = lines.some(({ text }) => npmCommands(text).includes('ci'));
  return installs ? violations : [...violations, 'workflow never runs npm ci'];
}

function advisoryId(via) {
  const match = /GHSA-[a-z0-9-]+/i.exec(via.url ?? '');
  return match ? match[0] : String(via.source);
}

export function blockingAdvisories(report) {
  if (!report || typeof report.vulnerabilities !== 'object') {
    throw new Error('npm audit report is missing or malformed');
  }
  const found = new Map();
  for (const entry of Object.values(report.vulnerabilities)) {
    for (const via of entry.via) {
      if (typeof via !== 'object' || !BLOCKING_SEVERITIES.has(via.severity)) continue;
      found.set(advisoryId(via), { advisory: advisoryId(via), package: via.name, severity: via.severity, title: via.title });
    }
  }
  return found;
}

function parseDay(value) {
  const time = /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') ? Date.parse(`${value}T00:00:00Z`) : NaN;
  return Number.isNaN(time) ? null : time;
}

function waiverShapeErrors(waiver, today) {
  const missing = WAIVER_FIELDS.filter((field) => typeof waiver[field] !== 'string' || waiver[field].trim() === '');
  if (missing.length > 0) return [`waiver ${waiver.advisory ?? '?'} is missing ${missing.join(', ')}`];
  const expires = parseDay(waiver.expires);
  if (expires === null) return [`waiver ${waiver.advisory} has an invalid expiry ${waiver.expires}`];
  if (expires < today) return [`waiver ${waiver.advisory} expired on ${waiver.expires}`];
  if (expires - today > MAX_WAIVER_DAYS * DAY_MS) return [`waiver ${waiver.advisory} exceeds ${MAX_WAIVER_DAYS} days`];
  return [];
}

function waiverScopeErrors(waiver, full, runtime) {
  if (!full.has(waiver.advisory)) return [`waiver ${waiver.advisory} no longer matches a finding; remove it`];
  if (waiver.devOnly === true && runtime.has(waiver.advisory)) {
    return [`waiver ${waiver.advisory} is dev-only but the advisory reaches runtime dependencies`];
  }
  if (waiver.devOnly !== true && waiver.devOnly !== false) return [`waiver ${waiver.advisory} must state devOnly`];
  return [];
}

export function evaluateAudit({ fullReport, runtimeReport, waivers, today }) {
  const full = blockingAdvisories(fullReport);
  const runtime = blockingAdvisories(runtimeReport);
  const todayStart = parseDay(today);
  const errors = waivers.flatMap((waiver) => {
    const shape = waiverShapeErrors(waiver, todayStart);
    return shape.length > 0 ? shape : waiverScopeErrors(waiver, full, runtime);
  });
  const waived = new Set(waivers.map((waiver) => waiver.advisory));
  for (const finding of full.values()) {
    if (!waived.has(finding.advisory)) {
      errors.push(`unwaived ${finding.severity} advisory ${finding.advisory} in ${finding.package}: ${finding.title}`);
    }
  }
  return errors;
}

function packageName(lockPath, entry) {
  return entry.name ?? lockPath.slice(lockPath.lastIndexOf('node_modules/') + 'node_modules/'.length);
}

export function evaluateInstallScripts({ lock, allowlist }) {
  const reviewed = allowlist.packages ?? {};
  const present = new Set();
  const errors = [];
  for (const [lockPath, entry] of Object.entries(lock.packages ?? {})) {
    if (lockPath === '' || entry.hasInstallScript !== true) continue;
    const name = packageName(lockPath, entry);
    present.add(name);
    const review = reviewed[name];
    if (!review || typeof review.reason !== 'string' || review.reason.trim() === '') {
      errors.push(`unreviewed install script: ${name}@${entry.version}`);
    }
  }
  for (const name of Object.keys(reviewed)) {
    if (!present.has(name)) errors.push(`install-script review for ${name} is stale; remove it`);
  }
  return errors;
}
