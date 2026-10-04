---
title: Environments and Delivery
document_id: ARCH-008
version: 0.1.0
status: Draft
classification: Internal
owner: Engineering
created: 2026-09-07
last_updated: 2026-09-07
---

# ARCH-008 — Environments and delivery

## Environments

| Environment | Purpose | Data |
| --- | --- | --- |
| Local | development | seeded synthetic institutions, one of each kind |
| CI | gates and tests | ephemeral PostgreSQL and MinIO via containers |
| Staging | pre-release verification, design-partner previews | synthetic only |
| Sandbox | affiliated-college API integration (`PRI-011`) | synthetic, publicly documented |
| Production | live | real |

**No production data is ever copied to a non-production environment.** Not
anonymised, not "just this once". Seeds generate synthetic institutions covering a
school, an affiliated college with departments, and a university with affiliations.

## Deployment

Containers on a managed platform (`ADR-012`), with the web application and API
co-located in one region — Server Components make server-to-server calls on every
render, so latency between them is paid on every page.

Deployables: `apps/web`, `backend` (API), `backend` (worker entrypoint), `ai`.
The mobile app releases through the stores, with over-the-air updates for JavaScript
(`ADR-013`).

Infrastructure is defined as code in `infra/`, or the relocation property `ADR-012`
depends on is a claim rather than a capability.

## Releasing

Trunk-based, short-lived branches, `main` always deployable. A change is deployable
alone — no change depends on an unmerged sibling to be safe.

**Migrations are expand-then-contract.** Deploy the additive migration, deploy the
code, then remove what is no longer used in a later release. A migration and the
code that requires it never ship in the same deploy, because a rollback would then
be impossible.

**Installed mobile clients cannot be rolled back.** An API change must remain
compatible with the versions in the field for a stated window (`ADR-013`), and the
contract diff gate in CI enforces it.

## Backups and recovery

Point-in-time recovery on PostgreSQL, versioned object storage, and a **restore
drill that is actually performed** on a schedule — an untested backup is a belief,
not a control. Recovery objectives are stated in the institution agreement.

Per-tenant export runs on demand and is the answer to `JRN-010`, independent of
backups.

## Related Documents

- `ADR-011` · `ADR-012` · `ADR-013` · `ADR-014` · `ARCH-001` · `JRN-010` · `ED-009`
