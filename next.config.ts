import type { NextConfig } from "next";

// D11: the client-side Headless engine (src/coveo/engine.ts) talks directly
// to Coveo from the browser, so connect-src has to name real hosts, not
// 'self'. @coveo/headless's own getOrganizationEndpoint()/
// getAnalyticsNextApiBaseUrl() (node_modules/@coveo/headless/dist/esm/api/
// platform-client.js) resolve every client-side call — search, query
// suggest, and RGA/CPR streaming all ride the search API — to
// https://<orgId>.org.coveo.com, and analytics pings to
// https://<orgId>.analytics.org.coveo.com; no other Coveo host is ever
// contacted from the browser. Server-side calls (/api/token, /api/passages)
// hit platform.cloud.coveo.com from Node, which isn't subject to this
// browser CSP at all. Derived from the same NEXT_PUBLIC_COVEO_ORGANIZATION_ID
// env var the rest of the app uses (see src/coveo/config.ts), so this stays
// correct if the org is ever re-provisioned; falls back to the old wildcard
// when the env var isn't set (e.g. a CI build with no Coveo env configured)
// rather than emitting a connect-src that would break every real request.
const organizationId = process.env.NEXT_PUBLIC_COVEO_ORGANIZATION_ID;
const COVEO_CONNECT_SRC = organizationId
  ? `https://${organizationId}.org.coveo.com https://${organizationId}.analytics.org.coveo.com`
  : "https://*.coveo.com https://*.cloud.coveo.com";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // Pokemon images only ever come from img.pokemondb.net (see the crawled
  // pokemonimageurl field in mapPokemonResult.ts and the remotePatterns
  // below) — Coveo is never an image source, so it has no place in img-src.
  "img-src 'self' data: https://img.pokemondb.net",
  `connect-src 'self' ${COVEO_CONNECT_SRC}`,
  "base-uri 'self'",
  "form-action 'self'",
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
