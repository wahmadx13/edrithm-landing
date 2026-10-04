# ADR-002 — Multi-Tenancy and Isolation

## Status

Accepted · 2026-09-07

*Note: this ADR fixes the isolation **model and enforcement principle**. The specific database and
platform are a separate decision (`ADR` for stack selection, Tier 2), constrained by this one.*

---

## Context

Edrithm holds the records of many institutions on shared infrastructure. Most of the humans in those
records are children. A cross-tenant leak would be a breach involving minors' identity documents,
academic records, and family financial information, and it would end the company.

The institutions themselves differ by three orders of magnitude — a 300-student school and a
40,000-student university with 60 affiliated colleges — and both must be economic at Pakistani price
points.

There is also a commercial dimension that is easy to underestimate. University procurement asks where
data lives, whether it can be held on dedicated infrastructure, and whether an on-premise deployment
is possible. These questions arrive before a contract, and an answer of "that would require a
rewrite" ends the conversation.

And uniquely for this product, the boundary is not absolute by design: an affiliated college and its
university *must* share specific records (`DOM-005`). The model must therefore be strict by default
and precisely permeable, rather than either open or sealed.

The options considered:

1. **Shared database, shared schema, application-enforced filtering** — a `tenant_id` column and a
   `where` clause in every query.
2. **Shared database, shared schema, database-enforced isolation** — row-level security with tenant
   context set on the connection.
3. **Schema per tenant** — one schema per institution in a shared database.
4. **Database per tenant.**

---

## Decision

**Shared database with database-enforced row-level isolation, and a model that permits any single
institution to be relocated to dedicated storage without application change.**

1. **Every tenant-scoped table carries the institution.** No exceptions beyond the small, enumerated
   set of global entities in `DOM-010` §3, each of which requires its own justification.

2. **Isolation is enforced by the database, not by application code.** Tenant context is established
   once at the request boundary from the authenticated Membership. A query written without a tenant
   condition must be *refused by the database*, not corrected in review.

3. **Application code cannot choose its tenant.** Tenant context is not a parameter. There is no
   privileged connection available to feature code.

4. **There is no administrative override.** No support tool, internal dashboard, or staff role reads
   tenant data outside a recorded, consented, time-boxed support grant (`DOM-010-C`).

5. **Cross-tenant access exists only through an Affiliation** — explicit, effective-dated, scoped by
   program and data category, and audited on both sides (`DOM-005`, `DOM-012-F`).

6. **Tenant location is resolved, never assumed.** The application asks where a tenant's data lives
   rather than assuming one database. Moving an institution to its own schema, database, or
   deployment must require no change to application code or the domain model.

7. **Isolation is continuously tested.** An automated suite attempts cross-tenant reads through every
   access path — service, API, background job, report, export — and a single success fails the build.

---

## Rationale

**Why row-level enforcement (option 2).** It makes the safe path the default and the
unsafe path impossible rather than merely discouraged. A developer who forgets gets
an error, not a leak. It also keeps a single shared schema, so migrations are one
operation rather than thousands — which matters enormously for a four-person team.

**Why §6 matters as much as the rest.** It costs almost nothing today — a resolution
step instead of a constant — and it is the difference between "yes, and it changes
nothing" and "no" when a vice-chancellor's IT officer asks about dedicated
infrastructure (`PER-011`).

---

## Rejected Alternatives

**Application-enforced filtering (option 1)** — enforced by every developer
remembering, on every query, forever, including in background jobs, exports, and
reports written under deadline. It fails once, silently. For a system holding
minors' records, a control that depends on universal recall is not a control.

**Schema-per-tenant (option 3)** — migration cost scales with tenant count, and a
partial migration failure leaves institutions on different schema versions.
Connection and catalogue overhead grows with tenant count, which is punishing in a
market full of small schools. Retained as the *upgrade path* for a large university
under §6, not as the default.

**Database-per-tenant (option 4)** — operationally correct and commercially
impossible at Pakistani school pricing. Also retained as an upgrade path.

---

## Consequences

### Positive

- A forgotten tenant condition produces an error rather than a breach.
- One schema, one migration path, affordable for a small team and a large tenant count.
- Economic at every institution size, which is what makes the school segment viable.
- Credible answers to procurement questions about residency and dedicated deployment.
- Affiliation becomes the single, auditable door — easy to reason about and easy to explain.

### Trade-offs

- **The data layer must be chosen with this as a hard constraint.** It rules out data-access
  approaches that cannot reliably carry tenant context on the connection, and that constraint is
  binding on the Tier 2 stack decision.
- **Connection and context management becomes critical infrastructure.** Pooling, background jobs,
  and async work must all carry context correctly, and getting it wrong is subtle.
- **A performance cost on every query**, and index design must account for tenant-leading access
  patterns from the start.
- **A noisy-neighbour risk** on shared infrastructure; large tenants need monitoring and eventually
  the §6 upgrade path.
- **Global entities are a permanent hazard.** Each one is a place where isolation must be reasoned
  about individually, which is why the list is short, enumerated, and requires an ADR to extend.
- **Testing isolation is ongoing work**, not a one-time exercise. Every new access path needs a test.

---

## Related Documents

- `docs/10-domain/DOM-010-tenancy-and-isolation.md`
- `DOM-004` (global Person) · `DOM-005` (the only door) · `DOM-011` · `DOM-012`
- `docs/05-product-principles.md` — `PRI-014`
- `docs/08-user-personas.md` — `PER-011`
