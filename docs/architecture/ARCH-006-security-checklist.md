---
title: Security Checklist (Living)
document_id: ARCH-006
version: 0.1.0
status: Draft
classification: Internal
owner: Engineering
reviewers:
  - Compliance
created: 2026-09-07
last_updated: 2026-09-07
---

# ARCH-006 — Security checklist (living)

Baseline: **OWASP ASVS Level 2**, plus the isolation and dignity controls this
product requires beyond it.

This document records what is **verified, with file and line evidence**, and what
remains a gap. Any change touching authentication, authorisation, tenancy,
validation, file handling, logging or personal data updates it in the same task.

**Legend:** `—` not started · `~` partial · `✓` verified with evidence

## Isolation — the controls this product lives or dies on

| Control | State | Evidence |
| --- | --- | --- |
| Every tenant-scoped table carries `institution_id` and an RLS policy | — | |
| A query without tenant context is refused by the database | — | |
| Tenant context established once per entry boundary (`ADR-019`) | — | |
| No unscoped query API exists in application code | — | |
| Transaction helper fails closed when context is absent | — | |
| No provider holds request state | — | |
| Concurrent multi-tenant isolation suite, every entry boundary | — | |
| Cross-tenant access only via an Affiliation, audited both sides | — | |
| Cache keys carry institution and principal (`ADR-014`) | — | |
| Client cache and device storage cleared on institution switch and sign-out | — | |

## ASVS

| Area | Control | State | Evidence |
| --- | --- | --- | --- |
| V1 Architecture | One API surface; trust boundaries documented | ~ | `ARCH-001` |
| V2 Authentication | Refresh rotation with reuse detection | — | |
| V2 | Brute-force lockout; timing-safe comparison | — | |
| V2 | Password hashing parameters reviewed | — | |
| V3 Session | Transaction-scoped claim propagation | — | |
| V3 | Session fixation prevented on privilege change | — | |
| V4 Access control | Every mutating handler calls a policy | — | |
| V4 | Sensitive capabilities separately granted and logged | — | |
| V4 | Separation of duties enforceable (marks entry ≠ approval) | — | |
| V4 | Ownership gate on every download and export | — | |
| V5 Validation | All input parsed by contract; unknown fields rejected | — | |
| V7 Errors & logging | No token, secret, or personal data in logs | — | |
| V7 | Correlation id on every request and job | — | |
| V8 Data protection | National identifiers encrypted before persistence | — | |
| V8 | Payroll amounts encrypted; visible only by capability | — | |
| V9 Communications | Strict CORS allowlist; hard fail if unset in production | — | |
| V12 Files | Uploads untrusted; scanned; fail closed | — | |
| V12 | No raw storage keys or checksums in responses | — | |
| V13 API | Generated specification; gated in production | — | |
| V14 Configuration | Secrets validated at boot; startup fails if missing | — | |
| V14 | No secret in source, tests, docs or compose files | — | |

## Product-specific controls

| Control | State | Evidence |
| --- | --- | --- |
| Ledger tables reject `UPDATE` and `DELETE` at the database | — | |
| Result declaration is a named, audited, permissioned act | — | |
| Issued documents immutable; reissue serves stored bytes | — | |
| Verification exposes only what confirms authenticity | — | |
| No judgment about a person is persisted (`PRI-012`) | — | |
| Protected proxies excluded from academic inference | — | |
| A person can see who accessed their record | — | |
| Device-local personal data encrypted, scoped, cleared on sign-out | — | |
| Intelligence service holds no database credential | — | |
| Worker exposes no inbound network surface | — | |
| `ai/` listener bound to loopback or private interface only | — | |
| Neither is published — no ingress, route, or DNS name | — | |
| Only the backend's database role may create a job | — | |
| Every job payload sealed and verified before execution | — | |
| Unsealed or stale job quarantined and alerted, never executed | — | |
| Job payload never carries its own authority; capability resolved at execution | — | |
| Model provider carries contractual no-training terms | — | |
| Support access is consented, time-boxed, logged, reviewable | — | |

## Related Documents

## Current evidence

See ../security/README.md for the current assurance limits. Historical monorepo
harness results are not evidence for this independent repository. Control rows
remain gaps until the actual application boundary is implemented and reviewed.

