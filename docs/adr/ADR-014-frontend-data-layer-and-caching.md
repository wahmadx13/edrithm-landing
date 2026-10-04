# ADR-014 — Server Components and Server Actions by default; a client cache where it earns its place

## Status

Proposed · 2026-09-07

*Replaces an earlier draft of this ADR that made a client cache the whole data
layer. The tenant-key rule below is unchanged from that draft and is the most
important part of this document.*

---

## Context

`ADR-005` and `ADR-007` place domain logic and database access in the NestJS
backend, with Next.js as the client. Two questions follow: how the web application
gets data, and how caching behaves in a multi-tenant product.

Since the earlier draft, `ADR-013` put React Native applications in the MVP. That
changes the calculation materially: **a mobile client cannot use Server Components,
Server Actions, or the Next.js cache.** It needs a typed API client with caching,
retry, and an offline mutation queue, and that layer is now being built regardless.
The question is no longer whether a client data layer exists, but whether the web
also uses it.

Two properties of the product pull in opposite directions. Most administrative
pages are read-then-act: open a student, change something, move on. Server
rendering suits them, costs no client JavaScript, and is fastest to first paint on
a weak connection. But a handful of surfaces are dense and interactive — the
student directory, award lists, defaulter lists, timetables — with filtering,
sorting and pagination where a server round-trip per interaction is the difference
between feeling fast and feeling like institutional software.

And underneath both: **Next.js caching keys on the call, not on the caller.**
`fetch` caching, `unstable_cache`, route segment caching, and `use cache` know
nothing about which institution or which person asked. Every read in Edrithm is
scoped to both. A cached tenant-scoped response served to another institution is
exactly the failure `ADR-002` exists to prevent, occurring *above* the database
where row-level security cannot see it. RLS protects a query; it does not protect a
cache in front of the query.

## Decision

**Server Components and Server Actions are the default. A client cache is used only
on interactive data surfaces, and is the same client the mobile app uses. Every
cache key covering tenant-scoped data carries the institution and the principal.**

1. **Reads are Server Components by default**, calling the backend server-side. No
   client JavaScript, no API client in the browser, no token in the browser.
2. **Mutations are Server Actions by default**, invalidating with tenant-scoped
   tags via `revalidateTag`.
3. **TanStack Query is used only where interaction demands it** — client-side
   filtering, sorting, pagination, and optimistic updates on dense tables. It is a
   deliberate, reviewed choice per surface, not the default.
4. **The typed client is generated from `packages/contracts`** (`ADR-008`) and is
   shared with `apps/mobile`, which holds the offline mutation queue (`ADR-013`).
5. **Every cache key and every revalidation tag for tenant-scoped data begins with
   the institution and, where relevant, the principal.** Enforced by a
   key-construction helper and a lint rule, never by convention.
6. **Untagged caching is permitted only on genuinely public surfaces** — the
   landing page and the public verification page (`DOM-007-N`) — where there is no
   tenant. Anything else requires a tenant-scoped tag and an explicit review.
7. **Switching institutions clears client cache and revalidates server cache** for
   the previous one. A person with Memberships in two institutions (`DOM-004`)
   must never see one through the other.
8. **Route handlers exist for auth callbacks and BFF concerns only.** No domain
   logic, no database access.

## Rationale

1. **The mobile app settles the "third-party dependency" question.** A typed client
   with caching and an offline queue is required for React Native no matter what.
   Sharing it with the web's interactive surfaces is nearly free; maintaining a
   second, different approach for those surfaces is not.
2. **Server Components are genuinely better for most of this product.** Less
   JavaScript on inexpensive phones, faster first paint on weak connections, and no
   session token in the browser. That serves `PRI-009` directly.
3. **Server Actions remove real ceremony** for the form-shaped mutations that make
   up most administrative work.
4. **Round-trips are the wrong trade on dense tables.** Filtering five thousand
   students should not be a network request per keystroke on a connection that
   drops. This is where the dependency earns its place, and only here.
5. **The tenant-key rule is a correctness control, not an optimisation.** It is
   stated as a decision so that it is designed and enforced rather than discovered
   in an incident.

## Consequences

- **Two data paths exist in the web application**, and which to use is a decision
  per surface rather than per developer. The rule — server by default, client cache
  only for interactive tables — must be written into the frontend standards, or it
  will drift into inconsistency.
- **A cache-key helper is mandatory infrastructure** and is tested, because a
  mistake in it is a cross-tenant leak.
- **The isolation test suite (`DOM-010-F`) extends to both clients**: switching
  institutions and signing out must demonstrably leave nothing readable, in the
  browser and on the device.
- **Next's caching is used deliberately and sparingly** on tenant-scoped pages.
  Some performance is left on the table. That is the correct trade.
- **Server Actions are an API surface** — they are POST endpoints — and carry the
  same authorisation and validation obligations as any other, parsed against the
  same contracts.
- **This supersedes the "no TanStack Query" position** in the original product
  notes, though far more narrowly than the earlier draft of this ADR did.

## Rejected Alternatives

**A client cache as the whole data layer** — the earlier draft. Rejected because it
gives up Server Components' advantages on the majority of pages that do not need
interactivity, and adds client JavaScript on exactly the devices `PRI-009` is
about.

**Server Components and Server Actions with no client cache at all** — the simplest
model, one way of doing things, no dependency. Rejected on the dense interactive
tables, where a server round-trip per filter change on a weak connection is a
material regression, and because the shared client exists for mobile regardless.

**Custom hooks and a hand-written API client** — as originally specified in the
product notes. Rejected: it reimplements a cache across dozens of screens and
leaves the mobile offline queue with no home.

**SWR** — lighter, with a weaker mutation and offline story than `ADR-013` needs.

## Related Documents

- `ADR-002` · `ADR-005` · `ADR-008` · `ADR-013` · `DOM-004` · `DOM-007-N` ·
  `DOM-010-F` · `PRI-009` · `EDR-VAL-004`
