# Public marketing website

Standalone Next.js application. Install with npm ci; develop with npm run dev; validate with npm run verify. Node 24.11 or newer is required.

Contains marketing routes only. NEXT_PUBLIC_APP_URL is the institutional application origin used by the login link (local default http://localhost:3000). No institution or operator dashboard routes are included.

## Design artifacts

The locked Tangerine source and compiler are in design-system/tangerine. This repository contains a pinned snapshot. Update it only from a reviewed edrithm-frontend release and refresh provenance hashes. provenance.json records original artifact hashes. npm run check:tokens verifies compiler output and negative regression cases. No sibling checkout or workspace dependency is required.

The inherited prototype components and global stylesheet are not yet migrated fully to Tangerine. Extraction does not certify design acceptance, backend connectivity, accessibility, or production readiness.

## Configuration

NEXT_PUBLIC_APP_URL identifies the institutional frontend origin. It is not a credential. Never put private secrets in NEXT_PUBLIC variables.

## Verification and dependency limitations (2026-10-04)

Verification covers lint, TypeScript, token generation/contrast and compiler rejection cases, focused unit tests, and a Next production build. It does not certify authentication, backend integration, native UI, design fidelity, or deployment readiness.

The final Next 16.3.8 / next-intl 4.14.9 dependency tree has zero runtime findings from npm audit --omit=dev. The full audit reports eight high findings in development-tool chains (ESLint/Next plugin and shadcn, through fast-glob, micromatch, braces and ts-morph). No compatible braces patch was available on this date; suggested major downgrades/overrides were not applied. These remain unresolved; this is not security or release approval. Re-run both audits before release.

On Windows, SWC native loading can reject cache directories whose ancestor ACLs allow replacement by another identity. Use its documented SWC_NATIVE_BINDING_CACHE setting with a private user-owned cache and trusted ancestors; do not disable integrity/security checks. This is a machine configuration, not a repository dependency.
