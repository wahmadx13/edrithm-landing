# ADR-017 — Edrithm records finance; it does not process it

## Status

Proposed · 2026-09-07

---

## Context

Two decisions arrived together and pull in opposite directions, so the boundary
between them has to be drawn explicitly rather than discovered.

**Payment processing is out.** Moving institutions' money means acquiring
relationships with banks and wallets, holding or routing funds, and — decisively —
becoming entangled with tax and government departments in ways that change what
kind of company Edrithm is. Institutions will instead record payments they received
through their own arrangements, and upload receipts, statements, and bills.

**Bookkeeping is in.** Fees, expenses, payroll, and ledgers, so that an institution
has a complete financial picture inside Edrithm and the intelligence layer can
analyse financial health (`JRN-009`, `14-intelligence/`).

The tension is that the second decision, taken naively, reaches further into
government and tax territory than the first one did. Payroll *processing* means
computing statutory withholding, EOBI, and social-security contributions —
jurisdiction-specific, frequently changing, and wrong answers create liability for
the institution. A general ledger that an institution relies on for statutory
filing makes us responsible for the correctness of their tax position.

`DOM-008` §9 previously drew this line at salary tracking and said that moving it
would require its own decision. This is that decision.

## Decision

**Edrithm is the financial record of an institution. It is not a payment processor,
not a payroll bureau, and not a filing agent.**

**In scope — the record:**

1. **Fees receivable in full** — fee heads, structures, concessions, invoices,
   challans as reference documents, recorded payments, receipts, balances, ageing
   (`DOM-008`).
2. **Expenses** — recorded against a chart of accounts, with supporting documents
   attached.
3. **A double-entry general ledger** with a chart of accounts, journals, and
   period close, so the financial picture is internally consistent and analysable.
4. **A payroll register** — what was agreed, what was paid, to whom, when, against
   which engagement, including deductions **as recorded by the institution**.
5. **Document ingestion** — uploaded bills, receipts, bank statements, and
   financial statements, retained as evidence and available for analysis.

**Out of scope — the processing:**

6. **No money movement.** Edrithm never initiates, holds, routes, or settles a
   payment. There is no wallet, no merchant account, no disbursement.
7. **No statutory computation.** Edrithm does not calculate income-tax withholding,
   EOBI, social-security contributions, or any other statutory deduction. It
   records the figures the institution provides.
8. **No filing, and no filing-grade assertion.** Edrithm produces no tax return,
   no statutory submission, and makes no claim that its ledger satisfies any
   filing obligation. Reports state this.
9. **No audit certification.** The ledger is a management record. It is not
   represented as audited or as a substitute for the institution's accountant.

## Rationale

1. **It preserves the boundary that motivated excluding payments.** The reason to
   stay out of payments was entanglement with government and tax departments.
   Payroll computation and filing-grade ledgers are more of that entanglement, not
   less, and drawing the line at *recording* keeps the original decision coherent.
2. **The record is what the intelligence layer needs.** Analysing financial health
   — collection, cost per student, staff cost ratio, seat utilisation, surplus —
   needs complete and consistent data, not the ability to move money. Nothing in
   `JRN-009` requires processing.
3. **Statutory rules are jurisdictional and volatile.** Computing them correctly in
   Pakistan is real work, and it multiplies in Saudi Arabia, Germany, and the United
   States. Recording figures an institution supplies is portable; computing them is
   a per-country product.
4. **It keeps liability proportionate.** A wrong number in a management report is a
   support conversation. A wrong statutory deduction is the institution's legal
   exposure, caused by us.
5. **Institutions already have an accountant.** We complement that relationship
   rather than replacing it, which is also an easier sale than asking a school to
   move its statutory accounting.

## Consequences

- **`DOM-008` expands substantially** — chart of accounts, journals, expenses,
  payroll register, period close — and its §9 boundary is replaced by this ADR.
- **Double-entry brings real obligations.** Journals balance, periods close, closed
  periods are immutable, and corrections are reversing entries rather than edits —
  `ADR-003` applied to accounting, where it is the established practice anyway.
- **Uploaded documents become financial evidence** and inherit retention,
  encryption, and access-audit requirements (`DOM-012`, `ADR-011`).
- **Extraction from uploaded documents must never write a financial record
  unreviewed.** An AI-read invoice total is a *suggestion* a person confirms.
  Fabricated or mis-extracted financial data is precisely what `EDR-VAL-003`
  forbids, and it is also how an institution loses trust in every number we show.
- **Reports must be labelled** as management information, not filing-grade.
- **Full double-entry bookkeeping is not a small module**, and it entered the MVP
  alongside mobile. A scope reduction was proposed and declined; nothing is
  deferred. `PRI-007` therefore applies to build order rather than to scope — the
  fee-receivable path is finished before the general ledger is started, and the
  ledger before payroll and extraction.
- **Institutions will ask us to cross this line** — "just calculate the tax for
  us". The answer is written down here so it is a policy rather than a judgment
  call under sales pressure.

## Rejected Alternatives

**Payments and payroll processing** — the fuller product, and the one that pulls
Edrithm into money movement, banking relationships, and statutory liability. Ruled
out deliberately.

**Fees only, no expenses or ledger** — the previous scope. Simpler, and it leaves
the owner dashboard able to show collection but not profitability, which weakens
the financial story that `01-executive-summary.md` makes central.

**Integration with existing accounting software instead of a ledger** — attractive,
and rejected for now because Pakistani institutions in this segment rarely run
accounting software with an API. Worth revisiting as an export path.

**A ledger presented as filing-grade** — the most valuable version to an
institution, and it makes us responsible for their statutory correctness. Rejected.

## Review Checkpoint

Revisit if institutions consistently reject a management-only ledger, or if a
market we enter makes statutory computation table stakes rather than differentiated.

## Related Documents

- `DOM-008` · `DOM-012` · `DOM-013` · `ADR-003` · `ADR-011` · `EDR-VAL-003` ·
  `PRI-007` · `JRN-005` · `JRN-009` · `14-intelligence/`
