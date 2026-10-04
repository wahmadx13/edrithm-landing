# ADR-020 — Chromium renders documents; issued bytes are stored, never re-rendered

## Status

Proposed · 2026-09-07

---

## Context

Edrithm issues documents that carry legal weight: Detailed Marks Certificates,
transcripts, result cards, certificates, fee challans and receipts. `DOM-007-M`
requires that a document is a rendering of ledger state at a point in time, that it
stores what it rendered, and that it can be reissued identically years later —
which is what makes `JRN-001`, the lost DMC, a non-event rather than a crisis.

Three constraints shape the choice, and they are not the ones that usually decide
this question.

**Urdu.** Names, institution details, and increasingly whole documents are rendered
in Urdu, written in Nastaliq. It is among the most demanding scripts to typeset:
contextual glyph substitution, dense ligatures, sloped baselines, and
right-to-left flow mixed with Latin and digits. Most PDF libraries do not shape it
correctly, and a student's name rendered wrong is not a cosmetic defect — it is an
unusable document, and an insulting one.

**Reproducibility.** A DMC issued in 2026 must be reissuable in 2036, identically.
Any renderer's output changes across versions, and templates change too.

**Volume.** A university declaring results has tens of thousands of candidates.

## Decision

**Chromium via Playwright, rendering HTML and CSS templates in the worker service.
Documents are generated lazily, stored immutably, and thereafter served as stored
bytes.**

1. **Chromium is the renderer**, chosen for text shaping. Its layout and shaping
   engine handles Nastaliq, bidirectional text, and mixed scripts correctly, and
   the team can author templates in HTML and CSS.

2. **Templates are versioned policy** (`DOM-009`, `document_template`), owned per
   institution, so a university's DMC layout is configuration rather than code.

3. **Generation is lazy.** Declaring a result makes results available; it does not
   generate documents. A document is produced on first request. Bulk generation
   exists as a job for institutions that want everything at once.

4. **The rendered artifact is stored immutably** in object storage (`ADR-011`),
   versioned, alongside the `result_snapshot` the document was rendered from.

5. **Reissue serves the stored bytes.** It is not a re-render. A Chromium upgrade,
   a font update, or a template revision therefore cannot alter a document already
   issued.

6. **Each issued document records its renderer version, template version, and font
   set.** Re-rendering is possible as a verification fallback, never as the normal
   path.

7. **Rendering sits behind a narrow interface** — snapshot plus template in, bytes
   plus metadata out — so an alternative renderer is a swap rather than a rewrite.

8. **Fonts are pinned and bundled**, not fetched at render time. A missing Nastaliq
   font silently substituted is a corrupted document.

## Rationale

1. **Script support is the deciding factor, not speed.** This reverses the usual
   analysis. A faster renderer that shapes Urdu poorly is useless here, and no
   amount of throughput compensates for a name printed wrong on a certificate.

2. **Storing bytes solves reproducibility completely.** The alternative —
   re-rendering from a snapshot and hoping the output matches — makes byte-identical
   reissue a property we would have to defend forever across every dependency
   upgrade. Storing the artifact makes it a property of object storage instead.

3. **Lazy generation dissolves the volume problem.** Most candidates do not request
   a document the week results are declared. Generating on demand turns a
   forty-thousand-document event into ordinary background work, and bulk generation
   remains available as a job across a worker pool.

4. **HTML and CSS templates are authorable.** Institutions vary their document
   layouts, and a template an implementer can adjust without a compiler is what
   makes `document_template` real policy rather than a code change per customer.

5. **It lives in the worker service** (`ADR-007`, `ADR-010`), where CPU-bound bursty
   work belongs, and where a slow render cannot affect a result declaration.

## Consequences

- **Chromium is heavy** — significant memory per instance. The worker maintains a
  pool with bounded concurrency, and document generation is isolated so it cannot
  starve other jobs.
- **Object storage grows permanently.** Issued documents are never deleted, and
  retention outlives enrolment. Budgeted in the per-institution cost model
  (`ADR-012`).
- **Template authoring is a real product surface**, with preview, versioning, and a
  test render against sample data before activation.
- **Font licensing must be checked** for any Nastaliq font bundled, and recorded.
- **The renderer version is part of the document record**, so a rendering defect can
  be scoped precisely to the documents affected.
- **Verification (`DOM-007-N`) reads the ledger, not the artifact.** The stored PDF
  is what a person holds; the verification page reports what the institution
  actually recorded, and the two are checked against each other rather than one
  standing in for the other.
- **Urdu output must be reviewed by someone who reads Urdu** before any document
  template is approved. This is not a thing engineers can eyeball.

## Rejected Alternatives

**Typst** — fast, deterministic, small, and genuinely well suited to templated
official documents. Rejected on complex-script maturity: Nastaliq shaping is not
something to bet a legally significant Urdu document on today. The narrow interface
in §7 exists so this can be reconsidered.

**LaTeX or XeLaTeX** — excellent typography and mature Urdu support through
established font packages. Rejected on authoring: templates become a specialist
skill, which conflicts with per-institution template configuration.

**Programmatic PDF libraries** (PDFKit, pdfmake, React-PDF) — fast and light, with
weak or absent complex-script shaping. Rejected outright for Urdu.

**WeasyPrint** — HTML and CSS to PDF in Python, and it would sit naturally beside
the intelligence service. Rejected because its text shaping for Nastaliq is weaker
than a browser engine's, on the one axis that decides this.

**Re-rendering on every issue instead of storing bytes** — saves storage, and makes
byte-identical reissue a promise we must defend across every future upgrade of a
browser, a font, and a template. Rejected.

**Generating all documents eagerly at declaration** — simpler mental model, and it
converts every declaration into a large batch job producing artifacts most of which
nobody requests. Rejected.

## Review Checkpoint

Revisit the renderer if Typst's complex-script support matures to the point that an
Urdu DMC is indistinguishable from Chromium's output, or if Chromium's resource
cost becomes the constraint on document throughput.

## Related Documents

- `DOM-007-M` · `DOM-007-N` · `DOM-009` · `JRN-001` · `JRN-002` · `ADR-007` ·
  `ADR-010` · `ADR-011` · `ADR-012` · `16-localization/`
