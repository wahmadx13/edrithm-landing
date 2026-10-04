# ED-006 — Code style

The goal is a codebase with no surprises. A reviewer should be able to predict the
next line. That comes from uniformity and naming, never from cleverness.

## 1. Zero comments

No `//`. No `/* */`. No `@ts-ignore`, no `@ts-expect-error`, no `eslint-disable`.

**Code that needs a sentence to be understood is not finished.** The fix is a better
name, a smaller function, or a clearer shape — never a comment.

Permitted, because they are machine instructions rather than prose: shebangs, build
and tool directives that change behaviour (each carrying its justification in the
session record), and a legally required licence header.

Technical explanations live in this repository's docs/ and README; local coordination records stay outside Git.

## 2. Types

1. No `any`. No `as`. No `as unknown as`. No non-null `!`.
2. Unknown input is `unknown`, narrowed exactly once at the boundary by a contract.
3. Every exported function and public method is explicitly typed. No inferred return
   types on a public surface.
4. **Illegal states unrepresentable.** Every status is a discriminated union with an
   exhaustive switch. Adding a variant must break the build everywhere it is not
   handled. Enrollment status, result status, document status and marks state are
   all unions, never strings.
5. `readonly` by default on properties and arrays. `const` always; `let` only inside
   a repository's query construction.
6. **Money is never a `number`.** It is the money type, with its currency.

## 3. Functions

1. One exported symbol per file.
2. A use case has exactly one public method, `execute`.
3. **No private methods on a use case.** A would-be private method is a helper, a
   repository method, or a mapper.
4. A function longer than about forty lines is hiding a missing helper or repository
   method.
5. No default exports.

## 4. Control flow

1. Guard clauses over nested conditionals. Return early.
2. No `else` after a `return`.
3. Maximum nesting depth of three.
4. `try/catch` translates a failure into a domain error. It is never control flow and
   never swallows.
5. No `switch` without a `default` provably unreachable by type.

## 5. Nest specifics

1. **No state on a provider.** Providers are singletons; request state on one is a
   cross-tenant leak (`ADR-019`). Tenant context comes from the context store, never
   from a field.
2. Injected dependencies are `private readonly`.
3. `Logger`, never `console`. A log line never contains a token, a secret, a
   national identifier, a mark, a balance, or message content (`ARCH-007`).
4. Nothing is instantiated with `new` that could be injected.

## 6. Formatting

Prettier decides. Not a matter of taste, not discussed in review.

## Enforced by

ESLint (`@typescript-eslint/strict-type-checked`, `no-inline-comments`,
`switch-exhaustiveness-check`, `max-depth`, `max-lines-per-function`,
`explicit-module-boundary-types`, `no-restricted-syntax` for provider state),
Prettier, `tsc --noEmit`, `scripts/check-comments.mjs`. See `ED-015`.

