// ED-091 Trojan Source gate: refuses literal bidi controls, invisible characters and C0/C1 controls in tracked text
// files. Deliberate joiners and marks in locale strings are allowed only by security/invisible-characters.json.
// It reads the working-tree content of every git-tracked file, so run it on the tree that will be committed or
// verified (CI runs it on a clean checkout). Binaries are skipped by file extension only: a NUL byte is reported as a
// control character, never treated as a reason to skip a file.
// Usage: node scripts/gates/check-invisible-characters.mjs [repoRoot]
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Never allowed anywhere: embeddings, overrides and isolates reorder what a reviewer sees (CVE-2021-42574).
const NEVER = new Set([0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069]);
// Refused unless allowlisted for a path: marks and joiners that Urdu and Pashto text can legitimately need, and the
// visible Arabic prepended marks (number signs U+0600-U+0605, end of ayah U+06DD, U+08E2) that are format characters
// only because they combine with the digits after them, for Arabic, Urdu and Pashto locale and content text.
const ALLOWABLE = new Set([0x200c, 0x200d, 0x200e, 0x200f, 0x061c, 0x0600, 0x0601, 0x0602, 0x0603, 0x0604, 0x0605, 0x06dd, 0x08e2]);
// Everything else that renders as nothing, by Unicode property rather than by a hand-kept list: format characters,
// line and paragraph separators (ECMAScript line terminators), and default-ignorable code points (identifier fillers,
// deprecated format controls, interlinear annotation, Mongolian and Khmer invisibles, tag characters).
const INVISIBLE = /[\p{Cf}\p{Zl}\p{Zp}\p{Default_Ignorable_Code_Point}]/u;
// Variation selectors are default-ignorable but select emoji and CJK presentation in ordinary text.
function variationSelector(cp) {
  return (cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0xe0100 && cp <= 0xe01ef);
}
function control(cp) {
  return (cp < 0x20 && cp !== 0x09 && cp !== 0x0a && cp !== 0x0d) || (cp >= 0x7f && cp <= 0x9f);
}
const BINARY = /\.(png|jpe?g|gif|webp|ico|avif|woff2?|ttf|otf|eot|pdf|zip|gz|tgz|br|wasm|node|mp4|webm|mp3|bin|dat|sqlite)$/i;
const hexOf = (cp) => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;

export function classify(cp, allowed = new Set()) {
  if (NEVER.has(cp)) return 'bidi control (never allowed)';
  if (ALLOWABLE.has(cp)) return allowed.has(cp) ? undefined : 'invisible mark or joiner (not allowlisted for this file)';
  if (control(cp)) return 'control character';
  if (variationSelector(cp)) return undefined;
  if (INVISIBLE.test(String.fromCodePoint(cp))) return 'invisible character';
  return undefined;
}

export function findProblems(text, allowed = new Set()) {
  const problems = [];
  let line = 1;
  let column = 0;
  for (const char of text) {
    const cp = char.codePointAt(0);
    column += 1;
    if (cp === 0x0a) {
      line += 1;
      column = 0;
      continue;
    }
    const kind = classify(cp, allowed);
    if (kind) problems.push({ line, column, hex: hexOf(cp), kind });
  }
  return problems;
}

export function loadAllowlist(root) {
  const path = join(root, 'security', 'invisible-characters.json');
  if (!existsSync(path)) return new Map();
  const entries = JSON.parse(readFileSync(path, 'utf8')).files ?? [];
  const map = new Map();
  for (const entry of entries) {
    const keys = Object.keys(entry).sort().join(',');
    if (keys !== 'codepoints,path,reason' || typeof entry.reason !== 'string' || entry.reason.trim() === ''
      || !Array.isArray(entry.codepoints) || entry.codepoints.length === 0) {
      throw new Error(`invisible-characters.json: each entry needs exactly path, a non-empty codepoints list and a reason (${JSON.stringify(entry)})`);
    }
    if (map.has(entry.path)) throw new Error(`invisible-characters.json: ${entry.path} is listed more than once`);
    const codepoints = entry.codepoints.map((value) => {
      const text = String(value);
      if (!/^U\+[0-9A-F]{4,6}$/i.test(text)) throw new Error(`invisible-characters.json: ${entry.path} lists "${text}"; write code points as U+XXXX`);
      return Number.parseInt(text.slice(2), 16);
    });
    for (const cp of codepoints) {
      if (!ALLOWABLE.has(cp)) {
        throw new Error(`invisible-characters.json: ${entry.path} lists ${hexOf(cp)}, which can never be allowlisted (only the Urdu and Pashto joiners and marks and the Arabic prepended marks can)`);
      }
    }
    map.set(entry.path, new Set(codepoints));
  }
  return map;
}

export function scanRepository(root) {
  const allowlist = loadAllowlist(root);
  const files = execFileSync('git', ['-c', 'safe.directory=*', '-C', root, 'ls-files', '-z'], { encoding: 'utf8' })
    .split('\0').filter((file) => file && !BINARY.test(file));
  const report = [];
  for (const file of files) {
    const text = readFileSync(join(root, file)).toString('utf8');
    for (const problem of findProblems(text, allowlist.get(file))) report.push({ file, ...problem });
  }
  for (const path of allowlist.keys()) if (!files.includes(path)) report.push({ file: path, line: 0, column: 0, hex: '-', kind: 'allowlisted file is not tracked' });
  return report;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const root = process.argv[2] ?? process.cwd();
  const report = scanRepository(root);
  for (const p of report) process.stderr.write(`${p.file}:${p.line}:${p.column} ${p.hex} ${p.kind}\n`);
  if (report.length > 0) {
    process.stderr.write(`invisible-characters: ${report.length} problem(s). Write the character as an escape (\\uXXXX) or allowlist a joiner in a locale file.\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write('invisible-characters: no literal bidi, invisible or control characters in tracked text files.\n');
  }
}
