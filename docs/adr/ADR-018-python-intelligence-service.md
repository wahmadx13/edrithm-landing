# ADR-018 — A Python service for intelligence and document extraction

## Status

Proposed · 2026-09-07

---

## Context

Two bodies of work do not belong in the request path of a TypeScript backend.

**Intelligence** (`14-intelligence/`) selects, ranks, explains, and narrates —
turning governed Metric values into statements a principal, a head of department, a
teacher, or a student can act on. `PRI-013` is emphatic that models never compute:
figures are produced deterministically from Metrics (`DOM-013`), and the model's job
is selection and language.

**Document extraction** arrived with `ADR-017`. Institutions upload bills, receipts,
bank statements, and financial statements, and `DOM-008-W` requires that values read
from them are *suggestions with a confidence* which a person confirms before they
become records.

Both are long-running, retryable, and bursty. Neither belongs in a request handler.
`ADR-005`'s review checkpoint anticipated exactly this: when a component's runtime
characteristics diverge, it is extracted along an existing module boundary, and it
need not be TypeScript.

## Decision

**A Python service — `ai` — consuming jobs from the queue,
producing insights and extraction suggestions, with no privileged data access.**

1. **FastAPI**, invoked through the job queue (`ADR-010`), not called synchronously
   from the request path. Its listener is **internal only** — loopback or a private
   interface, never published, never reachable from outside the deployment
   (`ADR-021`).
2. **It computes no figure that a user sees.** It receives Metric values already
   computed by the backend (`DOM-013-K`) and returns selection, ranking, and
   language. A number it produced is a defect.
3. **It holds no privileged database access.** It reads through the backend under
   the same tenant scoping and permission model as any other caller. It is not an
   exception to `ADR-002`, and a direct or superuser connection would make it one.
4. **Retrieval is permission-scoped before generation**, never filtered after
   (`PRI-013`).
5. **Model providers sit behind a narrow interface**, as the token issuer does
   (`ADR-009`), so provider and processing region are swappable.
6. **Extraction output is always a suggestion** carrying a confidence, a model
   version, and the source document, never a written record (`DOM-008-W`).
7. **Per-tenant spend ceilings and a usage ledger** are enforced in this service and
   reported per institution.
8. **No tenant data trains anything**, and contractual no-training terms are a
   prerequisite for any provider.

## Rationale

1. **The libraries are here.** Document extraction, OCR, tabular parsing, and any
   statistical work for early-warning signals are far better served in Python than
   in TypeScript, and this is the majority of the work.
2. **The boundary already exists.** `ADR-007` requires module boundaries enforced
   by tooling; intelligence sits behind one, and extraction behind another. Making
   this a service costs a queue contract we already have.
3. **Failure isolation.** A model provider outage, a slow extraction, or a runaway
   job must degrade an insight panel, never a result declaration. `EDR-VAL-003`
   requires unavailable to be shown as unavailable rather than as zero — easier to
   guarantee across a queue boundary.
4. **Cost and burst behaviour differ** from the transactional workload and are
   better scaled and budgeted separately.
5. **It keeps `PRI-013` structurally enforceable.** A service that has no
   database access and receives Metric values as input *cannot* compute a figure
   even by accident.

## Consequences

- **A second language enters the stack**, against `ADR-005`'s consistency argument.
  Accepted, and bounded: one service, behind a queue, with a contract. The rule is
  that domain logic does not migrate into it.
- **The queue contract between backend and service is versioned** and lives with
  the other contracts (`ADR-008`), in whatever form crosses the language boundary.
- **Its own dependency and vulnerability surface** to keep current.
- **Insight quality needs evaluation, not opinion** — a held-out set of real
  institutional situations with expected outputs, and Urdu output reviewed by
  someone who speaks it, before anything reaches a principal.
- **Extraction confidence must be calibrated** and surfaced honestly, including a
  threshold below which a suggestion is not shown at all (`DOM-008` §14).
- **Nothing in the MVP depends on this service being available.** Insight is
  additive; the record is not.

## Rejected Alternatives

**Intelligence inside the NestJS backend** — one fewer service and one fewer
language, and it puts model calls and extraction in the request path, gives that
code privileged data access, and makes `PRI-013` a matter of discipline rather than
structure. Rejected.

**A managed AI platform or vendor SDK called directly from the backend** — fastest
to a demo, and it couples us to a provider and a region, and offers nowhere to
enforce spend ceilings or permission-scoped retrieval. Rejected.

**Node with Python called out to for extraction only** — splits the work across a
boundary that does not match how it is written, for no gain.

**Deferring all of this** — `14-intelligence/` is a committed part of the product,
and the extraction requirement arrived with `ADR-017`. Deferring the service means
doing this work somewhere worse.

## Review Checkpoint

Revisit if the service accumulates domain logic — which would mean a boundary was
drawn in the wrong place — or if intelligence becomes latency-sensitive enough that
a queue-only interface is insufficient.

## Related Documents

- `PRI-013` · `DOM-008-W` · `DOM-013` · `ADR-002` · `ADR-005` · `ADR-007` ·
  `ADR-009` · `ADR-010` · `ADR-017` · `14-intelligence/` · `EDR-VAL-003`
