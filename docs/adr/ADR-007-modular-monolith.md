# ADR-007 — Modular monolith, not microservices

## Status

Proposed · 2026-09-07

---

## Context

Edrithm spans many domains — admissions, people, structure, timetabling,
attendance, assessment, results, documents, fees, communication, affiliation,
intelligence — across three institution kinds and an external API. The surface
suggests distribution. Four properties of this specific system argue against it.

## Decision

**One deployable, with hard internal boundaries, ready to peel a service off later
if load ever demands it.**

## Rationale

1. **Our atomic operations span domains.** Declaring a result writes marks-ledger
   state, result records, document issuance, audit records, and outbox events in
   one transaction (`DOM-007-L`, `DOM-012-D`). Distributed, that becomes a saga
   with compensating actions and partial failures — and an audit trail that can
   develop gaps. For a system whose central claim is that the record is complete
   and reconstructible (`ADR-003`), a gap is not a trade-off; it is the failure of
   the product's premise.

2. **Row-level security needs one connection with per-transaction claims.**
   `ADR-004` puts isolation in the database. Every additional service is another
   place to establish tenant context and another place to get it wrong. Multiplying
   the surface of the one control that protects children's records is a poor
   exchange for deployment independence.

3. **Several clients need one contract, not many.** The web application, the
   affiliation API, and later mobile clients consume the same contract
   (`PRI-011`, `ADR-008`). One deployable makes that one document.

4. **Four people.** Distributed systems cost operational attention that this team
   does not have to spend. `PRI-015` — boring where it counts — applies directly:
   the difficulty budget goes to the ledger, the affiliation model, and the policy
   engine, not to service topology.

## Consequences

- **Boundaries must be enforced by tooling rather than by network topology.** A
  dependency checker enforces: modules expose a public surface only, no reaching
  into another module's internals, no cycles. A boundary that is not mechanically
  enforced is not a boundary.
- **One module owns each table.** Cross-module reads go through the owning
  module's public surface, and a module ledger records who owns what.
- **Extraction stays possible.** If document generation at university volume, bulk
  import, or intelligence ever needs different runtime characteristics, it is
  extracted along a boundary that is already real — and `ADR-005`'s review
  checkpoint says that service need not be TypeScript.
- **Scaling is horizontal instances of one deployable** plus read replicas, which
  is sufficient for institutional load by a wide margin.
- **A large deployable takes longer to test and deploy** than a small service.
  Accepted, and mitigated by keeping the test suite fast rather than by splitting
  the system.

## Rejected Alternatives

**Microservices from the start** — would distribute a transaction that must be
atomic, multiply the isolation surface, fragment the contract, and consume the
team. Rejected.

**Service-per-institution-kind** (a school service, a university service) — the
same fork `ADR-001` rejected, expressed in infrastructure. Rejected emphatically:
it would make the canonical model unenforceable.

**A separate service for the public API** — superficially attractive for isolating
external traffic. Rejected because it would either duplicate the domain or become a
proxy; the API is the same contract with different authentication and rate limits,
which is a concern of the boundary layer, not a separate system.

## Review Checkpoint

Revisit when any single component's load, deployment cadence, or runtime needs
genuinely diverge — document generation and intelligence are the likely first
candidates. The decision then is to extract that one component, not to distribute
the system.
