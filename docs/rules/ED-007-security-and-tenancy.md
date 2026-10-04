# ED-007 — Security, tenancy, and dignity

## 1. Tenancy is the first security control

1. Every tenant-scoped table carries `institution_id` and a row-level security
   policy. A migration creating one without a policy fails the gate.
2. Tenant context is established once per entry boundary — HTTP middleware, queue
   consumer wrapper, scheduled task wrapper — and nowhere else (`ADR-019`).
3. Entry boundaries are enumerated. Adding one is a reviewed change.
4. The transaction helper **fails closed**. No context is an exception.
5. **No provider holds request state.**
6. A job carries institution and principal in its payload; the consumer opens a
   fresh store. A payload without them fails closed.
7. Cross-tenant access exists only through an Affiliation, scoped, audited on both
   sides.
8. **Isolation tests run concurrently**, across every entry boundary. A sequential
   suite proves nothing about AsyncLocalStorage.

## 2. Authorisation

1. **Every mutating handler calls a policy.** Enforced by a gate, not by review.
2. Capabilities are additive. There are no negative permissions (`DOM-011-D`).
3. Sensitive capabilities — `person.view_sensitive`, `marks.approve`,
   `result.declare`, `result.correct_after_declaration`, `fee.waive`,
   `payroll.view`, `policy.author`, `data.export_bulk`, `role.grant` — are
   separately granted and always audited.
4. Separation of duties is enforceable in configuration: whoever enters marks is
   not whoever approves them (`DOM-011-G`).
5. A record in another tenant is **not found**, never forbidden.

## 3. Personal data

1. National identifiers, guardian contacts and payroll amounts are encrypted at the
   column level, never logged, never indexed in a way that leaks them, and masked
   unless a capability permits otherwise — with that access audited.
2. Most people in this system are children. Collect the minimum; retain per policy;
   never use production data outside production (`ARCH-008`).
3. Reading a person's sensitive record is an audited action (`DOM-011-H`).
4. Device-local data is minimised to current rosters, encrypted at rest, and cleared
   on sign-out (`ADR-013`).

## 4. Dignity is a security rule here

`PRI-012` is enforced in the schema and the interface, not only in policy.

1. **There is no column to store a judgment about a person.** Risk indications,
   predictions and rankings are computed, displayed, and expire. A migration adding
   one is refused.
2. Fee status, scholarship or hardship status, family income, gender, religion,
   ethnicity and disability are **never inputs** to an academic or behavioural
   inference.
3. Nothing about a person is shown to another family or another student.
4. The system never acts on its own about a person — no automatic detention,
   escalation, or third-party notification.
5. Output language describes data, never character. No adjectives about ability or
   effort, no alarm-coded badges on a person's profile.
6. The same rules apply to staff. No stored effectiveness score, no ranking of named
   colleagues.
7. Notification payloads carry no marks, balances or standing — a lock screen is
   visible to whoever holds the phone (`ADR-016`).

## 5. Secrets and inputs

1. Secrets never in the repository, in code, in tests, in seeds or in CI logs.
   `gitleaks` gates every commit.
2. Configuration is validated at boot; startup fails on a missing secret rather than
   running degraded.
3. All input is untrusted until parsed by a contract at the boundary (`ED-004`).
4. Uploads are untrusted: type and size checked, scanned, stored under a
   tenant-scoped key, never served from a public bucket, always via a short-lived
   signed URL (`ADR-011`).

## 6. The worker and internal services accept nothing

`ADR-021`. The queue is a table in the same database as the domain — it is **not** a
trust boundary.

1. **The worker exposes no inbound network surface.** No HTTP server, no RPC
   listener, no port. It dials out; nothing dials in. A framework's default listener
   left running is a defect.
2. **`ai/`'s listener binds to loopback or a private interface only.** Never
   published, never a route, never a DNS name.
3. **Operational endpoints carry no domain capability.** Liveness returns liveness.
   Reaching it achieves nothing.
4. **Only the backend's database role may create a job.** The worker's role claims,
   completes and fails; it cannot enqueue work naming an institution or principal.
5. **Every job payload is sealed** — HMAC over the canonical payload including
   institution, principal, correlation id and issued-at — and **verified before a
   tenant context is opened**.
6. **A payload never carries its own authority.** It names the principal;
   capabilities are resolved at execution from the database. A forged payload
   claiming permissions gets none.
7. **Unsealed, mis-sealed or stale jobs are quarantined and alerted on**, never
   executed and never silently dropped. A rejected job is evidence someone tried.
8. **A payload missing institution or principal fails closed.**

Why this is its own section rather than a footnote: row-level security protects
against a query *without* a tenant. It cannot protect against a correct query for
the *wrong* tenant, which is exactly what an injected job produces. This is the one
path that reaches `ADR-002`'s outcome without defeating `ADR-002`.

## 7. The intelligence service

Holds no database credential (`ADR-018 §3`). It reads through the API under the same
tenant scoping as any other caller. Granting it direct access would undo `ADR-002`,
and no operational convenience justifies it.

## Enforced by

`scripts/check-tenancy.mjs`, `scripts/check-worker-surface.mjs`, `scripts/check-policy.mjs`, `scripts/check-dignity.mjs`
(prohibited column patterns), `gitleaks`, the concurrent isolation suite,
`ARCH-006` evidence table. See `ED-015`.
