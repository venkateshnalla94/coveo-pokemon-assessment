/**
 * Single source of truth for the app's public base URL — used by
 * layout.tsx's metadataBase, sitemap.ts, and robots.ts. Same
 * override-with-literal-fallback shape as SEARCH_HUB/PIPELINE in
 * src/coveo/searchConfig.ts: overridable via NEXT_PUBLIC_SITE_URL so a
 * preview/fork deployment isn't stuck pointing at this org's production
 * domain, but the literal fallback is the real, live Vercel URL (see
 * docs/HANDOFF.md), not a placeholder.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://coveo-pokemon-assessment.vercel.app";
