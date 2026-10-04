# ED-011 — Mobile standards

`apps/mobile` — React Native, Expo, one role-scoped application (`ADR-013`).

## 1. One app, roles decide the experience

Teacher, guardian and student are the same binary. What a person sees is derived
from their Memberships and role grants (`DOM-004`, `DOM-011`), never from a build
flag or a separate app.

## 2. Local-first, for two workflows only

Attendance and marks entry are local-first. Everything else requires connectivity
and **says so plainly** rather than failing quietly.

1. A capture is written to local SQLite **before** the interface confirms it.
   "Saved" means durable locally, not sent.
2. Every queued record carries a client-generated idempotency key, `occurred_at`,
   and the acting person.
3. Nothing is removed locally until the server confirms it.
4. Pending state is always visible — a count, an age, and a manual sync control.
   A teacher must never have to guess whether their work is safe.
5. The server is authoritative on merge. The client never resolves a conflict.
6. Clock skew is expected: `occurred_at` is client-reported and reconciled
   server-side; the device clock is never trusted as truth.

## 3. Local data

1. Minimised to what the current day needs — rosters, not the institution.
2. Encrypted at rest.
3. Cleared on sign-out and on institution switch.
4. Never includes marks, balances or standing for anyone but the signed-in person's
   own scope.

## 4. Notifications

Payloads carry no marks, balances, standing or judgment — a lock screen is visible
to whoever holds the phone (`ADR-016`, `ED-007 §4.7`). A notification says something
is available; the app shows what.

Every notification is also an in-app record, so a missed push is never a lost
message.

## 5. Compatibility

An installed app cannot be rolled back. The client states its contract version;
the API supports versions in the field for the stated window (`ED-004 §6`).

A release that requires a newer API is gated behind a capability check, never
assumed.

## 6. Devices

Developed and tested against low-end Android as the primary target — not as an
afterthought after it works on a flagship. Urdu rendering and right-to-left layout
are tested on device, not in a simulator only.

Over-the-air updates for JavaScript; native changes go through the stores.

## 7. Shared code

Contracts and the typed client come from `packages/contracts` (`ADR-008`). Domain
logic is not reimplemented on the device — the device captures and displays; the
server decides.

## Enforced by

`scripts/check-i18n.mjs`, offline sync test suite (`ED-009 §3`), contract version
gate, bundle and startup budgets, device test matrix in CI. See `ED-015`.
