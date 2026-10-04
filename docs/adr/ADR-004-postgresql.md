# ADR-004 — PostgreSQL as the database

## Status

Proposed · 2026-09-07

---

## Context

`ADR-002` fixed the isolation model before the platform was chosen, and it made
two demands that are unusual enough to eliminate most candidates on their own:

1. **A query written without a tenant condition must be refused by the database**,
   not corrected in review. That requires enforcement *inside* the engine.
2. **Tenant context is set once at the request boundary** and carried on the
   connection, not passed as a parameter application code chooses.

`ADR-003` adds a third: an append-only ledger where "current value" means "latest
unsuperseded", results are computed from that ledger plus effective-dated policy,
and both must be reproducible years later.

`DOM-009` adds a fourth: policy is structured, validated, versioned data that is
queried and evaluated, not compiled in.

## Decision

**PostgreSQL, and the platform's isolation model is built on its row-level
security.**

- Every tenant-scoped table carries `institution_id` and an RLS policy that reads
  the tenant claim from the connection's session context.
- Tenant context is set per transaction (`SET LOCAL`), never per process.
- The database is the source of truth for schema, constraints, and isolation.
- `jsonb` with check constraints and validation at the boundary carries policy
  definitions (`DOM-009`), where a rigid column-per-rule schema would need a
  migration for every institution's variation.

## Rationale

1. **Row-level security is the decision.** It is the only mainstream way to make
   `ADR-002`'s first demand literally true rather than aspirational. Nothing else
   we considered offers per-row policy enforcement tied to a session claim.
2. **The ledger needs real SQL.** "Latest unsuperseded entry per person per
   assessment", ranked over supersession chains, with typed absences excluded from
   aggregates, is a window-function query. It is written once, correctly, and read
   often. An engine that makes this awkward makes the core of the product awkward.
3. **Effective dating needs range types and exclusion constraints.** Policies, org
   units, fee structures, and role grants all carry validity ranges, and
   overlapping versions must be impossible rather than merely unlikely. `tstzrange`
   with an exclusion constraint enforces that in the engine.
4. **Financial correctness needs exact numerics.** `numeric` for money, with no
   float arithmetic anywhere near an invoice.
5. **Policy is semi-structured by nature.** `jsonb` holds a grading scheme with
   institution-specific shape while check constraints and schema validation keep it
   honest.
6. **It is boring where it counts** (`PRI-015`). Mature, well understood, available
   as a managed service in every region we will ever need, and self-hostable when a
   university requires it (`DOM-010-I`).

## Consequences

- **RLS must be right from the first migration.** A table added without a policy
  is a hole, so the migration convention makes the policy part of creating a
  tenant-scoped table, and the isolation test suite (`DOM-010-F`) fails the build
  if one is missing.
- **Connection pooling must preserve transaction-scoped context.** Transaction
  pooling is required; session-level `SET` is unsafe under a shared pool. This is
  a known operational hazard and is called out here so it is designed, not
  discovered.
- **A small performance cost on every query**, and indexes must lead with
  `institution_id`.
- **Reporting load will eventually need separation** from transactional load —
  read replicas, then projections (`DOM-012`). Not now, but the projection model
  exists partly so this is possible without redesign.

## Rejected Alternatives

**MySQL / MariaDB** — no row-level security. Isolation would fall back to
application filtering, which `ADR-002` rejected for cause. Weaker range, `jsonb`,
and window-function support for exactly the queries the ledger needs.

**MongoDB or another document store** — the domain is deeply relational (a person
in two institutions, enrollments, ledgers, affiliations) and the integrity
requirements are the product. Losing constraints in exchange for flexible policy
documents is a bad trade when `jsonb` gives us the flexibility inside a relational
engine.

**A managed multi-tenant platform with built-in isolation (Firebase, Supabase as a
platform rather than as Postgres)** — Supabase is PostgreSQL and would not be
rejected on the engine; the platform question is decided separately in `ADR-009`
and `ADR-012`. Firebase's model cannot express the ledger, the effective dating,
or the reporting, and is rejected as the primary store.

**SQLite at the edge for offline clients** — not a competing decision. Offline
capture is a separate problem addressed in its own ADR; this decision concerns
the system of record.

## Review Checkpoint

Revisit if any one of these becomes true:

- A tenant grows large enough that shared-schema RLS is no longer economic, at
  which point `ADR-002` §6 applies and the schema or database moves — the engine
  does not.
- A jurisdiction requires a database we cannot self-host in-region.
- Reporting load cannot be served from replicas and projections.
