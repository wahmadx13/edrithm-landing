# ED-001 — Architecture and layering

## 1. What the API is

The only door to the record (`ARCH-001`). Every client — web, mobile, affiliated
college, public verification — talks to it and to nothing else.

## 2. Top-level layout

`src/` is grouped by **kind**, not by feature alone.

```
src/
  main.ts  app.module.ts        composition root — global wiring only
  modules/<feature>/            every surface a client or consumer hits
  common/                       reusable stateful cross-cutting building blocks
  core/                         app-wide singletons, wired exactly once
  utils/                        pure stateless helpers, zero Nest imports
  templates/                    static content, document templates
```

## 3. The placement question

Ask in order. The first `yes` is the answer.

1. Does it expose a controller or a queue consumer a client or job reaches?
   → `modules/<feature>/`
2. Is it a lifecycle singleton wired once — the database connection, the tenant
   context store, configuration, the scheduler host? → `core/`
3. Is it a reusable building block many modules import — guards, decorators,
   interceptors, encryption, storage, jobs? → `common/`
4. Is it a pure stateless function with no Nest dependency? → `utils/`
5. Is it static content? → `templates/`

**`core/` vs `common/`.** `core/` is wired once and importing it twice would be a
bug. `common/` is freely importable, many times.

**A folder under `modules/` always has a controller or a consumer.** A
surface-less "module" is a smell — fold it into `core/`, `common/` or `utils/`.

## 4. Layering — one direction only

```
Entry -> Tenant context -> Controller | Consumer -> Command | Query -> Repository -> TenantScopedTx -> PostgreSQL
                                                        |
                                                     Policy (authorisation)
                                                     Contract (parse in, allowlist out)
                                                     Rules (institutional policy evaluation)
```

A controller never touches a repository. A repository never depends upward. Full
responsibilities in `ARCH-002`.

**Two things called policy.** `*.policy.ts` is authorisation. Institutional rules —
grading, promotion, eligibility, fees — are *rule evaluation* through the `rules`
module and are never called a policy check in code (`ARCH-002`).

## 5. Module boundaries

1. **Exactly one module owns each table.** Two writers means one module.
2. **No module imports another module's internals.** The only importable path
   across a boundary is `modules/<other>/public/<other>.api.ts`.
3. **Cross-module writes go through the outbox** as a domain event, never a direct
   write into another module's tables.
4. **No circular dependencies**, between modules or between files.
5. A module with no tables and no surface is not a module. Fold it.

## 6. Path aliases

Cross-boundary imports use aliases, never `../../`.

| Alias | Resolves to |
| --- | --- |
| `@modules/*` | `src/modules/*` |
| `@common/*` | `src/common/*` |
| `@core/*` | `src/core/*` |
| `@utils/*` | `src/utils/*` |
| `@contracts/*` | `packages/contracts/*` |

## Enforced by

`dependency-cruiser` (boundaries, cycles, alias-only cross-boundary),
`scripts/check-structure.mjs`, `scripts/check-ownership.mjs`. See `ED-015`.
