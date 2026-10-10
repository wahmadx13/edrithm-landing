// ED-010a git hooks: the version-controlled hooks exist, are executable in git, run only scripts this package
// defines, and nothing in the repository bypasses a hook (ED-015 §3).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';

const root = join(import.meta.dirname, '..');
const git = (...args) => execFileSync('git', ['-c', 'safe.directory=*', '-C', root, ...args], { encoding: 'utf8' });
const HOOKS = ['pre-commit', 'pre-push'];
const scripts = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts;

describe('git hooks', () => {
  it('tracks each hook as an executable POSIX shell script with LF endings', () => {
    for (const hook of HOOKS) {
      const entry = git('ls-files', '-s', '--', `.githooks/${hook}`).trim();
      assert.match(entry, /^100755 /, `.githooks/${hook} must be tracked with mode 100755`);
      const text = readFileSync(join(root, '.githooks', hook), 'utf8');
      assert.ok(text.startsWith('#!/bin/sh\n'), `.githooks/${hook} must start with #!/bin/sh`);
      assert.ok(!text.includes('\r'), `.githooks/${hook} must use LF line endings`);
    }
  });

  it('runs only npm scripts that package.json defines', () => {
    for (const hook of HOOKS) {
      const text = readFileSync(join(root, '.githooks', hook), 'utf8');
      const used = [...text.matchAll(/npm run --silent ([\w:-]+)/g)].map((m) => m[1]);
      assert.ok(used.length > 0, `.githooks/${hook} runs no npm script`);
      for (const name of used) assert.ok(scripts[name], `.githooks/${hook} runs undefined script ${name}`);
    }
  });

  it('pre-commit runs the fast gates and pre-push runs verify', () => {
    const preCommit = readFileSync(join(root, '.githooks', 'pre-commit'), 'utf8');
    for (const name of ['check:invisible', 'lint', 'typecheck']) assert.ok(preCommit.includes(`npm run --silent ${name}`));
    assert.ok(readFileSync(join(root, '.githooks', 'pre-push'), 'utf8').includes('npm run --silent verify'));
  });

  it('never bypasses a hook in tracked files', () => {
    const flag = ['--no', 'verify'].join('-');
    const hits = git('ls-files', '-z')
      .split('\0')
      .filter((path) => path && !path.startsWith('tests/'))
      .filter((path) => /\.(mjs|cjs|js|ts|tsx|json|ya?ml|sh|md)$|^\.githooks\//.test(path))
      .filter((path) => readFileSync(join(root, path), 'utf8').includes(flag));
    assert.deepEqual(hits, [], `${flag} must not appear in tracked files (ED-015 §3)`);
  });
});
