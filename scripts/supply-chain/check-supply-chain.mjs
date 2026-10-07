import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  evaluateAudit,
  evaluateInstallScripts,
  findInstallViolations,
  findUnpinnedActions,
  localActionReferences,
} from './supply-chain-policy.mjs';
import { actionFiles } from './walkers.mjs';

const root = process.cwd();
const workflowDir = join(root, '.github', 'workflows');

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), 'utf8'));
}

function readEntry(path) {
  return { name: relative(root, path).replace(/\\/g, '/'), text: readFileSync(path, 'utf8') };
}

function workflowFiles() {
  return readdirSync(workflowDir)
    .filter((name) => /\.ya?ml$/.test(name))
    .map((name) => readEntry(join(workflowDir, name)));
}

function unresolvedLocalActions(files, scanned) {
  return files.flatMap(({ name, text }) =>
    localActionReferences(text).flatMap(({ line, reference }) => {
      const target = reference.slice(2).replace(/\/+$/, '');
      const found = ['action.yml', 'action.yaml'].some((file) => scanned.has(`${target}/${file}`));
      return found ? [] : [`${name}:${line} local action ${reference} has no scanned action.yml or action.yaml`];
    }),
  );
}

function checkFile({ name, text }, options) {
  return [
    ...findUnpinnedActions(text).map(({ line, reference }) => `${name}:${line} action not pinned by commit SHA: ${reference}`),
    ...findInstallViolations(text, options).map((message) => `${name}: ${message}`),
  ];
}

function checkWorkflows() {
  const workflows = workflowFiles();
  const actions = actionFiles(root);
  const scanned = new Set(actions.map(({ name }) => name));
  return [
    ...workflows.flatMap((file) => checkFile(file, { requireCi: true })),
    ...actions.flatMap((file) => checkFile(file, { requireCi: false })),
    ...unresolvedLocalActions([...workflows, ...actions], scanned),
  ];
}

function checkLockfile() {
  const lock = readJson('package-lock.json');
  const manifest = readJson('package.json');
  const errors = lock.lockfileVersion >= 3 ? [] : [`package-lock.json lockfileVersion ${lock.lockfileVersion} is below 3`];
  return lock.name === manifest.name ? errors : [...errors, 'package-lock.json does not belong to package.json'];
}

function auditReport(extraArgs) {
  const npmCli = process.env.npm_execpath;
  const [command, args] = npmCli ? [process.execPath, [npmCli]] : ['npm', []];
  const result = spawnSync(command, [...args, 'audit', '--json', ...extraArgs], { cwd: root, encoding: 'utf8' });
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(`npm audit ${extraArgs.join(' ')} produced no report: ${result.stderr.trim()}`);
  }
}

function checkAudit() {
  return evaluateAudit({
    fullReport: auditReport([]),
    runtimeReport: auditReport(['--omit=dev']),
    waivers: readJson('security/audit-waivers.json').waivers,
    today: new Date().toISOString().slice(0, 10),
  });
}

function checkInstallScripts() {
  return evaluateInstallScripts({ lock: readJson('package-lock.json'), allowlist: readJson('security/install-scripts.json') });
}

const checks = { workflows: checkWorkflows, lockfile: checkLockfile, 'install-scripts': checkInstallScripts, audit: checkAudit };
const failures = Object.entries(checks).flatMap(([name, check]) => {
  try {
    return check().map((message) => `[${name}] ${message}`);
  } catch (error) {
    return [`[${name}] check could not run: ${error.message}`];
  }
});

for (const failure of failures) console.error(failure);
console.log(failures.length === 0 ? 'supply-chain: all checks passed' : `supply-chain: ${failures.length} failure(s)`);
process.exitCode = failures.length === 0 ? 0 : 1;
