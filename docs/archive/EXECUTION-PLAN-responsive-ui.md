# Execution Plan — Full Responsive Pass (mobile + tablet)

Status: **complete.** Sections 1–7 shipped as written, with one addition
sections 1–7 didn't anticipate: a real horizontal-overflow bug found via
375px screenshot verification (§9) — `body`'s `flex flex-col` (in
`layout.tsx`) gave every page's root `{children}` an unconstrained
content-based min-width floor, so a page with an unwrapped-by-design
horizontal row (`BrowseByType`'s 18-icon carousel, meant to be clipped by
its own `overflow-hidden`) forced the *whole page* wider than the viewport
at 375px instead of just clipping that row. Fixed by wrapping `{children}`
in `layout.tsx` with a `min-w-0` div — a one-line, site-wide fix rather than
patching it per-page. No other deviations: the drawer slides from the right
as specified (no bottom-sheet fallback needed), `z-50`, Escape/backdrop-click
both close it, body-scroll-locked. See `docs/HANDOFF.md`'s twenty-fifth
session entry for full verification detail.

Scope: pure responsive UI/CSS and markup structure across the whole frontend.
No Headless controller, query, field, or facet-selection logic changes
anywhere — every item below is Tailwind classes, markup structure, or a new
presentational component with no Coveo calls of its own.

## 0. Why this pass, and the two UX decisions it's built on

The app was visually tuned against desktop only. The worst offender is
`/search` (`src/app/search/page.tsx:48`): `grid-cols-1 md:grid-cols-[200px_
1fr]` means that below the `md` (768px) breakpoint the facet rail
(`FacetRail` → `AutomaticFacets` + `FacetSpeed` + `FacetAbilities`, all
fully expanded) stacks as one long column **above** the results grid —
results end up scrolled well below the fold. Ecommerce sites (Amazon, Best
Buy, eBay) solve this with a "Filters" button that opens an off-canvas
panel, keeping results visible immediately below the search box.

Two decisions were confirmed with the user before writing this plan:

- **Mobile/tablet filter UX → off-canvas drawer**, not an in-place accordion
  stacked above results.
- **Facet accordion behavior → mobile/tablet only.** Desktop (`md`+) keeps
  today's always-expanded sticky sidebar exactly as-is.

Target viewports to verify against: **375×667** (mobile, iPhone SE/8),
**390×844** (mobile, iPhone 12/13), **768×1024** (tablet portrait),
**1024×768** (tablet landscape), **1440×900** (desktop, must stay
pixel-identical to today).

## 1. `/search` — off-canvas filter drawer (the primary fix)

- `src/app/search/page.tsx`: keep `FacetRail` as the always-visible sidebar
  but hide it below `md` (`hidden md:block`, on top of its existing
  `md:sticky md:top-10`). Add a new `FilterDrawer` (mobile/tablet only,
  `md:hidden`) that renders the *same* `<AutomaticFacets /><FacetSpeed />
  <FacetAbilities />` children — no duplicate facet logic, just a second
  render slot gated by breakpoint, consistent with how `FacetRail` already
  just wraps children with no controller logic of its own.
- New `src/components/FilterDrawer.tsx`: a "Filters" trigger button
  (rendered inline near `SearchSummaryBar`'s sort control, mobile/tablet
  only) that opens a full-height slide-in panel. Follow the existing modal
  pattern from `src/components/ConfigRequiredDialog.tsx` exactly — same
  `fixed inset-0` backdrop (`bg-black/40`), `onClick={onClose}` on the
  backdrop + `onClick={(e) => e.stopPropagation()}` on the panel,
  `role="dialog" aria-modal="true"`, Escape-to-close. This is the fourth
  legitimate "floating" element per DESIGN.md's Flat-Unless-Floating rule
  (joining the suggestion dropdown, the config modal, and `CompareTray`), so
  it's consistent with the existing design system, not a new pattern. Panel
  slides from the right by default (bottom-sheet is an acceptable fallback
  if screenshots show the right-side drawer feels cramped on 375px). `z-50`
  — above `CompareTray`'s `z-40` and the config modal's `z-20`, since an
  open filter drawer should be the topmost interaction.
- Trigger button shows an active-filter-count badge, sourced from the same
  `buildBreadcrumbManager` state `SearchSummaryBar.tsx` already subscribes
  to (`breadcrumbState.facetBreadcrumbs`/`numericFacetBreadcrumbs`/
  `automaticFacetBreadcrumbs` lengths) — reuse, don't re-derive; lift a
  small shared hook/util rather than duplicating the `buildBreadcrumbManager`
  call a second time on the page.
- Body scroll lock while the drawer is open (`overflow-hidden` on `<body>`
  via effect) — contained change, no other page's scroll behavior touched.

## 2. Collapsible facet sections, mobile/tablet only

- `src/components/Facet.tsx` and `src/components/AutomaticFacets.tsx`: both
  currently render a bare `<fieldset>` with an always-visible `<ul>` of
  values. Wrap each fieldset's value list in a `<details>`/`<summary>`
  pattern (native, no JS state needed) that is open by default on `md`+ and
  closed by default below `md`. Since `<details open>` can't take a
  responsive Tailwind variant directly, apply the collapsed/accordion
  treatment only to the copies of `AutomaticFacets`/`FacetSpeed`/
  `FacetAbilities` rendered *inside* `FilterDrawer`, leaving `FacetRail`'s
  desktop copy completely untouched — e.g. a `collapsible?: boolean` prop on
  `Facet`, defaulted false, passed true only from `FilterDrawer`'s render.
  Keep the mechanism minimal.

## 3. Result grid + summary bar spacing

- `src/components/ResultList.tsx`: `gap-4 sm:gap-6` instead of a flat
  `gap-6`, so 2-up cards at 320–375px aren't cramped. Grid columns
  (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5`) are already
  correctly responsive — no change needed there.
- `src/components/SearchSummaryBar.tsx`: add the `FilterDrawer` trigger
  button into its existing `flex flex-wrap items-center justify-between`
  row (mobile/tablet only), next to the sort `<select>` — no restructuring
  of the bar's existing controller wiring.
- `src/components/Pager.tsx`: verify/bump touch target sizing (padding) on
  its buttons for mobile — currently plain `flex items-center justify-
  center gap-2 text-sm`; confirm via screenshot whether buttons need bigger
  hit areas.

## 4. Home page (`src/app/page.tsx`)

- Reduce vertical padding on small screens: `py-12 sm:py-16 md:py-24`
  instead of the flat `py-24`.
- `BrowseByType`'s Embla carousel is already a correct mobile pattern
  (drag/swipe + arrow buttons) — verify only; hide the arrow buttons below
  `sm` only if screenshots show them crowding the heading row at 375px.

## 5. PDP (`src/app/pokemon/[name]/page.tsx` + components)

- `PokemonHero`'s `grid-cols-1 sm:grid-cols-[minmax(0,360px)_1fr]` already
  stacks correctly below `sm` — verify via screenshot only.
- `src/components/ui/Tabs.tsx`: add `overflow-x-auto` +
  `flex-nowrap`/`whitespace-nowrap` safety to the `role="tablist"` row so
  the three tab labels never wrap awkwardly at the narrowest widths —
  currently unbounded `flex gap-1`.
- `src/components/SimilarPokemon.tsx`: cards are fixed `w-40` inside an
  Embla carousel — already the correct mobile pattern (same as
  `BrowseByType`), verify only.
- `src/components/AskAboutPokemon.tsx`: verify the `flex gap-2` input+button
  row (line ~103) doesn't overflow at 375px; add `flex-col sm:flex-row` if
  the button gets squeezed.

## 6. Compare page (`src/app/compare/page.tsx`)

- Table already uses `overflow-x-auto` + `min-w-[480px]` — correct existing
  mobile pattern. Enhance with a sticky first column (`sticky left-0
  bg-surface` on the row-label `<th>` cells) so Pokemon names/stat labels
  stay visible while scrolling horizontally — a real industry-standard
  comparison-table pattern, additive CSS-only change to existing `<th>`
  elements.
- `src/components/compare/CompareTray.tsx`: already `flex flex-wrap`,
  verify only at 375px with 3+ selected Pokemon.

## 7. Header (`src/components/AppHeader.tsx`)

- On `/pokemon/[name]`, verify the wordmark + `max-w-xs` search box don't
  overlap/squeeze at 375px. If they do, shrink the box's max-width on the
  smallest breakpoint rather than letting it wrap.

## 8. Explicitly out of scope

- No Headless controller, query, field, or facet-selection logic changes.
- No visual redesign of anything that already reads correctly on desktop.
- No new ADR — this doesn't reverse any prior architectural decision
  (ADR-0011's Automatic Facet Generation, ADR-0009 compare storage, etc.),
  it's responsive presentation only.

## 9. Verification

1. `npm run lint && npm run typecheck` — no logic touched, but confirm clean.
2. `npm test` — confirm the existing test suite still passes unchanged (no
   test asserts on the specific Tailwind classes being touched).
3. Start `next dev` and take real browser screenshots at each target
   viewport (375×667, 390×844, 768×1024, 1024×768, 1440×900) for: home,
   `/search` with results + drawer closed, `/search` with drawer open, a
   PDP, `/compare` with 2–3 Pokemon. Confirm:
   - Results are visible without scrolling past a full facet stack on
     mobile.
   - Filter drawer opens/closes, traps scroll, Escape/backdrop-click both
     close it, and desktop (1440) is pixel-identical to before the change.
   - No horizontal overflow/clipping anywhere at 375px.
4. Manually click through the drawer's accordion facets, apply a filter,
   and confirm the breadcrumb chips in `SearchSummaryBar` and the drawer's
   own badge count update correctly.

## 10. Closeout

When shipped: update this file's Status header to **complete**, move it to
`docs/archive/`, add an entry to `docs/README.md`'s "Completed execution
plans" list, and add a `docs/HANDOFF.md` session entry per `CLAUDE.md`'s
process rule (org config/auth wasn't touched, but this is app-visible
behavior, so it qualifies).
