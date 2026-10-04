# ADR-013 — Native mobile applications, with offline capture

## Status

Proposed · 2026-09-07

*Replaces an earlier draft of this ADR that proposed a PWA with foreground-only
sync. That draft was never accepted; the reasoning it contained is retained below
under Rejected Alternatives.*

---

## Context

`PRI-009` requires that attendance and marks entry work when the network does not.
`JRN-006` makes same-day absence notification one of the strongest daily-value
features in the product. Both promises are made to teachers and families using
inexpensive Android phones on weak connections, in buildings with load-shedding.

Two workflows genuinely need offline capture. Attendance is marked during a class
meeting, in a room that may have no signal, and it is time-sensitive. Marks entry
happens in bulk, sometimes in an examination hall, and losing an hour's work is
unacceptable. Everything else — admissions, fees, reporting, administration —
happens at a desk.

The domain model already makes the merge problem tractable. Attendance is one value
per (class meeting, person), so it is last-write-wins with actor and timestamp.
Marks are append-only ledger entries (`ADR-003`), so a replayed entry is a
duplicate discarded by idempotency key, never a conflict to resolve. `DOM-012-E`
already separates `occurred_at` from `recorded_at`, which is exactly what offline
capture needs.

A browser-based approach was the initial proposal. Two things changed it. Offline
reliability in a PWA depends on background sync that is unreliable on low-end
Android and largely absent on iOS, which makes the central promise conditional.
And the notification channel matters as much as the capture: reaching a guardian
the morning their child is absent requires a channel that arrives without the
recipient going looking, which a web application cannot provide.

## Decision

**Native mobile applications built with React Native and Expo, sharing the
monorepo's contracts, with local-first capture and push notifications.**

1. **One application, role-scoped.** A single app whose experience is determined by
   the signed-in person's Memberships and roles (`DOM-004`, `DOM-011`) — teacher,
   student, guardian. Administrative work remains on the web.
2. **React Native with Expo**, consuming `packages/contracts` (`ADR-008`) so the
   API contract cannot drift between web and mobile.
3. **Local-first for two workflows only** — attendance and marks entry — held in
   local SQLite with a durable outbound queue. Everything else requires
   connectivity and says so.
4. **Every queued record carries a client-generated idempotency key**,
   `occurred_at`, and the acting person. Nothing is removed locally until the
   server confirms it.
5. **The server is authoritative on merge.** Attendance is last-write-wins by
   `occurred_at` with full history retained; marks are deduplicated by idempotency
   key.
6. **Pending state remains visible** — a count of unsynced items and a manual sync
   control — even though background sync is now reliable. A teacher must never have
   to guess whether their work is safe.
7. **Push notifications** via Expo's notification service over FCM and APNs
   (`ADR-016`).

## Rationale

1. **It resolves the highest technical risk in the project.** Offline sync
   correctness was ranked first precisely because a PWA could not guarantee
   delivery. Native local SQLite and background sync remove the conditional from
   `PRI-009`.
2. **The notification channel is the product feature.** `JRN-006` requires reaching
   a guardian on the morning of an absence. A push notification arrives; a web page
   waits to be visited.
3. **Expo keeps it one team, one language, one contract.** TypeScript throughout
   (`ADR-005`), contracts shared (`ADR-008`), and over-the-air updates for
   JavaScript changes, which keeps release cadence closer to the web's than a fully
   native project would.
4. **One app rather than three** is the only maintainable shape at this team size.
   The roles differ enormously in what they see, and that is a routing and
   permission concern the model already expresses.

## Consequences

- **Mobile moves from a later phase into the MVP**, and the MVP grows. A scope
  reduction was proposed and declined: the decision is that nothing is deferred.
  `PRI-007` therefore applies as build discipline rather than as a cut — each
  workflow is finished, including its edge cases, empty states, errors and offline
  behaviour, before the next is started.
- **App-store release cycles enter the process.** Over-the-air updates cover
  JavaScript, but native changes and store review are now a constraint on how fast
  a fix reaches a teacher.
- **API versioning becomes load-bearing immediately.** An installed app is a client
  we cannot upgrade on demand, so the API must support older versions for a stated
  window — the discipline `ADR-008` and `13-platform-api/` describe, needed sooner
  than expected.
- **Local storage holds personal data about children on a teacher's own device.**
  Scope is minimised to current rosters, encrypted at rest, and cleared on
  sign-out. Device loss is a specified scenario in `15-compliance/`.
- **Clock skew is real.** `occurred_at` is client-reported and reconciled against
  `recorded_at`, with large skews flagged rather than trusted.
- **Adoption depends on installation** — see `ADR-016`, where this is recorded as
  an open risk rather than an assumption.
- **Testing must cover genuinely degraded networks and real low-end devices**, not
  a simulator with an offline toggle.

## Rejected Alternatives

**A Progressive Web App with foreground sync** — the earlier proposal. One
codebase, no app stores, instant updates. Rejected because background sync is
unreliable on low-end Android and largely absent on iOS, making `PRI-009`
conditional on a teacher remembering to keep the app open, and because a web
application has no way to reach a guardian who is not looking at it. The reasoning
remains sound about *cost*; it lost on capability.

**A PWA now, native later** — defers the second codebase, and would mean building
the capture and sync layer twice and migrating installed users. Rejected.

**Separate teacher and family applications** — cleaner experiences, and two release
pipelines, two review cycles, and two codebases for a team of four. Rejected;
revisit if the shared app's role routing becomes genuinely awkward.

**Fully native Swift and Kotlin** — best possible platform integration, at three
codebases and skills the team does not have. Rejected.

**No offline capture in the MVP** — contradicts `PRI-009` and guts `JRN-006`.
Rejected.

## Review Checkpoint

Measure two things after a term with a design partner: the proportion of captured
attendance that reaches the server the same day, and the proportion of guardians
who install and retain the app. The second is the number that decides whether
`ADR-016`'s open risk becomes a change of direction.

## Related Documents

- `PRI-007` · `PRI-009` · `JRN-006` · `ADR-003` · `ADR-005` · `ADR-008` · `ADR-016` ·
  `DOM-012-E` · `15-compliance/`
