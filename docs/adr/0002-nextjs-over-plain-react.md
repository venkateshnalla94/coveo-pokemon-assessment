# 0002: Next.js over plain React (Vite)

Status: Accepted

## Context

Headless works with any React setup. The Advanced tier calls for a Pokemon Detail Page (routing), and the Intermediate tier requires public hosting.

## Decision

Use Next.js (App Router) instead of a plain Vite + React SPA.

## Consequences

- File-based routing gives the detail page a URL for free (`src/app/pokemon/[name]`), including direct-link and refresh support without a manually wired router.
- Deploys to Vercel with effectively zero configuration, satisfying the Intermediate-tier hosting requirement cleanly.
- Server Components by default meant one real integration cost: `isCoveoConfigured()` had to be split into a plain module (`src/coveo/config.ts`, later `resolveCoveoConfig`) separate from the `"use client"` engine module, since a Server Component can't call a client-only export. Worth noting because it's a Next.js-specific constraint a plain SPA wouldn't have hit.
- The Headless engine and all controllers are still client-only (`"use client"` components) — this project doesn't use Next's SSR data-fetching for search results, since Headless manages its own client-side state. See ADR 0004 for why no server layer exists at all.
