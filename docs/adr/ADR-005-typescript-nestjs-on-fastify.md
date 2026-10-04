# ADR-005 — TypeScript throughout, NestJS on Fastify

## Status

Proposed · 2026-09-07

---

## Context

The web application already exists in TypeScript — Next.js, React 19, Zod,
React Hook Form. No backend exists. The team is three to four people plus agents.

Two properties of this product shape the choice more than throughput does.

**One contract, several clients.** The web application, the affiliated-college
API (`13-platform-api/`), later mobile clients, and eventually an institution's
own developers all consume the same contract. `PRI-011` makes that contract a
product. Anything that lets the server's idea of a payload drift from the
client's is a defect generator.

**Team size.** Four people cannot maintain two language ecosystems, two sets of
conventions, two dependency and security surfaces, and two bodies of agent
guidance. Consistency is not an aesthetic preference here; it is the mechanism by
which a small team produces work that reads as one person's (`ROOT-002`).

Load is not the deciding factor. Edrithm's work is dominated by PostgreSQL,
messaging providers, and document generation. Any mainstream runtime is far
faster than institutional traffic requires.

## Decision

**TypeScript for the backend, NestJS on the Fastify adapter.**

- One language across web, API, and shared packages.
- NestJS as the application framework, modular monolith (`ADR-007`).
- `@nestjs/platform-fastify`, decided at the scaffold rather than later.
- Node's current LTS.

## Rationale

1. **Shared contracts stop being a discipline and become a compile error.** One
   Zod schema produces validation, types, the OpenAPI document, and the client's
   types (`ADR-008`). Cross-language, the same guarantee costs a code-generation
   pipeline and buys drift.
2. **NestJS gives structure a small team would otherwise have to invent** —
   modules, dependency injection, a testing story, and enforceable internal
   boundaries. With agents writing much of the code, a framework with strong
   conventions produces more consistent output than an unopinionated one.
3. **The team already knows this stack**, and the existing frontend is built in
   it. Velocity now matters, and there is no compensating advantage elsewhere.
4. **Fastify over Express, decided at the scaffold.** Two reasons specific to
   Edrithm: document generation and bulk export stream rather than buffer (a
   university's transcript run and a full-institution export are both large), and
   `@fastify/multipart` streams natively where the idiomatic Express path buffers.
   Changing adapters after the endpoints exist is expensive churn for no gain.

## Consequences

- **Adapter types never appear in a controller.** Handlers take parsed contract
  input and return contract output, which keeps the adapter replaceable.
- **CPU-bound work needs a separate home.** Document rendering at volume, bulk
  imports, and later any analytical or model work are jobs, not request handlers
  (`ADR-010`), and may be written in another language behind a queue without
  disturbing this decision.
- **`FileInterceptor` and other Express-specific helpers are unavailable.** One
  streaming multipart interceptor is written once.
- **Fewer Nest-plus-Fastify examples exist** than Nest-plus-Express. Accepted.
- **One dependency and vulnerability surface** to keep current, which for a team
  of four is an advantage that outweighs ecosystem breadth arguments.

## Rejected Alternatives

**Go** — better raw performance and operational simplicity, and genuinely
attractive for a document-generation or ingest service later. Rejected as the
primary backend because it splits the contract into a generation pipeline, splits
the team's attention, and buys performance this workload does not need. Not
foreclosed: `ADR-007`'s module boundaries are where a Go service would be
extracted if one is ever warranted.

**Python (FastAPI)** — natural if the intelligence layer were the centre of the
product. It is not; `PRI-013` makes intelligence a consumer of governed metrics
rather than a core service, and that work belongs behind a queue in whatever
language suits it.

**Express** — the default adapter, rejected on streaming behaviour for the same
reason as above.

**A serverless-function backend** — poor fit for per-transaction database context
(`ADR-004`), connection pooling under RLS, and long-running import and generation
work.

## Review Checkpoint

Revisit if a component develops runtime characteristics this stack serves badly —
high-volume document generation, evidence ingest, or model serving. The answer
then is a separate service along an existing module boundary, not a rewrite.
