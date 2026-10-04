# ED-009 — Testing

## 1. Coverage floors

CI-enforced, on domain and business logic rather than padding.

| Area | Floor |
| --- | --- |
| Domain: rules engine, ledger, results, metrics, money | 100% |
| Identity, access, tenancy | 100% |
| Other backend logic | 95% |
| Web and mobile components with logic | 90% |
| Python intelligence service | 95% |

The 100% areas are the ones where a defect is a wrong result on a legal document,
a leaked record, or a wrong balance. There is no coverage exception for them.

## 2. Every source file has a spec

Enforced by a gate, not by intention. Tests ship **in the same pull request** as the
behaviour they test — never "in a follow-up".

Every bug fix adds a regression test that failed before the fix.

## 3. The suites that matter most

**Isolation.** Concurrent, multi-tenant, through every entry boundary — HTTP, queue
consumer, scheduled task, affiliation crossing, cache, device storage. Attempts a
cross-tenant read by every route available and fails the build if any succeeds
(`DOM-010-F`). A sequential suite proves nothing here.

**Ledger immutability.** Attempts `UPDATE` and `DELETE` against every ledger table
and asserts the database refuses.

**Rule evaluation.** Golden tests per policy type across institution kinds: the same
inputs and policy version always produce the same output, and the explanation names
the clauses that fired. A grading scheme's boundaries — including the rounding
case at 49.5 (`DOM-007-Q`) — are tested explicitly.

**Result reproducibility.** A result computed from a historical ledger state under a
historical policy version equals what was declared then. This is `ADR-003`'s central
promise and it is tested directly.

**Metric definitions.** Every governed Metric has tests for its stated edge cases
(`DOM-013-E`) — cancelled meetings, zero held meetings, absence not counted as fail,
superseded invoices.

**Offline sync.** Replay, duplicate idempotency keys, clock skew, partial batches,
and a connection dropped mid-sync.

## 4. Real dependencies

Database tests run against real PostgreSQL via Testcontainers, with real RLS
policies. A mocked database cannot prove isolation, and isolation is the thing most
worth proving.

## 5. Test data

Synthetic institutions only — a school, an affiliated college with departments, a
university with affiliations. Seeds carry Urdu names, long names, missing identity
documents, mid-year transfers, repeats and exemptions, because those are the cases
that break naive code.

**No production data in any test, ever** (`ARCH-008`).

## 6. Flakiness

A flaky test is quarantined within twenty-four hours and fixed within a week. A
flaky suite is a broken suite, and a broken isolation suite is an outage of the
control it represents.

## Enforced by

`scripts/check-tests.mjs`, coverage thresholds global and per-directory,
Testcontainers in CI, quarantine tracking. See `ED-015`.
