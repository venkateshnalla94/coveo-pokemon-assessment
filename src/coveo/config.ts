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
export interface CoveoConfig {
  configured: boolean;
  organizationId: string | undefined;
}

interface ResolveCoveoConfigOptions {
  environment?: Record<string, string | undefined>;
}

/**
 * Takes the environment map as a parameter (defaulting to `process.env`)
 * rather than closing over it globally, so it's unit-testable without
 * mutating global state. See docs/standards.md #2.
 */
export function resolveCoveoConfig({ environment = process.env }: ResolveCoveoConfigOptions = {}): CoveoConfig {
  const organizationId = environment.NEXT_PUBLIC_COVEO_ORGANIZATION_ID;

  return {
    configured: Boolean(organizationId),
    organizationId,
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
 */
export interface ServerCoveoConfig {
  configured: boolean;
  organizationId: string | undefined;
  apiKey: string | undefined;
}

export function resolveServerCoveoConfig({
  environment = process.env,
}: ResolveCoveoConfigOptions = {}): ServerCoveoConfig {
  const organizationId = environment.NEXT_PUBLIC_COVEO_ORGANIZATION_ID;
  const apiKey = environment.COVEO_API_KEY;

  return {
    configured: Boolean(organizationId && apiKey),
    organizationId,
    apiKey,
  };
}
