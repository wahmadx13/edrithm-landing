# ADR-016 — Push notifications as the primary channel; the reach gap is an open risk

## Status

Proposed · 2026-09-07

---

## Context

Several of Edrithm's highest-value moments depend on reaching a person who is not
looking at the product. A guardian must learn their child was absent on the morning
it happened (`JRN-006`). A student must learn they are approaching the attendance
threshold *before* they cross it. A family must learn a fee is due, and that a
result has been declared.

`ADR-013` puts native mobile applications in the MVP, which makes push
notifications available. Payment processing is deliberately out of scope
(`ADR-017`), so notifications carry information and never a payment instrument.

There is a hard fact underneath this decision. **Push notifications reach only
people who have installed the application, kept it installed, and granted
permission.** In the Pakistani school market, that is a real filter. The channel
that reaches every household without any of those steps is WhatsApp, and a school
that adopts Edrithm partly for parent communication will judge it on whether the
absence message actually arrives.

## Decision

**Push notification is the primary channel. The reach gap is recorded as an open
risk with a defined fallback, not assumed away.**

1. **Push via Expo's notification service over FCM and APNs.** FCM is used as a
   push transport only — device tokens and message payloads. It is not Firebase
   Auth or Firebase Storage, both removed by `ADR-009` and `ADR-011`, and no
   personal data beyond a device token is held there.
2. **Every notification is also an in-app record.** A notification is a
   convenience; the durable record lives in the app and the web portal, so a missed
   push is never a lost message.
3. **Notification preferences are per person and per category**, with a stated
   minimum an institution cannot silence for guardians (absence, result
   declaration, and anything affecting examination eligibility).
4. **Delivery is recorded.** Sent, delivered, opened — per recipient, so a school
   can answer "was the parent told?" with evidence rather than belief.
5. **Notification content carries no marks, no balances, and no judgments** in the
   payload itself, because a notification is visible on a lock screen. It says
   something is available; the detail requires opening the app.
6. **Language follows the recipient**, not the institution — Urdu or English, per
   person.
7. **The fallback channel is specified but not built:** an SMS or WhatsApp path for
   guardians without the app, behind the same notification abstraction, so adding
   it later is a provider implementation and not a redesign.

## Rationale

1. **Push is free at the margin.** With `ADR-017` removing payment processing,
   messaging is the largest variable cost per tenant, and per-message WhatsApp
   pricing at absence-notification volume across thousands of students is
   significant. Push removes that from the cost model entirely.
2. **The apps exist anyway** (`ADR-013`), so the channel is available at no
   additional integration cost.
3. **Deferring WhatsApp defers real complexity** — business verification, template
   approval, a business solution provider relationship, and per-conversation
   pricing — none of which should sit on the MVP's critical path.
4. **Abstracting the channel now costs almost nothing** and is what makes the
   fallback a later decision rather than a later rewrite.
5. **`PRI-012` shapes the content rule.** A lock-screen notification is visible to
   whoever holds the phone, so nothing about a person's marks, balance, or standing
   belongs in it.

## Consequences

- **Adoption of the guardian app becomes a product risk**, not merely a
  distribution one. If guardians do not install, `JRN-006` does not happen, and
  that is a feature schools will have bought Edrithm for. Onboarding — how a school
  gets families installed — needs designing as deliberately as the app itself.
- **This is measured, not assumed.** `ADR-013`'s review checkpoint tracks guardian
  installation and retention. A low number triggers the fallback, and the
  abstraction in §7 is what makes that cheap.
- **A device token registry** with lifecycle handling: reinstalls, device changes,
  shared family phones, and stale tokens.
- **Quiet hours and rate limits** are required. A guardian who receives too much
  will disable notifications, and then the channel is gone with no signal to us.
- **Notification delivery is a job** (`ADR-010`), driven by domain events, with
  retries and a per-recipient delivery log.
- **FCM re-enters the stack as a transport.** Narrow, replaceable, and worth
  stating explicitly so it is not mistaken for a reversal of `ADR-009`.

## Rejected Alternatives

**WhatsApp Business API as the primary channel** — the highest reach in this market
by a wide margin, and the strongest answer for parent communication. Deferred, not
rejected on merit: it carries per-message cost at scale, a business-verification
and template-approval process, and a provider relationship, and the apps give us a
free channel to start with. This is the most likely thing to be reversed by the
`ADR-013` measurement, and the abstraction exists for that reason.

**SMS as the primary channel** — reaches every phone, costs more per message than
WhatsApp, carries no rich content and no delivery confidence. Retained as the
simplest fallback implementation.

**Email** — near-zero engagement with Pakistani guardians. Retained for
institutional and staff correspondence only.

**In-app and portal notifications only** — zero cost, and effectively zero reach
for guardians. Rejected: it turns `JRN-006` into a page nobody visits.

## Review Checkpoint

Build the fallback when either is true: guardian app installation at a design
partner falls short of what makes absence notification meaningful, or an
institution makes parent reach a condition of purchase.

## Related Documents

- `JRN-006` · `PRI-012` · `ADR-009` · `ADR-010` · `ADR-013` · `ADR-017` · `15-compliance/`
