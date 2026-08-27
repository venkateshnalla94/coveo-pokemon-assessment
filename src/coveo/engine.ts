"use client";

import { buildSearchEngine, loadFieldActions, type SearchEngine } from "@coveo/headless";
import { POKEMON_FIELDS } from "./fields";
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
      "Missing NEXT_PUBLIC_COVEO_ORGANIZATION_ID (or, in \"direct\" auth mode, " +
        "NEXT_PUBLIC_COVEO_ACCESS_TOKEN). Copy .env.example to .env.local and " +
        "fill in the values from the Coveo admin console.",
    );
  }

  // Two auth strategies, picked by NEXT_PUBLIC_COVEO_AUTH_MODE — see
  // ADR-0007 and the doc comment on resolveCoveoConfig in ./config.
  const { accessToken, renewAccessToken } =
    config.authMode === "server"
      ? {
          // No access token is baked into the client bundle (see C4 /
          // ADR-0005). Headless requires a non-empty initial accessToken
          // (schema validation rejects ""), so this seeds an
          // intentionally-invalid placeholder; the first Search API call
          // 401s immediately, which triggers Headless's built-in
          // renew-access-token middleware (app/renew-access-token-
          // middleware.js) to call fetchAccessTokenFromServer() and retry.
          // This is the documented Headless pattern for "no static token"
          // setups, not a workaround — verified against the installed
          // package's own retry middleware rather than assumed.
          accessToken: "pending-renewal",
          renewAccessToken: fetchAccessTokenFromServer,
        }
      : {
          // "direct" mode: config.accessToken is a static, safely-exposable
          // API key (Execute queries + Analytics-Push only — see ADR-0007
          // for why this org's console can only issue that tier of key
          // right now). It doesn't expire on a timer the way a minted
          // search token does, so renewAccessToken just hands the same
          // value back — Headless still requires the callback to be
          // present, but it should only ever be invoked if Coveo itself
          // revokes/rejects the key mid-session, not on a schedule.
          accessToken: config.accessToken as string,
          renewAccessToken: async () => config.accessToken as string,
        };

  engine = buildSearchEngine({
    configuration: {
      organizationId: config.organizationId,
      accessToken,
      renewAccessToken,
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

  // Without this, only Coveo's default field set (title, uri, etc.) comes
  // back in each Result's `raw` object — custom fields like pokemontype/
  // pokemonimageurl/pokemongeneration are silently absent from every
  // individual result even though facets (a separate, server-computed
  // aggregation) show correct values regardless. mapPokemonResult reads
  // these fields straight off `raw`, so without this registration every
  // Pokemon image, type chip, and generation renders as missing, with no
  // error anywhere to point at why.
  engine.dispatch(loadFieldActions(engine).registerFieldsToInclude(Object.values(POKEMON_FIELDS)));

  return engine;
}

/**
 * Fetches a short-lived search token from the server-only /api/token route
 * (see src/app/api/token/route.ts). Only used in "server" auth mode —
 * Headless's renew-access-token middleware calls this the first time a
 * request 401s against the placeholder token above, and again on every
 * subsequent token expiry.
 */
async function fetchAccessTokenFromServer(): Promise<string> {
  const response = await fetch("/api/token");
  if (!response.ok) {
    throw new Error(`Failed to renew Coveo access token: ${response.status}`);
  }
  const body = (await response.json()) as { token: string };
  return body.token;
}
