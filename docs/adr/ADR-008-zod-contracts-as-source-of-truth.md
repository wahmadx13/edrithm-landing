# ADR-008 — One Zod contract per use case, shared across the monorepo

## Status

Proposed · 2026-09-07

---

## Context

`PRI-011` makes the API a product: versioned, documented, and integrable by an
affiliated college's own developer in an afternoon. That raises the cost of any
drift between what the server validates, what it returns, what the documentation
claims, and what the client expects.

The conventional NestJS shape keeps three parallel artefacts per endpoint: a DTO
with validation decorators for input, an entity class with documentation
decorators for output, and a mapper from database row to entity. Three artefacts
describing one endpoint drift, the drift is silent, and where it surfaces is a
client — in our case, possibly a college's integration that we do not control.

There is a second concern specific to this domain. Responses carry data that must
not leak: national identifiers, guardian contacts, internal ledger columns, policy
internals, and — across an affiliation — anything outside the affiliation's scope
(`DOM-005-B`). An allowlist enforced by remembering to omit a field is a breach
waiting for a busy afternoon.

The web application already uses Zod.

## Decision

**One contract file per use case, exporting an input schema and an output schema,
both Zod, living in a shared package consumed by server and clients alike.**

That single pair produces four things: runtime input validation, the output
allowlist, the TypeScript types, and the OpenAPI document.

- Contracts live in `packages/contracts`, imported by `apps/web` and the backend.
- The output schema is applied last, always, so the allowlist cannot be bypassed.
- The OpenAPI document is generated from the contracts, never hand-maintained.
- Mappers survive only for non-trivial row shaping, and the output schema still
  parses their result.

## Rationale

1. **Validation, types, and documentation cannot disagree**, because they are the
   same declaration. For an API that external developers integrate against, this
   is the difference between documentation and a promise.
2. **The output allowlist is enforced by parsing rather than by discipline.**
   National identifiers, ledger internals, and out-of-scope affiliation data cannot
   leak by omission. Given what this system holds, that guarantee is worth more
   than the convenience of returning an object directly.
3. **One source of truth across the monorepo.** A change to a contract is a
   compile error in the web application, not a runtime surprise. With four people
   and agents writing code, a compiler that catches drift is worth more than any
   convention.
4. **It is already the team's pattern**, reached on the API project for the same
   drift reasons.

## Consequences

- **`packages/contracts` becomes the spine of the monorepo** and its most
  reviewed code. A contract change is an interface change and is reviewed as one.
- **API versioning is versioning of contracts**, with a deprecation policy and a
  public changelog (`13-platform-api/`). This is the mechanism that makes external
  integration safe.
- **Everything crossing the boundary is parsed**, including affiliation payloads
  where scope enforcement and the output allowlist reinforce each other.
- **Some duplication between a contract's output schema and internal domain
  types.** Deliberate: the wire shape and the domain shape are allowed to differ,
  and coupling them is how internal changes become breaking API changes.
- **A small runtime parsing cost** on every response. Accepted.

## Rejected Alternatives

**DTO classes with validation decorators plus response entities plus mappers** —
the conventional shape, rejected on drift for the reasons above.

**Generating types from an OpenAPI document written by hand** — inverts the
relationship; the document becomes something to keep in sync rather than something
produced.

**Sharing domain types directly with clients** — couples the wire format to
internal structure and makes every refactor a potential breaking change for an
external integrator.

**tRPC** — excellent for a closed TypeScript client, wrong here: the affiliation
API's consumers are other institutions' systems in unknown languages, and they
need a conventional, documented HTTP API.
