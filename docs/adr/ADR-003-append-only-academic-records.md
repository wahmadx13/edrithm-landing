# ADR-003 — Append-Only Academic and Financial Records

## Status

Accepted · 2026-09-07

---

## Context

Edrithm's central claim is that it is a **system of record** for an institution's academic and
financial facts, not a database with forms in front of it. Everything the platform is meant to
replace — the lost DMC, the bundle of papers, the marks sheet carried across a city — depends on that
claim being true.

The facts in question decide whether a student graduates, qualifies for a job, or can prove what they
achieved. They are disputed. They are audited. They are occasionally the subject of legal
proceedings. And they are, in the current manual process, altered without trace often enough that a
controller of examinations treats "can this be changed?" as the first question about any system.

The conventional design stores a mark as a row and updates it when it changes. Under that design:

- The previous value is gone, and with it any answer to "what did it say before?"
- Who changed it, when, and why are absent unless separately logged — and a log that can be edited
  by the same authority is not evidence.
- A result printed last year cannot be reproduced, because the inputs have moved.
- There is no distinction between correcting a typo, applying moderation, awarding grace marks, and
  a revaluation — all four look identical afterwards.

Three surrounding facts sharpen this. Marks are produced under policies that themselves change, so
reproducing a result needs both the marks *and* the rules as they stood (`DOM-003-E`). Documents
issued from those results circulate physically and must remain verifiable years later (`DOM-007-N`).
And in the affiliation model, two institutions read the same academic facts, so "who changed this,
and under whose authority" is a question that crosses an organizational boundary.

---

## Decision

**Academic and financial facts are append-only. A record is written once and never modified or
deleted.**

1. **Marks and payments are ledger entries.** No update, no delete.

2. **A correction is a new entry that supersedes an earlier one**, carrying actor, timestamp, reason,
   and the authority that permitted it (`DOM-012-B`).

3. **Corrections are typed.** `correction`, `moderation`, `grace`, `revaluation`, `annulment` are
   distinct kinds, because they are distinct acts with different authorities and different meanings
   to a student.

4. **Absence is typed, never zero.** `absent`, `not_appeared`, `exempted`, `withheld`, `pending` are
   states. A zero recorded for a student who did not sit an examination is a falsification that
   propagates into every average computed downstream.

5. **Results are computed, never entered**, and record the ledger state and policy versions they were
   computed from (`DOM-007-J`, `DOM-007-K`).

6. **Documents are renderings of ledger state at a point in time**, storing what they rendered, and
   are reissuable identically. Superseded documents remain verifiable and are reported as superseded.

7. **The same rule governs money** (`DOM-008-A`), where audit expectations are, if anything, higher.

8. **Everything else may be ordinary mutable data.** Draft forms, unsent notices, saved filters, and
   preferences are not ledgers, and treating them as such would produce an unusable system. The
   three-class rule is `DOM-012-A`.

---

## Rationale

**It is what makes the product's central promise true.** "Nothing is ever lost" is not a marketing
line; it is either a property of the storage model or it is false.

**It is what a controller of examinations is actually buying.** `PER-003`'s first question is whether
marks can be edited. "No — corrections are new entries and everything is visible" is the answer that
wins the university segment, and there is no way to give it under an update-in-place model.

**It makes disputes answerable rather than arguable.** Reconstructing exactly what was recorded, by
whom, when, and under what rules turns a two-week investigation into a query.

**It makes reissue trivial**, which is the whole of `JRN-001`. A document that can be regenerated
identically is a document that cannot be lost.

**It is the substrate for everything downstream.** Audit, integrations, analytics, metrics, and the
intelligence layer all read from an immutable history. Retrofitting that after real records exist is
not a migration; it is a rewrite with irrecoverable gaps for every record written before it.

---

## Rejected Alternatives

**Update in place with a separate audit log** — the common approach, and insufficient here: the log is a
second source of truth nobody reconciles, it is typically editable by the same authority it
constrains, and it cannot reproduce a historical result — only narrate that something changed.
Rejected.

**Soft deletes and row versioning bolted onto mutable tables** — half the cost of doing it properly and
none of the guarantees; the distinction between kinds of change is still lost. Rejected.

**Event sourcing throughout the entire system** — correct for the ledger, disproportionate everywhere
else. Draft admission forms do not need an event stream. We take the append-only property where it
earns its cost and ordinary mutability elsewhere. Rejected as a global approach, adopted for ledgers.

---

## Consequences

### Positive

- The record is defensible: reconstructible, attributable, and tamper-evident by construction.
- Documents are reissuable and verifiable indefinitely.
- Results are reproducible under historical rules.
- Audit, events, analytics, and intelligence all rest on the same immutable history.
- Corrections are visible acts with reasons, which changes institutional behaviour for the better.

### Trade-offs

- **More rows, and more storage.** Accepted; storage is cheap and the record is not.
- **Reads are more complex.** "Current value" means "latest unsuperseded", everywhere. This is
  encapsulated once in the data-access layer or it will be got wrong repeatedly.
- **Results must be computed and cached**, with cache invalidation on new ledger entries and on
  policy changes — real complexity, and a likely source of bugs that needs deliberate design.
- **Projections must be maintained and rebuildable**, which is additional infrastructure.
- **Every aggregation must handle typed absences explicitly.** Convenient `SUM`s are wrong.
- **Genuine mistakes stay visible.** A teacher who enters a wrong mark and corrects it leaves both
  entries. This is the intended behaviour, and it needs handling with care in the interface so that
  ordinary human error is not displayed as though it were misconduct — a `PRI-012` concern.
- **Deletion requests need a designed answer**, since data-protection erasure and an immutable ledger
  are in tension. Resolved as redaction-preserving-facts in `DOM-012-K` and specified in
  `15-compliance/`.

---

## Related Documents

- `docs/10-domain/DOM-007-assessment-and-marks-ledger.md`
- `DOM-008` · `DOM-012` · `DOM-013`
- `docs/05-product-principles.md` — `PRI-002`, `PRI-003`
- `docs/09-user-journeys.md` — `JRN-001`, `JRN-002`
