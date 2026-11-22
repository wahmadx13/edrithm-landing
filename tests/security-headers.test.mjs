// ED-032 (Ziad, 2026-11-22): every landing page carries the framing, sniffing, referrer and HSTS headers (the web app's
// ED-135 rule), and the site allows no remote image host.
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { CONTENT_SECURITY_POLICY, SECURITY_HEADERS } from "../src/lib/security-headers.mjs";

const byName = Object.fromEntries(SECURITY_HEADERS.map((h) => [h.key.toLowerCase(), h.value]));

it("forbids framing two ways and sends nosniff, a referrer policy and HSTS", () => {
  expect(CONTENT_SECURITY_POLICY.split("; ")).toEqual(expect.arrayContaining(["frame-ancestors 'none'", "base-uri 'self'", "object-src 'none'"]));
  expect(byName["content-security-policy"]).toBe(CONTENT_SECURITY_POLICY);
  expect(byName["x-frame-options"]).toBe("DENY");
  expect(byName["x-content-type-options"]).toBe("nosniff");
  expect(byName["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(byName["strict-transport-security"]).toMatch(/^max-age=31536000/);
});

it("next.config applies the headers to every path and allows no remote images", () => {
  const config = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
  expect(config).toMatch(/source: "\/:path\*", headers: \[\.\.\.SECURITY_HEADERS\]/);
  expect(config).not.toMatch(/remotePatterns/);
  expect(config).not.toMatch(/dicebear/);
});
