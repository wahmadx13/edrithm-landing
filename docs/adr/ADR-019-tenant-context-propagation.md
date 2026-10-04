# ADR-019 — Tenant context travels in AsyncLocalStorage; a scoped transaction handle is the guarantee

## Status

Proposed · 2026-09-07

---

## Context

`ADR-002` and `ADR-004` put isolation in the database: every query runs on a
connection where the tenant claim has been set for the transaction, and a query
without one is refused by PostgreSQL rather than corrected in review.

That decision is only as good as the mechanism that gets the claim onto the
connection. This ADR specifies that mechanism, because it currently exists only as
an implication of ADR-002 — and an implied security control is not a control.

Three properties are required.

**It must reach every layer** without threading a parameter through every signature
in the system, and without any component being able to proceed with no tenant.

**It must work identically outside HTTP.** The outbox relay (`ADR-010`), document
generation, bulk import, notification dispatch (`ADR-016`), and scheduled work all
touch tenant data and none of them has a request. A mechanism that works one way
for requests and another way for jobs is a mechanism where one of the two paths
will eventually be wrong.

**It must survive singletons.** `ADR-005` uses NestJS, whose providers are
singletons by default. A service that stores `this.institutionId` between requests
is a cross-tenant leak — and one that passes every test written by someone
reasoning about a single request.

## Decision

**Tenant context propagates through AsyncLocalStorage. Data access is only
reachable through a transaction handle that cannot exist without it.**

1. **Context is established once at each entry boundary** — an HTTP middleware, a
   job consumer's wrapper, a scheduled task's wrapper — by opening an
   AsyncLocalStorage store holding the institution, the principal, the active
   Membership, and a correlation id. Entry boundaries are enumerated and few.

2. **No provider holds request state.** Singletons stay singletons and read context
   from the store. State on a provider is a lint-level prohibition, not a
   convention.

3. **Repositories never receive a raw connection.** They receive a
   `TenantScopedTx` handle. The only way to obtain one is the transaction helper,
   which opens a transaction, sets the tenant claim for it, and hands back the
   handle.

4. **The helper fails closed.** No context in the store means an exception, never a
   fallback to unscoped access, never a default institution, never a null tenant
   treated as "all".

5. **There is no unscoped query API.** No repository method, no service, and no
   feature code can obtain a connection any other way. The narrow set of legitimate
   exceptions — migrations, the outbox relay's own dispatch table, platform-level
   configuration — use a separately named, separately reviewed path that cannot
   reach tenant-scoped tables.

6. **Crossing a tenant boundary is explicit.** An affiliation read (`DOM-005`) opens
   a *new* scoped transaction for the other institution, authorised by the
   affiliation and audited (`DOM-012-F`). Context is never mutated in place to
   become another tenant.

7. **Context propagates into jobs as data.** A job enqueued during a request
   carries its institution and principal in its payload; the consumer opens a fresh
   store from them. Context is never assumed to survive the queue.

## Rationale

1. **The handle is the real control; the store is only transport.** Even if
   propagation were wrong, a query cannot be executed outside a scoped transaction
   because no such API exists. This is `ADR-002`'s "refused rather than reviewed"
   extended one layer up, and it is what makes the whole isolation model defensible
   rather than diligent.

2. **AsyncLocalStorage is the only propagation that works everywhere.** The same
   mechanism serves requests, queue consumers, and cron. One path means one thing
   to get right.

3. **Request-scoped providers were rejected on two counts.** Scope bubbling is
   viral — every dependent becomes request-scoped, propagating through services to
   controllers and instantiating much of the graph per request. And `Scope.REQUEST`
   does not exist outside HTTP, so jobs would need a second mechanism, which
   reintroduces exactly the divergence this decision exists to prevent.

4. **Fail-closed is the only safe default.** Every plausible failure — a forgotten
   wrapper, a new entry point, an escaped async context — must produce an error, not
   a query with no tenant condition. An error is a bug report; the alternative is an
   incident involving children's records.

5. **It keeps the cost proportionate.** Explicit parameter threading would also be
   correct, and it would mean every signature in the system carries a context
   argument and every refactor touches all of them. The handle gives most of that
   guarantee at a fraction of the churn.

## Consequences

- **The transaction helper is the most security-critical code in the system.** It is
  small, it is reviewed by more than one person, and it is held at full test
  coverage.

- **Isolation tests must run concurrently.** AsyncLocalStorage failures do not
  appear in sequential tests. The suite required by `DOM-010-F` runs handlers for
  different institutions simultaneously and asserts no bleed, through every entry
  boundary: HTTP, queue consumer, scheduled task, affiliation crossing.

- **Every new entry point is a review checkpoint.** Adding a queue consumer, a
  webhook receiver, or a scheduled task means establishing context correctly; the
  wrapper is provided so that this is one call rather than a pattern to remember.

- **Async context can be lost** across certain boundaries — some event-emitter
  patterns, some third-party callback APIs. Where that happens, context is passed
  explicitly. The fail-closed helper turns a lost context into an immediate error
  rather than a silent leak, which is how these get found.

- **Debugging is less obvious than explicit parameters.** Mitigated by carrying a
  correlation id in the same store and including institution and principal in every
  log line (redacted per `DOM-012`).

- **The intelligence service is unaffected and must stay so.** It holds no database
  access at all (`ADR-018` §3), so this mechanism is not its concern — and giving it
  one would make it the exception that undoes this decision.

## Rejected Alternatives

**Request-scoped NestJS providers** — idiomatic, type-safe, and it does not exist
outside HTTP and bubbles virally through the dependency graph. Rejected on both
counts.

**An explicit context parameter on every service and repository method** —
compiler-enforced, works everywhere, and the most defensible of the options on pure
correctness grounds. Rejected on churn: it threads through every signature in the
system, and the scoped-handle rule delivers the guarantee that actually matters
without it. Reconsider if ALS proves unreliable in practice.

**Context on a singleton provider, set per request** — the mistake this ADR exists
to prevent. Under concurrency it serves one institution's data to another.

**A tenant column filter applied in the data-access layer** — application-level
filtering, already rejected by `ADR-002` for cause.

**Deriving tenant from a header at each call site** — moves the decision to hundreds
of places, each of which can forget.

## Review Checkpoint

Revisit if AsyncLocalStorage proves lossy across a boundary we depend on, or if the
concurrent isolation suite ever fails for a propagation reason rather than a policy
reason. The fallback is explicit parameter passing, and the scoped handle means that
change is contained to the helper's signature rather than to the isolation model.

## Related Documents

- `ADR-002` · `ADR-004` · `ADR-005` · `ADR-006` · `ADR-010` · `ADR-016` · `ADR-018` ·
  `DOM-005` · `DOM-010-D` · `DOM-010-F` · `DOM-012-F` · `PRI-014`
