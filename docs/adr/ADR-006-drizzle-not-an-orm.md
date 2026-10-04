# ADR-006 — Drizzle, not an Active Record ORM

## Status

Proposed · 2026-09-07

---

## Context

Edrithm's data layer has three requirements that are unusual together, and each
of them is load-bearing rather than incidental.

**Row-level security with per-transaction tenant claims.** `ADR-002` and `ADR-004`
put isolation in the database. Every transaction must set the tenant claim on its
connection before any statement runs, and every query must go through a connection
where that has happened. A data layer that manages connections opaquely, or that
issues queries outside an explicit transaction, is a hole in the isolation model.

**A ledger read with real SQL.** "Latest unsuperseded marks entry per person per
assessment", supersession chains, typed absences excluded from aggregates
(`DOM-007-E`), results recomputed under historical policy versions, effective-dated
resolution of the most specific active policy — these are window functions,
lateral joins, and range predicates. They are the core of the product, not an
edge.

**The database as the source of truth.** Constraints, exclusion constraints on
effective ranges, and RLS policies live in migrations and are the real guarantees.
A tool that treats a model class as the source of truth and derives the schema
from it inverts that relationship.

An Active Record ORM is designed against all three. The model and the row become
one class; relationships traverse by property access that silently issues queries;
global query modifiers are invisible at the call site; lifecycle hooks fire with
no call site.

## Decision

**Drizzle. The database is the source of truth; the schema definition describes
tables that migrations create.**

- All SQL lives in repository modules owned by the domain module that owns those
  tables (`DOM-012` module ledger, `ADR-007`).
- Raw SQL is permitted and expected in repositories.
- Every repository call executes inside a transaction that has already set the
  tenant claim. Obtaining a connection any other way is blocked.
- Prisma, TypeORM, MikroORM, Sequelize and any Active Record layer are blocked at
  the import level.

## Rationale

1. **Prisma's row-level-security story is the weakest of the mainstream options.**
   Setting a session variable per transaction requires escaping to raw execution,
   and its connection handling makes "this query definitely ran on a connection
   with the tenant claim set" hard to guarantee rather than easy. `ADR-002` says
   isolation must be structural. A data layer that makes the structural guarantee
   awkward defeats the decision that matters most.
2. **We will write the ledger queries by hand regardless.** Given that, the value
   of a query-generating abstraction is small and its cost — an opaque layer
   between us and the query the database actually runs — is real.
3. **The seam is preserved.** Domain types and table shapes stay distinct, so the
   data layer can be replaced file by file with the compiler naming every call
   site.
4. **Migrations are plain SQL**, which is what RLS policies, exclusion constraints,
   and check constraints have to be anyway.
5. **Consistency with how the team already works.** This matches the decision
   already reached on the API project, for closely related reasons.

## Consequences

- **More query code written by hand** than an ORM would generate. Accepted; the
  queries that matter were always going to be hand-written.
- **Repository discipline is the boundary.** No SQL outside a repository, no
  repository outside its owning module. Enforced by tooling, not review.
- **Connection acquisition is centralised** so that the tenant claim cannot be
  omitted. This is the single most security-sensitive piece of infrastructure in
  the system and is written once, with tests that assert isolation through every
  path (`DOM-010-F`).
- **Developers used to an ORM need to learn SQL properly.** For this domain that
  is a benefit.
- **No lazy loading**, so query shape is a deliberate decision at every call site.
  Accepted, and preferable to discovering an N+1 in a result computation.

## Rejected Alternatives

**Prisma** — for the RLS and raw-SQL reasons above. It abstracts away precisely the
PostgreSQL features this design depends on, and the isolation guarantee is the one
thing we cannot make best-effort.

**TypeORM / MikroORM** — Active Record or heavyweight Data Mapper; both reintroduce
the coupling this decision exists to avoid.

**Raw `pg` with no query builder** — honest, and viable, but gives up compile-time
column and type checking across a schema this size for no gain. Drizzle is a typed
layer over SQL rather than an abstraction away from it, which is what we want.

## Review Checkpoint

Revisit if Drizzle's migration or RLS story regresses, or if a schema-level feature
we depend on becomes unsupportable. The seam in §Reasons 3 is what makes that
survivable.
