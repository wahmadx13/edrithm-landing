---
title: Observability
document_id: ARCH-007
version: 0.1.0
status: Draft
classification: Internal
owner: Engineering
created: 2026-09-07
last_updated: 2026-09-07
---

# ARCH-007 — Observability

## The rule

**An institution's question about its own data is answered from the record; our
question about the system is answered from telemetry. Neither ever answers the
other.** Personal data does not enter logs, traces or metrics.

## Logs

Structured JSON, one event per line, via a logger — never `console`.

Every line carries: timestamp, level, service, correlation id, institution id,
actor id, and the module. It never carries: a token, a secret, a national
identifier, a mark, a balance, a document body, or message content.

**Institution id in logs is deliberate and is not personal data** — it is what makes
an incident traceable to the tenant affected, which we owe them.

## Correlation

A correlation id is created at each entry boundary and carried through the tenant
context store (`ADR-019`), into every log line, every outbox entry, every job
payload, and every downstream call. A result declaration and the sixty webhook
deliveries it caused share one id.

## Traces

OpenTelemetry from the first deploy. Spans on: HTTP handlers, queue consumers,
database transactions (with the module and use case, never the parameters),
external provider calls, document renders, and intelligence calls.

## Metrics — two meanings, kept apart

**Governed Metrics** (`DOM-013`) are what institutions see. **Operational metrics**
are what we see. They share a word and nothing else, and the naming keeps them
apart everywhere.

Operational metrics worth having from day one: request and job latency
distributions, queue depth and age, outbox lag, document render time and pool
saturation, failed and dead-lettered jobs, webhook delivery success per
institution, model spend per institution against ceiling, and isolation-test
outcomes.

## Errors

Sentry, with personal data scrubbed before send and the institution id retained.
An error report must be actionable without exposing a student.

## What we alert on

Only what someone would act on at the time it fires: outbox lag beyond a threshold,
dead-lettered jobs, webhook delivery failing for one institution, authentication
failure spikes, **any cross-tenant isolation test failure — page immediately**, and
model spend approaching a tenant ceiling.

## Honest degradation

`EDR-VAL-003` applies to telemetry as much as to screens: when a dependency is
unavailable, the interface says unavailable. It never shows zero, and it never
shows a stale number as though it were current (`DOM-013` §8).

## Related Documents

- `ADR-010` · `ADR-012` · `ADR-019` · `DOM-013` · `EDR-VAL-003` · `ED-008`
