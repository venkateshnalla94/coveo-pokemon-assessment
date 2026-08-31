"use client";

import { buildSearchEngine, loadFieldActions, type SearchEngine } from "@coveo/headless";
import { POKEMON_FIELDS } from "./fields";
import { resolveCoveoConfig } from "./config";
import { PIPELINE, SEARCH_HUB } from "./searchConfig";

export { isCoveoConfigured } from "./config";

let engine: SearchEngine | undefined;

// Multiple pages each dispatch their own `executeSearch` on mount against
// this one shared engine singleton (see the guarded mount effects in
// src/app/page.tsx, SearchUrlSync.tsx, src/app/pokemon/[name]/page.tsx).
// Navigating between them while one is still in flight is a real,
// timing-dependent race: the newer dispatch correctly supersedes the older
// one — Headless's own request-cancellation logic, not a bug — but
// Headless's logger middleware (app/logger-middlewares.js) reports every
// cancelled/rejected action via `logger.error`, with no way to mark this
// one as an expected supersede (confirmed by reading the installed
// `executeSearch` thunk processor: it never sets the `payload.ignored` flag
// the logger middleware checks for). `configuration.loggerOptions` only
// exposes `level` (global) and `logFormatter` (reshapes the log object,
// can't drop it) — no way to suppress just this one message through
// Headless's public API. Confirmed via a live repro (cold-load, cross-page
// navigation, browser back/forward) that results/facets stay correct every
// time this fires; it's cosmetic. Filtered narrowly here — matched on the
// exact message text, nothing else touched — so it doesn't show up in a
// live demo or the hosted app; if a future @coveo/headless version changes
// this message, the filter just stops matching and the line reappears
// (fails open, doesn't swallow anything new).
const BENIGN_REJECTED_SEARCH_MESSAGE = "Action dispatch error search/executeSearch/rejected";
if (typeof window !== "undefined" && !("__pokemonConsoleErrorFiltered" in window)) {
  Object.defineProperty(window, "__pokemonConsoleErrorFiltered", { value: true });
  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (args.includes(BENIGN_REJECTED_SEARCH_MESSAGE)) {
      return;
    }
    originalConsoleError(...args);
  };
}

/**
 * Lazily creates a single client-side Headless search engine instance.
 * Config comes from resolveCoveoConfig() (NEXT_PUBLIC_* env vars, see
 * .env.example) — never hardcode the org ID or access token here. Callers
 * must check isCoveoConfigured() first.
 */
export function getSearchEngine(): SearchEngine {
  // The module-level singleton below is only safe to reuse in the browser.
  // This function still runs during SSR of these "use client" components,
  // and Next.js (Fluid Compute in particular) can reuse this module's scope
  // across multiple, unrelated requests on the server — so returning a
  // cached `engine` there would leak one request's search results into
  // another request's initial HTML, and desync from the client's fresh
  // engine on hydration. Server calls always build a throwaway engine
  // instead; only the browser gets the shared, reused instance the rest of
  // this file's comments describe.
  if (typeof window !== "undefined" && engine) {
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

  const newEngine = buildSearchEngine({
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
  newEngine.dispatch(
    loadFieldActions(newEngine).registerFieldsToInclude(Object.values(POKEMON_FIELDS)),
  );

  if (typeof window !== "undefined") {
    engine = newEngine;
  }

  return newEngine;
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
