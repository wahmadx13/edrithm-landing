import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { join, relative } from 'node:path';

const SKIPPED_EVERYWHERE = new Set(['node_modules', '.git']);
const SKIPPED_AT_ROOT = new Set(['.next', 'dist', 'build', 'coverage', '.expo']);

function readEntry(root, path) {
  return { name: relative(root, path).replace(/\\/g, '/'), text: readFileSync(path, 'utf8') };
}

function actionFilesUnder(root, directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      const skipped = SKIPPED_EVERYWHERE.has(entry.name) || (directory === root && SKIPPED_AT_ROOT.has(entry.name));
      return skipped ? [] : actionFilesUnder(root, join(directory, entry.name));
    }
    return /^action\.ya?ml$/.test(entry.name) ? [readEntry(root, join(directory, entry.name))] : [];
  });
}

export function actionFiles(root) {
  return actionFilesUnder(root, root);
}

function childDirectories(directory) {
  return readdirSync(directory, { withFileTypes: true }).filter(
    (entry) => (entry.isDirectory() || entry.isSymbolicLink()) && !entry.name.startsWith('.'),
  );
}

function packagesIn(directory, prefix, visited) {
  if (!existsSync(directory)) return [];
  const real = realpathSync(directory);
  if (visited.has(real)) return [];
  visited.add(real);
  return childDirectories(directory).flatMap((entry) => {
    if (!entry.name.startsWith('@')) return packageAt(join(directory, entry.name), `${prefix}${entry.name}`, visited);
    return childDirectories(join(directory, entry.name)).flatMap((scoped) =>
      packageAt(join(directory, entry.name, scoped.name), `${prefix}${entry.name}/${scoped.name}`, visited),
    );
  });
}

function packageAt(directory, lockPath, visited) {
  const manifest = join(directory, 'package.json');
  const self = existsSync(manifest) ? [{ path: lockPath, version: JSON.parse(readFileSync(manifest, 'utf8')).version }] : [];
  return [...self, ...packagesIn(join(directory, 'node_modules'), `${lockPath}/node_modules/`, visited)];
}

export function installedPackages(root) {
  return packagesIn(join(root, 'node_modules'), 'node_modules/', new Set());
}
