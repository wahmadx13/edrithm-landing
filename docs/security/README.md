# Security requirements and current assurance

See ../rules/ED-007-security-and-tenancy.md and ADR-002/009/019/021. Preserve tenant
isolation, explicit authorization and audit boundaries. The operator application
must never gain tenant browsing, impersonation or privilege override.

This repository setup does not certify production readiness. Existing scaffold
security review has unresolved object-lifetime and schema-resolution findings;
production data access and dependent features require independent correction and
review. Health checks, static previews and local UI tests do not establish tenant
isolation, authentication, full authorization, deployment or native-device safety.

No production credentials are configured. Local env files are ignored; only
placeholder examples may be committed. Add feature-specific security checks and
independent review before shipping the corresponding boundary.
## Supply-chain gate

`npm run check:supply-chain` runs first in CI and fails on:

- an action not pinned to a full commit SHA (`docker://` needs a digest), in any
  workflow or in any local `action.yml`/`action.yaml` (composite actions are scanned
  too). `uses` keys are checked in block and flow YAML; the complex-key form
  `? uses` is rejected as unsupported;
- a workflow or action step that runs npm with any subcommand other than `ci`,
  `run`, `run-script`, `test`, `audit`, `sbom`, `ls` or `outdated`, runs npm with
  no subcommand (e.g. `$(which npm) install`), or uses npx, pnpm, yarn, bun or
  corepack. Every npm on a line is checked, split at `&&`, `||`, `;`, `|`, `&`,
  `$(` and backticks; npm is recognised case-insensitively as `npm`, `npm.cmd`,
  `npm.ps1`, `npm.exe` or `npm-cli.js` under any path. A flag before the subcommand
  must be `--flag=value`, a `--no-` flag or a known boolean flag. Comments are
  stripped only outside quotes, and folded (`>`) and backslash-continued `run`
  blocks are joined before checking. A workflow must run `npm ci` outside a comment;
- a lockfile below version 3 or not matching `package.json`;
- a dependency with an install script that `security/install-scripts.json` does not
  list with its dependency class (`production` or `development`, matching the
  lockfile) and the exact versions whose script was read; or a stale entry there;
- a high or critical `npm audit` advisory not waived in `security/audit-waivers.json`.
  Waivers name an owner, reason and expiry; `devOnly: true` waivers run at most 90
  days and fail if the advisory reaches runtime dependencies; `devOnly: false`
  waivers run at most **30 days**. Expired, stale or malformed waivers fail. An audit
  that cannot run fails closed.

After `npm ci`, `npm run check:installed` fails if any installed package is missing
from `package-lock.json`, was not placed by `npm ci` (absent from
`node_modules/.package-lock.json`, which catches a fallback that installs a
lockfile-listed binding itself), or has a version different from the lockfile; if an
install-script package contains an `npm-install` fallback directory or a `.node`
file written into its root (unless its review lists it in `rootNativeFiles`); or if a
reviewed `loadCheck` module (the native bindings of @swc/core and unrs-resolver)
cannot be loaded. Local actions are scanned wherever they live, and every `uses: ./`
reference must resolve to a scanned `action.yml`/`action.yaml`.

CI also publishes a CycloneDX SBOM (`npm run sbom`) as a build artifact, and runs
weekly so new advisories surface without a push. Until a release process exists,
the SBOM from each CI run on main is the release SBOM.

Dependabot pull requests for npm and GitHub Actions are automated proposals only
and are never merged on GitHub. The repository's writer applies the update directly
on main through normal review and checks, then closes the bot pull request with
the commit reference.

Limits: the gate catches accidental drift, not a hostile workflow author, who
can always write a step it does not parse. package.json scripts are not inspected,
so `npm run <script>` is trusted to be reviewed with package.json. A folded `run`
block that splits `npm` and `ci` across lines is rejected (fail closed). npm audit
sees only published advisories; the installed-tree check sees package directories,
fallback directories and root `.node` files, not arbitrary files written elsewhere;
on Windows the @swc/core load check needs the documented private
`SWC_NATIVE_BINDING_CACHE`; the SBOM is per CI run until a release process exists.
Known gaps deferred to a later pass: `name:`/`description:` exemptions also apply
to lines inside `run` blocks; backslash-escaped quotes can desynchronise comment
stripping; `bunx` and `yarnpkg` are not matched; Docker `image:` references in
`action.yml` are not digest-checked.
