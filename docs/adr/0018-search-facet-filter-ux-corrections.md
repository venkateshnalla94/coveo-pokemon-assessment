# 0018: Search-page facet/filter UX corrections — type-icon swatches, facet order, and a stale `aq` filter fix

Status: Accepted

## Context

Two live-review passes on `/search` (twenty-first session, then twenty-third) found the facet rail and filter-clearing UX weren't matching the rest of the type-driven design system (ADR-0013) or the `aq`-based category filter mechanism (ADR-0011):

- **Flat color swatches, wrong facet order.** `AutomaticFacets.tsx`'s Type/Weaknesses/Resistances values used a flat CSS-colored circle + checkmark, while the home page's `BrowseByType` and every result card already used real type-icon art (ADR-0013's type-driven system). The facet rail's DOM order also put `FacetSpeed`/`FacetAbilities` ahead of the automatic facets, so Type — the highest-traffic facet — wasn't first.
- **A stale `aq` filter with no way to clear it.** Clicking a `BrowseByType` pill pre-filters `/search` via a raw `aq` expression (`@pokemontype=="Fire"`, not a facet — see ADR-0011, since Automatic Facet Generation has no stable `facetId`/URL param `aq` doesn't depend on). Typing a brand-new query afterward ANDed the new query with the stale `aq` filter forever (`SearchBox.tsx`'s in-place `submit()`/`selectSuggestion()` only own `state.query.q`, not the `advancedSearchQueries` slice `aq` lives in), returning zero results for an unrelated search and starving RGA of results. `SearchSummaryBar.tsx`'s breadcrumb row never surfaced `aq` at all — no chip, and "Clear all" only touched facets — so before this fix there was no UI affordance to remove a category filter once applied, not even via "Clear all."

## Decision

**Facet visuals and order** (twenty-first session): `TypeSwatch.tsx` replaced the flat color-circle + checkmark with the same real type-icon SVG art `BrowseByType` uses (`public/art/types/`) — each icon file is already a self-contained colored badge, so the checkmark was dropped in favor of a selected-state ring, still always paired with the type name as text (never color/icon alone). `AutomaticFacets` was moved to the top of `FacetRail` in `src/app/search/page.tsx`, ahead of `FacetSpeed`/`FacetAbilities`, so Type leads (then Generation, then whichever other fields the generator selects), with the two facets ineligible for Automatic Facet Generation following after.

**Stale `aq` fix** (twenty-third session): new `src/coveo/advancedSearchQuery.ts` (`clearBrowseByTypeFilter(engine)`, dispatches `updateAdvancedSearchQueries({ aq: "" })`) and `parseTypeFromAq` in `src/coveo/browseByTypeUrl.ts` (the display-side inverse of the existing `buildTypeSearchHref`). `SearchBox.tsx`'s in-place `submit()`/`selectSuggestion()` now call `clearBrowseByTypeFilter` before dispatching a new query. `SearchSummaryBar.tsx` now subscribes directly to `engine.state.advancedSearchQueries?.aq` (no Headless controller owns that slice), renders a `"Type: <value>" ×` breadcrumb chip when it's set, and "Clear all" clears `aq` in the same dispatch as `deselectAll()` rather than firing two requests.

Neither change reverses ADR-0011 or ADR-0013 — the `aq`-not-a-facet mechanism and the type-icon system are both unchanged; these fix a lifecycle gap (aq never got cleared) and extend an existing visual pattern (icons) to a component that hadn't picked it up yet.

## Consequences

- A category-filtered `/search?aq=...` visit followed by a new free-text query no longer silently ANDs the two together — the fix is testable directly: land on a `BrowseByType` link, type an unrelated query, confirm real results and an RGA answer.
- `docs/architecture/02-search-page.md` described the pre-this-ADR facet order and swatch treatment and needed updating to match (tracked in the same cleanup pass this ADR was written for).
- No Coveo org/index/query change — both fixes are client-side state/rendering only.
