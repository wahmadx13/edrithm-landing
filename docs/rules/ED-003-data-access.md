# ED-003 — Data access

The most consequential rules in this repository. Everything `ADR-002` promises is
either true here or true nowhere.

## 1. Drizzle only

Drizzle is the data layer (`ADR-006`). Prisma, TypeORM, MikroORM, Sequelize and any
Active Record layer are blocked at the import level.

The database is the source of truth. `db/schema.ts` describes tables that
migrations create; it does not generate them.

## 2. All SQL lives in a repository

A repository owns all data access for its module and never imports a command, a
query, a policy, a controller or another module. Raw SQL is permitted and expected
there.

No SQL anywhere else. Not in a command, not in a consumer, not in a helper, not in
a script that is not a migration.

## 3. Every query runs inside a TenantScopedTx

**A repository method takes a `TenantScopedTx` and cannot obtain a connection any
other way.** The only source of one is the transaction helper, which reads tenant
context from AsyncLocalStorage, opens a transaction, sets the tenant claim for it,
and **throws when context is absent** (`ADR-019`).

There is no unscoped query API. There is no fallback to "no tenant". There is no
default institution. A null tenant is never treated as "all".

The enumerated exceptions — migrations, the outbox relay's own dispatch table,
platform configuration — use a separately named, separately reviewed accessor that
**cannot reach tenant-scoped tables**.

## 4. Crossing a tenant boundary

An affiliation read opens a **new** scoped transaction for the other institution,
authorised by the affiliation and audited on both sides (`DOM-005`, `ADR-019 §6`).
Context is never mutated in place to become another tenant. There is no API that
would allow it.

## 5. Ledger tables

`UPDATE` and `DELETE` against a ledger table (`ARCH-004 §1`) are refused by a
database trigger. Application code does not attempt them.

A correction is a new row naming what it supersedes, with actor, timestamp, reason
and authority. Reading "current" means reading the latest unsuperseded row; reading
"as of date D" means reading what was unsuperseded at D. Both are repository
methods, written once, not reconstructed per call site.

## 6. Query discipline

1. **No set operations in TypeScript.** Filtering, joining, sorting, grouping,
   aggregating and paginating happen in SQL. Loading rows to filter them in memory
   is a defect, not a style preference.
2. **No formatting in SQL.** Dates, currency, names and labels are formatted in the
   presentation layer, in the reader's locale (`ED-013`).
3. **Explicit projections.** Never `select *`. A query names its columns, which is
   also what stops a new sensitive column silently entering a response.
4. **Typed absence is handled explicitly.** A `SUM` or `AVG` over marks must state
   what it does with absent, not-appeared, exempted and withheld (`DOM-007-E`). An
   aggregation that treats absence as zero is a defect.
5. **No N+1.** A list query fetches its related data in the same round trip.
   Query-count assertions in specs enforce it (`ED-008`).

## 7. Migrations

Plain SQL, forward-only, one concern each. A migration creating a tenant-scoped
table creates its RLS policy in the same migration. Indexes on large tables build
concurrently. An applied migration is never edited.

Expand-then-contract: additive migration, then code, then removal in a later
release (`ARCH-008`).

## 8. Casing

Database names stay `snake_case`. Code stays `camelCase`. The mapping happens
exactly once, in `db/schema.ts`. No `snake_case` identifier appears anywhere else.

## Enforced by

`dependency-cruiser` (repository isolation, no upward imports), ESLint
`no-restricted-imports` (banned ORMs), `scripts/check-query-discipline.mjs`,
`scripts/check-projection.mjs`, `scripts/check-tenancy.mjs`,
`scripts/check-indexes.mjs`, database triggers for ledger immutability. See
`ED-015`.
