import { describe, expect, it } from 'vitest';
import {
  evaluateAudit,
  evaluateInstallScripts,
  findInstallViolations,
  findUnpinnedActions,
} from '../scripts/supply-chain/supply-chain-policy.mjs';

const SHA = 'a'.repeat(40);
const ADVISORY = 'GHSA-vfj7-8cjw-p6xm';

function report(severity = 'high') {
  return {
    vulnerabilities: {
      braces: {
        via: [{ source: 1, name: 'braces', severity, title: 'deep nesting', url: `https://github.com/advisories/${ADVISORY}` }],
      },
      micromatch: { via: ['braces'] },
    },
  };
}

const clean = { vulnerabilities: {} };

function waiver(overrides = {}) {
  return { advisory: ADVISORY, package: 'braces', reason: 'dev tooling only', owner: 'ziad-infra', expires: '2026-11-04', devOnly: true, ...overrides };
}

function audit(overrides) {
  return evaluateAudit({ fullReport: report(), runtimeReport: clean, waivers: [waiver()], today: '2026-10-05', ...overrides });
}

describe('action pinning', () => {
  it.each([
    [`- uses: actions/checkout@${SHA} # v4`, 0],
    ['- uses: ./.github/actions/local', 0],
    [`- uses: docker://alpine@sha256:${'b'.repeat(64)}`, 0],
    ['- uses: actions/checkout@v4', 1],
    ['      uses: "actions/checkout@main"', 1],
    [`- uses: actions/checkout@${SHA.slice(1)}`, 1],
    ['- uses: docker://alpine:3.20', 1],
    ['- uses: actions/checkout', 1],
    ['- { uses: actions/checkout@v4 }', 1],
    ['- "uses": actions/checkout@v4', 1],
    ["- 'uses': actions/checkout@v4", 1],
    ['steps: [{uses: a/b@v1}]', 1],
    [`steps: [{uses: a/b@${SHA}}, {uses: c/d@v1}]`, 1],
    [`- { name: x, uses: a/b@${SHA} }`, 0],
    ['- uses: >-', 1],
    ['# uses: actions/checkout@v4', 0],
  ])('evaluates %s', (line, expected) => {
    expect(findUnpinnedActions(line)).toHaveLength(expected);
  });
});

describe('frozen installs', () => {
  it.each([
    '- run: npm ci\n- run: npm run verify',
    '- run: npm --no-audit ci\n- run: npm run -s check:supply-chain && npm test',
    '- run: npm ci\n  with:\n    cache: npm',
  ])('accepts %s', (workflow) => {
    expect(findInstallViolations(workflow)).toEqual([]);
  });

  it.each([
    '- run: npm install',
    '- run: npm i',
    '- run: npm ci && npm add left-pad',
    '- run: npm --prefer-offline install x',
    '- run: npm --prefix app install',
    '- run: npm update',
    '- run: npm exec --yes x',
    '- run: npx pkg@latest',
    '- run: pnpm install',
    '- run: yarn',
    '- run: bun install',
    '- run: npm ci & npm install x',
    '- run: npm ci $(npm install x)',
    '- run: npm ci `npm install x`',
    '- run: npm run lint npm install x',
    '- run: "npm install"',
    '- run: /usr/bin/npm install',
    '- run: npm --prefix ci install left-pad',
    '- run: npm --cache /tmp/npm ci',
  ])('rejects %s', (line) => {
    expect(findInstallViolations(`- run: npm ci\n${line}`)).toHaveLength(1);
  });

  it.each(['- run: npm --prefix=app ci', '- run: npm --no-fund -s ci', "- run: 'npm' ci"])('accepts flag form %s', (line) => {
    expect(findInstallViolations(line)).toEqual([]);
  });

  it('does not read a flag value as npm ci', () => {
    expect(findInstallViolations('- run: npm --prefix ci install left-pad')).toEqual([
      expect.stringContaining('line 1 unfrozen'),
      'workflow never runs npm ci',
    ]);
  });

  it('requires npm ci somewhere', () => {
    expect(findInstallViolations('- run: npm run verify')).toEqual(['workflow never runs npm ci']);
  });

  it('does not accept npm ci inside a comment', () => {
    expect(findInstallViolations('# npm ci\n- run: npm run verify')).toEqual(['workflow never runs npm ci']);
  });
});

describe('audit gate', () => {
  it('passes a valid dev-only waiver', () => {
    expect(audit({})).toEqual([]);
  });

  it('fails an unwaived high advisory', () => {
    expect(audit({ waivers: [] })).toEqual([expect.stringContaining(`unwaived high advisory ${ADVISORY}`)]);
  });

  it('fails an unwaived critical advisory', () => {
    expect(audit({ fullReport: report('critical'), waivers: [] })[0]).toContain('unwaived critical');
  });

  it('ignores moderate advisories', () => {
    expect(audit({ fullReport: report('moderate'), waivers: [] })).toEqual([]);
  });

  it('fails an expired waiver', () => {
    expect(audit({ waivers: [waiver({ expires: '2026-10-04' })] })).toEqual([expect.stringContaining('expired')]);
  });

  it('fails a waiver longer than 90 days', () => {
    expect(audit({ waivers: [waiver({ expires: '2027-01-04' })] })).toEqual([expect.stringContaining('exceeds 90 days')]);
  });

  it.each([{ reason: '' }, { owner: undefined }, { expires: 'soon' }, { devOnly: 'yes' }])('fails a malformed waiver %o', (overrides) => {
    expect(audit({ waivers: [waiver(overrides)] })).toHaveLength(1);
  });

  it('fails a dev-only waiver when the advisory reaches runtime', () => {
    expect(audit({ runtimeReport: report() })).toEqual([expect.stringContaining('reaches runtime')]);
  });

  it('fails a stale waiver', () => {
    expect(audit({ fullReport: clean })).toEqual([expect.stringContaining('no longer matches')]);
  });

  it('fails closed on a malformed report', () => {
    expect(() => audit({ fullReport: { error: { code: 'ENOTFOUND' } } })).toThrow('malformed');
  });
});

describe('install script review', () => {
  const lock = {
    packages: {
      '': { name: 'app' },
      'node_modules/@swc/core': { version: '1.0.0', hasInstallScript: true },
      'node_modules/clsx': { version: '2.0.0' },
    },
  };

  it('passes reviewed packages', () => {
    expect(evaluateInstallScripts({ lock, allowlist: { packages: { '@swc/core': { reason: 'binding check' } } } })).toEqual([]);
  });

  it('fails an unreviewed install script', () => {
    expect(evaluateInstallScripts({ lock, allowlist: { packages: {} } })).toEqual(['unreviewed install script: @swc/core@1.0.0']);
  });

  it('fails a review without a reason', () => {
    expect(evaluateInstallScripts({ lock, allowlist: { packages: { '@swc/core': { reason: ' ' } } } })).toHaveLength(1);
  });

  it('fails a stale review', () => {
    const allowlist = { packages: { '@swc/core': { reason: 'binding check' }, esbuild: { reason: 'binary' } } };
    expect(evaluateInstallScripts({ lock, allowlist })).toEqual(['install-script review for esbuild is stale; remove it']);
  });
});
