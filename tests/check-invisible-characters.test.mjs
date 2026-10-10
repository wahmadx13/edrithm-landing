// ED-091 Trojan Source gate tests. Every invisible character is built at runtime with String.fromCodePoint, so this
// file itself stays plain ASCII and passes the gate it tests.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll as after, describe, it } from 'vitest';
import { findProblems, loadAllowlist, scanRepository } from '../scripts/gates/check-invisible-characters.mjs';

const ch = (cp) => String.fromCodePoint(cp);
const roots = [];
after(() => roots.forEach((root) => rmSync(root, { recursive: true, force: true })));

function repo(files, allowlist) {
  const root = mkdtempSync(join(tmpdir(), 'invisible-gate-'));
  roots.push(root);
  execFileSync('git', ['init', '-q', root]);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  if (allowlist) {
    mkdirSync(join(root, 'security'), { recursive: true });
    writeFileSync(join(root, 'security', 'invisible-characters.json'), JSON.stringify({ files: allowlist }));
  }
  execFileSync('git', ['-C', root, 'add', '-A']);
  return root;
}

describe('findProblems', () => {
  it('refuses every bidi embedding, override and isolate (CVE-2021-42574)', () => {
    for (const cp of [0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069]) {
      assert.match(findProblems(`a${ch(cp)}b`)[0]?.kind ?? '', /bidi control/, cp.toString(16));
    }
  });
  it('refuses invisible characters: zero width space, word joiner, BOM, soft hyphen, separators, fillers, tags', () => {
    for (const cp of [0x200b, 0x2060, 0x2063, 0xfeff, 0x00ad, 0x180e, 0x2028, 0x2029, 0x034f, 0x115f, 0x1160, 0x3164, 0xffa0,
      0x206a, 0x206f, 0xfff9, 0xfffb, 0x17b4, 0x180b, 0xe0041]) {
      assert.match(findProblems(`a${ch(cp)}b`)[0]?.kind ?? '', /invisible character/, cp.toString(16));
    }
  });
  it('refuses C0 and C1 controls but allows tab, LF and CR', () => {
    assert.deepEqual(findProblems('a\tb\r\nc\n'), []);
    for (const cp of [0x00, 0x07, 0x1b, 0x7f, 0x85, 0x9b]) {
      assert.match(findProblems(`a${ch(cp)}b`)[0]?.kind ?? '', /control character/, cp.toString(16));
    }
  });
  it('refuses the visible Arabic prepended marks unless allowed for the file', () => {
    const ayah = `${ch(0x06dd)}${ch(0x0661)}`;
    assert.equal(findProblems(ayah)[0]?.hex, 'U+06DD');
    assert.deepEqual(findProblems(ayah, new Set([0x06dd])), []);
  });
  it('refuses joiners and marks unless allowed for the file', () => {
    const text = `x${ch(0x200c)}y${ch(0x200f)}`;
    assert.equal(findProblems(text).length, 2);
    assert.deepEqual(findProblems(text, new Set([0x200c, 0x200f])), []);
  });
  it('reports line and column in code points', () => {
    assert.deepEqual(findProblems(`ok\n${ch(0x1f600)}a${ch(0x202e)}`).map(({ line, column }) => [line, column]), [[2, 3]]);
  });
  it('keeps emoji and CJK variation selectors, which are default-ignorable but select presentation', () => {
    for (const cp of [0xfe0f, 0xfe00, 0xe0100, 0xe01ef]) assert.deepEqual(findProblems(`${ch(0x2764)}${ch(cp)}`), [], cp.toString(16));
  });
  it('accepts ordinary Urdu, Pashto and emoji text with no invisible characters', () => {
    assert.deepEqual(findProblems(`${ch(0x0627)}${ch(0x0631)}${ch(0x062f)}${ch(0x0648)} ${ch(0x067e)}${ch(0x069a)}${ch(0x062a)}${ch(0x0648)} ${ch(0x1f44d)}`), []);
  });
});

describe('allowlist', () => {
  it('allows joiners only in the listed file', () => {
    const urdu = `"key": "${ch(0x0645)}${ch(0x200c)}${ch(0x06cc)}"\n`;
    const root = repo({ 'locales/ur.json': urdu, 'src/a.ts': urdu }, [{ path: 'locales/ur.json', codepoints: ['U+200C'], reason: 'Urdu ZWNJ' }]);
    assert.deepEqual(scanRepository(root).map((p) => p.file), ['src/a.ts']);
  });
  it('never allowlists a bidi override, and rejects malformed entries', () => {
    const bad = repo({ 'a.txt': 'x' }, [{ path: 'a.txt', codepoints: ['U+202E'], reason: 'no' }]);
    assert.throws(() => loadAllowlist(bad), /can never be allowlisted/);
    const noReason = repo({ 'a.txt': 'x' }, [{ path: 'a.txt', codepoints: ['U+200C'] }]);
    assert.throws(() => loadAllowlist(noReason), /exactly path, a non-empty codepoints list and a reason/);
    const twice = repo({ 'a.txt': 'x' }, [{ path: 'a.txt', codepoints: ['U+200C'], reason: 'r' }, { path: 'a.txt', codepoints: ['U+200D'], reason: 'r' }]);
    assert.throws(() => loadAllowlist(twice), /listed more than once/);
    const bare = repo({ 'a.txt': 'x' }, [{ path: 'a.txt', codepoints: ['200C'], reason: 'r' }]);
    assert.throws(() => loadAllowlist(bare), /write code points as U\+XXXX/);
  });
  it('reports an allowlisted file that is not tracked', () => {
    const root = repo({ 'a.txt': 'x' }, [{ path: 'gone.json', codepoints: ['U+200C'], reason: 'r' }]);
    assert.match(scanRepository(root).map((p) => p.kind).join(), /not tracked/);
  });
});

describe('scanRepository', () => {
  it('scans tracked text files only, skipping binaries by extension alone', () => {
    const root = repo({
      'src/ok.ts': 'export const a = 1;\n',
      'src/bad.ts': `const s = "${ch(0x202e)}";\n`,
      'fixture.bin': `${ch(0x07)}${ch(0x202e)}`,
      'data.raw': `x\u0000${ch(0x202e)}`,
    });
    writeFileSync(join(root, 'untracked.ts'), ch(0x202e));
    assert.deepEqual([...new Set(scanRepository(root).map((p) => p.file))], ['data.raw', 'src/bad.ts']);
  });
  it('a NUL byte is reported, never a reason to skip the file (Faisal R1)', () => {
    const root = repo({ 'evil.mjs': `// ${ch(0)}
const a = "${ch(0x202e)}";
` });
    assert.deepEqual(scanRepository(root).map((p) => [p.file, p.hex]), [['evil.mjs', 'U+0000'], ['evil.mjs', 'U+202E']]);
  });
  it('this test file and the gate itself are plain ASCII', async () => {
    const { readFileSync } = await import('node:fs');
    for (const path of [new URL(import.meta.url), new URL('../scripts/gates/check-invisible-characters.mjs', import.meta.url)]) {
      assert.ok(/^[\x09\x0a\x0d\x20-\x7e]*$/.test(readFileSync(path, 'utf8')), path.pathname);
    }
  });
});
