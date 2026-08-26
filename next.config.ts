import type { NextConfig } from "next";

// Coveo platform hostnames are org-specific (https://<org>.org.coveo.com),
// so this uses a wildcard rather than a literal — tighten to the exact org
// hostname once known. See docs/standards-adoption.md #4.
const COVEO_CONNECT_SRC = "https://*.coveo.com https://*.cloud.coveo.com";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: https://img.pokemondb.net ${COVEO_CONNECT_SRC}`,
  `connect-src 'self' ${COVEO_CONNECT_SRC}`,
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.pokemondb.net",
        port: "",
        pathname: "/**",
        search: "",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
