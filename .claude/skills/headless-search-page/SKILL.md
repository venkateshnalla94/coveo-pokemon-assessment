---
name: headless-search-page
description: How to build and extend the Next.js search page using the Coveo Headless SDK — engine setup, facets, result rendering, and the typeahead vs actual-search controller split. Use when adding or modifying anything under src/.
---

# Headless search page

## Before writing any Headless code

Check the [Coveo Headless SDK docs](https://docs.coveo.com/en/headless/latest/) and its TypeScript types for an existing controller before writing custom request/response handling. The SDK is controller-driven — nearly every UI concern (search box, facets, pagination, breadcrumbs, result list, query suggest) has a dedicated `build*` function that manages its own state slice on the engine. Hand-rolling a fetch call instead of using a controller is almost always wrong here.

## Typeahead vs. actual search — one controller, two states

Verified against the installed `@coveo/headless@3.55.2` types (`controllers/core/search-box/headless-core-search-box.d.ts`) — there is **no standalone `buildQuerySuggest` controller** in this SDK version, despite that name showing up in older Headless examples. Typeahead is built into `SearchBox` itself:

| Concern | Where it lives on `SearchBox` | When it fires |
|---|---|---|
| Suggestions while typing | `state.suggestions: Suggestion[]`, via `updateText()` which auto-fetches suggestions | On keystroke, before submit |
| Query submission | `submit()` | On submit (Enter / search icon) |
| Results themselves | separate `buildResultList` controller, reflects state after `submit()` | After a search executes |

Render `state.suggestions` as the dropdown and keep it visually distinct from the `ResultList` results grid, but both come from the same `SearchBox` controller instance plus `ResultList` — don't go looking for a second query-suggest controller to import.

## Structure

- `src/coveo/config.ts` — `resolveCoveoConfig()`, the single reader of `NEXT_PUBLIC_COVEO_ORGANIZATION_ID`/`NEXT_PUBLIC_COVEO_ACCESS_TOKEN`. Plain module (no `"use client"`) so Server Components can call `isCoveoConfigured()` too — see docs/standards-adoption.md #2.
- `src/coveo/engine.ts` — `"use client"`, one `buildSearchEngine` call, reads config via `resolveCoveoConfig()`. Throws if unconfigured; callers must check `isCoveoConfigured()` first and render `CoveoConfigBanner` instead of calling `getSearchEngine()`.
- `src/coveo/mapPokemonResult.ts` — the mapper boundary: the **only** place that reads `result.raw[POKEMON_FIELDS.*]`. Components render a `PokemonItem`, never a raw Headless `Result`. See docs/standards-adoption.md #10 — if this rule is violated (a component reaches into `.raw` directly), that's a regression to fix, not a style nit.
- `src/coveo/applicationError.ts` — `toApplicationError()` normalizes Headless's `engine.state.search.error` (not exposed on `ResultListState`/`SearchStatusState`, which only have `hasError: boolean`) into a closed `ApplicationErrorCode` set.
- `src/coveo/searchRenderState.ts` — `deriveSearchRenderState()` combines a `ResultListState` + engine into the discriminated union `{status: "loading"|"error"|"empty"|"success"}` (docs/standards-adoption.md #11). Any new component that lists/renders search results should use this rather than re-deriving `isLoading`/`hasResults` checks inline.
- `src/components/SearchBox.tsx` — search input + typeahead dropdown.
- `src/components/FacetType.tsx`, `FacetGeneration.tsx` — thin wrappers around `buildFacet`, field names sourced from `docs/coveo-source-spec.md`.
- `src/components/ResultList.tsx` — subscribes to `buildResultList`, switches on `deriveSearchRenderState()`, renders `PokemonItem`s from the mapper.
- `src/app/pokemon/[name]/page.tsx` (Advanced tier) — Next.js dynamic route; resolves a single Pokemon via a targeted search query (Headless has no "fetch by id" API), same mapper/render-state pattern as `ResultList`.

## Field-name coupling

Facet code and `mapPokemonResult.ts` must use the exact field names configured in the Coveo source (see `pokemon-source-setup` skill). If a field is renamed on the source side, update `src/coveo/fields.ts` (and only that file, downstream of the mapper) in the same change — don't let the two drift.

## Until org access exists

The engine will fail to connect / return zero results. That's expected — build and verify the component tree renders (empty states, facet shells, search box) without runtime errors, and leave the actual query-return verification for once a real org/source exists.

## Testing conventions

Tests live under `tests/`, not colocated with source, and `tests/unit/` mirrors `src/`'s directory structure: `src/coveo/mapPokemonResult.ts` pairs with `tests/unit/coveo/mapPokemonResult.test.ts`. `tests/e2e/*.spec.ts` (Playwright) is separate so each tool's runner doesn't pick up the other's files (`vitest.config.mts` / `playwright.config.ts` `testDir`). Any new file added to `src/coveo/` needs a mirrored test under `tests/unit/coveo/` — `.githooks/pre-commit` runs `scripts/check-test-coverage.mjs`, which blocks a commit touching that directory without one (exemptions are `engine.ts` and `fields.ts`, listed with reasons in the script; add a new testable root to `TESTABLE_ROOTS` in that script if `src/lib/` or similar gets real logic later). UI components/routes are covered by the Playwright smoke suite instead, not a unit-test requirement — but if that changes, their tests would go in `tests/unit/components/` mirroring `src/components/`, same pattern.
