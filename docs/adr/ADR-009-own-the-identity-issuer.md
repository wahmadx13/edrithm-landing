# ADR-009 — Own the identity issuer; authorisation stays in PostgreSQL

## Status

Proposed · 2026-09-07

---

## Context

The original product notes specified Firebase Auth: the client obtains a Firebase
ID token, the backend verifies it with the Admin SDK, and roles are looked up in
the database. That was a reasonable choice for a school product. Three decisions
taken since have made it a liability.

**`ADR-002` and `ADR-004` put isolation in the database.** Row-level security
policies read a tenant claim from the connection's session context. That claim
comes from the verified principal on every request. Isolation therefore depends on
the exact shape and trustworthiness of the claim set — and on our ability to
control it as the model evolves.

**`DOM-004` made a Person global with many Memberships.** A signed-in human may
hold a student Membership at a college and a candidate Membership at its
affiliating university. The active Membership determines the tenant claim, so
authentication and tenant selection are distinct steps and the token must carry
both cleanly.

**`DOM-010` §5 recorded what universities ask before signing:** where data lives,
whether their own directory can authenticate, whether a dedicated or on-premise
deployment is possible. A hosted identity provider in a fixed region is an answer
we do not control, given during procurement, on the question institutions are most
sensitive about.

`DOM-011` is a further constraint: the authorisation model — roles, capabilities,
org-unit scopes, attribute conditions, separation of duties — is rich, institution-
defined, and already lives in PostgreSQL where RLS can read it.

## Decision

**Issue our own tokens from an identity module, and build it so that an external
identity provider is a swap rather than a rewrite.**

1. Emit standard OIDC-shaped claims — `iss`, `aud`, `exp`, `iat`, `sub` — plus the
   Membership and tenant claims that row-level security reads.
2. Publish a key set at the conventional path, with rotation designed in rather
   than retrofitted.
3. Put issuance and verification behind narrow interfaces; no other module knows
   how a token is made. Modules see a verified principal and nothing else.
4. **Authorisation stays in PostgreSQL** — roles, grants, capabilities, scopes —
   regardless of who issues tokens. This is independent of the decision above and
   does not move.
5. Support enterprise single sign-on as a federated *source* of authentication,
   with Edrithm still issuing the session token that carries our claims.

## Rationale

1. **The claim set is part of the security model.** Policies depend on its shape.
   Owning issuance means a change to the model is a change we make deliberately,
   not one we discover when a provider alters a token.
2. **Multiple Memberships per human is not a standard flow.** Switching
   institutions changes the tenant claim. Expressing that through a third-party
   provider means reshaping claims through mappers that sit underneath the entire
   isolation model and fail quietly when wrong.
3. **Universities will require directory integration and residency answers.**
   Federating into an issuer we control lets us say yes to both. A hosted provider
   makes that answer someone else's to give.
4. **Authorisation was never going anywhere.** Given `DOM-011`, a third-party
   provider would carry a fraction of the model and create a second source of
   truth for roles — the dangerous half-measure.
5. **Consistency with the team's existing decision** on the API project, reached
   for closely related reasons.

## What We Are Taking On

This is the serious cost, and it is stated plainly: refresh-token rotation with
reuse detection, timing-safe comparison, brute-force lockout, password hashing
parameters, session fixation, key rotation and revocation, and account recovery
for users who are children or their guardians. Each is a known-hard problem with a
known-good answer, and each must be covered by tests held at full coverage. None
may be improvised.

## Consequences

- **Identity is the most security-sensitive module in the system** and is reviewed
  accordingly.
- **Enterprise SSO becomes an integration**, not a re-platforming.
- **Firebase leaves the stack entirely**, including storage (`ADR-011`, pending).
- **Guardian access is a first-class flow**, not an afterthought — many guardians
  share a phone, and some students have no account at all (`DOM-004-L`).

## Rejected Alternatives

**Firebase Auth** — as specified originally. Rejected: claim shaping under our
isolation model becomes a silent-failure surface, residency and directory answers
are not ours to give, and the multi-Membership flow is not what it is built for.

**A self-hosted identity provider now (Keycloak, Zitadel, Ory, Logto)** — a second
stateful service with its own database, backups, and upgrade cycle, in the first
months, for a team of four. Rejected for now, not on principle.

**Auth0 or similar** — the same residency and control objections as Firebase, at
higher cost.

## Review Checkpoint

Any one of these flips the decision to a dedicated identity provider:

- A regulator, university, or auditor requires a certified identity provider.
- Federation with a national identity service becomes a requirement.
- Single sign-on is needed across systems beyond Edrithm.
- Multi-factor or passkeys become a compliance requirement rather than a feature.
- The team grows enough for someone to own identity infrastructure.

If it flips, we replace one module's issuer and touch nothing else — which is the
point of §Decision 3.
