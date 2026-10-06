import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  evaluateAudit,
  evaluateInstallScripts,
  findInstallViolations,
  findUnpinnedActions,
} from './supply-chain-policy.mjs';

const root = process.cwd();
const workflowDir = join(root, '.github', 'workflows');

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), 'utf8'));
}

function workflowFiles() {
  return readdirSync(workflowDir)
    .filter((name) => /\.ya?ml$/.test(name))
    .map((name) => ({ name, text: readFileSync(join(workflowDir, name), 'utf8') }));
}

function checkWorkflows() {
  return workflowFiles().flatMap(({ name, text }) => [
    ...findUnpinnedActions(text).map(({ line, reference }) => `${name}:${line} action not pinned by commit SHA: ${reference}`),
    ...findInstallViolations(text).map((message) => `${name}: ${message}`),
  ]);
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
