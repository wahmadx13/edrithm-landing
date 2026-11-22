# Landing site deploy runbook (ED-032)

Ziad, 2026-11-22. **Nothing here has been run against a cloud provider yet.**

## Build

```sh
docker build -t edrithm-landing:<sha> --build-arg NEXT_PUBLIC_APP_URL=https://<app host> .
```

- `NEXT_PUBLIC_APP_URL` is compiled into the browser bundle. Each environment gets its own image. It's never a
  secret.
- The build runs `check:tokens` and `next build`. It's heavy: build with at least 1.5 GB free, one heavy job at a time.
- Deploy by digest, and record the digest.

## Run

- `next start` on `127.0.0.1:3001`. The site holds no credentials, reads no Edrithm API and sets no cookies.
- It runs behind the TLS edge in the same network namespace, as one more host block next to the app, API and console
  hosts. A CDN in front is fine: the pages are static.
- `deploy/env.template` lists the one name, and it's a build argument.

## Before the first deploy
- **Security headers: done in the app.** `next.config.ts` sends them on every path (`src/lib/security-headers.mjs`,
  tested): a CSP with `frame-ancestors 'none'`, `base-uri 'self'`, `object-src 'none'` and `form-action 'self'`;
  `X-Frame-Options DENY`; `nosniff`; `strict-origin-when-cross-origin`; HSTS; and a Permissions-Policy. Script and
  style sources aren't restricted yet: that needs a per-request nonce pass (camille-web, after launch). The edge
  template sends the framing headers for the landing host too.
- **No runtime egress:** there are no remote image hosts. The unused avatar host pattern was removed, so the
  container needs no outbound access.
- Edge rules, the same as every host: methods GET, HEAD, POST, PATCH and DELETE (+ OPTIONS); HSTS; no body logging.
