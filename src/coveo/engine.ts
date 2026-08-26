"use client";

import { buildSearchEngine, type SearchEngine } from "@coveo/headless";
import { resolveCoveoConfig } from "./config";
import { PIPELINE, SEARCH_HUB } from "./searchConfig";

export { isCoveoConfigured } from "./config";

let engine: SearchEngine | undefined;

/**
 * Lazily creates a single client-side Headless search engine instance.
 * Config comes from resolveCoveoConfig() (NEXT_PUBLIC_* env vars, see
 * .env.example) — never hardcode the org ID or access token here. Callers
 * must check isCoveoConfigured() first.
 */
export function getSearchEngine(): SearchEngine {
  if (engine) {
    return engine;
  }

  const config = resolveCoveoConfig();

  if (!config.configured || !config.organizationId) {
    throw new Error(
      "Missing NEXT_PUBLIC_COVEO_ORGANIZATION_ID. " +
        "Copy .env.example to .env.local and fill in the values from the Coveo admin console.",
    );
  }

  engine = buildSearchEngine({
    configuration: {
      organizationId: config.organizationId,
      // No access token is baked into the client bundle (see C4 / ADR-0005).
      // Headless requires a non-empty initial accessToken (schema validation
      // rejects ""), so this seeds an intentionally-invalid placeholder; the
      // first Search API call 401s immediately, which triggers Headless's
      // built-in renew-access-token middleware (app/renew-access-token-
      // middleware.js) to call renewAccessToken() below and retry. This is
      // the documented Headless pattern for "no static token" setups, not a
      // workaround — verified against the installed package's own retry
      // middleware rather than assumed.
      accessToken: "pending-renewal",
      renewAccessToken: fetchAccessToken,
      search: {
        searchHub: SEARCH_HUB,
        pipeline: PIPELINE,
      },
      analytics: {
        enabled: true,
        analyticsMode: "next",
      },
    },
  });

  return engine;
}

/**
 * Fetches a short-lived search token from the server-only /api/token route
 * (see src/app/api/token/route.ts). Headless's renew-access-token middleware
 * calls this the first time a request 401s against the placeholder token
 * above, and again on every subsequent token expiry.
 */
async function fetchAccessToken(): Promise<string> {
  const response = await fetch("/api/token");
  if (!response.ok) {
    throw new Error(`Failed to renew Coveo access token: ${response.status}`);
  }
  const body = (await response.json()) as { token: string };
  return body.token;
}
