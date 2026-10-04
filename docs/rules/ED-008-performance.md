# ED-008 — Performance

The operating conditions are inexpensive Android phones, weak and intermittent
connections, and institutions ranging from three hundred students to forty thousand
(`PRI-009`). Performance here is a correctness-adjacent concern, not polish.

## 1. Budgets

Asserted in specs, not aspired to.

| Surface | Budget |
| --- | --- |
| Read endpoint, p95 | 300 ms server time |
| Write endpoint, p95 | 500 ms server time |
| Any list endpoint | paginated, hard maximum page size, no unbounded result |
| Queries per request | asserted per use case; a change that adds one is deliberate |
| Response payload | asserted per use case |
| Web first contentful paint, mid-range Android, 3G | under 2.5 s |
| Attendance marking, offline | under 200 ms to locally durable |

## 2. Rules

1. **No N+1**, ever. Related data is fetched in the same round trip, and specs
   assert the query count.
2. **Explicit projections.** Never `select *`; a query names its columns.
3. **Every foreign key is indexed**, and every composite index leads with
   `institution_id`.
4. **Nothing over a megabyte is held in memory.** Exports, imports, statement files
   and document bundles stream end to end. No buffering a file to hash, scan or
   store it.
5. **No unbounded work in a request.** Bulk generation, bulk import, bulk export and
   recomputation are jobs (`ARCH-005`).
6. **Result computation is cached and invalidated by ledger and policy version**,
   never recomputed per row on a list screen.
7. **Document generation is lazy** and pooled (`ADR-020`); it never blocks a
   declaration.

## 3. The mobile and offline path

1. The device holds the current day's rosters, not the institution.
2. Sync is incremental and resumable; a dropped connection never restarts a batch.
3. A queued record is durable before the interface confirms it. "Saved" means
   written to local storage, not sent.

## 4. Cost is a performance concern

Per-institution cost — compute, storage, notifications, model usage — is measured
per feature, not per month (`ADR-012`). A feature whose per-tenant cost is unknown
is not finished. Model spend is bounded by a per-tenant ceiling (`ADR-018`).

## Enforced by

Query-count and payload assertions in every query spec, `scripts/check-indexes.mjs`,
`scripts/check-projection.mjs`, ESLint `no-restricted-imports` for buffering APIs,
a soak test in CI, Lighthouse budgets on the web build. See `ED-015`.
