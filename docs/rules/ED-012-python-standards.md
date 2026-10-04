# ED-012 — Python standards

`ai` — insight and document extraction (`ADR-018`).

## 1. The two prohibitions

These are the reason the service exists in the shape it does, and they are absolute.

1. **It computes no figure a user sees.** Metric values arrive already computed
   (`DOM-013-K`). A number this service produced and a user read is a defect, not a
   feature.
2. **It holds no database credential.** It reads through the API under the same
   tenant scoping and permission model as any other caller.

A change that violates either is refused regardless of what it enables.

## 2. Extraction is a suggestion

A value read from an uploaded document carries a confidence, a model version and
its source, and is **never written as a record** (`DOM-008-W`). A person confirms
it. Unconfirmed extractions are visibly unconfirmed and are excluded from every
Metric.

Below the calibrated confidence threshold, a suggestion is not shown at all.

## 3. Retrieval before generation

Permission scoping happens at retrieval, never as a filter on generated output
(`PRI-013`). A model never sees data the requesting person could not read.

## 4. Providers

Behind a narrow interface, as the token issuer is (`ADR-009`). No provider SDK
appears outside the adapter. Contractual no-training terms and a stated processing
region are prerequisites, not preferences.

Every call records: institution, principal, purpose, model, tokens, cost. Per-tenant
ceilings are enforced here and a ceiling reached degrades the feature honestly —
it never silently stops (`EDR-VAL-003`).

## 5. Code

1. Typed throughout; `mypy --strict`. `Any` is a defect.
2. Formatting and linting by `ruff`; not discussed in review.
3. Docstrings on public modules, classes and functions — PEP 257. **No `#`
   explanatory comments**, on the same reasoning as `ED-006 §1`.
4. Pydantic models at every boundary, mirroring the contract that crossed the queue.
5. Pure functions where possible; model calls and I/O at the edges.
6. Dependencies pinned; lockfile committed.

## 6. Determinism and evaluation

1. Prompts are versioned files, not inline strings, and a prompt change is a
   reviewed change.
2. Model version, prompt version and inputs are recorded with every output, so any
   insight can be reproduced and explained.
3. **Insight quality is evaluated, not asserted.** A held-out set of real
   institutional situations with expected outputs, run in CI, with regressions
   failing the build.
4. Urdu output is reviewed by someone who reads Urdu before it ships (`ED-013`).

## 7. Dignity

`PRI-012` applies here most sharply, because this is where language about people is
generated.

- No adjective about a person's ability, effort or character. Ever.
- Statements describe data and behaviour: "attendance is below the eligibility
  threshold", never "weak student".
- No output ranks named people.
- Protected proxies are excluded from inference (`ED-007 §4.2`).
- Nothing generated about a person is hidden from that person.

## Enforced by

`mypy --strict`, `ruff`, `scripts/check-comments.py`, prompt-version gate,
evaluation suite in CI, spend-ledger assertions, `scripts/check-dignity.mjs` over
output templates. See `ED-015`.
