# ED-010 — Web standards

`apps/web` — Next.js, React, Tailwind, the Edrithm design system.

## 1. Where data comes from

`ADR-014` decides this per surface, and the choice is not a developer preference.

| Surface | Data path |
| --- | --- |
| Public — landing, verification | Server Components, cacheable, untagged |
| Read-then-act pages | Server Components, tenant-tagged cache |
| Form mutations | Server Actions, `revalidateTag` |
| Dense interactive tables | the shared typed client with TanStack Query |
| Anything mobile also does | the shared typed client |

**No `fetch` to the API from a client component by hand.** Either a Server
Component, a Server Action, or the generated client. There is no fourth way.

## 2. The cache rule

**Every cache key and every revalidation tag for tenant-scoped data begins with the
institution, and with the principal where the data is person-scoped.**

This is a security control (`ADR-014`, `ARCH-006`). Keys are built by the key helper
and never by hand; a literal string tag on tenant data fails the gate.

Untagged caching is permitted only on the landing page and the public verification
page. Anything else requires a tenant-scoped tag and a reviewed exception.

Switching institution clears client cache and revalidates server cache for the
previous one.

## 3. Server Actions are endpoints

A Server Action is a POST endpoint. It parses input with its contract, calls a
policy, and returns contract output — the same obligations as a controller
(`ED-004`). "It's just an action" is not an exemption.

## 4. Components

1. One exported component per file, maximum 150 logical lines.
2. Server Components by default; `"use client"` is a deliberate, justified boundary
   pushed as far down the tree as possible.
3. No business logic in a component. Formatting, layout and interaction only.
4. No data access in a component beyond the paths in §1.
5. Design system components before Tailwind classes; raw hex values never.

## 5. State

Server state lives in the data layer of §1. Interface state lives in the component
or in a small local store. They are never mixed — a filter is interface state, the
rows it filters are server state.

No browser storage for anything that must be correct: `localStorage` is for
remembered filters and collapsed panels, never for a draft that matters or anything
about a person.

## 6. Accessibility and locale

WCAG 2.1 AA is a build gate, not a phase (`PRI-009`, `CMP`).

1. Contrast passes in both themes, including on glass and gradient surfaces.
2. Status is never conveyed by colour alone.
3. Every interactive element is keyboard reachable with a visible focus state.
4. Touch targets meet the minimum size — these are used on phones, standing up.
5. **Every layout is tested in Urdu with the document direction reversed**
   (`ED-013`). Not translated — mirrored.
6. No text baked into a fixed-width element; long strings and Urdu both overflow
   Latin assumptions.

## 7. Performance

Route-level code splitting. Images sized and lazy. No heavy dependency added
without a stated reason and a bundle-size number. Lighthouse budgets are CI gates
(`ED-008`).

## Enforced by

ESLint (component size, `"use client"` boundary rules, restricted imports),
`scripts/check-cache-keys.mjs`, `scripts/check-i18n.mjs`, axe in component tests,
Lighthouse budgets, bundle-size check. See `ED-015`.
