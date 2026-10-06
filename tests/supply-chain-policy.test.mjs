import { describe, expect, it } from 'vitest';
import {
  evaluateAudit,
  evaluateInstallScripts,
  evaluateFallbackTraces,
  evaluateInstalled,
  findInstallViolations,
  findUnpinnedActions,
  localActionReferences,
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

  const review = (overrides = {}) => ({ class: 'production', versions: ['1.0.0'], reason: 'binding check', ...overrides });
  const run = (packages, lockfile = lock) => evaluateInstallScripts({ lock: lockfile, allowlist: { packages } });

  it('passes reviewed packages', () => {
    expect(run({ '@swc/core': review() })).toEqual([]);
  });

  it('fails an unreviewed install script', () => {
    expect(run({})).toEqual(['unreviewed install script: @swc/core@1.0.0']);
  });

  it('fails a review without a reason', () => {
    expect(run({ '@swc/core': review({ reason: ' ' }) })).toHaveLength(1);
  });

  it('fails a stale review', () => {
    expect(run({ '@swc/core': review(), esbuild: review() })).toEqual(['install-script review for esbuild is stale; remove it']);
  });

  it('fails a review that omits the dependency class', () => {
    expect(run({ '@swc/core': review({ class: undefined }) })).toEqual([
      'install-script review for @swc/core must state class production or development',
    ]);
  });

  it('fails a class that disagrees with the lockfile', () => {
    expect(run({ '@swc/core': review({ class: 'development' }) })).toEqual([
      'install-script review for @swc/core says development but the lockfile has it as production',
    ]);
    const devLock = { packages: { 'node_modules/msw': { version: '2.0.0', hasInstallScript: true, dev: true } } };
    expect(run({ msw: review({ class: 'development', versions: ['2.0.0'] }) }, devLock)).toEqual([]);
    const optionalDevLock = { packages: { 'node_modules/fsevents': { version: '2.3.3', hasInstallScript: true, devOptional: true } } };
    expect(run({ fsevents: review({ class: 'production', versions: ['2.3.3'] }) }, optionalDevLock)).toEqual([]);
    expect(run({ fsevents: review({ class: 'development', versions: ['2.3.3'] }) }, optionalDevLock)).toHaveLength(1);
  });

  it('fails a version whose script was not reviewed', () => {
    const bumped = { packages: { 'node_modules/@swc/core': { version: '1.0.1', hasInstallScript: true } } };
    expect(run({ '@swc/core': review() }, bumped)).toEqual(['install script not reviewed at this version: @swc/core@1.0.1']);
    expect(run({ '@swc/core': review({ versions: undefined }) })).toEqual(['install script not reviewed at this version: @swc/core@1.0.0']);
  });
});

describe('follow-up delta: workflow parsing', () => {
  it.each([
    ['- uses: actions/checkout@v4', 1],
    ['- ? uses\n  : actions/checkout@v4', 1],
    ['  ? "uses"', 1],
  ])('flags the complex-key form %s', (workflow, expected) => {
    expect(findUnpinnedActions(workflow)).toHaveLength(expected);
  });

  it.each([
    '- run: echo "a #b" && npm install x',
    "- run: echo 'x # y' ; npm install x",
    '- run: node $(which npm) install',
    '- run: NPM install',
    '- run: C:\\tools\\npm.cmd install',
    '- run: npm.ps1 install',
    '- run: node /usr/lib/node_modules/npm/bin/npm-cli.js install',
    '- run: corepack enable',
    '- run: >-\n    npm\n    install\n    left-pad',
    '- run: |\n    npm \\\n      install left-pad',
  ])('rejects %s', (step) => {
    expect(findInstallViolations(`- run: npm ci\n${step}`).length > 0).toBe(true);
  });

  it.each([
    '- run: npm ci # npm install is forbidden',
    '- run: npm ci\n  with:\n    cache: npm',
    '- name: Install with npm\n  run: npm ci',
    '- run: |\n    npm ci\n    npm run verify',
  ])('accepts %s', (workflow) => {
    expect(findInstallViolations(workflow)).toEqual([]);
  });

  it('does not let a flow-style run hide behind a name key', () => {
    expect(findInstallViolations('- run: npm ci\n- { name: x, run: npm install x }')).toHaveLength(1);
  });

  it('does not require npm ci in a composite action', () => {
    expect(findInstallViolations('runs:\n  using: composite\n  steps:\n    - run: npm run x', { requireCi: false })).toEqual([]);
    expect(findInstallViolations('runs:\n  steps:\n    - run: npm install', { requireCi: false })).toHaveLength(1);
  });
});

describe('follow-up delta: runtime waivers and installed tree', () => {
  it('caps a devOnly false waiver at 30 days', () => {
    const runtime = report();
    expect(audit({ runtimeReport: runtime, waivers: [waiver({ devOnly: false, expires: '2026-11-04' })] })).toEqual([]);
    expect(audit({ runtimeReport: runtime, waivers: [waiver({ devOnly: false, expires: '2026-11-05' })] })).toEqual([
      expect.stringContaining('exceeds 30 days'),
    ]);
    expect(audit({ waivers: [waiver({ expires: '2026-12-31' })] })).toEqual([]);
  });

  const lockfile = {
    packages: {
      '': {},
      'node_modules/a': { version: '1.0.0' },
      'node_modules/@s/b': { version: '2.0.0' },
      'node_modules/@unrs/binding-linux': { version: '3.0.0', optional: true },
      'node_modules/unrs-resolver': { version: '1.0.0', hasInstallScript: true },
      'node_modules/fsevents': { version: '2.3.3', hasInstallScript: true },
    },
  };
  const hiddenLock = { packages: { 'node_modules/a': {}, 'node_modules/@s/b': {} } };
  const installed = (...extra) => [{ path: 'node_modules/a', version: '1.0.0' }, { path: 'node_modules/@s/b', version: '2.0.0' }, ...extra];

  it('passes a tree placed by npm ci', () => {
    expect(evaluateInstalled({ lock: lockfile, hiddenLock, installed: installed() })).toEqual([]);
  });

  it('fails a package installed outside the lockfile', () => {
    expect(evaluateInstalled({ lock: lockfile, hiddenLock, installed: installed({ path: 'node_modules/@swc/wasm', version: '1.0.0' }) })).toEqual([
      'installed package not in lockfile: node_modules/@swc/wasm',
    ]);
  });

  it('fails a lockfile-listed binding that npm ci did not place (fallback install)', () => {
    expect(
      evaluateInstalled({ lock: lockfile, hiddenLock, installed: installed({ path: 'node_modules/@unrs/binding-linux', version: '3.0.0' }) }),
    ).toEqual(['installed package not placed by npm ci (absent from node_modules/.package-lock.json): node_modules/@unrs/binding-linux']);
  });

  it('fails an installed version that differs from the lockfile', () => {
    expect(evaluateInstalled({ lock: lockfile, hiddenLock, installed: [{ path: 'node_modules/a', version: '1.0.1' }] })).toEqual([
      'installed version 1.0.1 differs from lockfile 1.0.0: node_modules/a',
    ]);
  });

  it('fails fallback traces in install-script packages', () => {
    const allowlist = { packages: { fsevents: { rootNativeFiles: ['fsevents.node'] } } };
    const traces = {
      'node_modules/unrs-resolver': { npmInstallDir: true, rootNativeFiles: ['resolver.linux-x64-gnu.node'] },
      'node_modules/fsevents': { npmInstallDir: false, rootNativeFiles: ['fsevents.node'] },
    };
    expect(evaluateFallbackTraces({ lock: lockfile, allowlist, traces })).toEqual([
      'install-script fallback directory found: node_modules/unrs-resolver/npm-install',
      'native file written into install-script package root: node_modules/unrs-resolver/resolver.linux-x64-gnu.node',
    ]);
  });
});

describe('follow-up delta: local action references', () => {
  it('lists ./ references, including nested build directories, for resolution', () => {
    const workflow = `- uses: ./.github/actions/build\n- uses: actions/checkout@${SHA}\n- { uses: ./.github/actions/x/ }`;
    expect(localActionReferences(workflow).map(({ reference }) => reference)).toEqual(['./.github/actions/build', './.github/actions/x/']);
  });
});
