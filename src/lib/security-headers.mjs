// Security headers for every landing page (ED-032; Ziad, 2026-11-22; the web app's ED-135 rule, RELEASE-BLOCKERS F1).
// The landing site is public marketing: no session, no cookies, no forms that post credentials. The CSP sets the
// framing, base, object and form rules only; script and style sources are left to a later nonce pass, because Next's
// inline bootstrap scripts need a per-request nonce, and a static policy here would either break hydration or have
// to allow 'unsafe-inline' (which adds nothing).
export const CONTENT_SECURITY_POLICY = ["frame-ancestors 'none'", "base-uri 'self'", "object-src 'none'", "form-action 'self'"].join("; ");

export const SECURITY_HEADERS = Object.freeze([
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Browsers ignore HSTS on plain http (local development), so it is safe to send everywhere.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
]);
