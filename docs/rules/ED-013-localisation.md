# ED-013 — Localisation, Urdu, and locale correctness

Edrithm is built for Pakistan first, to a standard that travels (`VIS-007`).
Localisation is not translation applied afterwards; it is a property of the schema,
the layout and the output.

## 1. Every text column is classified

Three kinds, and each behaves differently. A new text column declares which it is,
or the gate fails.

| Kind | Meaning | Rule |
| --- | --- | --- |
| **Governed** | Institution-authored text that appears on official output — institution name, programme title, course title, document labels | Paired columns, one per supported language |
| **Personal** | A person's own data — names, addresses | Stored as given, with a language tag; never machine-translated |
| **Operational** | Notes, remarks, internal descriptions | Single column, carries a language tag |

**A person's name is never transliterated by us.** If an institution records a name
in Urdu, that is the name. A Latin form is a separate recorded value, not a
generated one.

## 2. Governed text is paired

A governed field exists in English and Urdu. Neither is an afterthought: a document
issued in Urdu with an English course title is a defective document.

Where an institution has not supplied one language, the interface shows what exists
and marks the gap. It does not silently fall back and it does not machine-translate
official text.

## 3. Interface language follows the person

Locale is a property of the Person, not of the institution or the browser. A
guardian who reads Urdu receives Urdu — notifications, portal, and documents where
the institution supports it (`ADR-016 §6`).

## 4. Layout is mirrored, not translated

1. Every screen is tested with the document direction reversed. Mirroring is
   layout, not a stylesheet afterthought.
2. Logical CSS properties throughout — start and end, never left and right.
3. Icons with direction — arrows, chevrons, progress — mirror. Icons without —
   a clock, a logo — do not.
4. Numbers, dates and currency follow the locale, and mixed Latin-Urdu strings
   are laid out with proper bidirectional handling rather than by hand.
5. **No text baked into a fixed-width element.** Urdu and German both overflow
   Latin assumptions.

## 5. Urdu rendering

Nastaliq is demanding — contextual shaping, dense ligatures, sloped baselines.

1. The font is pinned and bundled, never fetched at render time. A silently
   substituted font is a corrupted document (`ADR-020`).
2. Line height and letter spacing are set for Nastaliq specifically; Latin defaults
   clip it.
3. **Every document template and every screen is reviewed by someone who reads
   Urdu** before it ships. This is not something an engineer can eyeball.

## 6. Formatting belongs to the reader

Dates, numbers, currency and names are formatted in the presentation layer, in the
reader's locale — never in SQL (`ED-003 §6.2`), never stored pre-formatted.

Store instants with a timezone; the institution's timezone decides a business day
(`DOM-003`).

## 7. Built for the next locale

Calendar system, grading vocabulary, name ordering, identifier formats and currency
are locale-pack concerns (`16-localization/`, `DOM-009-E`), not hardcoded
assumptions. Saudi Arabia needs Hijri as a first-class display calendar; the
abstraction exists now so that is a pack rather than a migration.

Adding a language is a content project. If it is ever an engineering project, this
rule was not followed.

## Enforced by

`scripts/check-i18n.mjs` (column classification, governed pairing, no orphaned
column, language tags), ESLint (no physical CSS direction properties, no hardcoded
user-facing strings), RTL snapshot tests, font-pinning check. See `ED-015`.
