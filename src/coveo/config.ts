/**
 * Plain (non-"use client") module so this can run in Server Components too —
 * e.g. page.tsx deciding whether to render the search UI or a setup banner.
 * NEXT_PUBLIC_* vars are statically inlined at build time either way.
 *
 * One resolver, not `process.env` read ad hoc across the codebase — see
 * docs/standards-adoption.md #2. As of C4/ADR-0005, this file only resolves
 * *client-safe* config (the org ID). The privileged search-token-minting key
 * is server-only and never read here — see resolveServerCoveoConfig below,
 * used exclusively by src/app/api/token/route.ts and
 * src/app/api/passages/route.ts.
 */
export type CoveoAuthMode = "direct" | "server";

export interface CoveoConfig {
  configured: boolean;
  organizationId: string | undefined;
  authMode: CoveoAuthMode;
  accessToken: string | undefined;
}

interface ResolveCoveoConfigOptions {
  environment?: Record<string, string | undefined>;
}

function parseAuthMode(value: string | undefined): CoveoAuthMode {
  return value === "server" ? "server" : "direct";
}

/**
 * Takes the environment map as a parameter (defaulting to a fixed-shape
 * object below) rather than closing over `process.env` globally, so it's
 * unit-testable without mutating global state. See docs/standards.md #2.
 *
 * The default is NOT `environment = process.env` — that indirection defeats
 * Next.js's build-time NEXT_PUBLIC_* inlining. Next's webpack DefinePlugin
 * only replaces the literal, syntactic expression `process.env.NEXT_PUBLIC_X`
 * wherever it appears verbatim in source; it can't see through a variable
 * alias. `environment.NEXT_PUBLIC_COVEO_ORGANIZATION_ID` (environment being a
 * parameter that merely defaults to process.env) never matches that pattern,
 * so in the browser — where `process.env` is a stub containing only the keys
 * Next statically found — this always read back `undefined`, regardless of
 * what was actually set in .env.local. Writing the literal member expression
 * directly here, even just inside this default value, is what makes it
 * inlinable again. Every new NEXT_PUBLIC_* field added to this default must
 * repeat the same literal `process.env.NEXT_PUBLIC_X` form — a helper or
 * loop that reads them dynamically would reintroduce the bug.
 *
 * `authMode` picks between two client auth strategies — see ADR-0007:
 * - "direct" (default): the client uses `accessToken` (NEXT_PUBLIC_COVEO_
 *   ACCESS_TOKEN) as a static Search API credential. This is what an
 *   "Anonymous search"-purpose Coveo API key is designed for — query +
 *   analytics privileges only, safe to ship in client JS. In effect for
 *   this project because this org's console cannot currently issue a key
 *   with the SEARCH_API/IMPERSONATE privilege that /api/token's minting
 *   call requires (confirmed via privilege introspection — see ADR-0007).
 * - "server": the client starts with a placeholder token and renews via
 *   /api/token, which mints short-lived tokens server-side using
 *   COVEO_API_KEY (ADR-0005's original design). Switch to this the moment a
 *   key with that privilege becomes obtainable — no other code changes
 *   needed, see src/coveo/engine.ts.
 */
export function resolveCoveoConfig({
  environment = {
    NEXT_PUBLIC_COVEO_ORGANIZATION_ID: process.env.NEXT_PUBLIC_COVEO_ORGANIZATION_ID,
    NEXT_PUBLIC_COVEO_AUTH_MODE: process.env.NEXT_PUBLIC_COVEO_AUTH_MODE,
    NEXT_PUBLIC_COVEO_ACCESS_TOKEN: process.env.NEXT_PUBLIC_COVEO_ACCESS_TOKEN,
  },
}: ResolveCoveoConfigOptions = {}): CoveoConfig {
  const organizationId = environment.NEXT_PUBLIC_COVEO_ORGANIZATION_ID;
  const authMode = parseAuthMode(environment.NEXT_PUBLIC_COVEO_AUTH_MODE);
  const accessToken = environment.NEXT_PUBLIC_COVEO_ACCESS_TOKEN;

  return {
    configured: Boolean(organizationId && (authMode === "server" || accessToken)),
    organizationId,
    authMode,
    accessToken,
  };
}

export function isCoveoConfigured(): boolean {
  return resolveCoveoConfig().configured;
}

/**
 * Server-only config resolver — reads `COVEO_API_KEY` (never
 * `NEXT_PUBLIC_*`, never shipped to the client bundle). Only ever call this
 * from a Route Handler under src/app/api/ (e.g. token/route.ts), which runs
 * exclusively on the server. See docs/adr/0005-server-token-and-passage-routes.md.
 *
 * Unlike resolveCoveoConfig above, `environment = process.env` here doesn't
 * need the same literal-expression workaround: this only ever runs in a Node
 * server process, which has a real, fully-populated `process.env` at
 * runtime — there's no build-time inlining step to defeat.
 */
export interface ServerCoveoConfig {
  configured: boolean;
  organizationId: string | undefined;
  apiKey: string | undefined;
  mlApiKey: string | undefined;
}

/**
 * Two separate keys, not one, because Coveo's Custom API key purpose can no
 * longer grant Execute queries / Analytics-Push (those are now
 * template-locked to purposes like "Anonymous search") while ML - Allow
 * content preview is only grantable via Custom. A single key covering all
 * three isn't buildable in the console anymore. See
 * docs/adr/0005-server-token-and-passage-routes.md.
 *
 * `apiKey` (COVEO_API_KEY, "Anonymous search" purpose): Execute queries +
 * Analytics-Push. Used by /api/token, and by /api/passages for Passage
 * Retrieval — direct testing against the live org found `POST /rest/search/
 * v3/passages/retrieve` requires EXECUTE_QUERY, not content preview; see
 * docs/adr/0008-passage-retrieval-needs-execute-query-not-content-preview.md.
 *
 * `mlApiKey` (COVEO_ML_API_KEY, Custom purpose, ML - Allow content preview
 * only): unused by any route, confirmed dead. ADR-0008's follow-up test
 * against a live, Active CPR model got a full 200 with real passage content
 * using `apiKey` alone — content-preview isn't needed anywhere in this app.
 * Not deleted this session (inert, not urgent), but there's no reason to
 * keep it or the underlying Coveo key around beyond convenience.
 */
export function resolveServerCoveoConfig({
  environment = process.env,
}: ResolveCoveoConfigOptions = {}): ServerCoveoConfig {
  const organizationId = environment.NEXT_PUBLIC_COVEO_ORGANIZATION_ID;
  const apiKey = environment.COVEO_API_KEY;
  const mlApiKey = environment.COVEO_ML_API_KEY;

  return {
    // Only organizationId is universally required here — apiKey and mlApiKey
    // are each optional depending on which route/auth mode is in play (e.g.
    // COVEO_API_KEY isn't set at all in "direct" client-auth mode). Callers
    // (/api/token, /api/passages) each separately check the specific key
    // they need; folding apiKey into this flag would make /api/passages
    // wrongly report "not configured" whenever only mlApiKey is set.
    configured: Boolean(organizationId),
    organizationId,
    apiKey,
    mlApiKey,
  };
}
