<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Coveo Pokemon Challenge

Next.js + `@coveo/headless` search frontend over pokemondb.net. Cross-tool agent instructions live here; `CLAUDE.md` imports this file and adds only Claude-specific process rules on top.

## Commands

```bash
npm run dev          # local dev server
npm run build        # production build
npm run start        # serve a production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm test             # vitest unit tests
npm run test:coverage # vitest with coverage (src/coveo/* + src/app/api/*/route.ts — see docs/standards-adoption.md #12)
npm run test:e2e     # playwright e2e suite
```

`npm install` also wires a pre-commit hook (lint + typecheck) via `scripts/install-hooks.mjs`.

## Repo map

- `src/coveo/engine.ts` — Headless search engine singleton (client-only), auth-mode branching (direct vs server — see `docs/adr/0007`)
- `src/coveo/config.ts` — `resolveCoveoConfig()` / `resolveServerCoveoConfig()`, single source of Coveo env config. Has a load-bearing comment about `NEXT_PUBLIC_*` inlining — read it before adding a new env-driven field here.
- `src/coveo/fields.ts` — custom field names shared with the Coveo source config
- `src/coveo/searchConfig.ts` — search hub / pipeline names
- `src/coveo/mapPokemonResult.ts` — mapper boundary from a Headless `Result` to the local `PokemonItem` model
- `src/coveo/applicationError.ts` — normalized error type for Coveo-side failures
- `src/coveo/searchRenderState.ts` — discriminated-union render state (`loading`/`error`/`empty`/`success`)
- `src/app/api/token/route.ts` — server-side search token minting ("server" auth mode only)
- `src/app/api/passages/route.ts` — Passage Retrieval proxy, uses `COVEO_API_KEY` (not `COVEO_ML_API_KEY` — see `docs/adr/0008-passage-retrieval-needs-execute-query-not-content-preview.md`)
- `src/app/api/similar/route.ts` — deterministic same-type query backing the PDP's Similar Pokemon carousel (`docs/adr/0014`, `docs/adr/0015`)
- `src/components/SearchBox.tsx` — search input + typeahead (single controller covers both; see `.claude/skills/headless-search-page`)
- `src/components/AutomaticFacets.tsx` — Type/Generation/Egg Groups/Weaknesses/Resistances, via Coveo's real Automatic Facet Generation, not per-field facet components (`docs/adr/0011`)
- `src/components/FacetSpeed.tsx`, `FacetAbilities.tsx` — the two facets kept manual (numeric, and facet-search respectively)
- `src/components/ResultList.tsx` — result grid with images and type chips
- `src/components/SimilarPokemon.tsx` — PDP "Similar Pokemon" carousel, calls `/api/similar`
- `src/app/pokemon/[name]/page.tsx` — Pokemon detail page

## Current status

The Coveo org is live; the app returns real, correctly-faceted search results with images. `docs/HANDOFF.md` is the current-state source of truth — read it before touching org config or auth code, since it has state and gotchas not obvious from the plan docs alone.

## Conventions

- `docs/standards-adoption.md` — which engineering standards this project adopted, adapted, or skipped, and why.
- `docs/adr/` — architecture decisions. A new architectural decision, or a reversal of a previous one, gets a new ADR file here, not just a code comment.
