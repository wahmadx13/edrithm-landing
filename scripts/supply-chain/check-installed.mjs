import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { evaluateFallbackTraces, evaluateInstalled } from './supply-chain-policy.mjs';

const root = process.cwd();
const visited = new Set();

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function childDirectories(directory) {
  return readdirSync(directory, { withFileTypes: true }).filter(
    (entry) => (entry.isDirectory() || entry.isSymbolicLink()) && !entry.name.startsWith('.'),
  );
}

function packagesIn(directory, prefix) {
  if (!existsSync(directory)) return [];
  const real = realpathSync(directory);
  if (visited.has(real)) return [];
  visited.add(real);
  return childDirectories(directory).flatMap((entry) => {
    if (!entry.name.startsWith('@')) return packageAt(join(directory, entry.name), `${prefix}${entry.name}`);
    return childDirectories(join(directory, entry.name)).flatMap((scoped) =>
      packageAt(join(directory, entry.name, scoped.name), `${prefix}${entry.name}/${scoped.name}`),
    );
  });
}

function packageAt(directory, lockPath) {
  const manifest = join(directory, 'package.json');
  const self = existsSync(manifest) ? [{ path: lockPath, version: readJson(manifest).version }] : [];
  return [...self, ...packagesIn(join(directory, 'node_modules'), `${lockPath}/node_modules/`)];
}

function fallbackTraces(lock, installedPaths) {
  return Object.fromEntries(
    Object.entries(lock.packages)
      .filter(([lockPath, entry]) => entry.hasInstallScript === true && installedPaths.has(lockPath))
      .map(([lockPath]) => {
        const directory = join(root, lockPath);
        const rootNativeFiles = readdirSync(directory).filter((file) => file.endsWith('.node'));
        return [lockPath, { npmInstallDir: existsSync(join(directory, 'npm-install')), rootNativeFiles }];
      }),
  );
}

function loadChecks(lock, allowlist, installedPaths) {
  const requireFromRoot = createRequire(join(root, 'package.json'));
  return Object.entries(allowlist.packages ?? {}).flatMap(([name, review]) => {
    if (!review.loadCheck || !installedPaths.has(`node_modules/${name}`)) return [];
    try {
      requireFromRoot(review.loadCheck);
      return [];
    } catch (error) {
      return [`native binding failed to load for ${review.loadCheck}: ${error.message.split('\n')[0]}`];
    }
  });
}

const lock = readJson(join(root, 'package-lock.json'));
const hiddenPath = join(root, 'node_modules', '.package-lock.json');
const allowlist = readJson(join(root, 'security', 'install-scripts.json'));
const installed = packagesIn(join(root, 'node_modules'), 'node_modules/');
const installedPaths = new Set(installed.map(({ path }) => path));
const failures =
  installed.length === 0 || !existsSync(hiddenPath)
    ? ['node_modules or node_modules/.package-lock.json is missing; run npm ci first']
    : [
        ...evaluateInstalled({ lock, hiddenLock: readJson(hiddenPath), installed }),
        ...evaluateFallbackTraces({ lock, allowlist, traces: fallbackTraces(lock, installedPaths) }),
        ...loadChecks(lock, allowlist, installedPaths),
      ];
for (const failure of failures) console.error(`[installed] ${failure}`);
console.log(failures.length === 0 ? `installed: ${installed.length} packages placed by npm ci, versions match, no fallback traces` : `installed: ${failures.length} failure(s)`);
process.exitCode = failures.length === 0 ? 0 : 1;
