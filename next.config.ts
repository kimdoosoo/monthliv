import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Branded 404 for addresses outside the language folders (see src/app/global-not-found.tsx).
    globalNotFound: true,
  },
  async headers() {
    // My page, the host centre and the admin never belong in search results, whatever the robots file says.
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/:locale/account/:path*", headers: noindex },
      { source: "/:locale/language", headers: noindex },
      { source: "/:locale/host/:path+", headers: noindex },
      { source: "/:locale/admin/:path*", headers: noindex },
    ];
  },
};

export default withNextIntl(nextConfig);
