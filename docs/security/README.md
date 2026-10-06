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

- a workflow action not pinned to a full commit SHA (`docker://` needs a digest);
- a workflow that runs npm with any subcommand other than `ci`, `run`, `run-script`,
  `test`, `audit`, `sbom`, `ls` or `outdated`, uses npx, pnpm, yarn or bun, or never
  runs `npm ci` outside a comment. Every npm on a line is checked, split at `&&`, `||`,
  `;`, `|`, `&`, `$(` and backticks; a flag before the subcommand must be written
  `--flag=value`, be a `--no-` flag or a known boolean flag, so a flag value is never
  read as the subcommand. `uses` keys are checked in block and flow YAML;
- a lockfile below version 3 or not matching `package.json`;
- a dependency with an install script missing from `security/install-scripts.json`,
  or a stale entry there;
- a high or critical `npm audit` advisory not waived in `security/audit-waivers.json`.
  Waivers name an owner, reason and expiry at most 90 days ahead; expired, stale or
  malformed waivers fail, and a `devOnly` waiver fails if the advisory reaches
  runtime dependencies. An audit that cannot run fails closed.

CI also publishes a CycloneDX SBOM (`npm run sbom`) as a build artifact, and runs
weekly so new advisories surface without a push. Until a release process exists,
the SBOM from each CI run on main is the release SBOM.

Dependabot pull requests for npm and GitHub Actions are automated proposals only
and are never merged on GitHub. The repository's writer applies the update directly
on main through normal review and checks, then closes the bot pull request with
the commit reference.

Limits: the gate catches accidental drift, not a hostile workflow author, who
can always write a step it does not parse. package.json scripts are not inspected,
so `npm run <script>` is trusted to be reviewed with package.json. npm audit sees
only published advisories; install-script review is by package name, so version
bumps of listed packages need reading during update review; the SBOM is per CI
run until a release process exists.
