# ADR-011 — S3-compatible object storage, MinIO as the interface and the on-premise answer

## Status

Proposed · 2026-09-07

---

## Context

Edrithm stores files of three quite different kinds, and conflating them produces
either an over-engineered store or a negligent one.

**Legally significant documents.** Issued DMCs, transcripts, and certificates
(`DOM-007-M`). These must be retrievable in ten years, byte-identical to what was
issued, and they are what makes `JRN-001` work. Losing one is the failure the
product exists to prevent.

**Institutional and personal documents.** Student photographs, uploaded identity
documents, admission attachments, institution branding. Personal data, some of it
belonging to minors, subject to `15-compliance/`.

**Operational artifacts.** Bulk export bundles, import files, generated reports.
Transient, regenerable, and often large.

`ADR-009` removed Firebase from the stack, which took Firebase Storage with it.
`DOM-010-I` requires that a single institution can be moved to dedicated or
on-premise infrastructure without application change, and universities ask about
exactly this during procurement (`DOM-010` §5).

## Decision

**S3-compatible object storage, accessed only through the S3 API, with MinIO as
the reference implementation and the on-premise answer.**

1. **No vendor-specific storage API, ever.** The application knows the S3 API and
   nothing else. Provider is configuration.
2. **MinIO is what we run for on-premise and self-hosted deployments**, and what
   developers run locally. Same API as production.
3. **While on managed hosting** (`ADR-012`), the bucket is a managed S3-compatible
   service, so durability and replication are the provider's obligation rather than
   ours.
4. **Objects are private.** Access is via short-lived signed URLs, never public
   buckets, never a permanent URL stored in a record.
5. **Keys are tenant-scoped by construction** — the institution is the first path
   segment — so a mis-scoped read is visible in the key, and per-tenant lifecycle,
   export, and deletion are possible.
6. **Issued documents are immutable objects with versioning enabled.** A reissue
   is a new object, never an overwrite.

## Rationale

1. **One API across every deployment shape.** The same code serves a managed
   bucket, a self-hosted MinIO in a university's own data centre, and a developer's
   laptop. That is the whole reason `DOM-010-I` is answerable.
2. **MinIO makes the residency answer real rather than theoretical.** "Yes, it can
   run in your data centre" is a sentence we can only say if we never used a
   proprietary storage API.
3. **Durability belongs to whoever is best placed to provide it.** For documents
   with a ten-year retention obligation, a managed service's replication is a
   better guarantee than a four-person team's backup discipline — while we are on
   managed hosting.
4. **Signed URLs keep authorisation in the application**, where `DOM-011`'s scoping
   and audit live, rather than in bucket policy.

## Consequences

- **We must not use S3 features outside the common subset** that MinIO implements.
  This is a real constraint and is enforced by keeping storage access behind a
  narrow interface.
- **Durability moves to us the day we self-host.** An on-premise MinIO deployment
  needs a documented backup, replication, and restore procedure before a single
  institution's documents live on it.
- **Signed-URL issuance is an audited action** for sensitive documents
  (`DOM-012-F`).
- **Storage is part of tenant export** (`JRN-010`), and per-tenant key scoping is
  what makes that a bounded operation.
- **Object lifecycle differs by kind.** Operational artifacts expire; documents do
  not. Retention is Policy (`DOM-009`), applied per prefix.

## Rejected Alternatives

**Firebase Storage** — as originally specified. Removed with `ADR-009`: no
on-premise story, no residency control, and a proprietary API that would make
`DOM-010-I` unanswerable.

**Storing documents in PostgreSQL** — attractive for transactional consistency
between a document record and its bytes, and rejected on size: large objects bloat
the database, complicate backup and restore, and make the ledger's own operational
story worse.

**A provider-specific SDK for whichever service we host on** — cheaper today, and
it forecloses the deployment flexibility that is a commercial requirement.

**Self-hosted MinIO from day one** — defensible, and rejected for now only because
it moves durability for ten-year documents onto a four-person team earlier than
necessary. The interface is identical, so this is a hosting decision, not an
architectural one, and can change without code.

## Related Documents

- `DOM-007-M` · `DOM-010-I` · `DOM-012-F` · `JRN-001` · `JRN-010` · `ADR-009` · `ADR-012`
