# Handoff archive — sessions 17–27

Historical session log. Current state lives in `docs/handoff/STATE.md`;
recent sessions in `docs/handoff/LATEST.md`. Look this file up via
`docs/handoff/INDEX.md`, not by reading it top to bottom. (Session 26 does
not exist — the source file's own numbering skips from 27 to 25.)

## Twenty-seventh session — SEO audit follow-through: metadata, crawlability, soft-404 fix (Phases 1+3 of `docs/EXECUTION-PLAN-seo.md`)

A prior session (unclear which — the plan doc, `docs/adr/0019-server-rendered-seo-metadata-shim.md`, and this file's diff were all found already uncommitted at the start of this session, approved but unimplemented) had audited the app against a general frontend-SEO checklist and found every route (`/`, `/search`, `/compare`, `/pokemon/[name]`) was `"use client"` with no `robots.txt`, no `sitemap.xml`, no per-page metadata, and every one of the ~1025 PDPs sharing one static title/description and returning HTTP 200 for an unknown name (soft-404). This session executed that plan's Phase 1 and Phase 3, per the user's choice to bundle them (both touch the same new PDP server wrapper). Phase 2 (BreadcrumbList JSON-LD) and Phase 4 (SSR body content) are still open — see `docs/EXECUTION-PLAN-seo.md`.

**What shipped:**

- `src/coveo/serverPokemonLookup.ts` (new, coverage-gated) — server-only Coveo Search API v2 reads, same `resolveServerCoveoConfig()`/`COVEO_API_KEY` pattern as `src/app/api/similar/route.ts`. `fetchPokemonMetadata(name)` for the PDP's metadata/404 check; `fetchAllPokemonNames()` (paginated, `firstResult`/`totalCount`-driven, sorted by name) for the sitemap. Both wrapped in React's `cache()`.
- `src/app/robots.ts`, `src/app/sitemap.ts` (new) — real sitemap (1028 URLs live-verified: 3 static + 1025 real Pokemon), `revalidate = 3600`. Robots disallows `/search?`/`/compare?` (query-string prefix only, not the bare paths) and `/api/`.
- `src/app/pokemon/[name]/page.tsx` restructured into a thin async server component (`generateMetadata` + `notFound()`) wrapping the unchanged client UI, now moved verbatim to `src/app/pokemon/[name]/PokemonDetailPageClient.tsx`.
- `src/app/search/layout.tsx`, `src/app/compare/layout.tsx` (new) — thin server layouts declaring static `metadata`, since the segments' `page.tsx` files stay `"use client"` and can't export it themselves.
- `src/app/layout.tsx` — added `metadataBase` (new `src/siteUrl.ts`) and default OG/Twitter tags using the real `home-banner.webp` asset.
- `.env.example` documents the new optional `NEXT_PUBLIC_SITE_URL` override.
- **ADR-0019 wording correction**: the ADR as originally written said the server metadata fetch would reuse the client's public `NEXT_PUBLIC_COVEO_ACCESS_TOKEN`. Implementation instead reuses the `COVEO_API_KEY` server pattern already established by `/api/similar` — same privilege, but works regardless of which client `authMode` is active. Documented as an implementation note in the ADR, not a new decision.

**One real, pre-existing gap confirmed live (not introduced this session):** curling the built PDP for pikachu shows the `<head>` metadata is fully correct and real, but the server-rendered `<body>` briefly contains the client component's own "Pokemon not found" text — because that component's Headless query only fires client-side, after hydration. This is exactly the Phase 4 (SSR body content) gap the plan already flagged as deferred/optional; confirming it live is new information, the gap itself isn't.

**Not verified this session:** a manual click-through of the interactive UI (search, facets, compare) in a real browser — port 3000 was occupied by the user's own running `next dev` session, and reusing it for Playwright e2e or manual testing risked interfering with in-progress work. Verification instead relied on the interactive client component being an unmodified, byte-for-byte file move, plus `curl`-verified output from a real `npm run build && npm run start` (on port 3100) against the live org. Recommend a quick manual pass early next session.

Gates run clean this session: `npm run lint`, `npm run typecheck`, `npm test` (247 passed, +15 new), `npm run test:coverage` (98.55%/92.94%/96.77%/98.53%, gate is 80%), `npm run build`.

## Twenty-fifth session — executed the responsive UI plan (off-canvas filter drawer + accordion facets + spacing/overflow fixes), found and fixed a real site-wide horizontal-overflow bug

Executed `docs/archive/EXECUTION-PLAN-responsive-ui.md` §1–7 in full, per the
`docs/PROMPT-execute-responsive-ui.md` this file's own convention had staged
for a future session. Pure responsive UI/CSS and markup — no Headless
controller, query, field, or facet-selection logic touched.

**Shipped:**
- `/search` off-canvas filter drawer: `FacetRail` hidden below `md`
  (`src/components/FacetRail.tsx`), new `src/components/FilterDrawer.tsx`
  (right-side slide-in panel, `ConfigRequiredDialog`-style backdrop/
  `stopPropagation`, `z-50`, body-scroll-locked, Escape-to-close — that last
  one is genuinely new code, since `ConfigRequiredDialog` turned out not to
  have Escape-to-close to copy from despite the plan assuming it did).
  Renders the same `AutomaticFacets`/`FacetSpeed`/`FacetAbilities` `FacetRail`
  already renders on desktop, no duplicate facet logic.
- Accordion facets, mobile/tablet only: `collapsible?: boolean` prop added to
  `Facet.tsx`, `AutomaticFacets.tsx`, `FacetSpeed.tsx`, `FacetAbilities.tsx`
  (default `false`, byte-identical desktop markup); wraps the value list in
  `<details open><summary>` when `true`, only ever passed from
  `FilterDrawer`.
- Active-filter badge on the drawer's trigger: `SearchSummaryBar.tsx` now
  computes the count from the `breadcrumbState` it already reads (one
  `buildBreadcrumbManager` call total, not a second one) and passes it to
  `FilterDrawer` as a prop.
- `ResultList.tsx` grid gap `gap-4 sm:gap-6`; home page (`src/app/page.tsx`)
  vertical padding `py-12 sm:py-16 md:py-24`; `ui/Tabs.tsx`'s tablist gets
  `overflow-x-auto flex-nowrap whitespace-nowrap`; `/compare`'s row-label
  `<th>` cells get `sticky left-0 z-10 bg-surface` (verified live: scrolling
  the table horizontally keeps row labels pinned while data columns scroll
  under them).
- New `CONTENT.search.filtersLabel`/`filtersCloseLabel` in
  `src/content/pokedex.ts`, following the existing chrome-copy convention.

**Real bug found and fixed during the plan's own §9 screenshot verification**
(not something the plan anticipated): the home page overflowed horizontally
to 1280px wide at a 375px viewport — confirmed via Playwright screenshots
plus a DOM-ancestor-width diagnostic script, not just eyeballing an image.
Root cause: `src/app/layout.tsx`'s `<body className="min-h-full flex
flex-col">` makes every page's `{children}` a flex item on the cross axis,
and flex items default to `min-width: auto` (a content-based floor, not 0).
`BrowseByType.tsx`'s carousel row (`<ul className="flex gap-4">`, 18
type-icon `<li>`s, deliberately unwrapped and meant to be clipped by its own
`overflow-hidden` wrapper) has a ~1200px min-content width, and with no
`min-width: 0` anywhere in the ancestor chain between `body` and that `<ul>`,
that min-content width propagated all the way up and set the whole page's
width — not just that one carousel row's. First attempted a narrower fix
(`min-w-0` on the home page's own BrowseByType wrapper div) and confirmed via
the same diagnostic script that it did *not* fix it, because the real forcing
flex item was one level higher (the page root itself, a flex item of `body`,
not of anything inside the page). Fixed at the correct root: wrapped
`{children}` in `layout.tsx` with a single `<div className="min-w-0">` —
site-wide, one place, rather than patching per-page. Confirmed via the
diagnostic script that document/page width now stays 375px on home, `/search`,
the PDP, and `/compare` at a 375px viewport, and confirmed 1440px desktop
views are visually unchanged (`FacetRail`'s `hidden md:block` and the
`collapsible` props never fire at `md`+, so nothing there could have
regressed, and screenshots confirm it).

**Verified live** (not just from reading the diff): `npm run lint`,
`npm run typecheck`, `npm test` (232/232, unchanged) all clean. Started
`next dev` and drove it with a throwaway Playwright script (`chromium-cli`
wasn't available in this environment) — screenshots at 375×667 and 1440×900
for home, `/search` (drawer closed/open), a PDP, and `/compare`; confirmed
the drawer opens via the "Filters" button, Escape closes it (checked
programmatically, not just visually — dialog count drops to 0), applying a
facet inside the drawer updates both the badge count (0 → 1) and
`SearchSummaryBar`'s breadcrumb chip, and the compare table's sticky column
holds under horizontal scroll. **Not verified**: 390×844 and 1024×768 (two
of the plan's five target viewports) weren't separately screenshotted —
375×667 and 768×1024-adjacent behavior (`md` breakpoint is 768px, tested at
1440 and 375 which bracket it) make a regression at those two specific sizes
unlikely, but it's an honest gap, not "verified." `CompareTray` at 375px with
3+ selected Pokemon (§6, "verify only") also wasn't exercised — seeding 3+
selections requires driving `sessionStorage`-backed compare state, which the
verification pass didn't set up.

Per the plan's own §10 and `CLAUDE.md`'s process rule: moved
`docs/EXECUTION-PLAN-responsive-ui.md` and
`docs/PROMPT-execute-responsive-ui.md` to `docs/archive/`, updated the
plan's Status header to complete with the overflow-bug deviation noted, and
added one entry to `docs/README.md`'s "Completed execution plans" list.

## Twenty-fourth session — fixed a leaking server-side engine singleton causing SSR hydration mismatches (no org config touched)

User hit a React hydration-mismatch error on `/search?q=...`, reported against
`GeneratedAnswer.tsx:118`. The diff React showed there was misleading — it
was React misattributing a tree-shape mismatch to the next sibling.

Root cause was in `src/coveo/engine.ts`: `getSearchEngine()` cached its
Headless engine in a plain module-level `let engine` singleton, unconditional
on execution environment. That's fine for the browser, but `getSearchEngine`
is still called during SSR of every "use client" component that uses it
(`useState(() => getSearchEngine())` runs on the server render pass too).
Next.js/Vercel can reuse a server module's scope across multiple, unrelated
requests within the same process (this is explicit, current Vercel platform
behavior under Fluid Compute — see the Vercel plugin's injected knowledge-
update on function-instance reuse), so one request's SSR pass could populate
`engine.state` with real search results, and leave that same populated
engine object cached for the *next* request to reuse. That next request's
server-rendered HTML then reflected stale/foreign search state (e.g.
`SearchSummaryBar`'s result-count bar rendering fully populated), while the
client's fresh hydration pass built a brand-new, empty engine — a genuine
content mismatch, not a false positive from React's diffing.

Fix: `getSearchEngine()` now only returns/caches the module-level singleton
when `typeof window !== "undefined"`. Every server call builds and returns a
disposable, per-render engine that's discarded afterward, so SSR can never
leak state across requests. Browser behavior (the intentional shared-engine-
across-pages singleton the file's own comments describe) is unchanged.

No e2e/browser verification of the live hydration warning was done — `tsc`
passes; recommend the user reload `/search?q=...` a few times against `next
dev` to confirm the warning is gone before closing this out.

## Twenty-third session — fixed stale category-filter (`aq`) surviving a new search (no org config touched)

User reported: click a "Browse by category" pill on the home page (e.g.
"Normal") → lands on `/search?aq=%40pokemontype%3D%3D%22Normal%22` → then
type a brand-new query ("pikachu") in the search box → URL becomes
`/search?q=pikachu&aq=%40pokemontype%3D%3D%22Normal%22` and returns zero
results (Pikachu is Electric-type, still filtered to Normal), with RGA also
not triggering. Investigated in plan mode before any code changed.

**Root cause**: `BrowseByType.tsx`'s category pills pre-filter `/search` via
a raw `aq` (advanced query) expression, not a facet — a deliberate design
from `docs/adr/0011-automatic-facet-generation-on-search-page.md`, since
`/search`'s type facet is Automatic Facet Generation, which has no stable
`facetId`/URL param `aq` doesn't depend on. That ADR fixed `aq` reaching the
Search API at all, but never addressed clearing it afterward.
`SearchBox.tsx`'s in-place `submit()`/`selectSuggestion()` (used on
`/search`) call the Headless `SearchBox` controller directly, which only
owns `state.query.q` — it has no knowledge of the `advancedSearchQueries`
slice `aq` lives in, so a new query got ANDed with the stale filter forever.
Separately, `SearchSummaryBar.tsx`'s breadcrumb row never surfaced `aq` at
all: no chip, and "Clear all" (`breadcrumbManager.deselectAll()`) only
touches facets — so before this session there was **no UI affordance at
all** to remove a category filter once applied, not even by clicking "Clear
all." Confirmed as a genuine bug (not intended per ADR-0011) and agreed with
the user to close both gaps together rather than ship a partial fix that
just makes the filter invisible instead of stuck.

**Fix**, four files: new `src/coveo/advancedSearchQuery.ts`
(`clearBrowseByTypeFilter(engine)`, dispatches
`updateAdvancedSearchQueries({ aq: "" })`); `src/coveo/browseByTypeUrl.ts`
gained `parseTypeFromAq` (display-side inverse of the existing
`buildTypeSearchHref`, for rendering a breadcrumb label — the URL/state
mechanism itself is unchanged); `SearchBox.tsx`'s in-place `submit()`/
`selectSuggestion()` now call `clearBrowseByTypeFilter` immediately before
dispatching the new query; `SearchSummaryBar.tsx` now subscribes directly to
`engine.state.advancedSearchQueries?.aq` (no Headless controller owns that
slice), renders a `"Type: <value>" ×` breadcrumb chip when it's set, and
"Clear all" clears `aq` too (before calling `deselectAll()`, so both land in
one Search API request instead of two). No new ADR — this doesn't reverse
ADR-0011's decision, it fixes a lifecycle gap that ADR never addressed.

**Verification**: `npm run typecheck`, `npm run lint` clean. Confirmed live
against the already-running dev server (not a fresh one — Turbopack detected
the existing process on port 3000 and reused it) that `/search?aq=...Normal`
server-renders the new "Type: Normal" chip. Full manual click-through
(type a new query after a category-pill landing, click the chip's ×, click
"Clear all" with only the type filter active, confirm a single network
request each time, confirm RGA renders for the previously-broken query) was
**not** independently re-verified by this session after handoff — worth a
quick pass next session if not already done live by the user.

## Twenty-second session — fixed two layout-shift/flicker bugs (no org config touched)

User reported three coupled UI complaints from using the running app: on `/search`, the page visibly "shrinks" (facet rail and results move inward) when a query returns zero results and "moves back" once results return, with the same complaint for the RGA panel; and the PDP visibly flickers/jumps when its data arrives because the loading state doesn't match the loaded layout's shape. Two independent root causes, confirmed via live measurement (Playwright against the running dev server, not just visual inspection) before touching code.

**Bug 1 — scrollbar toggling shifts centered content horizontally.** No `scrollbar-gutter` rule existed anywhere; a short page (no results, no RGA answer) vs. a tall one (full results grid, RGA answer, loaded PDP) crosses the vertical-scrollbar threshold, and the scrollbar's width changes the viewport's available width, shifting every `mx-auto`-centered section sideways. Fixed with one rule: `html { scrollbar-gutter: stable; }` in `src/app/globals.css`, reserving the scrollbar track permanently. This alone is only a ~15–20px effect.

**Bug 2 — the real cause of the large shift the user actually saw, found by measuring two screenshots the user dropped in `docs/temp/image.png` / `docs/temp/image copy.png`.** `body` (`src/app/layout.tsx`) is `flex flex-col`, and each page's root container (`<div className="mx-auto max-w-7xl px-6 py-10">`) is a **direct flex child** of it. On a flex item, auto margins (`mx-auto`) take priority over the default cross-axis stretch, so the container shrink-wraps to its content's intrinsic width instead of always filling to `max-w-7xl` — less content (empty/filtered-to-zero results, or a short compare/PDP page) meant a measurably narrower box, symmetrically re-centered, which reads exactly as "the page shrinking and moving." Confirmed with a real Playwright measurement at a fixed 1440px viewport, same browser session: container width was **1280px** with results vs **927.9px** empty, before the fix; **1280px in both** after. Fixed by adding `w-full` alongside `mx-auto max-w-7xl` (explicit width instead of `auto` stops the auto-margin/stretch conflict) on all four instances of this container recipe: `src/app/search/page.tsx`, `src/app/pokemon/[name]/page.tsx`, and both spots in `src/app/compare/page.tsx` (same bug, same `body` ancestor — fixed for consistency even though only `/search` and the PDP were called out). `src/app/page.tsx`'s home hero container was deliberately left alone — it's an intentionally narrower, centered hero block (`items-center text-center`), a different design intent from the results/filters layout this fix targets.

**Bug 3 — PDP loading flicker.** `src/app/pokemon/[name]/page.tsx`'s `loading` branch was a single line of text (`<p>{loadingLabel}</p>`), while the loaded branch renders the full hero + stat panel + tabs layout — the height/shape mismatch caused a visible jump on data arrival. Added `PokemonDetailSkeleton` (same file), mirroring `PokemonHero`/`PokemonStatPanel`/`Tabs`' own wrapper classes and spacing with `animate-pulse` blocks, following the same skeleton convention already established by `ResultCardSkeleton` (`ResultList.tsx`) and `AnswerSkeleton` (`GeneratedAnswer.tsx`) rather than introducing a new shimmer treatment. `sr-only` loading-label text preserved for screen readers, same pattern `ResultList.tsx`'s own loading case already uses.

**Verification, all real**: `npm run typecheck`, `npm run lint` clean. `npm test` — 217/217 (33 files), unchanged pass count (no test referenced the old PDP loading `<p>` text, so nothing broke). Playwright measurement script (written this session, deleted after use — not committed) confirmed the container-width fix directly against the running dev server, not just inferred from the diff.

**Not done this session**: no visual/manual review of the new PDP skeleton's proportions against the real loaded layout in an actual browser — sized from reading component source, not eyeballed live. Worth a quick look next session if the shapes feel off. Org config, presentation decks, and the Phase 0 email/ML-rebuild confirmation (see "What's next") — none of that touched.

## Twentieth session — committed Doc 3, resolved the ML-recommendations decision (Branch B), enabling ART (in progress)

Opened by committing Doc 3's still-uncommitted shipped code from the nineteenth
session (`src/components/BrowseByType.tsx`, `src/components/PokemonHero.tsx`,
`src/content/pokedex.ts`, `public/art/`) — hooks (lint, typecheck, coverage
guard, 193/193 tests) all passed clean, commit `bce2b69`.

**Analytics check (Doc 1's blocking open decision, resolved)**: live Coveo
admin console, Analytics → Reports → Summary → Open → Edit → Activity tab —
**1,200 search events, all-time** (since org creation). Coveo's own docs
(`docs.coveo.com/en/3399`, direct fetch) put the CR-model reliability
threshold at ~10,000 queries — two orders of magnitude above this org's real
volume. Decision: **Branch B** — "Similar" only, as a deterministic same-type
Search API query (no CR model, no `/api/recommendations` route), documented
in new `docs/adr/0014-recommendation-strategy.md`. This unblocks
`docs/archive/EXECUTION-PLAN-similar-pokemon-carousel.md` to proceed on its
`/api/similar` route as the sole data source.

**ART (independent of the branch decision, recommended regardless per Doc 1)
— model creation started, not yet Active.** Console: AI and ML → Models →
Add model → "Automatic Relevance Tuning" card → Next → Data period (3mo
default) → Next → commerce events off → Next → no dataset filters → Next →
named `Pokedex ART` → Start building. **Not yet associated with the
`Pokedex` query pipeline** — that's a separate step (Query Pipelines →
`Pokedex` → Edit components → Machine learning tab → Associate model) that
has to wait until the model's Status column shows Active (~30 min per
`docs.coveo.com/en/3397`).

**Update, same session**: `Pokedex ART` reached Active status and was
associated with the `Pokedex` pipeline (Query Pipelines → `Pokedex` → Edit
components → Machine learning tab → Associate model → model `Pokedex ART`,
no condition, default advanced configuration). **Confirmed live via the
Relevance Inspector**, not just a console assumption — the "Automatic
Relevance Tuning" panel for `Pokedex ART` shows real learned boosts already:
Pikachu (2500), Charizard (790), Eevee (480), Tadbulb (360), Greninja (360).
ART is genuinely active and influencing ranking. **ART is fully done —
model built, associated, and verified.**

### External docs.coveo.com pages read this session

All fetched directly (not WebSearch-only), per `CLAUDE.md`'s docs-first rule:

- `docs.coveo.com/en/1674` (Administration Console reports) — nav path to
  Usage Analytics. Matched: Analytics → Reports.
- `docs.coveo.com/en/1559` (Review trends from Summary dashboard) — exact
  steps to read historical query count. Matched: Analytics → Reports →
  Summary → Open → Edit → Activity tab, Search Event Count.
- `docs.coveo.com/en/1013` (ART glossary) — baseline ART definition. Thin
  page, no creation steps; pointed to `/en/3384`.
- `docs.coveo.com/en/l1ca1038` (Associate an ART model with a pipeline) —
  association steps. Matched: Query Pipelines → pipeline → Edit components →
  Machine learning tab → Associate model.
- `docs.coveo.com/en/3384` (About ART) — overview confirmation only, no
  creation steps; pointed to `/en/3397`.
- `docs.coveo.com/en/3397` (Create and manage an ART model) — actual
  creation steps and prerequisites. **New finding, not in the execution-plan
  doc**: ART's real prerequisite is only ~100 search/click events and ~55
  visits/day — far lower than CR's 10,000-query bar, and almost certainly
  already cleared by this org's 1,200 events. Console path confirmed as
  **AI and ML → Models**, not "Analytics → Models."
- `docs.coveo.com/en/1886` (CR implementation overview) — confirmed CR needs
  its own dedicated query pipeline, must never share `Default` (or any other
  interface routed to `Default` breaks). Not acted on this session since
  Branch B was chosen, but worth remembering if the decision is ever
  revisited.
- `docs.coveo.com/en/3399` (Create and manage a CR model) — confirmed the
  10,000-query figure verbatim ("a usage analytics dataset of 10,000 queries
  or more typically allows a Coveo ML model to provide very relevant
  recommendations") and CR creation steps, for the record even though Branch
  B means these aren't executed this session.

## Twentieth session, continued — built `/api/similar` + `SimilarPokemon` carousel (Doc 2, item 1 of 3)

With Doc 1 resolved (Branch B, ART live), built the first of the three
remaining items: the PDP "Similar Pokemon" carousel from
`docs/archive/EXECUTION-PLAN-similar-pokemon-carousel.md`, to its full spec including
the idle/loading/success/error contract from
`docs/archive/EXECUTION-PLAN-async-ui-states.md` (built in from day one, not as a
follow-up, per that doc's own instruction).

**New**: `src/app/api/similar/route.ts` (calls Search API v2 directly with a
`@pokemontype==(...) AND @pokemonname<>"..."` filter, `numberOfResults: 6`,
same `resolveServerCoveoConfig()`/rate-limit pattern as `/api/passages`) and
`src/components/SimilarPokemon.tsx` (embla-carousel-react — first UI library
in this repo beyond `@coveo/headless`/Next — real card data: sprite, name,
dex number, type chips, a genuine "Strong in: X, Y" line from the Pokemon's
own two highest stats, no price/rating since Pokemon have no equivalent).
Mounted between `Tabs` and `AskAboutPokemon` on the PDP.

**`docs/adr/0014-recommendation-strategy.md`** (Branch B decision, written
earlier this session) and **`docs/adr/0015-similar-pokemon-server-route.md`**
(new — explains why `/api/similar` is a third server-route exception to
ADR-0004 for a *different* reason than `/api/token`/`/api/passages`: it needs
no privileged credential, a plain client-side `fetch()` would work fine
security-wise, but routing it server-side avoids a second Headless
controller/engine clobbering the PDP's shared-engine query state).

**`.async-panel` CSS (grid `0fr`→`1fr` collapse/expand + reduced-motion
override) added to `src/app/globals.css`** — didn't exist yet; this carousel
is its first consumer, ready for `GeneratedAnswer`/`AskAboutPokemon`/
`ResultList` to reuse when Doc 4's remaining work happens.

**One real pre-existing bug found and fixed, unrelated to this feature**: a
literal NUL byte had sat inside `mapPokemonResult.ts`'s `zipEvolutionTargets`
dedup-key template literal (`` `${name}\0${imageUrl}` `` instead of a space)
since commit `8464fe0` (eleventh session) — invisible in editors/Read output,
which is why `git diff` had silently shown that file as "Binary files
differ" for nine sessions without anyone investigating why. Found while
reviewing this session's diff to that file (the carousel work exported
`asString` from it). Fixed in its own commit, same dedup semantics, verified
207/207 tests still pass.

**Verification, all real**: `npm run lint`, `npm run typecheck` clean.
`npm test` — 207/207 (31 files). `npm run test:coverage` — 99.33%
statements/99.32% lines, `/api/similar/route.ts` itself 100%
statements/functions/lines. `npm run build` succeeds, `/api/similar` listed
as a dynamic route. Manual: Playwright against the running dev server on
`/pokemon/Eevee` confirmed the carousel renders below Tabs, above "Ask about
Eevee," with six genuinely same-type (Normal), non-self Pokemon and no
console errors.

**Not done this session**: items 2 (home hero carousel + PDP Highlights,
Doc 3 §5) and 3 (rest of Doc 4 — `GeneratedAnswer`/`AskAboutPokemon`/
`ResultList`) of the three-item build order are still open.

## Twentieth session, continued — Similar Pokemon carousel UX fixes

User manual-tested the just-shipped carousel and found three real gaps not
caught by the automated verification above: the card wasn't clickable except
for the small "View Pokemon" text, there was no hover feedback the way the
`/search` listing page's `ResultCard` has one, and there was no visible way
to scroll besides an undiscoverable drag gesture.

`src/components/SimilarPokemon.tsx` reworked: the whole card is now one
`<Link>` (matching `ResultCard`'s pattern exactly — no nested anchor), reuses
`ResultCard`'s `.result-tile` treatment (lift + type-color glow on
hover/focus, sprite scale) for a consistent feel with the listing page, and
gained prev/next arrow buttons (hand-drawn SVG chevrons, no icon library —
same posture as `PokeballGlyph.tsx`) wired to `embla-carousel-react`'s
`scrollPrev`/`scrollNext`, with disabled state synced to
`canScrollPrev`/`canScrollNext` via embla's `select`/`reInit` events. Arrows
are hidden entirely when there's only one card (nothing to scroll to).

Verified live via Playwright against the running dev server on
`/pokemon/Eevee`, not just visual inspection: confirmed the card's own
`<a>` resolves to `/pokemon/<name>` (not a second nested link), confirmed
`Previous`/`Next` buttons exist with correct `disabled` state before and
after a click, confirmed zero console errors. `npm run lint`,
`npm run typecheck`, `npm test` (208/208), coverage (99.33%) all clean.
Existing `SimilarPokemon.test.tsx` updated for the new accessible-name
shape (`getByRole("link", { name: /Flareon/ })` instead of an exact
`"View Pokemon"` link name, since that text is no longer its own anchor),
plus a new test asserting the arrow buttons only render once there's more
than one card.

Commit `8b13f9a`.

## Twenty-first session — home hero carousel + PDP Highlights (Doc 3 §5), async UI-states contract (Doc 4)

Built items 2 and 3 of the three-item build order (item 1, the PDP Similar
Pokemon carousel, shipped last session). Re-read
`docs/temp/insiprations/{Home,pdp}/`'s six real reference screenshots
directly before building, per Doc 3 §5's own note that its prose summary is
lossy — confirmed the summary was accurate (Sleep Country hero carousel with
visible prev/next arrows and overlay copy+CTA; Sephora "Highlights" row of
small icon-circle + label callouts directly below the hero).

**Home hero carousel** (`src/components/HeroCarousel.tsx`, new) — supersedes
the single static `homeBanner` `ImageSlot` on `src/app/page.tsx`.
`embla-carousel-react` (already a dependency, added last session for
`SimilarPokemon.tsx`) backs it, same posture: hand-drawn chevron arrow
buttons (no icon library), dot indicators synced to `emblaApi`'s
`select`/`reInit` events. Three slides, each promoting a real,
already-shipped feature rather than a sale/promo (this app has no commerce):
"Search the full Pokedex" (anchors to `#pokedex-search`, a plain `<a href>`
scroll — no ref plumbing needed), "Compare up to 4 Pokemon" (links to
`/compare`), "Ask about any Pokemon" (links to `/search`, since no single
Pokemon is a natural target from the home page — Doc 3 §5.1's own
fallback). **Scope decision, not in the doc**: all three slides reuse the
one already-downloaded `home-banner.webp` as background (differentiated by
overlay copy/CTA only) rather than sourcing three separate crops — avoided
a second image-compositing pass for decorative background art given the
no-fabricated-data rule only governs Pokemon facts, not marketing imagery.
Slide 1's body interpolates the real indexed total (`QuerySummary` state,
already fetched on mount) via the same pattern the dropped
`indexedCountSuffix` used — that dead CONTENT entry was removed since
nothing else referenced it once the plain subtitle paragraph no longer
needed it.

**PDP "Highlights" row** (`src/components/PdpHighlights.tsx`, new) — a
Sephora-style grid of icon-circle + label callouts mounted directly below
`PokemonHero`, above `PokemonStatPanel`, built entirely from `PokemonItem`
fields the page already has (no new Coveo query, so the async-states
contract below doesn't apply to it — it's synchronous). Four real fields:
primary type (reuses `TypeSwatch`, the same component the type facet
already uses, per Doc 3 §5.2's explicit instruction), top ability
(`item.abilities[0]`), egg group (`item.breeding.eggGroups[0]`),
generation. **The reference's catch-rate-derived "Rare"/"Common" tier
callout was dropped, using the doc's own escape hatch**: Nintendo has never
published an official catch-rate tier boundary, and picking cutoffs
ourselves would present an invented classification as if it were real
data — exactly what `CLAUDE.md`'s no-fabricated-data rule prohibits.
Documented inline in the component's own comment so a future session
doesn't re-propose the same bucketing without re-deriving why it was
skipped. Icons: the type swatch plus three hand-drawn SVG glyphs (ability,
egg, generation) matching `PokeballGlyph.tsx`'s thin-stroke posture — no
icon library.

**Async idle/loading/success/error contract** (Doc 4) applied to all three
remaining components, reusing the `.async-panel` CSS from last session
(`src/app/globals.css`, first shipped for `SimilarPokemon.tsx`) rather than
redefining it:

- **`GeneratedAnswer.tsx`**: no longer `return null`s for its hidden state —
  the `.async-panel` wrapper stays mounted across every status, collapsed to
  zero height via `data-open="false"`. Loading gained a real 3-bar
  `animate-pulse` skeleton alongside the existing `ScanSequence` label. **A
  new "error" status was added to `deriveGeneratedAnswerRenderState`
  (`src/coveo/generatedAnswerRenderState.ts`) — this reverses part of a
  previously documented decision, so it's captured in
  `docs/adr/0016-generated-answer-error-state.md`**, not just a code
  comment, per `CLAUDE.md`'s ADR rule. The prior version folded every
  `state.error` into `hidden` (reasoning: RGA is org-gated, an absent
  feature shouldn't look like a broken search); this session split that —
  `isEnabled`/`isVisible` false still folds to `hidden` unchanged, but
  `state.error` on an otherwise-enabled-and-visible controller is now a
  genuine "couldn't retrieve" state, since that's a real request failure,
  not a missing feature. The existing test asserting error→hidden was
  updated (renamed, new expectation) rather than deleted, plus a new test
  pinning that not-enabled still wins over a stray error.
- **`AskAboutPokemon.tsx`**: the results region (previously absent from the
  DOM entirely until a response landed — the "tiny box... then whole PDP
  moves" complaint Doc 4 exists to fix) is now wrapped in `.async-panel`
  from "idle" onward, open on loading/error/success. Added a one-passage-
  shaped skeleton (`PassageSkeleton`, reusing the real `.passage-card` CSS
  class) for the loading state, which previously rendered nothing at all
  while the request was in flight.
- **`ResultList.tsx`**: the loading branch was plain text; now renders the
  same `grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4` shape as
  success, with 8 placeholder tiles (sprite-square + two skeleton text
  lines) so loading→success swaps tile content, not grid shape. The old
  loading text is kept as an `sr-only` announcement rather than dropped
  outright. `empty`/`error` stay their own distinct layouts, unchanged.

**Verification, all real**: `npm run lint`, `npm run typecheck` clean.
`npm test` — 221/221 (34 files, up from 208/31 — added
`HeroCarousel.test.tsx`, `PdpHighlights.test.tsx`, `AskAboutPokemon.test.tsx`
new, extended `generatedAnswerRenderState.test.ts`). `npm run test:coverage`
— 99.33% statements, unchanged (its `TESTABLE_ROOTS` guard only covers
`src/coveo/*` and API routes, not components — see
`docs/standards-adoption.md` #12 — so component test files are additive,
not gate-enforced). `npm run build` succeeds, all routes list correctly.
Manual: a Playwright script driven against the running dev server (not just
unit tests) confirmed live on `localhost:3000` — home hero carousel renders
all three slides, arrow/dot navigation works, the "Start searching" CTA's
`#pokedex-search` anchor actually scrolls to the search box; PDP Highlights
renders all four real fields on Eevee (Normal / Run Away / Field / Generation
1); `/search?q=char` still renders its results list correctly; asking a
question on Eevee's PDP shows "Asking..." immediately (the new loading
state) before resolving to real passages. Zero console errors across all
of the above. Screenshots reviewed directly, not just asserted programmatically.

## Twenty-first session, continued — hero/PDP redesign after live user review

User manual-reviewed the hero carousel/PDP Highlights work above and found
four real problems, worked through in plan mode before any code changed:
the carousel belonged on Browse-by-type, not the home hero; Home/Search/PDP
all capped their content narrower than the header, wasting real width on
anything bigger than a small laptop; the PDP's full-bleed backdrop photo
didn't read as a commerce product shot; and `PdpHighlights`' circular
icon-in-circle badges reused this app's *only* other use of that shape —
`TypeSwatch`/`BrowseByType`'s clickable filter pins — so they looked
clickable when they weren't (three of its four fields also just duplicated
info already visible in the Hero/tabs). Full plan (judgment calls stated
with reasoning) at the approved plan file, condensed here:

**Container width**: `max-w-6xl` → `max-w-7xl` (1152px → 1280px), applied
consistently to `AppHeader`, Home, `/search`, `/compare`, `CompareTray`
(all were already 6xl) and PDP (was the one outlier at `max-w-5xl`) — one
shared constant, not a one-off bump on the pages that were called out.

**Home hero reverted to a static banner** — `HeroCarousel.tsx` deleted
entirely, `src/app/page.tsx` back to its pre-session `ImageSlot` +
subtitle-with-real-indexed-count form (`CONTENT.home.indexedCountSuffix`
re-added), just spanning the wider container. The 3-slide Search/Compare/
Ask promo copy from last session's carousel was dropped rather than kept
as static cards — nothing in the ask wanted that content to survive, and
the page's own doc-comment already commits to staying minimal.

**Browse-by-type became the carousel** (`src/components/BrowseByType.tsx`)
— same `embla-carousel-react` mechanism `SimilarPokemon.tsx` established
first (`align: "start"`, `dragFree: true`, chevron arrows with
`canScrollPrev`/`canScrollNext`-synced disabled state), replacing the
native `overflow-x-auto` strip. Real click-through per type unchanged.
Since this made two real carousels with identical arrow-button/scroll-state
logic, extracted the shared bits into **new**
`src/components/ui/CarouselArrowButton.tsx` and
`src/components/ui/useCarouselArrows.ts`; `SimilarPokemon.tsx` switched to
both instead of its own inlined copies — pure de-duplication, no behavior
change.

**PDP redesign, commerce-style**: deleted the full-bleed `heroBackdrop`
breakout entirely (the `-mx-[50vw]` viewport-breakout wrapper +
`ImageSlot` in `pokemon/[name]/page.tsx`), plus the now-orphaned
`CONTENT.art.heroBackdrop` entry and `public/art/hero-backdrop.webp` file.
`PokemonHero.tsx` is now a two-column grid (`grid-cols-1
sm:grid-cols-[minmax(0,360px)_1fr]`) — a dominant sprite "packshot" panel
on the left (the prior small overlapping "trading card" treatment, now the
primary element in its own column instead of a workaround for a clashing
photo backdrop; no more negative-margin overlap trick since there's
nothing left to overlap), identity + type + quick facts on the right. The
packshot panel keeps real visual interest via a **new**, static (non-hover)
variant of the existing oklab color-mix glow recipe
(`.hero-packshot[data-glow]` in `globals.css`, distinct from
`.result-tile[data-glow]` since this panel is never interactive).

**`PdpHighlights.tsx` deleted outright**, not reskinned — judgment call:
type/ability/egg-group were already visible elsewhere (Hero's type Chips;
Abilities and Overview tabs), only `generation` was genuinely new.
`generation` folded into `PokemonProfilePanel`'s existing `DataList`
(Overview tab, new prop, new row right after Species) — same non-
interactive `dt`/`dd` styling already used for height/weight/egg groups,
zero pill-shaped anything. A compact 2-row `DataList` (Generation +
`abilities[0]`, labeled plainly "Ability" not "Top ability" — source
order, not a verified primary, same caveat this codebase already applies
to `types[0]`) sits directly in the Hero's right column too, so at-a-glance
info survives without a tab click, using `DataList`'s proven non-clickable
visual language instead of the circular-badge one that caused the
complaint. `tests/unit/components/PdpHighlights.test.tsx` deleted with the
component; `tests/unit/components/HeroCarousel.test.tsx` deleted with
`HeroCarousel.tsx`.

**`ResultList.tsx` grid gained an `xl:grid-cols-5` step** (both the success
grid and the loading skeleton, kept identical as they already were) — one
more tile per row on wide viewports instead of just bigger tiles, using the
width the container bump freed up.

**No ADR for any of this** — visual/layout decisions, same category as the
v4 restyle batches (none of which got their own ADR either), not the kind
of lasting technical-architecture call ADRs in this repo are reserved for.

**Verification, all real**: `npm run lint`, `npm run typecheck` clean.
`npm test` — 216/216 (33 files: net -7 from deleting `HeroCarousel.test.tsx`/
`PdpHighlights.test.tsx`, +1 new `BrowseByType.test.tsx`). `npm run
test:coverage` unchanged (99.33%, its guard doesn't cover components).
`npm run build` succeeds. Manual: a Playwright script against the running
dev server confirmed live — Home shows the static (non-sliding) banner with
the real "1,025 Pokemon indexed" count, Browse-by-type's prev/next arrows
actually scroll the strip (Normal drops off the left edge, Dark/Steel
scroll into view); PDP shows the two-column hero with no backdrop image,
Generation ("Generation 1") and Ability ("Run Away") visible under Eevee's
name without a tab click, Generation also present in the Overview tab's
spec sheet. Zero console errors. Screenshots reviewed directly (not just
asserted programmatically) — the PDP hero screenshot in particular was
checked against the "does this read like a commerce product shot" bar the
feedback set.

One `impeccable` design-hook finding accepted as a sanctioned exception:
`PokemonHero.tsx`'s dex-number watermark font-size (9rem) is a resize of
the same oversized-watermark treatment already accepted at 7rem/10rem in
an earlier session (config.json's `design-system-font-size` ignore-list) —
persisted via `hook-admin.mjs ignore-value`, not silently overridden.

## Twenty-first session, continued — facet icons + facet order

Same session, one more round of live feedback on `/search`: the Type/
Weaknesses/Resistances facets' flat color-only swatches read as generic
color pills rather than tying into the same icon language the home page's
Browse-by-type strip already established, and the facet order should lead
with Pokemon Type, then Generation, then whatever else.

**`TypeSwatch.tsx`** (used by `AutomaticFacets.tsx` for the three
type-driven facets) now renders the same real downloaded type-icon SVG
`BrowseByType.tsx` uses (`public/art/types/`), not a plain CSS-colored
circle — each icon file is already a self-contained colored circle badge,
so there's no separate fill to draw. The inline checkmark SVG that used to
mark a selected value was dropped: with a real icon now occupying the
circle, a checkmark on top of it would obscure the icon rather than add
information, and the existing selected-state ring (plus the native
checkbox, unchanged) already makes selection unambiguous on its own.

**Facet order**: `AutomaticFacets.tsx` gained a `FIELD_ORDER_PRIORITY`
client-side sort — Type first, Generation second, everything else after in
whatever order Coveo's automatic facet generator returned it (a stable
sort, so the fields we have no opinion on keep their relevance-ranked
order). Checked `AutomaticFacetGeneratorOptions` in the installed
`@coveo/headless` types first, per this project's Coveo-docs-first rule:
it only exposes `desiredCount`/`numberOfValues`, no field/order control, so
pinning order has to happen at render time, not via a generator option —
this doesn't request anything different from Coveo, doesn't touch which
fields the generator selects, and isn't a reversal of ADR-0011's decision
to let it choose them, so no new ADR. Also moved `<AutomaticFacets />`
above `<FacetSpeed />`/`<FacetAbilities />` in `src/app/search/page.tsx`'s
facet rail — those two are the only facets ineligible for automatic
generation (Speed is numeric; Abilities needs facet-search), so without
this move Type/Generation would still have rendered below them despite
leading within the automatic group.

**Verification, all real**: `npm run lint`, `npm run typecheck` clean.
`npm test` — 217/217 (added a new `AutomaticFacets.test.tsx` case asserting
the Type-then-Generation-then-rest order with a mixed-field fixture).
`npm run test:coverage` unchanged (99.33%). `npm run build` succeeds.
Manual: Playwright against the running dev server on the live org,
`/search?q=char` — confirmed real fieldset legend order top-to-bottom
(`Pokemon Type`, `Genration`, `Weakness aganist`, `Resistance against`,
`Egg Groups`, `Speed`, `Abilities` — the org's own field labels, typos and
all), and the Type facet's swatches render as real colored type-icon badges
with a visible selection ring after toggling one on. Zero console errors.

**Not this session's concern, flagged for later**: the live org's field
labels have real typos ("Genration", "Weakness aganist") — a Coveo admin
console fix (Fields page), not app code; noted here rather than silently
worked around.

## Nineteenth session — scoped four follow-up execution plans (no implementation yet)

User raised four gaps after the v4 design pass and Vercel deploy: no
similar/recommended Pokemon on the PDP, no Coveo ML beyond RGA/Passage
Retrieval/Query Suggestions/Automatic Facet Generation, four dashed-placeholder
`ImageSlot`s (`homeBanner`, `heroBackdrop`, `typeFacetHeader`, `emptySearch` —
`CONTENT.art` in `src/content/pokedex.ts` has all four `undefined`), and real
layout shift where `GeneratedAnswer.tsx` and `AskAboutPokemon.tsx` go from
absent straight to a full block the instant Coveo responds, reflowing
everything below them.

Went through plan mode twice on this. The first pass proposed avoiding any
new art/dependencies (build "Similar" from a same-type query only, fill the
placeholder slots from already-fetched sprite data / in-house components like
`PokeballGlyph`, keep the async-state fix component-local) — **the user
rejected that plan outright** and gave more specific direction: check real
Coveo ML options (Content Recommendation model, ART) against the org's actual
usage-analytics volume before deciding anything, source real downloaded
images for the placeholder slots (licensing accepted as a non-issue for a
demo), make the similar-Pokemon UI an actual carousel (`embla-carousel-react`
approved as a new dependency — the first UI library in this repo beyond
`@coveo/headless` and Next itself), redesign Browse-by-type from a text-pill
grid into a horizontal strip of circular type icons, and treat the layout-
shift fix as a general idle/loading/success/error contract every
Coveo-or-API-backed component should follow, not a one-off patch.

Produced four new execution docs instead of code, per that direction ("I want
4 execution files, rather than implementing"):

1. **`docs/archive/EXECUTION-PLAN-ml-recommendations.md`** — research on Coveo's
   Content Recommendation (CR) model and Automatic Relevance Tuning (ART),
   done via WebSearch against docs.coveo.com this session (**not yet
   re-verified by direct page fetch — that's still required before any
   console action, per the standing rule below**). Key finding: CR needs
   roughly 10,000+ historical queries to be reliably relevant per Coveo's own
   guidance; this org's actual volume is unknown and genuinely blocks the
   doc's "Similar/Recommended/Popular" decision — **next session should open
   with Analytics → Usage Analytics in the live console to get that number
   before anything else in this doc proceeds.** ART is recommended
   independently of that number (console-only, pairs with the org's existing
   Query Suggestions model per Coveo's own docs).
2. **`docs/archive/EXECUTION-PLAN-similar-pokemon-carousel.md`** — the PDP carousel
   UI spec, written to consume either ML doc branch's output identically via
   one `SimilarPokemon` data shape. Not blocked on doc 1 to *write* the
   `/api/similar` same-type-query fallback route, since that's needed either
   way as a safety net.
3. **`docs/archive/EXECUTION-PLAN-marketing-assets.md`** — ready to execute now, no
   open decisions. Real images downloaded into `public/art/` (not hotlinked)
   for the four placeholder slots, plus a real type-icon set (candidates
   found: `github.com/partywhale/pokemon-type-icons`, a DeviantArt PNG set)
   for the Browse-by-type icon-strip redesign.
4. **`docs/archive/EXECUTION-PLAN-async-ui-states.md`** — ready to execute now, no
   open decisions. A shared idle/loading/success/error contract (persistent
   wrapper, CSS grid `0fr`→`1fr` collapse/expand, real skeletons) applied to
   `GeneratedAnswer.tsx`, `AskAboutPokemon.tsx`, `ResultList.tsx`, and the new
   carousel from day one.

**Nothing was implemented in the planning half of this session** — no code
changed, no org config touched, no docs.coveo.com pages fetched directly yet
(only WebSearch snippets, which are not a substitute for a direct page read
per this project's standing rule — doc 1 says this explicitly and it must be
honored before any ART/CR console action next session).

## Doc 3 executed — real marketing assets + icon-based Browse-by-type

Same (nineteenth) session, immediately after the four docs above were
written — user asked to execute Doc 3 (`docs/archive/EXECUTION-PLAN-marketing-assets.md`)
right away rather than waiting. No Coveo org config touched; no query/
controller behavior changed.

**Sourcing, real and verified live, not guessed:** confirmed
`img.pokemondb.net/artwork/large/<name>.jpg` (the same host
`mapPokemonResult.ts` already trusts as the real image source for every
Pokemon sprite this app renders) serves full official-style artwork for any
Pokemon name, distinct from the smaller `sprites/home/normal/2x/` sprites
used elsewhere in the app. Downloaded 16 of these (Pikachu, Charizard,
Gyarados, Venusaur, Mewtwo, Snorlax, Lucario, Gengar, Lugia, Garchomp,
Umbreon, Greninja, Mew, Articuno, Psyduck, Dragonite), chroma-keyed each
one's white background to transparent (simple near-white threshold + edge
feather, via Pillow — a real cutout, not a fabricated image), and composited
three collages: `home-banner.webp` (7-Pokemon marquee, 1920×600),
`hero-backdrop.webp` (6-legendary lineup, 2100×900), `empty-search.webp`
(a single Psyduck — genuinely on-brand for a "found nothing, confused" empty
state). Saved as WebP (not PNG) specifically for size: the PNG composites
were 1.2–1.8MB each, WebP got them to 44–316KB with no visible quality loss.
All three now live under `public/art/` and are wired into `CONTENT.art` in
`src/content/pokedex.ts` — `ImageSlot.tsx` needed zero changes, exactly as
the doc predicted.

**Type icons**: found `github.com/partywhale/pokemon-type-icons` (MIT
licensed, confirmed by reading its actual `LICENSE` file, not assumed) — 18
SVGs, one per real type name, each already a self-contained colored circle
badge. Downloaded all 18 into `public/art/types/`, with the MIT license text
and a source/attribution note for the two other composites saved alongside
them in `public/art/types/LICENSE.txt`.

**`BrowseByType.tsx` rewritten**: the text-pill grid became a horizontal
scrollable strip of circular icon "pins" (plain `<img>`, not `next/image` —
next/image's optimizer refuses local SVGs without setting
`dangerouslyAllowSVG` in `next.config.ts`, and there's no responsive-size
need for a fixed 56px icon), each still carrying a small type-name label
below it (never icon-alone, per the same color-plus-label rule
`ADR-0013` already established for facet swatches) and still using the exact
same `buildTypeSearchHref` click destination as before — a visual swap only.
Dropped the `typeFacetHeader` `ImageSlot` and its `CONTENT.art` key entirely
(unused code deleted, not left as dead scaffolding) rather than filling it
with a fourth image — the icon strip itself reads as the section's visual
anchor now, a redundant banner above it would have been clutter, confirmed
by an actual in-browser look, not decided in the abstract.

**One real bug found and fixed, not anticipated by the doc.** Once
`hero-backdrop.webp` was live behind the PDP hero sprite
(`PokemonHero.tsx`), the sprite's own image — a real indexed
`img.pokemondb.net/sprites/...` asset, always rendered with an *opaque
white* background baked into the pixels, not a transparent cutout — showed
up as a jarring hard-edged white rectangle sitting on top of the new
colorful collage; harmless before this session since it sat on a blank
dashed placeholder instead. A first fix attempt (a soft radial `var(--surface)`
glow behind the sprite) did nothing, confirmed live via screenshot — the
sprite's opaque pixels simply painted over it, since `object-contain` still
occupies the full image box. Real fix: reframed the sprite's container as a
deliberate rounded card (`bg-surface`, `shadow-xl`, hairline ring) instead of
fighting the opaque background — turns the white box into an intentional
"trading card" floating on the band, confirmed live in both light and dark
mode via Playwright screenshots (`src/components/PokemonHero.tsx`). This is
a pre-existing characteristic of the real sprite data, not something this
session's asset work broke — it was simply invisible against a blank
placeholder before.

**Verification, all live, not just declared:** `npm run lint`,
`npm run typecheck`, `npm test` (193/193, no test changes needed — no
existing test referenced `BrowseByType` or `typeFacetHeader`), `npm run build`
all clean. Manual Playwright screenshots against a real local dev server
confirmed: the home banner and type-icon strip render correctly in both light
and dark mode; the PDP hero backdrop + reframed sprite card render correctly
in both modes across two different Pokemon (Charizard, Gengar); every
Browse-by-type icon's click destination is unchanged. The `empty-search.webp`
slot itself was not separately re-screenshotted this session (a garbage
query still matched 438 results via Coveo's own query-suggestion/fuzzy
behavior rather than truly returning zero) — low risk, since it renders
through the exact same `ImageSlot` code path already proven live for the
other two slots.

Files touched: `src/content/pokedex.ts`, `src/components/BrowseByType.tsx`,
`src/components/PokemonHero.tsx` (the unplanned card-framing fix). New:
`public/art/home-banner.webp`, `public/art/hero-backdrop.webp`,
`public/art/empty-search.webp`, `public/art/types/*.svg` (18 files),
`public/art/types/LICENSE.txt`.

**Not done this session**: Docs 1, 2, and 4 — Doc 1's live Analytics console
check is still the next open item and still gates Doc 2's data source; Doc 4
is independent and can be picked up any time.

## Same session, continued — new inspiration folded into Docs 2 and 3

User dropped six reference screenshots into `docs/temp/insiprations/{Home,pdp}/`
(Sleep Country and Sephora product pages) and asked for them to be read and
folded into the relevant execution docs as new scope, documentation-only —
no code this pass. Both docs updated directly (see their own files for full
detail, not re-summarized here to avoid drift):

- **`docs/archive/EXECUTION-PLAN-marketing-assets.md`** gained a new §5: a home hero
  **carousel** (2-3 slides promoting real, already-shipped features —
  search, compare, ask-about-Pokemon — superseding the single static
  `home-banner.webp` as the whole hero; that image becomes one slide's
  background instead) and a new PDP **"Highlights" section** (icon+label
  callouts built from real `PokemonItem` fields — type via `TypeSwatch`,
  top ability, egg group, generation, a to-be-defined catch-rate tier).
  Sleep Country's bigger "Shop by Category" tile grid was logged as
  "considered, not proposed yet" rather than queued as work, since it would
  compete with the icon-pin strip already shipped this session.
- **`docs/archive/EXECUTION-PLAN-similar-pokemon-carousel.md`**'s card spec (§3)
  was sharpened against Sephora's "Similar Lip Balms & Treatments" grid as
  its direct template: price and star-rating fields are explicitly dropped
  (no Pokemon equivalent — importing them would be fabricated data), replaced
  with a real stat-highlight line ("Strong in: Attack, Speed", derived from
  the two highest real values in `item.stats` via `STAT_ORDER`,
  `src/coveo/pokemonStats.ts`). The `SimilarPokemon` data contract (§1) and
  the `/api/similar` mapping (§2) both gained a `stats` field to support it.

Both docs still route through `EXECUTION-PLAN-ml-recommendations.md`'s open
Analytics check where applicable (the carousel doc's data source), and
neither depends on Doc 4. Nothing in `public/art/`, `src/`, or the Coveo org
changed this pass.

## Eighteenth session — manual walkthrough + two missing e2e specs (What's next item 1)

Executed "What's next" item 1: a real browser walkthrough of the v2.3+ surfaces (home, typeahead, search results, facets, PDP, Ask-about-this-Pokemon/CPR, RGA, compare flow, reduced-motion), plus the two e2e specs that item named. No Coveo org config touched.

**Two new e2e specs, both passing live against the org**: `tests/e2e/state-persistence.spec.ts` —
- `compare selection survives navigating away and back`: selects a card's compare checkbox on `/search?q=pikachu`, navigates into the PDP, confirms the tray is still populated there, then `page.goBack()`s to the search results and confirms both the tray and the card's own checkbox are still correct. Exercises `CompareProvider`'s `sessionStorage` mirror (ADR-0009) across a real navigation, not just a state check in place.
- `a deep-linked facet URL restores its selection on a cold load`: `/search?f-pokemonabilities=Static` on a fresh `page.goto` (no prior navigation) asserts the "Static" checkbox comes back checked. Uses the Abilities facet (a plain `buildFacet`, not Automatic Facet Generation) deliberately — the type facet's presence is query-dependent and async per ADR-0011, which would make a cold-load assertion flaky for reasons unrelated to what this test is actually checking.

**Two real bugs found by the manual walkthrough, not by any existing automated test, both fixed and verified live:**

1. **`AskAboutPokemon.tsx` passage list — real React duplicate-key warning, reproducible on the very first try.** `key={passage.document.primaryid}` (v4 plan §8's own instruction) assumed each passage has a distinct source document, but `/api/passages`' request is `filter: '@pokemonname=="<name>"'` — scoped to exactly one document — so every passage returned for a query is a chunk of that *same* document and shares one `primaryid`. Reproduced live asking "what are the base stats" on Charizard's PDP (screenshot confirmed all 3 passages tagged "retrieved from: Charizard"). Fixed: `key={`${passage.document.primaryid}-${index}`}` — safe here since `state.passages` is replaced wholesale on every new ask, never patched in place. Added a console-error assertion to the existing `tests/e2e/ask-about-pokemon.spec.ts` golden-path test as a regression guard (`expect(consoleErrors).toEqual([])`), confirmed it fails against the old code and passes against the fix.
2. **`CompareProvider.tsx` — real hydration-mismatch error on any hard reload with an active compare selection.** The provider's `useState` lazy initializer read `sessionStorage` synchronously on the client (a deliberate choice, per its own prior comment, to avoid a tray-flash) — but this is a client component that still gets an SSR pass, and the server always renders an empty tray, so the very first client render diverged from the server's whenever a selection already existed in storage. Reproduced live: select a compare item, then `page.goto` the same origin again (a real page reload, not client-side nav) — React threw the mismatch error every time. **Put to the user as a real trade-off** (fix and accept a brief empty-tray flash on reload, vs. leave it and log it) rather than silently reversing the prior session's documented choice; user chose to fix it. Now: `names` starts at `[]` unconditionally (matches SSR), and a mount effect hydrates from `sessionStorage` via `queueMicrotask(() => setNames(...))` (the same `react-hooks/set-state-in-effect`-avoidance idiom `SearchBox.tsx` already uses, not a stylistic choice) — landing well before the next paint, so the flash is not visually perceptible in practice. A `skipNextPersist` ref guards the existing persist-effect from writing this hydration's still-stale `names` closure (`[]`) back over `sessionStorage` before the hydration's `setNames` has actually committed. Confirmed live twice: no console error on a reload with an active selection, and the tray still correctly repopulates after reload. `tests/unit/components/compare/CompareProvider.test.tsx` and `CompareTray.test.tsx` updated to `await`/`findBy*` the now-async hydration instead of asserting the old synchronous behavior (5 tests were red until this update, all green after).

**Manual walkthrough — everything else confirmed working as designed**, screenshotted at each step (home, typeahead, search results with facets/RGA, PDP with hero/stat-bars/tabs, Ask-about-this-Pokemon passages, compare tray → `/compare` 3-way table, PDP under forced `prefers-reduced-motion: reduce`). No other console errors or visual defects found.

**Verification.** `npm run lint` clean. `npm run typecheck` clean. `npm test` — 193/193 (29 files, including the 2 rewritten compare test files). `npm run build` succeeds. `npm run test:e2e` with env vars exported into the Playwright process: 21/25 pass — the new `state-persistence.spec.ts` (2/2) plus the existing configured suites unaffected; the same 4 pre-existing `unconfigured.spec.ts` failures documented since the thirteenth session (unchanged, unrelated local-environment mismatch).

Files touched: `src/components/AskAboutPokemon.tsx`, `src/components/compare/CompareProvider.tsx`. Tests: new `tests/e2e/state-persistence.spec.ts`; updated `tests/e2e/ask-about-pokemon.spec.ts`, `tests/unit/components/compare/CompareProvider.test.tsx`, `tests/unit/components/compare/CompareTray.test.tsx`.

**Not done this session** (still open, see "What's next"): Vercel deploy, both presentation decks, Phase 0 email/booking, the off-cycle ML model rebuild request (user confirmed sending 2026-08-31).

## Vercel deploy (same day, following the eighteenth session) — live

**Live URL: https://coveo-pokemon-assessment.vercel.app/** — closes "What's next" item 3 (Intermediate tier).

Connected via the Vercel dashboard's GitHub import (user's explicit preference — no `vercel` CLI login from this environment, no direct push from here), not the CLI: Import Git Repository → `venkateshnalla94/coveo-pokemon-assessment`, Next.js preset auto-detected, no `vercel.json` needed.

Ahead of the import, `package.json` got a new `"engines": { "node": "^22.11.0 || ^24.11.0" }` — Vercel reads `engines.node` to pick its build runtime, and `coveo.analytics` (a `@coveo/headless` transitive dependency) declares that exact same constraint (the same one that already forced CI's Node 20 → 24 bump, fifth session) — pinning it avoids the deploy silently building against an unsupported Node version the way CI once did.

**One real deploy-time bug, found and fixed live, not anticipated in the pre-deploy checklist**: `COVEO_API_KEY` was missing/empty in the Vercel project's environment variables (either never added, or `COVEO_ML_API_KEY` got added in its place — an easy mix-up given the two similarly-named keys), so `/api/passages` 500'd with "Coveo is not configured on the server (missing COVEO_API_KEY or org ID)" (`src/app/api/passages/route.ts:66`) — `/api/token` would have hit the same failure if "server" auth mode were active. Fixed by the user adding `COVEO_API_KEY` under Production in the Vercel dashboard and redeploying (env var changes don't apply to an already-built deployment). **Confirms once more, on a third surface, ADR-0008's finding that Passage Retrieval needs `COVEO_API_KEY`\(`EXECUTE_QUERY`\), not `COVEO_ML_API_KEY`** — worth remembering if `COVEO_ML_API_KEY` ever gets cleaned up as dead code (still not done, see the Stage E section above), since someone could plausibly reach for it here by name-similarity alone.

**Verified live post-fix** (Playwright against the real deployed URL, not just a visual check): `/search?q=pikachu` renders results, `/pokemon/pikachu`'s `<h1>` resolves correctly, "Ask about this Pokemon" returns 3 passages, zero console errors — confirming the eighteenth session's `AskAboutPokemon.tsx` duplicate-key fix holds in the actual production build, not just locally.

## Seventeenth session — v4 design pass, Batch 6 (motion/a11y pass + ADR + wrap-up, closes the v4 pass)

Executed execution-order steps 10-11 of `docs/archive/EXECUTION-PLAN-v4-design-system.md` (§10/§11, verification checklist in §12), the last batch of the plan. No Coveo org config touched; no controller/query behavior changed beyond one combobox-conformance fix (below), which is UI interaction correctness, not a query/facet change.

**This was not a clean audit — three real bugs found and fixed, verified live, not assumed from reading the CSS/JSX.**

1. **No global focus ring existed at all**, despite `docs/archive/EXECUTION-PLAN-v4-design-system.md` §3.2 stating `--signal-red` covers "exactly two uses: the Pokeball glyph and the global focus ring." The Pokeball glyph use was real (batch 2); the focus-ring use was never actually built in any prior batch — checkboxes, `Tabs` buttons, citation `<a>` tags, feedback buttons, the compare tray, and result-tile `<Link>`s all fell back to the browser default outline (or, on the `AskAboutPokemon`/`Facet` search inputs, `outline-none` with only a faint `focus:border-black/30` swap — no ring of any kind). Fixed with one rule in `src/app/globals.css`: `:focus-visible { outline: 2px solid var(--signal-red); outline-offset: 2px; }`, deliberately unlayered so it outranks Tailwind's `outline-none` utility (which lives in the generated `@layer utilities`) regardless of selector specificity or source order — the same cascade rule this file already documents for `--text-3xl`. Confirmed live via Playwright `getComputedStyle` reads on a real result-tile link and the search input (see `tests/e2e/a11y-motion.spec.ts`), not just "the CSS exists."
2. **The fix above would have been silently invisible on the type-facet swatch.** Its native checkbox is `sr-only` (clipped, `overflow: hidden`) per plan §6's "keep the native checkbox, don't replace it" rule — so a focus ring drawn on the checkbox itself is clipped away with it. Added `.swatch-checkbox:focus-visible + * { outline: 2px solid var(--signal-red); ... }` to paint the ring on the swatch's visible sibling span instead (`src/components/AutomaticFacets.tsx` now applies a `swatch-checkbox` class to that input). Verified live: focusing the hidden checkbox does show a ring on the visible swatch, and the checkbox's own (invisible) outline is still present separately, proving the rule targets the right element rather than accidentally matching by coincidence.
3. **The typeahead's suggestion `<button>`s had no `tabIndex={-1}`.** This is a combobox-popup conformance bug from batch 2, not new to this session, but only surfaced during this session's real keyboard walk: without it, Tab drops through the input onto the option buttons in document order, which both breaks the `aria-activedescendant` virtual-focus pattern batch 2 built and immediately closes the very listbox being tabbed into (via the input's `onBlur`). Fixed in `src/components/SearchBox.tsx`.

**Everything else in the audit came back clean, confirmed by real checks, not by re-reading source and assuming the earlier batches' own "confirmed live" claims still held:**

- **Reduced motion.** All five animation surfaces — Pokeball glyph spin/settle, result-tile hover lift, StatBar mount-fill (already covered, re-checked), RGA per-line fade-up + cursor blink, passage-card fade-in — were re-verified under `page.emulateMedia({ reducedMotion: "reduce" })` with real `getComputedStyle` reads in the new `tests/e2e/a11y-motion.spec.ts`, specifically hunting for a repeat of the batch-2 class of bug (a reduced-motion override losing the cascade to a more-specific `[data-state="..."]` rule and doing nothing at runtime while looking correct in the CSS). None found — every batch since 2 that added an animation paired it with a working override in the same commit, and `globals.css`'s own comments already documented the reasoning per-rule (specificity ties broken by later-in-cascade for `.stat-bar-fill`, `!important` only where genuinely needed for the Pokeball glyph's `[data-state]` rules).
- **Contrast.** Re-ran `tests/unit/coveo/typeColors.test.ts`'s independent WCAG re-derivation (it computes the ratio itself rather than asserting against `getTypeTextColor`'s own output) — all 11 assertions pass, all 18 pairs still clear 4.5:1. Confirmed this is unaffected by any `--shell-*` value changed since batch 1: `type-solid` badges use the type hex itself as the background, not a shell-derived tint, so shell-ramp changes can't invalidate this set. (The 12%-alpha `type` chip variant, which *does* composite against `--surface`, predates this design pass and was out of scope for the 18-pair audit per the plan's own framing in §3.1.)
- **Keyboard walk.** Driven with real Playwright keyboard/`.focus()` interaction in `tests/e2e/a11y-motion.spec.ts` against the live org, not manual reasoning: typeahead (Down/Down/Enter selects a suggestion and navigates), facets (Tab to a checkbox, Space toggles it), compare tray (Space-select a card, Tab to the tray link, Enter opens `/compare`). All pass.
- **`Tabs`' active-underline `--signal-red` exception** — left exactly as batch 4 flagged it and as `docs/adr/0013-type-driven-design-system.md` now documents formally: a real, plan-directed third use of `--signal-red` beyond §3.2's literal "exactly two" wording, not fixed here per this session's explicit instruction not to.

**ADR written:** `docs/adr/0013-type-driven-design-system.md` — covers the generated-CSS-token decision (Decision 1), the `--signal-red` two-use restriction plus the `Tabs` exception documented as a real inconsistency rather than smoothed over (Decision 2), and the §2.1 no-inline-RGA-highlighting decision with the Passage Retrieval contrast (Decision 3).

**Not fully resolved, carried forward from earlier batches (not re-attempted this session, per its own scope — this was an audit-and-fix pass, not a feature pass):**

- `EvolutionChain`'s "trigger condition between stages" (batch 4): no such field exists in the index (`EvolutionTarget` / `docs/coveo-source-spec.md`'s evolution-chart extraction carry no per-branch trigger data), so the arrow between stages stays a plain arrow rather than fabricating one. Adding that field is index/extraction scope for a future session, not a presentation-layer fix.
- `--signal-red`'s three-vs-two-uses tension (batch 4, reconfirmed and formally documented this session in ADR-0013 Decision 2): `Tabs`' active underline is a plan-directed third use of a token §3.2 describes as having "exactly two." Resolving it either way (drop the Tabs use, or restate §3.2) is a plan-level call for whoever picks this up next, not a code change made silently here.

**Verification.** `npm run lint` clean. `npm run typecheck` clean. `npm test` — 193/193 unit tests pass (29 files), unchanged from the sixteenth session (no `src/coveo/*`/`src/app/api/*` files touched this batch, so the coverage gate had nothing new to require). `npm run build` succeeds (production build, Turbopack, all 8 routes). `npm run test:e2e` with `NEXT_PUBLIC_COVEO_ORGANIZATION_ID` etc. exported into the Playwright process: the new `tests/e2e/a11y-motion.spec.ts` — 10/10 pass, including the type-facet-swatch focus test (guarded by a real `waitFor` rather than an immediate `.count()` check, since Automatic Facet Generation resolves asynchronously after the page's own results and an immediate count read a false "not present" once during authoring); the existing `search.spec.ts` (4/4) and `ask-about-pokemon.spec.ts` (2/2) suites unaffected; the same 4 pre-existing `unconfigured.spec.ts` failures documented since the thirteenth session (this dev machine's `.env.local` has a live org configured, so the app is never actually "unconfigured" when Playwright's `webServer` boots it — a standing local-environment mismatch, not a regression, and out of scope to "fix" since it would mean breaking local dev's real credentials).

Files touched: `src/app/globals.css` (global `:focus-visible` rule, `.search-box-input` suppression, `.swatch-checkbox` sibling rule), `src/components/SearchBox.tsx` (`search-box-input` class, suggestion-button `tabIndex={-1}`), `src/components/AutomaticFacets.tsx` (`swatch-checkbox` class). New: `docs/adr/0013-type-driven-design-system.md`, `tests/e2e/a11y-motion.spec.ts`.

This closes execution-order steps 1-11 of `docs/archive/EXECUTION-PLAN-v4-design-system.md` — the v4 design pass (batches 1-6) is complete.

