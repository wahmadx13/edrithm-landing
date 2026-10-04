# ADR-021 — Internal services accept no inbound requests; jobs are sealed

## Status

Proposed · 2026-09-09

---

## Context

`backend` is the only door to the record (`ARCH-001`). Two other processes run
behind it: the **worker** (`backend/src/worker.ts`) draining the outbox and running
jobs, and the **intelligence service** (`ai/`).

Neither is a service anyone should be able to call. But "should not" is not a
control, and there are two distinct ways in that need closing.

**The network path.** If the worker ever exposes an HTTP surface — a health probe, a
metrics endpoint, an admin route, a framework's default listener — and that surface
is reachable from outside the deployment, it becomes an unauthenticated entry point
into a process that runs privileged work. `ai/` is specified as FastAPI
(`ADR-018 §1`), which means an HTTP server exists in that process by construction.

**The payload path, which is the more serious one.** Jobs carry their institution
and principal in the payload, and the consumer opens a tenant-context store from
them (`ADR-019 §7`). A job that did not come from the backend — injected into the
queue table, or a legitimate job whose payload was altered — would therefore execute
**as an institution of the attacker's choosing**. That is a full tenant escalation
reached without touching row-level security at all: the worker would open a
perfectly valid scoped transaction for the wrong tenant.

Queue tables live in the same PostgreSQL instance as the domain (`ADR-010`), so
anyone who obtains any database write path — a compromised credential, an injection
in an unrelated component, a misconfigured role — inherits that escalation.

## Decision

**Internal services accept no inbound requests, and every job is authenticated
before it executes.**

### The network surface

1. **The worker exposes no inbound network surface.** No HTTP server, no RPC
   listener, no message-broker port. It dials out — to PostgreSQL, object storage,
   notification providers — and nothing dials in.

2. **`ai/` accepts no inbound request from outside the deployment.** It is a queue
   consumer (`ADR-018 §1`). Any HTTP it serves binds to loopback or a private
   interface only.

3. **Neither is published.** No public ingress, no load balancer target, no route,
   no DNS name. Deployment configuration is asserted by a test, not by intention
   (`ED-015`).

4. **Operational endpoints carry no domain capability.** A liveness or metrics
   endpoint returns liveness or metrics. It cannot enqueue, cancel, replay, or read
   a domain record, so reaching it achieves nothing.

### The payload

5. **A job may only be created by the backend, in the same transaction as the fact
   that caused it** (`ADR-010`). Nothing else enqueues.

6. **Database privilege separation.** The worker's role may claim, complete and fail
   jobs. It may not `INSERT` new jobs except through a constrained retry path that
   cannot set the institution or principal. Only the backend's role may create work.

7. **Every job payload is sealed.** The backend computes an HMAC over the canonical
   payload — including institution, principal, correlation id, and issued-at — with
   a key held only by the backend and its consumers. The consumer verifies signature
   and freshness **before** opening a tenant context.

8. **An unsealed, mis-sealed or stale job is quarantined, never executed**, and
   raises an alert. It is treated as an attempted intrusion, not as a bad message.

9. **A payload never carries its own authority.** It names the institution and the
   principal; **capabilities are resolved at execution from the database**, never
   read from the message. A forged payload that claims permissions gets none.

10. **A payload missing institution or principal fails closed** (`ADR-019 §7`).

## Rationale

1. **The strongest control is the absence of a surface.** A process that listens for
   nothing cannot be called by anyone, authenticated or not. This is cheaper and
   more durable than authenticating a surface that should not exist.

2. **Signing closes the path that isolation does not.** Row-level security protects
   against a query without a tenant; it cannot protect against a *correct* query for
   the *wrong* tenant, which is precisely what an injected job produces. This is the
   one place where `ADR-002`'s guarantee can be bypassed without breaking it, and it
   deserves its own control.

3. **Defence in depth, deliberately.** Privilege separation (§6) alone would suffice
   if database credentials were never compromised. Signing (§7) alone would suffice
   if key management were perfect. Neither assumption is safe on its own, and both
   together are cheap.

4. **Re-resolving capability (§9) removes the value of forgery.** Even a
   perfectly forged payload buys an attacker only the permissions that principal
   genuinely holds — which for a service principal is narrow and audited.

5. **Quarantine rather than discard (§8).** A rejected job is evidence. Dropping it
   silently destroys the only signal that someone tried.

## Consequences

- **Key management is now real.** A signing key shared between backend and consumers,
  rotated on a schedule, with an overlap window so in-flight jobs verify across a
  rotation. Held in the secrets manager, never in the repository (`ED-007 §5`).
- **Replay must be bounded.** Issued-at plus a freshness window, and an idempotency
  key that makes a replayed job a no-op rather than a repeat (`API-004`).
- **Two database roles instead of one**, with a migration path and grants that are
  themselves reviewed.
- **A slightly more awkward local development story** — the signing key must exist
  even on a laptop. Seeded, with a value that is obviously not a secret.
- **Deployment configuration becomes testable and tested.** "Is the worker publicly
  reachable?" is a check, not an assumption.
- **`ADR-018` is clarified**, not superseded: `ai/` remains FastAPI, and its
  listener is internal-only.

## Rejected Alternatives

**An HTTP worker behind an API key** — the shape most teams reach for. Rejected: it
creates the surface this decision exists to remove, and an API key in an environment
variable is a weaker control than having no listener at all.

**Network policy alone — private subnet, security group, no public route** — a
necessary control and an insufficient one. It protects against the internet and not
against anything already inside the deployment, which is exactly the position an
attacker with a compromised credential is in.

**Database access control alone** — protects against injection into the queue, and
does nothing about a legitimate but altered payload, nor about a component that
legitimately holds the backend's credential.

**Trusting the queue because it is "internal"** — the assumption that produces this
class of incident. The queue is a table in the same database as the domain; it is
not a trust boundary.

**mTLS between services** — appropriate if these were request/response services.
They are not: there is no request to authenticate, only a message to verify.

## Review Checkpoint

Revisit if the worker ever genuinely needs to accept a request — a synchronous
callback from a payment or notification provider, say. The answer then is that the
callback lands on `backend`, which authenticates it and enqueues work, and the
worker's surface stays closed.

## Related Documents

- `ADR-002` · `ADR-010` · `ADR-018` · `ADR-019` · `ARCH-001` · `ARCH-005` ·
  `ARCH-006` · `PROD-021` · `ED-007` · `ED-015`
