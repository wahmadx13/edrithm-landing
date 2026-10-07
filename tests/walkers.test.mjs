import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { actionFiles, installedPackages } from '../scripts/supply-chain/walkers.mjs';

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'edrithm-walkers-'));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

function withFixture(files, test) {
  const root = fixture(files);
  try {
    test(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const manifest = (name, version) => JSON.stringify({ name, version });

describe('action file walker', () => {
  it('scans local actions in nested build-style directories but skips them at the root', () => {
    withFixture(
      {
        '.github/actions/build/action.yml': 'runs: {}',
        '.github/actions/dist/action.yaml': 'runs: {}',
        'build/action.yml': 'runs: {}',
        'node_modules/x/action.yml': 'runs: {}',
        'packages/tool/node_modules/y/action.yml': 'runs: {}',
      },
      (root) => {
        expect(actionFiles(root).map(({ name }) => name).sort()).toEqual([
          '.github/actions/build/action.yml',
          '.github/actions/dist/action.yaml',
        ]);
      },
    );
  });
});

describe('installed package walker', () => {
  it('reports scoped, nested and packages under directories without a package.json', () => {
    withFixture(
      {
        'node_modules/a/package.json': manifest('a', '1.0.0'),
        'node_modules/@s/b/package.json': manifest('@s/b', '2.0.0'),
        'node_modules/a/node_modules/c/package.json': manifest('c', '3.0.0'),
        'node_modules/nopkg/node_modules/evil/package.json': manifest('evil', '9.9.9'),
        'node_modules/.bin/tool': '',
      },
      (root) => {
        expect(installedPackages(root).sort((x, y) => x.path.localeCompare(y.path))).toEqual([
          { path: 'node_modules/@s/b', version: '2.0.0' },
          { path: 'node_modules/a', version: '1.0.0' },
          { path: 'node_modules/a/node_modules/c', version: '3.0.0' },
          { path: 'node_modules/nopkg/node_modules/evil', version: '9.9.9' },
        ]);
      },
    );
  });

  it('terminates on a symlink cycle', () => {
    withFixture({ 'node_modules/a/package.json': manifest('a', '1.0.0') }, (root) => {
      symlinkSync(join(root, 'node_modules'), join(root, 'node_modules', 'a', 'node_modules'), 'junction');
      expect(installedPackages(root)).toEqual([{ path: 'node_modules/a', version: '1.0.0' }]);
    });
  });

  it('returns nothing when node_modules is absent', () => {
    withFixture({ 'package.json': manifest('app', '0.0.0') }, (root) => {
      expect(installedPackages(root)).toEqual([]);
    });
  });
});
