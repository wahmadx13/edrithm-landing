const PINNED_REF = /^[0-9a-f]{40}$/;
const BLOCKING_SEVERITIES = new Set(['high', 'critical']);
const MAX_WAIVER_DAYS = 90;
const MAX_RUNTIME_WAIVER_DAYS = 30;
const DAY_MS = 86_400_000;
const WAIVER_FIELDS = ['advisory', 'package', 'reason', 'owner', 'expires'];
const DEPENDENCY_CLASSES = new Set(['production', 'development']);

const USES_KEY = /(?:^|[\s{,[-])["']?uses["']?\s*:\s*["']?([^"'\s#,}\]]*)/g;
const COMPLEX_USES_KEY = /(?:^|[\s{,[-])\?\s*["']?uses["']?\s*$/;
const SAFE_NPM_COMMANDS = new Set(['ci', 'run', 'run-script', 'test', 'audit', 'sbom', 'ls', 'outdated']);
const OTHER_PACKAGE_RUNNERS = /\b(?:npx|pnpm|yarn|bun|corepack)\b/i;
const SAFE_NPM_VALUE = /^\s*(?:-\s*)?["']?(?:cache|package-ecosystem)["']?\s*:\s*["']?npm["']?\s*$/;
const LABEL_KEY = /^\s*(?:-\s*)?["']?(?:name|description)["']?\s*:/;
const FLOW_RUN_KEY = /[{,]\s*["']?run["']?\s*:/;
const RUN_KEY = /^(\s*)(?:-\s+)?["']?run["']?\s*:\s*(.*)$/;
const BLOCK_INDICATOR = /^[|>][-+0-9]*$/;

function stripComment(text) {
  let quote = null;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '#' && (index === 0 || /\s/.test(text[index - 1]))) {
      return text.slice(0, index);
    }
  }
  return text;
}

function codeLines(workflowText) {
  return workflowText.split(/\r?\n/).map((text, index) => ({ line: index + 1, text: stripComment(text) }));
}

function indentOf(text) {
  return text.length - text.trimStart().length;
}

function blockBody(lines, start, keyIndent) {
  const body = [];
  for (let index = start; index < lines.length; index += 1) {
    const { text } = lines[index];
    if (text.trim() !== '' && indentOf(text) <= keyIndent) break;
    body.push(text.trim());
  }
  return body;
}

function runBlocks(lines) {
  return lines.flatMap(({ line, text }, index) => {
    const match = RUN_KEY.exec(text);
    if (!match || !BLOCK_INDICATOR.test(match[2].trim())) return [];
    const body = blockBody(lines, index + 1, match[1].length);
    if (match[2].trim().startsWith('>')) return [{ line, text: body.join(' ') }];
    return body.join('\n').replace(/\\\n/g, ' ').split('\n').map((command) => ({ line, text: command }));
  });
}

function usesReferences(workflowText) {
  return codeLines(workflowText).flatMap(({ line, text }) => {
    const complex = COMPLEX_USES_KEY.test(text) ? [{ line, reference: '? uses (unsupported YAML form)' }] : [];
    return [...complex, ...[...text.matchAll(USES_KEY)].map((match) => ({ line, reference: match[1] }))];
  });
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
const NPM_EXECUTABLE = /^(?:.*[\\/])?npm(?:\.cmd|\.ps1|\.exe)?$/i;
const NPM_CLI_SCRIPT = /(?:^|[\\/])npm-cli\.js$/i;
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
  return { bare: true };
}

function isNpmToken(token) {
  return NPM_EXECUTABLE.test(token) || NPM_CLI_SCRIPT.test(token);
}

function npmInvocations(text) {
  return text.split(SHELL_SEPARATORS).flatMap((segment) => {
    const tokens = segment.replace(/["']/g, ' ').trim().split(/\s+/);
    return tokens.flatMap((token, index) => (isNpmToken(token) ? [npmSubcommand(tokens.slice(index + 1))] : []));
  });
}

function npmCommands(text) {
  return npmInvocations(text).flatMap(({ command }) => (command ? [command] : []));
}

function isAnalysed(text) {
  if (SAFE_NPM_VALUE.test(text)) return false;
  return !LABEL_KEY.test(text) || FLOW_RUN_KEY.test(text);
}

function isUnfrozen(text) {
  if (!isAnalysed(text)) return false;
  const unsafe = npmInvocations(text).some(
    ({ command, ambiguousFlag, bare }) => bare || ambiguousFlag || (command && !SAFE_NPM_COMMANDS.has(command)),
  );
  return OTHER_PACKAGE_RUNNERS.test(text) || unsafe;
}

export function findInstallViolations(workflowText, { requireCi = true } = {}) {
  const lines = codeLines(workflowText);
  const units = [...lines, ...runBlocks(lines)];
  const violations = [
    ...new Set(
      units
        .filter(({ text }) => isUnfrozen(text))
        .map(({ line, text }) => `line ${line} unfrozen install or unreviewed npm command: ${text.trim()}`),
    ),
  ];
  const installs = units.some(({ text }) => isAnalysed(text) && npmCommands(text).includes('ci'));
  return installs || !requireCi ? violations : [...violations, 'workflow never runs npm ci'];
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
  const maxDays = waiver.devOnly === false ? MAX_RUNTIME_WAIVER_DAYS : MAX_WAIVER_DAYS;
  if (expires - today > maxDays * DAY_MS) return [`waiver ${waiver.advisory} exceeds ${maxDays} days`];
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

function dependencyClass(entry) {
  return entry.dev === true ? 'development' : 'production';
}

function reviewErrors(name, entry, review) {
  const id = `${name}@${entry.version}`;
  if (!review || typeof review.reason !== 'string' || review.reason.trim() === '') return [`unreviewed install script: ${id}`];
  if (!DEPENDENCY_CLASSES.has(review.class)) return [`install-script review for ${name} must state class production or development`];
  const errors = [];
  if (review.class !== dependencyClass(entry)) {
    errors.push(`install-script review for ${name} says ${review.class} but the lockfile has it as ${dependencyClass(entry)}`);
  }
  if (!Array.isArray(review.versions) || !review.versions.includes(entry.version)) {
    errors.push(`install script not reviewed at this version: ${id}`);
  }
  return errors;
}

export function evaluateInstallScripts({ lock, allowlist }) {
  const reviewed = allowlist.packages ?? {};
  const present = new Set();
  const errors = [];
  for (const [lockPath, entry] of Object.entries(lock.packages ?? {})) {
    if (lockPath === '' || entry.hasInstallScript !== true) continue;
    const name = packageName(lockPath, entry);
    present.add(name);
    errors.push(...reviewErrors(name, entry, reviewed[name]));
  }
  for (const name of Object.keys(reviewed)) {
    if (!present.has(name)) errors.push(`install-script review for ${name} is stale; remove it`);
  }
  return [...new Set(errors)];
}

export function evaluateInstalled({ lock, hiddenLock, installed }) {
  const locked = lock.packages ?? {};
  const placed = new Set(Object.keys(hiddenLock?.packages ?? {}));
  return installed.flatMap(({ path, version }) => {
    if (!(path in locked)) return [`installed package not in lockfile: ${path}`];
    const errors = [];
    if (!placed.has(path)) errors.push(`installed package not placed by npm ci (absent from node_modules/.package-lock.json): ${path}`);
    if (version !== locked[path].version) errors.push(`installed version ${version} differs from lockfile ${locked[path].version}: ${path}`);
    return errors;
  });
}

export function evaluateFallbackTraces({ lock, allowlist, traces }) {
  const reviewed = allowlist.packages ?? {};
  return Object.entries(traces).flatMap(([lockPath, trace]) => {
    const name = packageName(lockPath, lock.packages?.[lockPath] ?? {});
    const allowed = new Set(reviewed[name]?.rootNativeFiles ?? []);
    const errors = trace.npmInstallDir ? [`install-script fallback directory found: ${lockPath}/npm-install`] : [];
    const strays = trace.rootNativeFiles.filter((file) => !allowed.has(file));
    return [...errors, ...strays.map((file) => `native file written into install-script package root: ${lockPath}/${file}`)];
  });
}

export function localActionReferences(workflowText) {
  return usesReferences(workflowText).filter(({ reference }) => reference.startsWith('./'));
}
