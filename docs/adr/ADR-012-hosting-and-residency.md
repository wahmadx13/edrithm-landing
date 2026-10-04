# ADR-012 — Managed hosting now, relocatable by design

## Status

Proposed · 2026-09-07

---

## Context

Edrithm earns rupees and pays for infrastructure in dollars, at school-segment
price points. The team is three to four people with no dedicated operations
capacity.

Against that, `DOM-010` §5 records what universities ask before signing: where
data physically lives, whether a dedicated deployment is possible, whether it can
run on their own infrastructure. Those questions arrive during procurement, and an
answer of "that would require a rewrite" ends the conversation.

The nearest substantial cloud regions to Pakistan are in the Gulf and Singapore.
Latency from Lahore to either is acceptable for an administrative application and
is not the deciding factor. Cost and operational attention are.

## Decision

**Deploy on a managed platform with managed PostgreSQL, and preserve relocatability
as a hard architectural constraint.**

1. **No platform-specific primitives.** No proprietary queue, no vendor storage
   API (`ADR-011`), no platform-only database extension, nothing that a move would
   have to be rewritten around.
2. **Everything runs as ordinary containers** against ordinary PostgreSQL, Redis-
   free where possible (`ADR-010`), and S3-compatible storage.
3. **Region is configuration, stated in the agreement**, and the deployment is
   reproducible in another region from infrastructure definitions held in `infra/`.
4. **The relocation path is documented before it is needed** — dedicated schema,
   dedicated database, dedicated deployment, on-premise — as `ADR-002` §6 requires.
5. **The procurement answer is honest**: not "we are on a hyperscaler", but "here
   is the documented path to a dedicated region or your own infrastructure, and it
   changes nothing about how the platform works."

## Rationale

1. **Operational attention is the scarcest resource on this team.** A managed
   platform costs money to save something we have less of.
2. **The relocation property is what makes this survivable.** Because `ADR-002`,
   `ADR-011`, and `ADR-010` were each decided with portability in mind, this is a
   deployment choice rather than an architectural one — which is precisely why
   those decisions were made that way.
3. **Cost scales with revenue.** A managed platform lets a small tenant base be
   economic, where a reserved hyperscaler footprint would not be until much later.
4. **Nothing is foreclosed.** The first university that requires the Gulf or their
   own data centre triggers a migration we designed for, not one we discover.

## Consequences

- **A weaker procurement answer in the interim** than a hyperscaler name would
  give. Accepted, and mitigated by documenting the path rather than improvising it.
- **Platform limits must be understood early** — request duration, background
  process support, connection limits against transaction-mode pooling (`ADR-004`),
  and egress costs for bulk export.
- **The web application and the API must be co-located.** `ADR-014` makes Server
  Components the default read path, so every page render performs server-to-server
  calls to the API. Same region, and ideally the same private network. Splitting
  them across platforms or regions makes every page pay that latency on every
  render and inverts the argument for server rendering entirely. This is a
  deployment constraint, not a preference.
- **Infrastructure is defined as code from the start**, or the relocation property
  is a claim rather than a capability.
- **A per-institution cost model is required** before pricing is set: compute,
  storage, messaging, and model usage per tenant (`17-business/`). Messaging is
  likely to dominate.
- **Backups, restore drills, and a stated recovery objective** are ours to own and
  verify regardless of who runs the hardware.

## Rejected Alternatives

**AWS or Azure in the Gulf from day one** — the strongest procurement answer, and
rejected for now on cost and on the operational attention a four-person team would
spend. Revisited the moment a university deal depends on it.

**A Cloudflare-centric stack (Workers, R2, Hyperdrive)** — attractive storage and
egress economics, and rejected because the Workers runtime fights `ADR-005` and
`ADR-007`: long-running jobs, document generation, and per-transaction database
context are all awkward there. R2 remains a candidate for storage alone.

**Self-hosting in Pakistan from the start** — best possible residency answer and
lowest latency, rejected on the operational burden of running the hardware, the
network, and the durability guarantees ourselves at this team size.

## Review Checkpoint

Move to a hyperscaler region, or to dedicated infrastructure, when any one of
these becomes true:

- A university contract depends on a named region or on-premise deployment.
- A data-protection obligation requires in-country or in-region storage.
- Platform limits constrain document generation, export, or job throughput.
- Cost at scale crosses the point where reserved capacity is cheaper.

## Related Documents

- `ADR-002` §6 · `ADR-004` · `ADR-010` · `ADR-011` · `DOM-010` · `15-compliance/`
