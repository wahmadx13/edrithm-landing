# ED-005 — Naming and file placement

## 1. Files

`kebab-case`, with a role suffix that says what the file is.

| Suffix | Contains |
| --- | --- |
| `*.module.ts` | Nest wiring only |
| `*.controller.ts` | Route handlers only |
| `*.command.ts` | One write use case |
| `*.query.ts` | One read use case |
| `*.consumer.ts` | One queue consumer |
| `*.policy.ts` | Authorisation decisions |
| `*.repository.ts` | Data access |
| `*.contract.ts` | Input and output schemas |
| `*.mapper.ts` | Pure row shaping |
| `*.helpers.ts` | Pure feature-local logic, grouped by concern |
| `*.metric.ts` | A governed Metric definition (`DOM-013`) |
| `*.api.ts` | A module's public cross-module surface |

## 2. Banned names

`service`, `manager`, `handler`, `helper` (singular), `util`, `utils`, `common` as
a filename, `misc`, `shared`, `base`, `data`, `stuff`, `index` except a pure
re-export barrel, `v2`, `new`, `final`, `old`, `temp`.

A name that could describe half the codebase describes none of it.

## 3. Banned domain words

The glossary's banned terms (`ROOT-003 §10`) are banned in identifiers, not only in
prose. No `session` unqualified, no `class`, no `batch`, no `subject`, no `faculty`
meaning teachers, no `marksheet`, no unqualified `score`.

Use `academicSession`, `cohort`, `course`, `staffMember`, `dmc`, `marksEntry`.

## 4. Symbols

- Classes `PascalCase`, matching the file role — `AssessmentRepository`,
  `DeclareResultCommand`.
- A command is a **verb phrase**: `DeclareResultCommand`, `RecordAttendanceCommand`.
  Never a noun.
- A query is `Get*` or `List*`. No other prefix.
- Injected dependencies are `private readonly`.
- Booleans read as assertions: `isDeclared`, `hasCapability`, `canReissue`.

## 5. Helpers

- A standalone helper is **never** defined inline in a command, query, controller or
  repository.
- Generic and reusable → `utils/`, once, imported everywhere. Never re-implemented.
- Feature-local → that module's `helpers/`, grouped into a concern-named file. Never
  one file per function. Never a private method on a use case.
- Used in more than one module → it is not feature-local. Move it.

## 6. Directory size

Maximum **five** files per directory. See `ED-002 §4`.

## Enforced by

`scripts/check-naming.mjs`, `scripts/check-glossary.mjs`,
`scripts/check-structure.mjs`, ESLint `unicorn/filename-case`. See `ED-015`.
