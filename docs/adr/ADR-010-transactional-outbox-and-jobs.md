# ADR-010 — Transactional outbox for events; a queue for jobs

## Status

Proposed · 2026-09-07

---

## Context

`DOM-012-D` requires that every significant change emits an immutable Domain
Event, and makes those events the substrate for four things at once: the audit
trail, webhooks to affiliated colleges (`13-platform-api/`), metrics and
projections (`DOM-013`), and the intelligence layer (`14-intelligence/`).

That creates a correctness problem with a well-known shape. Declaring a result
writes ledger state, result records, document issuance, and audit records in one
transaction (`ADR-007` §1), and must also notify sixty affiliated colleges. If the
notification is published inside the transaction, a broker failure rolls back a
declaration that legally happened. If it is published after commit, a crash
between the two loses a notification that a college is waiting for — and
`JRN-003`'s promise is that nothing is lost.

There is a second, separate need. Bulk import (`JRN-007`), document generation at
university volume, WhatsApp and SMS dispatch, projection rebuilds, and scheduled
work are jobs: long-running, retryable, and unsuitable for a request handler.

These are different problems and are frequently conflated. Events are facts that
already happened and must never be lost. Jobs are work that must eventually be
done and may be retried, reordered, or abandoned.

## Decision

**A transactional outbox for events, and a separate job queue for work.**

1. **Events are written to an outbox table in the same transaction as the change
   that produced them.** Either both commit or neither does.
2. **A relay reads the outbox and publishes**, marking entries dispatched. Delivery
   is at-least-once; consumers are idempotent.
3. **Ordering is guaranteed per aggregate**, not globally.
4. **Jobs go to a PostgreSQL-backed queue** (pg-boss) with retries, backoff,
   dead-lettering, and scheduled execution. A job that must not be lost is triggered by an event, not
   enqueued directly from a request.
5. **Webhooks to affiliated institutions are jobs driven by events**, with their
   own retry schedule, signing, and per-institution delivery log.

## Rationale

1. **The outbox is the only way to keep the event stream consistent with the
   record** without distributed transactions. For a system whose premise is that
   the record is complete, an event stream that can silently diverge from it is
   not acceptable.
2. **It costs one table and a relay.** Given `ADR-007` — one deployable, one
   database — this is cheap. It would be far more expensive to add later, because
   every event written before it existed would be unreliable.
3. **Separating jobs from events keeps failure semantics honest.** An event is a
   fact and is never dropped. A job may exhaust its retries and be dead-lettered
   for a human. Merging the two forces one of those semantics onto the other.
4. **Webhook delivery to a college is a support conversation waiting to happen**,
   so it needs a per-institution log a person can inspect — which a job with a
   delivery record provides and a fire-and-forget publish does not.

## Consequences

- **Every domain write path must remember the outbox.** This is encapsulated in
  the transaction helper so that emitting an event is part of the unit of work,
  not a separate call a developer may forget.
- **The relay is infrastructure with its own failure modes** — lag, duplicate
  dispatch, poison entries — and needs monitoring from the start.
- **Consumers must be idempotent.** At-least-once delivery is a contract, and
  every consumer, including external ones, is told so explicitly.
- **No additional infrastructure.** The queue lives in the database we already
  run, so a job can be enqueued in the *same transaction* as the outbox entry that
  triggers it — which removes an entire class of "the event committed but the job
  did not" bug, and removes a service from a four-person team's operational
  surface.
- **Outbox growth needs archival.** At university scale this is meaningful volume
  and is handled with the ledger retention work in `DOM-012` §8.
- **Projection rebuilds become routine** rather than frightening, because the
  event history supports them.

## Rejected Alternatives

**Publishing to a broker inside the transaction** — couples a legally significant
commit to broker availability. Rejected.

**Publishing after commit, best effort** — loses events on crash, which
contradicts `DOM-012-D` and `JRN-003`. Rejected.

**Change-data-capture from the database log** — robust and genuinely attractive,
and it removes the "remember the outbox" burden. Rejected for now on operational
cost for a team of four, and because domain events carry intent that a row diff
does not: `result.declared` is not `UPDATE results SET status`. Worth revisiting.

**A full event-sourced architecture** — `ADR-003` already rejected event sourcing
as a global approach. Ledgers are append-only; the rest of the system is not.

**Redis with BullMQ** — the conventional choice in this ecosystem, with better
throughput, richer tooling, and a mature dashboard. Rejected for now because it
adds a stateful service to operate, and because it cannot enqueue transactionally
with the outbox. Revisit if job throughput outgrows PostgreSQL.

**A managed queue service** — reasonable, and it reintroduces the platform lock
`ADR-012` §1 avoids.

## Review Checkpoint

Revisit change-data-capture if outbox discipline proves hard to maintain in
practice, or if event volume outgrows a polling relay. Revisit Redis and BullMQ if
job throughput or queue latency outgrows a PostgreSQL-backed queue — most likely
first at document generation during a university result declaration.
