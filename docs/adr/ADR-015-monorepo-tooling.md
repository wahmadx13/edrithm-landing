> Superseded for repository/tooling structure by ../REPOSITORY-DECISION.md. Preserved as historical rationale only.

# ADR-015 — pnpm workspaces and Turborepo

## Status

Proposed · 2026-09-07

---

## Context

The repository now holds a Next.js application, a NestJS backend, worker
processes, and shared packages — contracts (`ADR-008`), the design system, and the
policy engine. They share dependencies, and `packages/contracts` is imported by
almost everything.

The restructure that created `apps/`, `backend/`, `ai/`, and `packages/` deliberately
left the package manager undecided, keeping a minimal npm root that does nothing
but hold git hooks. That was a placeholder, not a decision.

Three properties matter for a team of this size: installs must be fast enough that
nobody avoids them, a change to `packages/contracts` must visibly and immediately
break every consumer that is now wrong, and CI must not rebuild and retest
everything on every commit.

## Decision

**pnpm workspaces for dependency management, Turborepo for task orchestration.**

1. Workspace packages are referenced by name, and the type checker resolves across
   package boundaries so a contract change surfaces as a compile error everywhere
   it matters.
2. Turborepo defines the task graph — build, typecheck, lint, test — with caching
   keyed on inputs, locally and in CI.
3. Dependency boundaries between packages are enforced by tooling, matching
   `ADR-007`'s requirement that module boundaries are mechanical rather than
   cultural.

## Rationale

1. **pnpm's strict linking prevents phantom dependencies** — a package importing
   something it never declared, which works locally and fails in a different
   install. In a repository where several deployables share packages, that failure
   mode is expensive and hard to diagnose.
2. **Disk and install time.** Content-addressed storage makes installs fast enough
   that CI and a developer's laptop both stop resenting them.
3. **Turborepo's caching keeps the feedback loop short.** A change to the web
   application should not retest the backend.
4. **It is boring where it counts** (`PRI-015`). No exotic build system, no
   bespoke scripts.

## Consequences

- **The minimal npm root is replaced**, and git hooks move to the pnpm root. A
  clean install is required once at the changeover.
- **`packages/contracts` becomes the most-depended-upon package** and its build
  must be fast, since everything waits on it.
- **CI configuration is task-graph-shaped** rather than a list of steps.
- **Everyone must use pnpm.** A stray `npm install` produces a divergent lockfile,
  so this is enforced in CI rather than requested.

## Rejected Alternatives

**Plain npm workspaces** — one less tool, and it keeps the current setup working.
Rejected on strictness: npm's flat installs permit phantom dependencies, which is
the failure this repository shape is most exposed to.

**Yarn or Bun workspaces** — Yarn offers no advantage here over pnpm; Bun is fast
and still maturing for a production monorepo of this shape.

**Nx** — more capable than Turborepo, with generators and a richer dependency
graph, and more configuration than four people need. Turborepo does the one thing
required — cache the task graph — with much less surface.

**No monorepo tooling at all** — viable at two packages, unworkable at eight.

## Related Documents

- `ADR-007` · `ADR-008` · `PRI-015` · `ROOT-001` (repository structure)

