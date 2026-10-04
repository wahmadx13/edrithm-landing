---
title: Glossary — The Binding Vocabulary
document_id: ROOT-003
version: 0.1.0
status: Draft
classification: Internal
owner: Product
reviewers:
  - Engineering
  - Domain
created: 2026-09-07
last_updated: 2026-09-07
---

# Glossary

## Purpose

This document fixes the meaning of every term Edrithm uses. It is binding on the blueprint, the
database schema, the API, the user interface, and every conversation about the product.

It exists because Edrithm serves schools, colleges, and universities at the same time, and those
three worlds use the same English words to mean different things. A "class" is a group of children
in a school and a single teaching hour in a university. A "session" is an academic year in Lahore, a
semester in Islamabad, and a login token in the codebase. Left unresolved, that ambiguity does not
stay a writing problem — it becomes a schema argument in month four, a wrong number on a principal's
dashboard in year one, and a support ticket forever.

**A term means what this document says it means. Everywhere. Without exception.**

The one permitted variation is the *label shown to a user*. A school administrator sees "Class 9-B";
a university administrator sees "BSCS-5 Section A". Both are the same underlying term — a **Cohort**
— rendered with the vocabulary that institution recognizes. Labels are configuration. Terms are not.

---

# 1. Institution and Structure

## Institution

A single organization that Edrithm serves: one school, one college, or one university. An
Institution is the **tenant** boundary. All data belongs to exactly one Institution, and no query
crosses that boundary without an explicit, audited relationship.

A school group with five branches is **one Institution with five campuses**, not five Institutions.
Two colleges under the same owner that keep separate records, separate staff, and separate results
are **two Institutions**.

## Institution Kind

What an Institution is: `school`, `college`, `university`. It determines default configuration —
session shape, structural depth, grading family, default labels — and nothing else. Kind never
changes behavior in code; it selects a policy set.

## Org Unit

A node in an Institution's structure tree. Every Org Unit has a **kind** and a parent, except the
root, which is the Institution itself.

Recognized kinds: `campus`, `faculty`, `school_wing`, `department`, `program`.

The tree is arbitrary-depth and sparse. A single-campus primary school may have one level. A
university has four or five. The same traversal code serves both.

```text
Institution (University of Example)
└── Campus (Main Campus)
    └── Faculty (Faculty of Computing)
        └── Department (Computer Science)
            └── Program (BS Computer Science)

Institution (Example Public School)
└── Campus (Model Town Branch)
    └── School Wing (Secondary)
        └── Program (Matric — Science Group)
```

## Campus

An Org Unit representing a physical location. What institutions casually call a "branch". Edrithm
uses **Campus**; "branch" appears only in user-facing labels where an institution prefers it.

## Faculty

An Org Unit grouping departments in a university. Never used to mean teaching staff — see **Staff
Member**. "Faculty" as a synonym for teachers is banned in this repository precisely because it
collides.

## Department

An Org Unit that owns courses, programs, and academic staff. Present in universities and in
affiliated colleges. Absent in most schools.

## Program

An Org Unit representing a named course of study that leads to an award: *BS Computer Science*,
*FSc Pre-Medical*, *Matric — Science Group*, *O Levels*. A Program owns a **Scheme of Study** and a
graduation rule.

---

# 2. Time

## Academic Session

A named, dated period of academic activity within an Institution: *2026–27*, *Fall 2026*,
*Spring 2027*. Every academic record is scoped to exactly one Academic Session.

**"Session" alone is banned.** Write Academic Session, Class Meeting, or Auth Session. This is the
single most dangerous ambiguity in the domain and the rule is absolute.

## Session Shape

How an Institution divides its year: `annual`, `semester`, `trimester`, `quarterly`. A property of
the Institution's calendar policy, not of the code.

## Term

A subdivision of an Academic Session used for reporting and assessment where the Session is not
itself the smallest unit — a school's *First Term* within 2026–27. In a semester system the
Academic Session and the Term are usually the same object; Edrithm still models both so that
reporting code has one shape.

## Class Meeting

A single scheduled occurrence of teaching — one period, one lecture, one lab. What attendance is
recorded against.

## Auth Session

An authenticated user session. Belongs to identity and security, never to the academic domain, and
never appears in an academic document.

## Effective Dating

Most configuration in Edrithm — grading schemes, fee structures, schemes of study, org structure,
policies — is **effective-dated**: it carries a validity range and is never edited in place. A
change creates a new version with a new effective range. This is what allows a result from 2024 to
be reconstructed under the rules that applied in 2024.

---

# 3. People and Identity

## Person

A single human being, recorded once. A Person is not a user account and is not tied to one
Institution. The same Person may be a student at an affiliated college and a registered candidate of
its affiliating university at the same time.

## Membership

The relationship between a Person and an Institution, carrying the roles that Person holds there and
the period over which they hold them. A Person with two Memberships is one human known to two
Institutions — not two records.

## User Account

The credentials by which a Person signs in. One Person, one Account, potentially many Memberships.

## Student

A Person with a student role in a Membership. "Student" describes a role, never a table of its own —
a graduate, an alumnus, and a currently enrolled learner are the same Person with different
Membership states.

## Guardian

A Person responsible for a student — parent, guardian, or authorized relative. Guardianship is a
recorded relationship with its own permissions, not a text field on the student.

## Staff Member

A Person employed by or contracted to an Institution: teaching or non-teaching. Use **Teacher** only
for a Staff Member assigned to teach an Offering.

## Institution Identifier

An identifier issued by an Institution to one of its own people — an admission number, a roll number,
an employee number. Format is institution-configured. Unique within the Institution and its issuing
scheme; never assumed unique globally.

## Registration Number

An identifier issued by an **affiliating body** — a university or an examination board — to a
candidate, and carried for the life of a program. Distinct from an Institution Identifier and issued
by a different authority. A student at an affiliated college has both.

## National Identifier

A government-issued identity number — CNIC for adults, B-Form number for minors in Pakistan.
Sensitive data, field-level encrypted, never a primary key, never displayed in full without cause.

---

# 4. Curriculum and Delivery

## Course

A unit of study in an Institution's catalogue, with a code, a title, and a credit or weighting value.
*CS-301 Data Structures* is a Course. *Physics* in a school catalogue is a Course.

**Schools call this a "Subject."** That is a label. The term is Course.

## Scheme of Study

The set of Courses a Program requires, with their sequencing, credit values, and elective rules.
Effective-dated: the scheme a 2023 intake studies under is not necessarily the one a 2026 intake
studies under, and both must remain reconstructible.

## Offering

A Course delivered in a specific Academic Session to a specific set of students, taught by assigned
Staff Members. *CS-301, Fall 2026, Section A* is an Offering. *Physics, Class 9, 2026–27* is an
Offering.

The Offering is where teaching, attendance, assessment, and results attach. It is the busiest
entity in the system.

## Cohort

A persistent named group of students who move through a Program together. *Class 9 — Section B*.
*BSCS Fall-2023 — Section A*.

A Cohort is a convenience over Enrollment, not a replacement for it: enrolling a Cohort into an
Offering creates an individual Enrollment for each of its members. This is what lets a school
administrator assign an entire class to a subject in one action while the underlying records stay
per-student — which is what universities, transfers, repeats, and exemptions all require.

## Enrollment

The record that a specific Person is taking a specific Offering, with a status history: `enrolled`,
`withdrawn`, `transferred`, `repeating`, `exempted`, `completed`. Always individual. Never inferred
from Cohort membership at read time.

## Admission

The process by which an applicant becomes an enrolled student, and the record of it. Distinct from
Enrollment: Admission is the decision, Enrollment is the ongoing fact.

## Applicant

A Person who has applied to an Institution and has not yet been admitted or rejected. An Applicant
becomes a Student on admission; the same Person record carries through.

---

# 5. Assessment and Results

This section carries the highest stakes in the product. Every term here has legal weight for a real
student.

## Assessment

Any activity that produces marks: an examination, a quiz, an assignment, a practical, a viva, a
project, sessional work. Has a maximum mark, a weighting, and a Term.

## Marks Entry

A single recorded score for one Person on one Assessment. **Marks Entries are never updated and
never deleted.** A correction is a new Marks Entry that supersedes the previous one, carrying actor,
timestamp, reason, and approval. See ADR-003.

## Marks Ledger

The complete, append-only sequence of Marks Entries for an Institution. The ledger is the record;
everything else — award lists, results, DMCs, transcripts, dashboards — is a projection of it at a
point in time.

## Award List

The compiled marks for one Offering or one examination paper, submitted by the responsible Staff
Member for approval. The unit of academic submission and sign-off.

## Moderation

The reviewing and adjustment of an Award List by an authority — a controller of examinations, an
examination committee — before results are declared. Every moderation action is a ledger event with
a named actor and a reason.

## Grace Marks

Marks awarded under an Institution's stated policy to lift a candidate over a threshold. Always
policy-driven, always recorded as a distinct, visible ledger event, never silently folded into a
score.

## Grading Scheme

The rules converting marks into grades and grade points: percentage bands, letter grades, a 4.0 GPA
scale, relative grading. Effective-dated, owned by the Institution or by the affiliating body.

## Result

The outcome for one Person for one Offering, Term, or Program, computed from the Marks Ledger under
the Grading Scheme in effect. A Result is derived, reproducible, and versioned — never typed in by
hand.

## Result Notification

The formal declaration by an Institution that Results for a given examination are official. Before
declaration a Result is provisional; after it, changes require a Re-checking, Re-totalling, or
correction workflow, each of which is itself a ledger event.

## DMC — Detailed Marks Certificate

The document issued to a student showing subject-wise marks for an examination. In Edrithm a DMC is
a **rendering of ledger state at a point in time**, carrying its own identifier, version, issue
date, and a verification code. It can be reissued identically at any time, which is the entire point:
a lost DMC stops being a crisis.

## Transcript

The cumulative academic record across a Program: all Courses, credits, grades, and the resulting
GPA/CGPA. Generated under the affiliating body's rules. Like a DMC, versioned and verifiable.

## Verification Code

The identifier printed on a DMC or Transcript — as text and as a QR code — that resolves to a public
page confirming what the issuing Institution actually recorded. Verification is a read of the
authoritative record, never a stored copy of the document.

## Re-checking · Re-totalling

Post-declaration workflows. **Re-totalling** re-adds the marks already awarded. **Re-checking**
re-examines the answer script. Different processes, different fees, different authorities, different
outcomes. They are never conflated.

## Supplementary · Repeat · Improvement

Additional attempts at an Assessment or Course, differing in eligibility rules and in how they
affect the Result. The attempt number is part of the record; a later attempt never erases an earlier
one from the ledger.

## Detained

The status of a student barred from sitting an examination for failing to meet an eligibility rule —
most commonly the attendance threshold. A status derived from policy and data, recorded with its
reason, and appealable.

---

# 6. Money

## Fee Head

A single named charge: tuition, admission, examination, laboratory, transport, hostel, library fine.

## Fee Structure

The set of Fee Heads applying to a Cohort, Program, or student category for an Academic Session,
with amounts and due cycles. Effective-dated.

## Invoice

The amount owed by a student for a period, assembled from the Fee Structure and any Concessions.

## Challan

The printed or digital payment instrument a payer takes to a bank or pays through a wallet, carrying
a reference number that reconciles back to an Invoice. The dominant payment instrument in Pakistan,
and a first-class entity rather than a report.

## Payment · Receipt

A **Payment** is money received, with its instrument, reference, and date. A **Receipt** is the
document issued acknowledging it. Payments are append-only; a reversal is a new entry.

## Concession

A reduction in what a student owes: scholarship, sibling discount, staff ward, merit award,
hardship waiver. Recorded with its authority and reason, never as an edited invoice amount.

## Defaulter

A student with an overdue balance, as defined by the Institution's own policy — which varies, and is
therefore a governed Metric (see `MET-`) rather than a hardcoded rule.

---

# 7. Affiliation

## Affiliating Body

An organization with authority over another institution's academic outcomes: a university over its
affiliated colleges, or an examination board over its registered schools.

## Affiliated College

An Institution whose students are registered with, examined by, and awarded by an Affiliating Body,
while being administered independently.

## Constituent College

A college that is a part of a university rather than an independent Institution affiliated to it.
Modelled as an Org Unit of the university, not as a separate Institution. The distinction matters:
it decides who owns the records.

## Affiliation

The recorded, effective-dated relationship between an Affiliating Body and an Affiliated College,
scoped to the Programs it covers. The Affiliation is what authorizes data to cross the tenant
boundary, and it is the only thing that does.

## Board

A statutory examination authority. In Pakistan, a BISE for secondary and higher-secondary
examinations; internationally, the equivalent awarding body. Treated as an Affiliating Body with
Institution Kind `board`.

---

# 8. Policy, Metrics, and Intelligence

## Policy

A versioned, effective-dated, machine-readable rule set that governs behavior for one Institution:
grading, promotion, attendance thresholds, fee cycles, identifier formats, eligibility. Policies are
**data**. Differences between a school, a college, and a university are expressed here, never in
branching code.

## Metric

A named, governed, versioned definition of something Edrithm can state as a number — *attendance
percentage*, *pass rate*, *collection rate*, *active student*, *defaulter*, *CGPA*. Each carries an
identifier (`MET-NNN`), a precise definition, its inputs, and its edge cases.

Every number displayed anywhere — dashboard, report, API response, AI insight — resolves to a
Metric. This is what makes the principal, the head of department, and the printed report agree on
what "attendance" means. Defined in `DOM-013`.

## Insight

A statement generated for a user that combines one or more Metrics with context and a suggested
action. An Insight is always traceable to the records that produced it, and its numbers are always
computed, never generated.

## Signal

An indication that a person may need attention — a falling attendance trend, a grade trajectory, an
overdue balance. Signals are **computed, shown, and expire.** A Signal is never written to a
person's record, never ranked publicly, and never acted on by the system without a human. See
`PRI-012`.

---

# 9. Platform

## Tenant

The isolation boundary. One Institution, one tenant. Used when discussing data isolation and access
control; **Institution** is used when discussing the organization itself.

## Tenant Boundary

The rule that no data is readable outside the Institution that owns it, except through an explicit
Affiliation, and never without an audit record.

## Domain Event

An immutable record that something happened — a Marks Entry was recorded, a Result was declared, a
Payment was received. The substrate for audit, integrations, analytics, and intelligence.

## Projection

A read-optimized view derived from ledgers and events — a dashboard figure, a result sheet, a
defaulter list. Projections are always rebuildable from the record. They are never the record.

---

# 10. Banned Terms

These words are ambiguous across our three institution kinds and are not used in documents, schema,
or code. The permitted alternatives are given.

| Banned                        | Use instead                                                        |
| ----------------------------- | ------------------------------------------------------------------ |
| Session (unqualified)         | Academic Session · Term · Class Meeting · Auth Session              |
| Class                         | Cohort (the group) · Class Meeting (the occurrence) · Program (the level) |
| Batch                         | Cohort · Intake Year                                                |
| Subject                       | Course (Subject is a school-facing label only)                      |
| Faculty (meaning teachers)    | Staff Member · Teacher (Faculty is an Org Unit kind)                |
| Branch                        | Campus                                                              |
| Marksheet                     | DMC · Result · Award List — depending on which is meant             |
| Fee (as a single amount)      | Fee Head · Fee Structure · Invoice                                  |
| Student ID (ambiguous)        | Institution Identifier · Registration Number · Person identifier    |
| Grade (ambiguous)             | Grade (the award) · Program level — never "Grade 9" for a Cohort    |
| User (in domain documents)    | Person · Staff Member · Student · Guardian                          |
| Score (unqualified)           | Marks Entry · Result · Metric                                       |

---

# 11. Abbreviations

| Term | Meaning                                                                       |
| ---- | ----------------------------------------------------------------------------- |
| BISE | Board of Intermediate and Secondary Education (Pakistan)                      |
| CGPA | Cumulative Grade Point Average                                                |
| CLO  | Course Learning Outcome                                                       |
| CNIC | Computerised National Identity Card (Pakistan)                                |
| DMC  | Detailed Marks Certificate                                                    |
| HEC  | Higher Education Commission (Pakistan)                                        |
| IBCC | Inter Board Committee of Chairmen (Pakistan)                                  |
| OBE  | Outcome-Based Education                                                       |
| PLO  | Program Learning Outcome                                                      |
| RLS  | Row-Level Security                                                            |

---

# Changing This Document

A new domain term, or a changed meaning, is a decision. It is proposed with the change that needs
it, reviewed, and merged in the same pull request as the documents and code that use it. Renaming a
term after it reaches the schema is expensive; that expense is the reason this document exists.

---

# Related Documents

- `ROOT-002-CONTRIBUTING.md` — the glossary rule
- `docs/10-domain/` — the model these terms describe
- `docs/10-domain/DOM-013-metric-and-semantic-layer.md` — governed Metric definitions
