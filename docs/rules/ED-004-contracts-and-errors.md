# ED-004 — Contracts and errors

## 1. One contract per use case

Each use case has one contract file exporting an input schema and an output schema,
both Zod, in `packages/contracts` (`ADR-008`).

That pair produces four things: runtime input validation, the output allowlist,
the TypeScript types, and the OpenAPI document. They cannot disagree, because they
are one declaration.

**Every handler has a contract.** No exceptions, including internal endpoints and
queue consumers, whose payloads are parsed the same way.

## 2. The output allowlist is not optional

**The output schema is applied last, always.** A raw database row is never
returned. Not "for now", not for an internal endpoint, not in a debug route.

This is what prevents national identifiers, guardian contacts, payroll amounts,
storage keys, ledger internals and out-of-scope affiliation data from leaking by
omission. Given what this system holds, parsing on the way out is a security
control, not a formality.

## 3. Unknown fields are rejected

Input parsing is strict. An unrecognised field is an error, not silently dropped —
a client sending a field we ignore believes something happened that did not.

## 4. Errors are typed

Each module declares its domain errors in `errors.ts`. A failure is a typed domain
error or a framework exception — never a returned `null` the caller must interpret,
never a thrown string.

An error carries a stable machine-readable code, a human-readable message safe to
show a user, and never a stack trace, a query, or a hint about another institution's
data.

**Authorisation failures do not reveal existence.** A record in another tenant is
not found, never forbidden.

## 5. Rule evaluation explains itself

When an institutional rule decides something about a person — detained, ineligible,
promoted, in default — the result carries which policy version applied and which
clauses fired (`DOM-009-G`). "Why is this student detained?" is answered by the
engine, not by a developer reading code.

## 6. The API is a product

Versioned, with a deprecation policy and a public changelog (`13-platform-api/`).

- The specification is generated from contracts and never hand-edited.
- A breaking change to a published version is refused by the contract diff gate.
- **An installed mobile client cannot be rolled back** (`ADR-013`), so compatibility
  with versions in the field is held for the stated window.
- No `any` in a generated client — CI generates, greps, and fails.

## Enforced by

`scripts/check-contracts.mjs` (every handler has one, no raw row returned),
`scripts/check-openapi.mjs`, contract diff in CI, `client:verify`. See `ED-015`.
