# ED-002 — Module anatomy

Every module has the identical shape. This is the single decision that makes the
codebase predictable: a reviewer who has read one module has read them all, and can
predict where the next line belongs.

## 1. The canonical shape

```
modules/<feature>/
  <feature>.module.ts           wiring only
  <feature>.controller.ts       endpoints only, one line per handler
  <feature>.policy.ts           authorisation decisions for this module
  errors.ts                     typed domain errors for this module
  public/
    <feature>.api.ts            THE ONLY file other modules may import
  commands/
    <verb-phrase>.command.ts    one write use case per file
  queries/
    get-<thing>.query.ts        one read use case per file
    list-<things>.query.ts
  consumers/
    <event>.consumer.ts         one queue consumer per file
  contracts/                    re-exports from packages/contracts for this module
  db/
    schema.ts                   the Drizzle tables this module owns
    <feature>.repository.ts     all SQL for this module
  mappers/                      pure row shaping, when non-trivial
  helpers/                      pure feature-local logic, grouped by concern
```

## 2. Root files

**Exactly four files may live at a module root**: `module`, `controller`, `policy`,
`errors`. Everything else lives in a subdirectory, even when it holds one file —
`db/<feature>.repository.ts`, never `<feature>.repository.ts`.

Only `module` is required.

## 3. There is no `<feature>.service.ts`

One file per use case, one exported symbol per file. A command is an
`@Injectable()` class with a single `execute()` method; so is a query.

The controller injects use cases directly, so its constructor is a table of
contents. `ls commands/` tells you everything this module can do.

## 4. Directory size

**Maximum five files per directory** anywhere under `src/`. Exceeding it is first a
signal that the boundary is wrong, and only then a reason to sub-group:

1. Re-examine the boundary. Ten commands usually means two modules (`ARCH-003`).
2. If the boundary is genuinely right, group by capability —
   `commands/declaration/`, `commands/moderation/`.

Never rename or merge files to defeat the count.

## 5. File size budgets

Zero comments means a line count is a pure logic count.

| File | Warn | Hard error |
| --- | --- | --- |
| `*.command.ts` | 80 | 120 |
| `*.query.ts` | 60 | 100 |
| `*.consumer.ts` | 60 | 100 |
| `*.controller.ts` | 100 | 150 |
| `*.repository.ts` | 180 | 250 |
| `*.policy.ts` | 80 | 120 |
| `helpers/`, `mappers/` | 100 | 150 |
| any other logic file | 150 | 250 |

**Exempt:** contract declarations, `db/schema.ts`, generated code.

Over budget means responsibilities are mixed. Resolve by extraction:

| Symptom | Extract to |
| --- | --- |
| Query construction inside a command | `db/<feature>.repository.ts` |
| Row shaping inside a command | `mappers/` |
| A reusable transform | `helpers/` (local) or `utils/` (cross-cutting) |
| Institutional rule logic | the `rules` module — it is policy data, not code |
| A separable sub-domain | a new module |

## 6. Controller rules

Route handlers and nothing else. No private methods, no business logic, no data
access, no normalisation, no try/catch for flow control.

Handler order: `@Post` → `@Get` → `@Patch` → `@Delete`. Within a group, static
paths precede `:id` routes so routing is never shadowed.

## 7. Cross-module contact

Another module may import exactly one thing: `public/<feature>.api.ts`. It exports a
narrow, read-shaped interface and never exposes repositories, schemas, commands,
mappers or Drizzle types.

## Enforced by

`scripts/check-structure.mjs`, `scripts/check-file-size.mjs`,
`dependency-cruiser`, ESLint. See `ED-015`.
