# ADR-001 — One Canonical Institution Model

## Status

Accepted · 2026-09-07

---

## Context

Edrithm serves three kinds of institution that appear, on the surface, to be different systems.

A school has classes with sections; a student belongs to a section and studies every subject with it.
The year is annual, divided into terms. Marks are percentages, and a student is promoted.

A university has faculties, departments, and programs; a student enrolls in individual courses with
credit hours. The year is divided into semesters. Marks become grade points, and a student graduates
by satisfying a scheme of study.

An affiliated college is both simultaneously — administratively school-like, academically
university-like, with its students' records existing in two institutions at once.

The scope of the product moved from schools to schools, affiliated colleges, and universities before
any backend existed. That timing is fortunate: the decision is still free.

Two obvious paths present themselves, and both are the same mistake at different scales:

1. **Separate products** for school and higher education, sharing a brand.
2. **One product with institution-kind branching** — `if (kind === 'university')` distributed through
   the domain, the queries, and the interface.

The first forfeits the affiliation network, which is our principal strategic asset, and doubles every
subsequent piece of work. The second is the same fork, deferred and disguised: the branches multiply,
each new institution adds one, and within two years no one can change anything safely.

---

## Decision

**There is one canonical institution model. A school, a college, and a university are configurations
of it.**

The model is seven concepts: Institution, Org Unit, Academic Session, Course, Cohort, Offering,
Enrollment — with Person and Membership describing people, and Policy carrying every rule that
differs.

Specifically:

- Structure is **one arbitrary-depth Org Unit tree** with typed nodes, not fixed levels and not
  separate entities per level.
- Everything academic is **scoped to an Academic Session**, whose shape is configuration.
- **Enrollment is always individual.** A Cohort creates Enrollments in bulk; it never substitutes for
  them.
- A **Person is not owned by an Institution**; a Membership connects them.
- **Every difference between institution kinds is Policy** — versioned, effective-dated data.
- `institution.kind` selects a default policy set at creation and is **never consulted again**.

Any code that branches on institution kind has found a policy that has not been modelled yet. The
fix is the policy, never the branch.

---

## Rationale

**Why one model rather than two products.** The affiliation network is the strategic asset
(`DOM-005`): a university relationship carries into its colleges, and a shared record between them is
what nobody else offers. That is only possible if a university and a college are the same kind of
object to the platform. Two products cannot share an affiliation.

**Why an arbitrary-depth tree.** Fixed levels are the most common failure in this category of
software. Every institution has a structure slightly unlike the last, and a schema with `campus_id`,
`faculty_id`, `department_id` requires a migration for each surprise. One tree with typed nodes
requires configuration.

**Why individual enrollment.** A model that infers who is taking what from group membership breaks
on the first exemption, repeat, transfer, or elective — and breaks *silently*, producing wrong
results on documents with legal weight. Individual enrollment costs nothing at school scale and is
the only thing that works at university scale.

**Why a global Person.** A student at an affiliated college is one human known to two institutions.
A per-tenant `students` table cannot express that, and retrofitting it later means rewriting identity
after real records exist.

**Why policy-as-data.** It is the mechanism that makes one codebase serve a BISE school and a
semester university, and it is the same mechanism that later makes Saudi Arabia or Germany a
configuration pack rather than a rewrite. The cost is paid once; the alternative is paid on every
institution, forever.

---

## Rejected Alternatives

**Separate products** — forfeits affiliation, doubles the work, and guarantees divergence. Rejected.

**Institution-kind branching** — A fork with extra steps. Rejected.

**A generic entity-attribute model** — configurable enough to express anything, and therefore unable to
enforce anything — no invariants, no meaningful validation, no comprehensible queries. Academic
records need enforced integrity. Rejected.

**School-first now, generalize later** — superficially pragmatic, and the specific way this becomes
impossible: identity, enrollment, and the ledger are exactly what cannot be generalized after real
data exists. Rejected.

---

## Consequences

### Positive

- One codebase for every institution kind, and one place to fix anything.
- The affiliation network becomes possible, and with it the compounding of `DOM-005` §7.
- New institution types are onboarding work, not engineering work.
- International expansion becomes a policy-pack project.
- The vocabulary is shared, so documents, schema, API, and interface agree (`ROOT-003`).

### Trade-offs

- **Higher initial complexity.** A school-only product would be simpler to build this quarter. We are
  paying for optionality we have already decided to exercise.
- **Tree traversal and individual enrollment cost more** than fixed levels and group inference —
  mitigated by materialized paths and bulk operations, not avoided.
- **The policy engine must exist before the first release**, since nothing works without it. It is
  effectively on the critical path.
- **The discipline is permanent.** Every future feature must be checked against `PRI-001`, and the
  first time a kind-branch is merged under deadline pressure, the decision begins to unwind. This is
  a review obligation, not a one-time cost.
- **Terminology requires constant care**, which is why `ROOT-003-GLOSSARY.md` is binding rather than
  advisory.

---

## Related Documents

- `docs/10-domain/DOM-001-canonical-institution-model.md` — the model this decision produced
- `DOM-002` · `DOM-004` · `DOM-005` · `DOM-006` · `DOM-009`
- `docs/05-product-principles.md` — `PRI-001`, `PRI-004`
- `ROOT-003-GLOSSARY.md`
