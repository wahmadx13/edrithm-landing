import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { SECURITY_HEADERS } from "./src/lib/security-headers.mjs";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // No remote images: the landing site fetches nothing from third parties at run time (ED-032; the previous remote
  // avatar host pattern was unused by any page).
  async headers() {
    return [{ source: "/:path*", headers: [...SECURITY_HEADERS] }];
  },
};

export default withNextIntl(nextConfig);
