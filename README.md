# Coveo Pokemon Challenge

Take-home assessment for a Coveo Forward Deployed Engineer role. Next.js + [`@coveo/headless`](https://docs.coveo.com/en/headless/latest/) search frontend over pokemondb.net. Full requirements: `docs/`.

**To evaluate this repo**, this file plus `docs/adr/` (18 short decision records) cover the architecture and the "why" behind it. `docs/HANDOFF.md` and `docs/archive/` are a session-by-session build log and superseded planning docs — real build history, kept for anyone who wants the "problem → iteration → fix" detail, but not required reading to judge the app.

## Status

Connected to a live Coveo org and deployed on Vercel: search, faceting (Automatic Facet Generation plus manual Speed/Abilities facets), Query Suggest typeahead, Generated Answer (RGA), a Pokemon detail page with a Similar Pokemon carousel, Passage Retrieval ("Ask about this Pokemon"), and a Compare view all work end to end against real indexed data. Open items are the two panel presentation decks — current state and next steps: `docs/HANDOFF.md`.

## Structure

- `src/` — Next.js + Coveo Headless SDK search frontend
- `docs/` — assessment instructions, the Coveo source/field-mapping spec, engineering standards adopted (`standards-adoption.md`), and architecture decision records (`adr/`) — see `docs/README.md` for an index
- `presentation/` — outlines for the two panel presentation topics
- `.claude/` — project agents/skills covering indexing, frontend, hosting, and presentation prep
- `tests/unit/` — Vitest unit tests, mirroring `src/`'s structure (`tests/unit/coveo/` for `src/coveo/`, etc.)
- `tests/e2e/` — Playwright e2e smoke tests

## Architecture at a glance

A Next.js App Router frontend on top of Coveo's `@coveo/headless` SDK, run as a client-side SPA: every page builds its Headless controllers against one shared `SearchEngine` singleton (`getSearchEngine()`, `src/coveo/engine.ts`), and Headless issues its own `fetch` calls to the Coveo Search API directly from the browser — no server rendering step in the search request path at all.

"No server layer" is the deliberate default (`docs/adr/0004-no-server-layer.md`), with three narrow, individually ADR-documented exceptions where a Next.js API route exists specifically to keep a privileged key server-only:

- **`/api/token`** — mints a short-lived search token server-side (`server` auth mode only, not live today — see `docs/adr/0007`).
- **`/api/passages`** — proxies Coveo's Passage Retrieval v3 endpoint for the PDP's "Ask about this Pokemon" feature (`docs/adr/0008`).
- **`/api/similar`** — a deterministic same-type query backing the PDP's Similar Pokemon carousel, server-side to avoid a second query colliding with the page's own shared engine, not for credential reasons (`docs/adr/0014`, `docs/adr/0015`).

Full request-lifecycle and controller-collision details: `docs/architecture/00-system-overview.md`.

## Data pipeline — indexing pokemondb.net

Two Coveo Web (crawler) sources: `Pokedex - Test` (a 3-document prototyping source) and `Pokedex - Full` (the real crawl, 1025 items, the one the `Pokedex` query pipeline's filter rule actually serves at runtime).

- **Scope**: inclusion `https://pokemondb.net/pokedex/*`; exclusions `/move/*`, `/type/*`, `/ability/*`, `/item/*`, the `/pokedex/national` index page itself, and `/pokedex/stats/*` — only real per-Pokemon pages get indexed, per the challenge's own instruction to exclude Moves/Types/etc.
- **Field extraction**: ~24 custom fields (identity, stats, training, breeding, type defenses) extracted via XPath selectors against the page's `vitals-table`/type-defense tables — each selector, and the specific extraction trap it exists to work around, is documented in `docs/coveo-source-spec.md`. Two representative traps: the vitals table has two `№` rows (National and Local dex numbers), so the dex-number selector needs positional truncation to isolate the right one; several stat/training rows render a value plus a `<small>` parenthetical (e.g. catch rate: `45` then `(5.9% with PokéBall, full HP)`), so those selectors need an explicit `text()[1]` rather than the row's full text.
- **Indexing Pipeline Extensions (IPEs)**: two org-level postConversion Python extensions — one derives `pokemongeneration` (`"Generation 1"`…`"Generation 9"`) from `pokemondexnumber`'s numeric ranges; the other strips `pokemonweaknessesraw`/`pokemonresistancesraw`'s raw `@title` text (e.g. `"Ground → Electric = super-effective"`) down to just the leading type name for `pokemonweaknesses`/`pokemonresistances`. Full Python: `docs/coveo-source-spec.md`.
- **Content exclusion** (separate from field extraction — this trims what reaches `body`, i.e. what RGA/Passage Retrieval can retrieve from): 3 XPath `exclude` rules remove the Moves-learned table, the Type-defenses effectiveness grid, and the Locations + off-topic PokéBase block — each is either already captured as a structured field or genuinely off-topic for grounding an answer. Full reasoning: `docs/adr/0012-web-scraping-content-exclusion-for-rga-cpr.md`.

## Machine learning models

Five ML models, all associated to the same `Pokedex` query pipeline (condition: Search Hub is `PokedexSearch`; filter: `@source==("Pokedex - Full")`):

| Model | Type | Purpose | Used by |
|---|---|---|---|
| `Pokedex Query Suggestions` | Query Suggestions | Typeahead suggestions as the user types | `SearchBox.tsx` |
| `Pokedex Semantic Encoder` | Semantic Encoder | Embeddings backing RGA's and Passage Retrieval's semantic retrieval | Indirect — no direct app call, both ML surfaces below depend on it |
| `Pokedex RGA` | Relevance Generative Answering | Synthesized answer panel on `/search` | `GeneratedAnswer.tsx` |
| `Pokedex Passage Retrieval` (CPR) | Passage Retrieval | Raw scored passages for "Ask about this Pokemon" on the PDP | `/api/passages` → `AskAboutPokemon.tsx` |
| `Pokedex ART` | Automatic Relevance Tuning | Boosts ranking of the ~5 best results per query, learned from same-visit click/search sequences | No app code — pipeline-level, associated in the admin console |

**Query Suggest preload, concretely**: the model's initial vocabulary came from a one-time `PUT /rest/organizations/<org>/machinelearning/models/<modelId>/configs/DEFAULT_QUERIES?languageCode=en` call (Machine Learning API, multipart `configFile`), authenticated with an admin console session rather than a separate API key. Payload: `docs/DEFAULT_QUERIES.csv`, a header-less `query,weight` CSV, 1070 rows — all 1025 real indexed Pokemon names (pulled live from the Search API, not typed by hand) at weight 1, plus 45 curated intent phrases. Full sequence: `docs/plan101.md`'s D7 row; response evidence: `docs/temp/stage-d/d7-default-queries-200-response.png`.

**ART, concretely**: associated to the `Pokedex` query pipeline (Search hub components → Machine learning tab), no application code involved — it's a pure ranking-boost layer sitting in front of every query already flowing through that pipeline. Confirmed live and active: the admin console's own Automatic Relevance Tuning panel shows real learned boosts, not just an "Active" status label.

**Why no Content Recommendation model** (for "Similar"/"Recommended"/"Popular" Pokemon): Coveo's own guidance is that a Content Recommendation model needs roughly 10,000+ historical queries to produce reliably relevant output; this org's actual usage-analytics volume, checked live, was 1,200 events all-time — two orders of magnitude short. Rather than ship a CR-backed surface that would effectively be guessing, the PDP's Similar Pokemon carousel is a deterministic same-type Search API v2 query via `/api/similar` — no ML model, no cold-start risk, always real data. Full decision: `docs/adr/0014-recommendation-strategy.md`.

## Search & facets

`/search`'s five highest-traffic facets (Type, Generation, Egg Groups, Weaknesses, Resistances) are served by Coveo's real **Automatic Facet Generation** (`buildAutomaticFacetGenerator`), not five individually hand-built facet components — the admin console's per-field **Facet Generator** option is enabled on those five fields, and `AutomaticFacets.tsx` derives its state fresh from each search response with no persistent per-mount registration. Two facets stay manually built for concrete reasons, not by default: Speed (`buildNumericFacet` — Automatic Facet Generation is STRING-only) and Abilities (`Facet.tsx` with `searchable` — hundreds of distinct values need facet-search, which automatic facets don't support). Full story, including the facet-ID-collision bug that motivated the switch: `docs/adr/0011-automatic-facet-generation-on-search-page.md`.

## Headless controllers — what's used where

Every page builds its controllers against the same shared engine singleton (`getSearchEngine()`) — a facet toggled on `/search` and the `SearchBox` mounted persistently in `AppHeader` are not independent state, they're both subscribers to one store (`docs/architecture/00-system-overview.md#the-engine-singleton`).

| Page | Controller | Built in | Purpose |
|---|---|---|---|
| Home | `buildQuerySummary` | `page.tsx` | Live indexed-item count |
| Home | `buildSearchBox` | `SearchBox.tsx` | Typeahead only — `onNavigate` redirects to `/search` |
| `/search` | `buildUrlManager` | `SearchUrlSync.tsx` | URL⇄state sync; also registers the `advancedSearchQueries` reducer |
| `/search` | `buildSearchBox` | `SearchBox.tsx` | Query text + typeahead + submit |
| `/search` | `buildAutomaticFacetGenerator` | `AutomaticFacets.tsx` | Type/Generation/Egg Groups/Weaknesses/Resistances |
| `/search` | `buildFacet` (searchable) | `FacetAbilities.tsx` | Abilities facet |
| `/search` | `buildNumericFacet` | `FacetSpeed.tsx` | Speed facet |
| `/search` | `buildQuerySummary`, `buildBreadcrumbManager`, `buildSort` | `SearchSummaryBar.tsx` | Result count, active-filter chips + clear all, sort dropdown |
| `/search` | `buildDidYouMean` | `DidYouMean.tsx` | Query-correction suggestion |
| `/search` | `buildGeneratedAnswer` | `GeneratedAnswer.tsx` | RGA |
| `/search` | `buildResultList` | `ResultList.tsx` | Results grid |
| `/search` | `buildPager` | `Pager.tsx` | Pagination |
| `/search` | `buildInteractiveResult` / `buildInteractiveCitation` | `ResultList.tsx` / `GeneratedAnswer.tsx` | Per-result / per-citation click analytics |
| PDP | `buildResultList` | `page.tsx` | Single-item result via an exact-match `aq`, not free text |
| PDP | `buildSearchBox` | `page.tsx` | Used only to reset text to `""` and `.submit()` — text never shown |

Every controller above is the real, installed `@coveo/headless` controller, confirmed against the package's own `.d.ts` files during the build sessions — no hand-rolled reimplementation of anything Headless already provides.

**Deliberate non-Headless counter-examples** — named so the pattern reads as a judgment call, not an oversight: `AskAboutPokemon.tsx` (Passage Retrieval, via `/api/passages`) and `SimilarPokemon.tsx` (via `/api/similar`) are both plain `fetch` + local `useState` union (`idle`/`loading`/`error`/`success`), not Headless controllers — they call this app's own Next.js routes, not the Coveo Search API directly, so there's no engine state to subscribe to. `CompareProvider` is a third: plain React Context mirrored to `sessionStorage`, holding only Pokemon names, deliberately never search/facet/sort state.

**The subscription pattern**: `src/coveo/useControllerState.ts` is the one hand-rolled piece of infrastructure in the app. Every controller exposes `.state` + `.subscribe(listener)`, and this hook wraps that in React's `useSyncExternalStore` rather than the naive `subscribe()`-inside-`useEffect`-calling-`setState` pattern. Three non-obvious things it gets right: a bare `controller.subscribe` reference loses its `this` binding (called through the instance instead); Headless's `.state` getter builds a fresh object on every read, which trips React's "getSnapshot should be cached" check (fixed by caching the last snapshot in a `useRef`, refreshed only inside the subscribe callback); and the `subscribe` function passed to `useSyncExternalStore` needs a stable identity (`useCallback`), since Headless's `subscribe()` invokes the listener once synchronously on subscribe and an unstable identity causes an infinite resubscribe loop.

This exists because of a real bug, not speculative hardening: a controller's *constructor* can dispatch synchronously (`buildUrlManager`'s constructor synchronously dispatches `restoreSearchParameters`) — if that happens while a sibling component is mid-render, React throws "Cannot update a component while rendering a different component." This actually happened once `SearchBox` was duplicated into the persistent `AppHeader` layout alongside `/search`'s `SearchUrlSync`. The one deliberate exception is `SearchUrlSync.tsx` itself, which still uses raw `.subscribe()` + `useEffect` — correctly, since it drives `router.replace()` (a side effect, not React render state), so it was never in the vulnerable class this hook exists to fix.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in from the Coveo admin console
npm run dev
```

`.env.example` documents each variable, including the dual client auth mode (`NEXT_PUBLIC_COVEO_AUTH_MODE`, `NEXT_PUBLIC_COVEO_ACCESS_TOKEN`) and the two server-only keys (`COVEO_API_KEY`, `COVEO_ML_API_KEY`) — see `docs/adr/0006-split-api-key-for-content-preview.md` and `docs/adr/0007-dual-auth-mode-direct-vs-server-token.md` for why there are two of each. See `docs/coveo-source-spec.md` for the source/field configuration this frontend expects.

Without those env vars, the app builds and runs fine but shows a "Coveo isn't configured" banner instead of the search UI — required so `npm run build` / Vercel deploys succeed with no env vars set. For the detailed `src/` file map, see `AGENTS.md`.

## Testing

```bash
npm test              # Vitest unit tests
npm run test:coverage # Vitest with coverage (src/coveo/* + src/app/api/*/route.ts — see docs/standards-adoption.md #12)
npx playwright test   # e2e smoke tests
```

**Unit tests** (Vitest, `tests/unit/`, two projects — `node` for `src/coveo/*`/API-route tests, `jsdom` for component tests, see `vitest.config.mts`): cover `src/coveo/*` business logic (the result mapper, render-state derivation, error normalization, config resolution, sort/facet-range constants, type-color contrast checked against real WCAG math), all three server API routes (`/api/token`, `/api/passages`, `/api/similar`), and ~14 components with real branching logic — `Tabs`, `SearchUrlSync`, `CompareProvider`/`CompareTray`, `StatBar`, `Chip`, `Pager`, `PokemonMarkdown`, `Breadcrumb`, `TypeDefenses`, `EvolutionChain`, `DidYouMean`, `FacetSpeed`, `AutomaticFacets`, `SimilarPokemon`, `AskAboutPokemon`, `BrowseByType`. Purely presentational components (props straight to JSX, no branching) are deliberately untested — that's what e2e already exercises against a real org; see `docs/standards-adoption.md` #12/#12b for the full scoping rationale.

The coverage gate (80% statements/branches/functions/lines) is scoped to 8 named files, not a blanket repo-wide number: `src/coveo/mapPokemonResult.ts`, `applicationError.ts`, `searchRenderState.ts`, `config.ts`, `typeColors.ts`, plus `src/app/api/token/route.ts`, `passages/route.ts`, `similar/route.ts`.

**E2E tests** (Playwright, `tests/e2e/`, 5 specs): `unconfigured.spec.ts` — permanent smoke suite for the no-env-vars state, always runs; `search.spec.ts` — golden-path search + facets against the live org; `ask-about-pokemon.spec.ts` — Passage Retrieval golden path; `state-persistence.spec.ts` — Compare selection survives navigation, deep-linked facet URLs restore on a cold load; `a11y-motion.spec.ts` — reduced-motion override, focus-visible ring. The four configured-golden-path specs are `test.skip`-gated on `NEXT_PUBLIC_COVEO_ORGANIZATION_ID`, so they no-op without a live org configured.

## Engineering standards

This project selectively adopts a broader standards playbook (`docs/standards.md`, from a prior commerce Coveo project) rather than applying it wholesale — see `docs/standards-adoption.md` for what was adopted, adapted, or explicitly skipped and why, and `docs/adr/` for the architecture decisions behind this app's shape.

## Git hooks

`npm install` wires a pre-commit hook (lint + typecheck) via `scripts/install-hooks.mjs`. Run it once after cloning if hooks aren't active (`git config core.hooksPath` should show `.githooks`).

## CI

`.github/workflows/ci.yml` runs lint, typecheck, unit tests, and build on push/PR.

## Learn more

- [Coveo Headless SDK docs](https://docs.coveo.com/en/headless/latest/)
- [Next.js documentation](https://nextjs.org/docs)
