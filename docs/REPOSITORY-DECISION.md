# Independent repository decision

Accepted by owner, 2026-10-04. Supersedes ADR-015 and older monorepo/tooling paths.

This project uses six independent repositories: frontend, backend, ai, landing,
superadmin and mobile (each prefixed edrithm-). One institutional role-based web
app and one role-based mobile app; the operator app remains separate. This changes
source organization, not backend domain/module boundaries or tenant isolation.

Each repo has its own dependencies, lockfile, environment, docs, checks and build.
No worktrees or PRs. Work on main; after the relevant independent lead reviews the
exact work and applicable checks pass, push directly to main. If remote main has
changed, integrate and revalidate before pushing. Never force-push or bypass checks.
Team coordination and review records live in the local parent desk, outside Git.

Each repo tracks placeholder .env.example and ignores .env and environment variants.
Test environment inspection is currently owner-authorized until revoked or marked
sensitive. Do not commit credentials or echo them into logs. Browser/mobile public
variables are public. Provision real service credentials separately when needed.

Frontend maintains the publishable canonical Tangerine token artifact. Consumers
pin generated snapshots with provenance until an independent package publication
path is established. No runtime imports from sibling repos. Shared API contracts
must likewise be versioned and independently consumable before feature integration.
