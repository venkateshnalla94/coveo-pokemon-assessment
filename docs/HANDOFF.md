# Session handoff — Coveo org build status

Updated 2026-09-01, thirty-fourth session. **This (thirty-fourth) session fixed a real regression the user hit as a GitHub Actions e2e failure: the twenty-seventh session's soft-404 fix (`src/app/pokemon/[name]/page.tsx` calling `notFound()` when `fetchPokemonMetadata` returns null) never accounted for `fetchPokemonMetadata` also returning null when Coveo is simply unconfigured (no `COVEO_API_KEY`/org id — every CI run, fork, and preview build without `.env.local`), so every PDP route had been 404ing outright in any env-less build since that session shipped, instead of falling through to the client component's Breadcrumb + `CoveoConfigBanner`. Fixed by checking `resolveServerCoveoConfig()` before calling `notFound()` — only a genuine no-match on a *configured* server 404s now; unconfigured falls through as before. Also guarded the BreadcrumbList JSON-LD `<script>` (added twenty-eighth session) behind the same `pokemon` null-check, since it read `pokemon.name` unconditionally. Updated/added unit tests in `tests/unit/app/pokemon/page.test.ts` to mock `resolveServerCoveoConfig` and cover both branches. No org config touched. See "Thirty-fourth session" below.** Updated 2026-09-01, thirty-third session. **This (thirty-third) session executed and closed out Phase 2 of `docs/archive/EXECUTION-PLAN-a11y-remediation.md` (color contrast), the plan's final phase: added a text-only `--shell-500` token (computed via WCAG relative-luminance math, not guessed) so `--shell-400` stays untouched for its three decorative/non-text uses, replaced `text-black/40`/`dark:text-white/40` with the same token at every real-text call site, and — while re-running the suite with `disableRules()` fully removed — found and fixed one more real violation neither prior audit pass had caught (`text-shell-200` on a pending RGA scan-step label, 1.49:1). `KNOWN_PRE_EXISTING_RULE_IDS` is now gone entirely; `a11y-scan.spec.ts` passes 4/4 against the real org with zero disabled rules. Plan doc archived (both phases done). See "Thirty-third session" below.** Updated 2026-08-31, thirty-second session. **This (thirty-second) session executed Phase 1 of `docs/EXECUTION-PLAN-a11y-remediation.md` (landmark structure): added a real `<main>` on all four routes and a visually-hidden `<h1>` on home and `/search` (the two routes that had none). Found the PDP's `page-has-heading-one`/`landmark-one-main` violations the thirty-first session's audit recorded were actually a bug in the audit's own test — the PDP test never waited for its async content before scanning, so axe was checking the loading skeleton, not the real page, which already had a real `<h1>` via `PokemonHero`. Fixed the test's wait, not the (non-existent) markup gap. `KNOWN_PRE_EXISTING_RULE_IDS` in `tests/e2e/a11y-scan.spec.ts` now holds only `"color-contrast"` (Phase 2, not this session). See "Thirty-second session" below.** Updated 2026-08-31, thirty-first session. **This (thirty-first) session executed Phase 1 of `docs/archive/EXECUTION-PLAN-quick-improvements.md` (its final phase), closing that plan doc out entirely: extracted `src/utils/searchUrlFragment.ts`, `apiRateLimit.ts`, `apiError.ts`, and `validateRequestBody.ts`, then refactored `SearchUrlSync.tsx` plus the `/api/similar` and `/api/passages` routes to use them, standardizing both routes' error bodies on `{ error: { code, message } }`. The a11y remediation debt Phase 2 found and allowlisted (not fixed) is now scoped as its own doc, `docs/EXECUTION-PLAN-a11y-remediation.md` — including a fresh audit run with concrete element targets/contrast ratios this session captured, not just the prior session's summary. See "Thirty-first session" below.** Updated 2026-08-31, thirtieth session. **This (thirtieth) session executed Phase 2 of `docs/archive/EXECUTION-PLAN-quick-improvements.md`: added `@axe-core/playwright` and a new `tests/e2e/a11y-scan.spec.ts` scanning home, `/search`, a PDP, and `/compare` for automated accessibility violations. The first real run surfaced genuine, pre-existing violations on every route (low-contrast gray text, missing `<main>` landmark, missing top-level heading, unlandmarked content) — not scanner noise. Per user decision, these four rule ids are allowlisted in the new spec (not fixed) so the scanner ships green today; the actual remediation is new, unscoped follow-up work. Phase 1 of that plan doc (utils extraction + API error/validation helpers) is still not started. See "Thirtieth session" below.** Updated 2026-08-31, twenty-ninth session. **This (twenty-ninth) session closed out `docs/EXECUTION-PLAN-seo.md` entirely: got the user's go/no-go on Phase 4 (SSR body content), which came back no — declined, not deferred, with cost/benefit reasoning recorded in the plan doc rather than a silent skip. No code changed. The plan doc is now archived (`docs/archive/EXECUTION-PLAN-seo.md`), all four of its phases resolved (1/2/3 shipped, 4 declined). See "Twenty-ninth session" below.** Updated 2026-08-31, twenty-eighth session. **This (twenty-eighth) session executed `docs/EXECUTION-PLAN-seo.md` Phase 2 only (real `BreadcrumbList` JSON-LD on the PDP) — no org config touched, small app-visible addition (a `<script type="application/ld+json">` in the PDP's server-rendered `<head>`/body). See "Twenty-eighth session" below.** Updated 2026-08-31, twenty-seventh session. **This (twenty-seventh) session executed `docs/EXECUTION-PLAN-seo.md` Phases 1 (metadata & crawlability foundation) and 3 (soft-404 fix), bundled together since both touch the same new PDP server wrapper — no org config touched, but this ships real app-visible behavior (page titles, HTTP status codes). See "Twenty-seventh session" below.** The twenty-sixth session investigated (but could not build, blocked externally) a real multi-turn chat agent — see the "Chat agent" item further down this file. Updated 2026-08-31, twenty-fifth session. **This (twenty-fifth) session executed `docs/archive/EXECUTION-PLAN-responsive-ui.md` end to end — the off-canvas mobile/tablet filter drawer on `/search`, accordion facets, and spacing/overflow fixes across every page — and found a real, previously-unnoticed horizontal-overflow bug in `layout.tsx`'s flex structure during its own screenshot verification step; see "Twenty-fifth session" below.** The twenty-fourth session fixed a real SSR bug the user hit as a React hydration-mismatch error on `/search`: `getSearchEngine()`'s module-level singleton could leak search state across unrelated server requests (Vercel Fluid Compute reuses function instances/module scope across requests), producing server-rendered HTML that didn't match the client's fresh engine — no org config touched; see "Twenty-fourth session" below.** The twenty-third session fixed a real query-state bug the user found by using the running app: a category filter picked up from the home page's Browse-by-type links (`aq`) survived a brand-new search-box query, ANDing a stale type filter into unrelated searches (and starving RGA of results) — no org config touched; see "Twenty-third session" below. The twenty-second session fixed two real layout-stability bugs the user found by eyeballing the running app, no org config touched — see "Twenty-second session" below; the rest of this paragraph covers the twenty-first session and earlier. Phase v2.3 is fully built (seventh session). The tenth session closed v3.1 (sort break) and most of v3.3 (search page data), plus a facet-architecture change (Automatic Facet Generation). The eleventh session did most of v3.2 (branching evolution chain + evolution images) and most of v3.4 (RGA/CPR content-exclusion diagnosis and rules). The twelfth session gave the user the full remaining v3.2/v3.4 console sequence. The thirteenth session executed Batch 2 (chrome restyle + Pokeball search bar). The fourteenth session executed Batch 3 (result tiles + facet type-swatches). The fifteenth session executed Batch 4 (PDP restyle). The sixteenth session executed Batch 5 (RGA scan reveal + scanline citations, passage-retrieval restyle). The seventeenth session executed Batch 6, closing out the v4 design pass entirely (motion/a11y audit + ADR-0013). The eighteenth session did the manual walkthrough + two missing e2e specs, found and fixed two real bugs, then shipped the Vercel deploy (live at https://coveo-pokemon-assessment.vercel.app/). The nineteenth session scoped four follow-up execution-plan docs (see below) and executed Doc 3's original scope (real marketing assets + icon-based Browse-by-type) — that code sat uncommitted until the twentieth session. The twentieth session committed Doc 3's shipped code, resolved Doc 1's open Analytics-volume decision (Branch B) and enabled+verified ART, then built item 1 of 3 (the PDP Similar Pokemon carousel, Doc 2) including a manual-testing UX-fix follow-up (whole-card click, hover pop, scroll arrows). **This (twenty-first) session built items 2 and 3 of the three-item build order — home hero carousel + PDP Highlights (Doc 3 §5), and the async idle/loading/success/error contract on `GeneratedAnswer`/`AskAboutPokemon`/`ResultList` (Doc 4) — closing out all four follow-up execution docs from the nineteenth session, then (same session, after live user review) reworked the hero/PDP/Highlights UI it had just shipped: un-carouseled the home hero in favor of a carousel Browse-by-type, widened Home/Search/PDP to match the header's container width, dropped the PDP's full-bleed backdrop photo for a commerce-style two-column hero, and deleted `PdpHighlights` in favor of folding its one genuinely new field (generation) into the existing Overview tab and Hero — then, after a second round of live feedback, replaced the search page's flat-color facet swatches (Type/Weaknesses/Resistances) with the same real type-icon art the home page's Browse-by-type strip uses, and reordered the facet rail to lead with Type, then Generation, then the rest. See "Twenty-first session" and both "Twenty-first session, continued" entries below for all of it.** What's left project-wide: the two presentation decks, and confirming whether the Phase 0 email/booking + off-cycle ML-rebuild request actually got sent (**deadline 2026-09-06** — user indicated sending both 2026-08-31, still not independently verified) — summarized in "What's next" below. The prior sessions' handoff content is folded into this one; treat this file as the current snapshot, not an addendum.

## Thirty-fourth session — fixed the PDP soft-404 regressing every unconfigured build (CI, forks, preview builds without `.env.local`)

The user reported a GitHub Actions failure: `tests/e2e/unconfigured.spec.ts`'s PDP test couldn't find the Breadcrumb's "Home" link on `/pokemon/pikachu`. Not a missing-secrets-in-CI issue to route around — a real bug in the twenty-seventh session's soft-404 work.

**Root cause**: `fetchPokemonMetadata` (`src/coveo/serverPokemonLookup.ts`) returns `null` for two different reasons — a genuine no-match against a configured org, *and* an unconfigured server (`resolveServerCoveoConfig().configured` false, i.e. no `COVEO_API_KEY`/org id). `src/app/pokemon/[name]/page.tsx` collapsed both to the same `notFound()` call, so any env-less build — CI, a fork, a preview deploy missing `.env.local` — 404s on every `/pokemon/*` route instead of rendering `PokemonDetailPageClient`, which is where `Breadcrumb` and `CoveoConfigBanner` live. This has been broken since the twenty-seventh session shipped the soft-404, just never caught because verification there ran against the live configured org.

**Fix**: `page.tsx` now calls `resolveServerCoveoConfig()` itself and only calls `notFound()` when `!pokemon && serverConfigured` — an unconfigured server has no way to know if a name is real, so it falls through to the client component exactly as `/` and `/search` already do when unconfigured. Also found and fixed a related issue while in there: the BreadcrumbList JSON-LD `<script>` (twenty-eighth session) read `pokemon.name` unconditionally, which would have thrown once `pokemon` could legitimately be `null` past the `notFound()` guard — wrapped it in `{pokemon && (...)}`.

**Tests**: updated `tests/unit/app/pokemon/page.test.ts` to mock `@/coveo/config`'s `resolveServerCoveoConfig` (previously unmocked, silently relying on `process.env` being unconfigured in the test process) and added a case for "unconfigured + null lookup renders the client component" alongside the existing "configured + null lookup 404s" case. Verified `tests/e2e/unconfigured.spec.ts` (all 5) passes with `.env.local` genuinely absent, matching the CI environment — confirmed it fails in the pre-fix state with `.env.local` present but network-blind mode wasn't tried; the local repro that mattered was moving `.env.local` aside entirely. `npm test` (269/269), `npm run lint`, `npm run typecheck` all clean. No org config touched, no ADR needed (bug fix to an existing decision, not a new one).

## Thirty-third session — a11y remediation Phase 2 (color contrast): closed out the plan doc, found one more real violation the prior two audit passes missed

Executed Phase 2 of `docs/archive/EXECUTION-PLAN-a11y-remediation.md`, the plan's final phase, per the plan doc's own two sub-decisions.

**Token fix shape decided by computing contrast, not guessing**: wrote a small `node` script implementing WCAG 2 relative-luminance contrast math and ran it against the actual background colors this text sits on (`--shell-050`/`--shell-000` light, `--shell-900`/`--shell-800` dark) rather than eyeballing hex values.

- `--shell-400` (`#767d8e`) has three non-text consumers in `globals.css` — `.stat-bar-fill`'s fill color, `.evo-stage[data-current]`'s ring, `.pokedex-cursor`'s blink — all decorative, so it was left untouched rather than darkened. A new `--shell-500` token was added for text only. Computed contrast also showed `--shell-400` fails as text in **both** color schemes (3.78:1 light on `--shell-050`, 3.90:1 dark on `--shell-800`), not just light as the plan doc's open question assumed — it's never redefined per scheme, so both needed the fix.
- `--shell-500`: `#616777` in `:root` (5.19:1 / 5.65:1 against the two light backgrounds), overridden inside the existing `@media (prefers-color-scheme: dark)` block to `#8e94a3` (5.95:1 / 5.29:1 against the two dark backgrounds). One `text-shell-500` Tailwind class (via a new `@theme inline` mapping) works unchanged in both schemes since the variable itself flips — no `dark:` variant needed at any call site.
- `text-black/40`/`dark:text-white/40` replaced with `text-shell-500` at every real-text call site (facet-value counts, facet no-matches text, image-placeholder label) — decided "token entirely," not a higher opacity value, so muted text has one definition site-wide. The four "×" close-button call sites (`SearchSummaryBar.tsx`, `FilterDrawer.tsx`, `CompareTray.tsx`) kept `hover:text-black dark:hover:text-white`; only the resting-state class swapped. `marker:text-black/40 dark:marker:text-white/40` (three `<summary>` disclosure-triangle colors) was left alone — decorative, not text, never what axe flagged.

**Real violation found during this session's own verification, not by either prior audit**: after applying the fix and removing `disableRules()` entirely, `npx playwright test tests/e2e/a11y-scan.spec.ts` failed `/search` with a new `color-contrast` node the thirty-first session's audit and this plan doc's Findings section had both missed — `GeneratedAnswer.tsx`'s `ScanSequence` rendered the "pending" RGA step label (a step not yet reached, e.g. `answering` while still `searching`) in `text-shell-200`, measuring 1.49:1 against `--shell-050`. This state only renders while a step is genuinely pending, which neither prior click-through happened to catch mid-stream. Fixed by collapsing the `completed`/`pending` cases to the same `text-shell-500` — the `active` step already has its own `text-foreground underline` treatment carrying the real information (which step is current), so the three-way visual distinction was polish, not a second accessible-contrast tier that would've needed inventing.

**Verified live, not just via the allowlist going empty**: sourced `.env.local` into the shell before running Playwright directly (the test process's own `test.skip()` checks `process.env.NEXT_PUBLIC_COVEO_ORGANIZATION_ID`, which isn't inherited from the `next build && next start` webServer command alone) — `a11y-scan.spec.ts` 4/4 pass against the real org with `KNOWN_PRE_EXISTING_RULE_IDS` and every `disableRules()` call deleted, not just emptied. Re-ran `search.spec.ts`, `ask-about-pokemon.spec.ts`, `a11y-motion.spec.ts` (16/16) — no regressions from the class-name swaps. Screenshotted all four routes at 1280×900 in both `colorScheme: "light"`/`"dark"` via a scratch Playwright script (deleted after use, not committed): muted text reads clearly in both modes, no layout shift.

**Tests:** `npm run lint`, `npm run typecheck`, `npm test` (268/268, unchanged), `npm run test:coverage` (98.46%/92.05%/96.29%/98.44%, no coverage-gated file touched), `npm run build` all clean.

`docs/archive/EXECUTION-PLAN-a11y-remediation.md` (moved from `docs/EXECUTION-PLAN-a11y-remediation.md`) now carries a "Status: complete" header with both phases checked off and the decisions/deviation above recorded. `docs/README.md`'s "Live reference" list lost its entry for the now-archived doc; "Completed execution plans" gained one.

## Thirty-second session — a11y remediation Phase 1 (landmark structure): `<main>` + `<h1>` on all four routes; PDP's flagged violations turned out to be a scan-timing bug in the test, not missing markup

Executed Phase 1 of `docs/EXECUTION-PLAN-a11y-remediation.md`, per the plan doc the thirty-first session wrote. Phase 2 (color contrast) is explicitly out of scope for this session, per user decision when choosing which phase to run.

**Per-route root cause, from re-reading each page before touching anything** (this differed from the plan doc's own assumption in one place — see below):
- Home (`src/app/page.tsx`): no `<main>` anywhere; no `<h1>` at all — a prior session's comment explains it was deliberately dropped in favor of `AppHeader`'s persistent wordmark, but that wordmark is a `<Link>`, not a heading, so the page still needed a real one.
- `/search` (`src/app/search/page.tsx`): already had a `<main>`, but it only wrapped the results column (`SearchSummaryBar`/`DidYouMean`/`GeneratedAnswer`/`ResultList`/`Pager`) — the top `SearchBox` and the facet rail sat outside it, which is why `region` flagged this route. No `<h1>` anywhere on it either.
- PDP (`PokemonDetailPageClient.tsx`): **already had a real `<h1>`** (`PokemonHero.tsx:90`, the Pokemon's own name) and needed a `<main>` added, but the `page-has-heading-one`/`landmark-one-main` violations the thirty-first session's audit recorded for this route were a false positive caused by the audit test itself: `a11y-scan.spec.ts`'s PDP test (unlike its `/search` test, which already waits on `.result-tile`) called `analyze()` immediately after `page.goto()`, before the async search-based content resolved — so it was scanning the loading skeleton (no landmark, no heading) rather than the real page.
- `/compare` (`src/app/compare/page.tsx`): already had a real `<h1>` (`CONTENT.compare.pageTitle`) — just needed the `<main>`.

**Changes:**
- `src/app/page.tsx`, `src/app/search/page.tsx`, `PokemonDetailPageClient.tsx`, `src/app/compare/page.tsx`: each route's outer content `<div>` became a `<main>`. On `/search`, the old inner `<main>` (results column only) was demoted to a `<div>` now that the new outer one covers the whole page. `FacetRail` was already a real `<aside>` landmark (`src/components/FacetRail.tsx:13`) — untouched.
- `src/app/page.tsx` and `src/app/search/page.tsx` gained a visually-hidden `<h1 className="sr-only">` (`CONTENT.brand.name` and `CONTENT.seo.search.titlePrefix` respectively) — sr-only specifically to avoid a second visible heading under the header wordmark on home, matching that page's existing design intent.
- `tests/e2e/a11y-scan.spec.ts`: added `await expect(page.locator("h1")).toBeVisible()` before the PDP scan (mirrors the `/search` test's existing wait pattern) — the actual fix for that route's false-positive violations. `KNOWN_PRE_EXISTING_RULE_IDS` now holds only `"color-contrast"`; the doc comment above it was rewritten to stop describing four violations when only one remains.

**Verified live**, not just via the test suite: ran `next dev` and screenshotted all four routes in both light and dark `prefers-color-scheme` (via a scratch Playwright script, since no chromium-cli was available) — zero visual diff from the `<main>`/sr-only-`<h1>` changes, as expected.

**Tests:** `npm run lint`, `npm run typecheck`, `npm test` (268/268, unchanged — no unit test asserts on this markup) all clean. `npm run build` succeeds. `npx playwright test tests/e2e/a11y-scan.spec.ts` — 4/4 pass with only `color-contrast` disabled (previously 4/4 passed with four rules disabled). Also re-ran `search.spec.ts`, `ask-about-pokemon.spec.ts`, and `a11y-motion.spec.ts` (16/16) against the real org to check the `<main>` swaps didn't disturb anything relying on prior DOM structure — no regressions.

`docs/EXECUTION-PLAN-a11y-remediation.md` updated: Phase 1's three checkboxes checked, with a note on the PDP test-bug finding; status header now "Phase 1 done, Phase 2 not started." Not archived yet — Phase 2 (color contrast) remains open.

## Thirty-first session — Phase 1 of the quick-improvements plan (utils extraction + API error/rate-limit/validation helpers), plan doc closed and archived; a11y remediation debt spun out to its own doc

Executed Phase 1 of `docs/archive/EXECUTION-PLAN-quick-improvements.md` (the plan's only remaining scope after the thirtieth session's Phase 2) per `docs/PROMPT-execute-quick-improvements-phase1.md`. No zod or other new dependency — per that plan doc's decision, the two routes' existing manual `typeof`/type-guard checks were formalized into shared `src/utils/` helpers instead.

**New files:**
- `src/utils/searchUrlFragment.ts` — `toHeadlessFragment()`, moved out of `SearchUrlSync.tsx` verbatim (doc comment included) as a named export.
- `src/utils/apiRateLimit.ts` — `createRateLimiter(windowMs, maxRequests)`, a factory (not a single shared limiter) so `/api/similar` (20 req/min) and `/api/passages` (10 req/min) each get their own independent bucket map — a shared module-level map would have let one client's `/api/passages` burst count against their `/api/similar` limit, which the old duplicated-but-separate code never did.
- `src/utils/apiError.ts` — `ApiErrorCode` (`INVALID_BODY`/`RATE_LIMITED`/`NOT_CONFIGURED`/`UPSTREAM_FAILURE`) and `jsonError(code, message, status)`, following `src/coveo/applicationError.ts`'s normalized-error-typing precedent for the HTTP layer. Both routes' error bodies are now `{ error: { code, message } }` instead of the previous bare `{ error: string }` — same status codes as before (400/403/429/502/503), a response-shape fix only.
- `src/utils/validateRequestBody.ts` — `requireNonEmptyString`, `requireNonEmptyStringArray`, `optionalString`, each returning `{ ok: true, value }` / `{ ok: false, message }`.

**Modified:** `SearchUrlSync.tsx` (shrunk to pure Headless-integration concerns, behavior unchanged — its own test suite passed unmodified), `src/app/api/similar/route.ts`, `src/app/api/passages/route.ts` (swapped in the three helpers; net less code per file).

**Verified live**, not just unit-tested: ran a scratch `next dev` instance and `curl`'d both routes — a bad body on `/api/similar` and `/api/passages` each returned `{"error":{"code":"INVALID_BODY","message":"..."}}`; a 22-request burst against `/api/similar` (limit 20/min) returned `{"error":{"code":"RATE_LIMITED","message":"Too many requests."}}` starting around the 20th request.

**Tests:** `tests/unit/app/api/similar/route.test.ts` and `.../passages/route.test.ts` updated to assert the new envelope shape on every error case, not just status codes. New `tests/unit/utils/{apiError,apiRateLimit,validateRequestBody,searchUrlFragment}.test.ts`. All 268 unit tests pass (247 prior + 21 new). Coverage gate (`/api/similar`, `/api/passages` are gated per `docs/standards-adoption.md` #12) still clean: 98.46%/92.05%/96.29%/98.44% against an 80% threshold — extracting logic out of the gated files only reduced what they cover, it didn't create a gap. `npx playwright test tests/e2e/a11y-scan.spec.ts` re-run to confirm nothing in this refactor touched a11y-relevant markup: 4 passed against the real org.

**a11y remediation, per user decision this session:** rather than leaving the debt the thirtieth session found as a loose paragraph, wrote `docs/EXECUTION-PLAN-a11y-remediation.md` scoping it as its own two-phase plan (landmark/heading structure, then color contrast). Re-ran an ad-hoc axe scan (`withRules()` instead of the spec's `disableRules()`) against all four routes to get concrete element targets and contrast ratios for that doc, rather than re-deriving the thirtieth session's summary from memory — e.g. `text-black/40`/`text-white/40` facet-count labels on `/search` measure **2.82:1** (64 nodes), `text-shell-400` measures **3.78:1** everywhere else it's used, `landmark-one-main` is missing on 3 of 4 routes (not confirmed missing on `/search` itself this run — flagged as worth re-checking), `page-has-heading-one` is missing on 3 of 4 routes (not `/compare`). Not yet started — this is a new open doc, not closed-out work.

Gates clean: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:coverage`, `npm run build`, `npx playwright test tests/e2e/a11y-scan.spec.ts`.

`docs/archive/EXECUTION-PLAN-quick-improvements.md` is now fully done (both phases) and was moved from `docs/EXECUTION-PLAN-quick-improvements.md` into `archive/`, matching this repo's convention of keeping only open plan docs at the top level of `docs/`. `docs/README.md` gained an entry for it in "Completed execution plans," plus a pointer to the new open `EXECUTION-PLAN-a11y-remediation.md` under "Live reference."

## Thirtieth session — automated a11y scanning added (Phase 2 of `docs/archive/EXECUTION-PLAN-quick-improvements.md`); real pre-existing violations found and allowlisted, not fixed

Ran the smaller of the two phases in `docs/EXECUTION-PLAN-quick-improvements.md` (planned twenty-ninth session, executed this session). Added `@axe-core/playwright@4.13.0` as a devDependency — checked its peer dependency (`playwright-core >= 1.0.0`) against the installed `@playwright/test@^1.62.1` before pinning, per the plan doc's own caveat that this needed live verification, not a guess. New `tests/e2e/a11y-scan.spec.ts` follows the exact skip-guard and navigation conventions already established by `a11y-motion.spec.ts`/`search.spec.ts`/`ask-about-pokemon.spec.ts` (same `test.skip(!process.env.NEXT_PUBLIC_COVEO_ORGANIZATION_ID, ...)` gate, same `pikachu`/`eevee` fixtures). Scans four routes: `/`, `/search?q=pikachu`, `/pokemon/pikachu`, and `/compare?names=pikachu,eevee` (the bare `/compare` route only renders an empty-selection message, so query params were needed to get a real comparison table on screen for axe to check).

**The first real run against the live org failed all four tests** with genuine violations, not false positives: `color-contrast` (`text-shell-400` gray text and `text-black/40`/`text-white/40` labels fall below the WCAG AA 4.5:1 threshold — one example measured 3.78:1), `landmark-one-main` (no `<main>` element anywhere in the DOM), `page-has-heading-one` (no top-level heading on some routes), and `region` (page content sitting outside any landmark). This is real, previously-unknown a11y debt this scanner exists specifically to catch — exactly the kind of finding the plan doc anticipated might happen ("filtered to a documented allowlist if a pre-existing, unfixable violation turns up").

Stopped and asked the user rather than either silently allowlisting or silently expanding scope to fix everything (per `CLAUDE.md`'s working-style rule and the work-resume skill's re-scope guidance). User chose "allowlist now, fix later": a `KNOWN_PRE_EXISTING_RULE_IDS` array in the new spec, passed to `AxeBuilder#disableRules()` in every test, with an inline comment naming what was found and pointing back to `docs/EXECUTION-PLAN-quick-improvements.md`. All four tests pass against the real org with this in place; confirmed the skip guard still works correctly with the org env var unset.

**Not done, explicitly out of this session's scope:** the actual remediation — real color-token contrast fixes, adding a `<main>` landmark, adding missing headings, wrapping unlandmarked content — across every route. This is new work discovered this session, not yet written up as its own execution-plan phase or doc. Phase 1 of `docs/EXECUTION-PLAN-quick-improvements.md` (utils extraction, API error/validation helpers) also remains untouched.

Gates clean: `npm run lint`, `npm run typecheck`, `npx playwright test tests/e2e/a11y-scan.spec.ts` (4 passed against the real org; 4 skipped with the org var unset). `npm run test:coverage` not re-run — this session touched no `src/coveo/*` or `src/app/api/*/route.ts` files, so that gate is unaffected. Full `npm test` suite (247 tests) was already confirmed clean earlier this session via the pre-commit hook on an unrelated commit; not independently re-run for this e2e-only change.

## Twenty-ninth session — SEO plan closed out: Phase 4 declined, `docs/EXECUTION-PLAN-seo.md` archived

The user asked directly whether Phase 4 (SSR body content) was worth building. Answer given and accepted: no. Reasoning — Google's crawler already executes JS and gets full content via Phases 1–3's `<head>` metadata plus the client's post-hydration render, so the SEO gain from fixing the brief pre-hydration "not found" flash is close to zero; the cost (threading server-fetched initial data into `PokemonDetailPageClient` without duplicating or breaking its own Headless query, which also drives the Similar Pokemon carousel, Ask About Pokemon, and the exact-match safety-net re-check) is bigger than Phases 1–3 combined; and this is a take-home assessment app evaluated by people, not a production catalog competing for organic ranking — the audience Phase 4 serves (non-JS clients, crawlers) isn't this project's actual audience.

No code changed. `docs/archive/EXECUTION-PLAN-seo.md` (moved from `docs/EXECUTION-PLAN-seo.md`) now carries a "Status: complete" header and Phase 4's section rewritten from "deferred, needs a go/no-go" to "DECLINED" with the reasoning above. `docs/README.md`'s "Completed execution plans" list gained an entry for it. The now-consumed `docs/PROMPT-decide-seo-phase4.md` was deleted rather than left stale, since there's no further SEO work queued.

**What's next, project-wide:** unchanged from before this session — the two presentation decks, and confirming whether the Phase 0 email/booking + off-cycle ML-rebuild request actually got sent (deadline 2026-09-06).

## Twenty-eighth session — BreadcrumbList JSON-LD on the PDP (Phase 2 of `docs/EXECUTION-PLAN-seo.md`)

Executed Phase 2 only, per `docs/PROMPT-execute-seo-phase2.md`. `src/app/pokemon/[name]/page.tsx` (the server wrapper Phase 1 already introduced) now renders a `<script type="application/ld+json">` `BreadcrumbList` alongside `PokemonDetailPageClient`, built by a new `buildBreadcrumbJsonLd(pokemon.name)` helper in that same file — `pokemon` is the same `fetchPokemonMetadata` result `generateMetadata` and the 404 check already use, so this needed no new server fetch and no waiting on the client's own Headless query.

Two things the prompt asked to confirm before writing code, both resolved in favor of the prompt's own inclination:
- **Fixed "Home / `<Name>`" shape always**, not conditioned on `Breadcrumb.tsx`'s `from` prop. `from` only reflects one visit's navigation history (did the user arrive via a search-result click); structured data describes the page's permanent site position, which doesn't change per visit. `Breadcrumb.tsx`'s own visible three-crumb UI (when `from` is present) is untouched — this was a JSON-LD-only decision, no second source of truth was created since the JSON-LD only ever needs `pokemon.name`, which `Breadcrumb.tsx` doesn't even require to render its "Home" and current-page crumbs.
- **`pokemon` from the server-side `fetchPokemonMetadata` call was sufficient** — no need to thread anything from the client's Headless query. `item` URLs use `SITE_URL` (already established by Phase 1) for absolute paths; `name` uses `pokemon.name`'s canonical casing, matching `generateMetadata`'s canonical link (not the raw, possibly differently-cased route param).

Verified live (build on port 3101, real org data): `pikachu` renders the exact JSON-LD `{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://coveo-pokemon-assessment.vercel.app"},{"@type":"ListItem","position":2,"name":"Pikachu","item":"https://coveo-pokemon-assessment.vercel.app/pokemon/Pikachu"}]}`; `not-a-real-pokemon` still 404s (Phase 3 unaffected). Gates clean: `npm run lint`, `npm run typecheck`, `npm test` (247 passed, unchanged — this file isn't coverage-gated and had no prior test suite), `npm run build`.

**Not done, matching the prompt's explicit scope boundary:** Phase 4 (SSR body content) was not started — it's still gated on a separate go/no-go decision from the user, not assumed in scope by this session. That decision is still open.

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

## Sixteenth session — v4 design pass, Batch 5 (AI surfaces)

Executed execution-order step 9 of `docs/archive/EXECUTION-PLAN-v4-design-system.md` (§7/§8/§11), building on Batches 1–4 (already landed uncommitted). No Coveo org config touched; no controller/query behavior changed — specifically, **no `fieldsToIncludeInCitations` was added** to `buildGeneratedAnswer`'s initial state, even though that would have been the obvious way to get a citation's Pokemon type directly. It was rejected as exactly the kind of controller-config change plan §1 restricts to the two named `SearchBox` exceptions; see the citation-coloring paragraph below for what was done instead.

**`generatedAnswerRenderState.ts` — one new `streaming` arm, not a parallel state machine.** Before this session, `state.answer` truthy alone produced `{ status: "answer" }` regardless of `state.isStreaming` — a partially-streamed answer and a finished one were indistinguishable, so the component had no signal to drive the cursor/reveal treatment differently. Now: `state.answer` truthy + `state.isStreaming === true` → `{ status: "streaming", answer }`; `state.answer` truthy + `isStreaming === false` → `{ status: "answer", answer }` (unchanged shape/behavior from before). `loading`/`hidden` arms untouched. `tests/unit/coveo/generatedAnswerRenderState.test.ts` updated in the same commit: the existing "returns the answer text" case now pins `isStreaming: false` explicitly, plus a new case for the `streaming` arm — all via exact `toEqual`, per the file's existing convention.

**`GeneratedAnswer.tsx` — instrument-readout frame.** Rewritten around a `Panel` wrapper: mono-uppercase `CONTENT.answer.panelLabel` ("Pokedex entry", displayed uppercase via the existing `.font-mono-label` CSS class — the string itself stays sentence-case in `pokedex.ts` since the class owns the transform) over a `border-t border-shell-600/40` rule, no rounded-card background. A new `ScanSequence` component renders the real `searching`/`thinking`/`answering` steps from `state.generationSteps` (not simulated — `GENERATION_STEP_NAMES` isn't re-exported as a *value* from `@coveo/headless`'s public entry, only as a type, so a local `STEP_ORDER` constant mirrors it) with three visual states: pending (`text-shell-200`), active (`text-foreground` + underline — **not** `--signal-red`, which stays restricted to the Pokeball glyph + focus ring per plan §3.2), completed (`text-shell-400`). `AnswerBody` splits the streamed answer on blank lines (`\n{2,}`) into blocks, each wrapped in a `.pokedex-line` div keyed by array index; a block already on screen never remounts as later deltas only extend the final (still-growing) block, so `.pokedex-line`'s 180ms fade-up-on-mount CSS animation fires exactly once per completed block — this *is* the native stream doing the reveal, no typewriter buffering layered on top (plan §2.2). `.pokedex-cursor` (blinking block, `animation: pokedex-cursor-blink 1s step-end infinite`) renders only while `renderState.status === "streaming"`, gone the instant it flips to `"answer"`. Feedback thumbs-up/down now only render once streaming has finished (a small product call, not in the plan's literal text: liking/disliking a still-growing answer read as premature).

**Citations — scanline tags, no inline highlighting.** The old numbered `<ol>` (`[1] Title`) and the "Grounded in N sources" line are both gone, replaced by one `<ul>` of `⟶ retrieved from: {citation.title}` tags (`CONTENT.answer.citationPrefix` reused, unchanged copy). `buildInteractiveCitation`'s `.select()` click-tracking is preserved on each tag's anchor. Per plan §2.1, no attempt was made to locate a citation's span inside the answer text — `GeneratedAnswerCitation` carries no offset/position fields and `citation.text` is a paraphrase of the source, not an answer substring. **Real-data citation coloring, not fabrication and not a controller-config change**: `CitationTag` resolves a type color by building a *second* `buildResultList(engine)` instance purely to read the already-fetched, already-rendered `ResultList`'s state (multiple controller instances of the same kind share one store slice per engine — this issues no new request) and matching each citation's `permanentid` (a standard Coveo system field present on `result.raw` regardless of `fieldsToInclude`) against the currently displayed results' `result.raw.permanentid`, then reads that result's `pokemontype` the same way `mapPokemonResult.ts` does. A citation whose document isn't among the currently-rendered results degrades to the plain neutral-bordered tag (`data-has-type="false"`) rather than guessing a color — this is the graceful-degradation path, expected to be common (RGA's top-ranked source documents don't always coincide 1:1 with the visible result page). New CSS: `.scan-citation` in `globals.css`, tint/edge via the standard `color-mix(in oklab, var(--type-primary) …)` recipe (§3.1), `--type-primary` set inline only when a color resolved.

**`AskAboutPokemon.tsx` (PDP passage retrieval) — restyled, not reframed.** Per `docs/passage-retrieval-pov.md`'s standing position (reiterated by plan §8), the three passages stay three separate `<li>` cards — never merged into one answer-shaped block — each still showing its own `Passage N` label and `Relevance: N%` score, both pinned by `tests/e2e/ask-about-pokemon.spec.ts`'s regex/count assertions and left byte-identical. **The direct-child structure survived**: `<ol aria-label="Passages">` still has `<li>` as its immediate children with nothing inserted between them — re-verified by running the e2e spec live (see Verification below), not just by inspection, since that selector is a documented one-change-breaks-it risk. New this session: each card is now keyed by `passage.document.primaryid` (was array `index`), tinted/edged via `.passage-card`'s `color-mix()` recipe off `--type-primary` (a new `pokemonTypes` prop threaded from `page.tsx`'s already-fetched `item.types`, same decorative-only/`types[0]`-isn't-primary posture as every other type-lit surface), and reveals with a one-time staged `passage-fade-in` (220ms, `animationDelay: index * 90ms` per card) since the response is complete rather than streamed — no cursor, no per-line splitting inside a passage (unlike RGA's `AnswerBody`, deliberately: plan §8 explicitly warns `PokemonMarkdown` consumes `|`/`#`/`**` into structure, so a passage's rendered DOM text isn't character-identical to `passage.text`, and passages are often raw move tables per `docs/HANDOFF.md`'s CPR-staleness note — no substring/line inference was attempted against that markdown). `document.title` (returned by `/api/passages` today but never rendered before this session) now surfaces via the same `⟶ retrieved from:` tag motif as RGA's citations, reusing `CONTENT.answer.citationPrefix` across both AI surfaces for one consistent attribution language. No `uri` field on the payload, so this stays plain text, not a link, per the plan's explicit note.

**Verification.** `npm run lint` clean. `npm run typecheck` clean. `npm test` — 193/193 unit tests pass (29 files), including the two updated `generatedAnswerRenderState.test.ts` cases. `npm run test:e2e` as shipped: the same 4 pre-existing `unconfigured.spec.ts` failures documented since the thirteenth session (this dev machine's `.env.local` has a live org configured, so the app is never actually "unconfigured" when Playwright's `webServer` boots it — standing local-environment mismatch, not a regression). Ran the RGA/passage-touching specs (`ask-about-pokemon.spec.ts` ×2, `search.spec.ts` ×4) with `NEXT_PUBLIC_COVEO_ORGANIZATION_ID` etc. exported into the Playwright process itself — all 6 pass, including the fragile `[aria-label="Passages"] > li` `toHaveCount(3)` assertion and the `/Relevance: \d+(\.\d+)?%/` regex, confirming the restyle didn't disturb either contract.

Files touched: `src/coveo/generatedAnswerRenderState.ts`, `src/components/GeneratedAnswer.tsx`, `src/components/AskAboutPokemon.tsx`, `src/app/pokemon/[name]/page.tsx` (new `pokemonTypes` prop threaded to `AskAboutPokemon`), `src/content/pokedex.ts` (`answer.panelLabel` reworded, `answer.groundedInSources` removed as dead code — its "Grounded in N sources" line no longer renders anywhere), `src/app/globals.css` (new `.pokedex-line`/`.pokedex-cursor`/`.scan-citation`/`.passage-card` rules). Tests: `tests/unit/coveo/generatedAnswerRenderState.test.ts` updated in the same commit per the coverage gate.

**Not done this session** (later batch per the plan): the motion/a11y pass (execution-order step 10 — `prefers-reduced-motion` audit across *all* animations including this session's new ones, though `.pokedex-line`/`.pokedex-cursor`/`.passage-card` each already got their own reduced-motion override as they were built, matching the rest of the codebase's pattern of pairing an animation with its override in the same commit rather than deferring it) and the ADR + final handoff write-up (execution-order step 11) — still pending.

## Fifteenth session — v4 design pass, Batch 4 (PDP)

Executed execution-order step 8 of `docs/archive/EXECUTION-PLAN-v4-design-system.md` (§9/§11), building on Batches 1–3 (tokens/typography/content/`ImageSlot`, chrome/Pokeball search bar, result tiles/facets — already landed uncommitted). No Coveo org config touched; no controller/query behavior changed.

**Test-first, per the plan's explicit ordering.** `tests/unit/components/ui/StatBar.test.tsx` was rewritten from asserting `container.querySelector(".bg-black\\/85")` + inline `style.width` to the `role="meter"`/`aria-valuenow`/`aria-valuemin`/`aria-valuemax` contract the component already exposed — run and confirmed green against the *pre-restyle* `StatBar` first, then `StatBar.tsx` was restyled and the same test re-run green again. The fill-width assertions became aria-attribute assertions (`aria-valuenow` reports the real, unclamped value even past `max`; the caller/consumer computes the visual percentage from `aria-valuenow`/`aria-valuemax`), which is a stronger contract than the old literal-class check, not a weaker one.

**`StatBar` restyle.** The fill (`.stat-bar-fill` in `globals.css`) is type-colored via `background-color: var(--type-primary, var(--shell-400))`, with `--type-primary` set as an inline style on `PokemonStatPanel`'s wrapper (new `types` prop, decorative-only per §2.3 — never labeled "primary"). Width-in-on-mount animation uses CSS `@starting-style` (`width: 0%` at first paint, transitioning to the real inline `width: N%` over 700ms), not a JS-driven transition — the same "gate motion in exactly one CSS rule" posture already used for the Pokeball glyph. `prefers-reduced-motion: reduce` sets `transition: none` on `.stat-bar-fill`; unlike the Pokeball glyph's rules, there's no `[data-state="..."]` attribute-selector sibling raising specificity here, so no `!important` was needed — same specificity, later in the cascade, wins outright. **Verified, not just declared**: new e2e test `tests/e2e/search.spec.ts` ("StatBar's fill transition is disabled under prefers-reduced-motion") loads `/pokemon/pikachu` under `page.emulateMedia({ reducedMotion: "reduce" })` and asserts `getComputedStyle(fill).transitionDuration === "0s"` — a real computed-style check, per the class of bug batch 2 found doing exactly this for the search bar. `MAX_BASE_STAT` (255) kept as the absolute scale, unchanged.

**PDP layout.** `pokemon/[name]/page.tsx`'s container: `max-w-2xl` → `max-w-5xl`. The hero backdrop `ImageSlot` breaks out to full viewport width via the standard `left-1/2 right-1/2 mx-[-50vw] w-screen` trick, so it reads as a band rather than a boxed image inside the max-w container. `PokemonHero.tsx`'s sprite grew from `h-40 w-40` (160px) to `size-55`/`sm:size-90` (220px/360px) and overlaps the band above it via `-mt-32`/`sm:-mt-48`. The dex number renders twice: its existing small mono line next to the name, plus a new oversized (`text-[7rem]`/`sm:text-[10rem]`, intentionally off the 6-step type scale — logged as a sanctioned `design-system-font-size` ignore, not a violation) low-opacity (`text-shell-400/15`) mono watermark centered behind the sprite. Per the existing warning comment (now updated, not removed): only the `#` prefix is added to `dexNumber`, never a `padStart`, since the source field already arrives zero-padded to four digits.

**`TypeDefenses.tsx`** now pairs `TypeSwatch` (the exact component the type facet uses, from batch 3's `AutomaticFacets.tsx`) with a `Chip variant="type"` label per weakness/resistance — same swatch-plus-label pattern as the facet row, `selected` hardcoded `false` (no selection state on a display-only list). Satisfies the color-alone rule (swatch is `aria-hidden`, `Chip` always carries the visible type name).

**`EvolutionChain.tsx`** became a horizontal row of `.evo-stage` tiles (new class in `globals.css`) separated by a plain arrow, sprite + name each. The current stage gets a `--type-edge` ring (`box-shadow` using `color-mix(in oklab, var(--type-primary) 55%, transparent)`, mixed in oklab for the same ice/steel-greying reason as the result tile's glow) — its color comes from two new optional props, `currentImageUrl`/`currentTypes`, threaded from `page.tsx`'s already-fetched `item.imageUrl`/`item.types` (no new query). **Deviation from the plan's literal prose, flagged rather than silently resolved**: §9 describes "the trigger condition between them" (e.g. a level or evolution-stone label), but neither `EvolutionTarget` (`mapPokemonResult.ts`) nor `docs/coveo-source-spec.md`'s evolution-chart extraction carries that field — there is no real per-branch trigger data in the index today. Per plan §1's no-fabricated-data constraint (which overrides the rest of the plan on conflict), no trigger text was invented; the arrow between stages stayed a plain arrow. Adding that field is index/extraction scope, not this presentational batch's — flagged here for a future session rather than fabricated to fill the visual slot.

**`Tabs.tsx`** restyled to `font-mono-label` (uppercase, `+0.08em` tracking) with a `border-signal-red` 2px active underline, replacing the old rounded-top-bordered-box active state. **Note on plan §3.2 tension, not resolved here**: §3.2 states `--signal-red` is "restricted to exactly two uses: the Pokeball glyph and the global focus ring," but §9 explicitly directs "Tabs restyle to ... a `--signal-red` active underline" — a third use. Implemented per §9's explicit, batch-scoped instruction (the more specific and more recently-written direction), but the tension between the two sections is real and worth a one-line fix to §3.2's "exactly two" if the third use is intentional going forward.

**Verification.** `npm run lint` clean, `npm run typecheck` clean, `npm run build` succeeds. `npm test` — 192/192 unit tests pass (29 files), including the rewritten `StatBar.test.tsx`, `EvolutionChain.test.tsx` (8/8, `<img>`/`alt=""` sprite contract preserved), `Tabs.test.tsx` (8/8, inactive panel still unmounted via `null`, not `hidden`-only), and `TypeDefenses.test.tsx` (4/4, `getByText` on the type name still resolves through the new `TypeSwatch`+`Chip` pairing). `npm run test:e2e` as shipped: same 4 pre-existing `unconfigured.spec.ts` failures documented since the thirteenth session (this dev machine's `.env.local` has a live org configured, so the app is never actually "unconfigured" when Playwright's `webServer` boots it — a standing local-environment mismatch, not a regression). Ran the 6 "configured" e2e tests (`search.spec.ts` ×4 including the new reduced-motion StatBar test, `ask-about-pokemon.spec.ts` ×2) with `NEXT_PUBLIC_COVEO_ORGANIZATION_ID` etc. exported into the Playwright process itself — all 6 pass, confirming the PDP restructure didn't disturb the `heading level 1` hero-name contract `e2e/search.spec.ts` already scoped on (still `<h1>`), and that the reduced-motion StatBar fix is real under a live render, not just declared in CSS.

Files touched: `src/app/pokemon/[name]/page.tsx`, `src/components/PokemonHero.tsx`, `src/components/PokemonStatPanel.tsx`, `src/components/ui/StatBar.tsx`, `src/components/TypeDefenses.tsx`, `src/components/EvolutionChain.tsx`, `src/components/ui/Tabs.tsx`, `src/app/globals.css` (new `.stat-bar-fill`/`.evo-stage` rules), `src/content/pokedex.ts` (new `pdp.sectionHeadings.stats` label). Tests: rewrote `tests/unit/components/ui/StatBar.test.tsx`; added a reduced-motion case to `tests/e2e/search.spec.ts`.

**Not done this session** (later batches per the plan): RGA scan reveal + passage-retrieval styling (§7/§8, execution-order step 9), the motion/a11y pass (execution-order step 10), and the ADR + final handoff write-up (execution-order step 11) — all still pending.

## Fourteenth session — v4 design pass, Batch 3 (result tiles + facets)

Executed execution-order steps 6–7 of `docs/archive/EXECUTION-PLAN-v4-design-system.md` (§11), building on Batches 1–2 (tokens/typography/content/`ImageSlot` + chrome/Pokeball search bar, already landed uncommitted). No Coveo org config touched; no controller/query behavior changed.

**Step 6 — Result tiles (`src/components/ResultList.tsx`'s `ResultCard`, `src/components/ui/Chip.tsx`).** Dropped the drawn `border border-black/10` from the `<li>`; the tile is now `.result-tile` (new class in `globals.css`), lit by a `::before` pseudo-element using `--type-primary`/`--type-secondary` custom properties set per-card via inline `style` (CSP-permitted). `data-glow="single"` gets the radial `color-mix(in oklab, ...)` glow; `data-glow="dual"` (both types present and different) gets the 135° linear gradient — the *preferred* treatment per plan §2.3, since `types[0]` isn't a verified primary type. Glow intensity "roughly doubles" on hover/focus via an opacity step (0.55 → 1) against the same gradient stops, not a re-mixed percentage (`color-mix()` percentages aren't independently transitionable). Sprite gets a `sizes` prop on `next/image` (there was none before — Next was serving the largest candidate for every tile) and a `mt-[-12%]` bleed past the tile's own padding so it overflows the top edge. Dex number and a new compact stat-total bar (`role="meter"`, absolute-scaled against `MAX_BASE_STAT * 6`) sit at `opacity-0` at rest, revealed via `group-hover`/`group-focus-within` so nothing reflows. Synchronized hover: sprite (scale), name + dex number (one `group`) move together; type chips are excluded from the group and always render at full solid color. Type badges switched from `Chip variant="type"` (12%-alpha tint) to a new `variant="type-solid"` (full-strength fill, text color from `getTypeTextColor()`) — added as a third variant on the existing `Chip` component, not a rewrite; `data-variant` contract preserved. Grid gap raised `gap-4` → `gap-6` for the larger sprites; 2/3/4-column grid unchanged. `--signal-red` was deliberately **not** used for the hover highlight (it's restricted to the Pokeball glyph + focus ring per plan §3.2) — used an underline (`decoration-transparent` → `decoration-current`) instead.

**Step 7 — Facets (`AutomaticFacets.tsx`, `Facet.tsx`, `FacetSpeed.tsx`, `BrowseByType.tsx`).** New `src/components/ui/TypeSwatch.tsx`: a 24px color-swatch-in-32px-hit-target with a 2px ring + check mark when selected, decorative only (`aria-hidden`), resolving its own color from a type-name label via `getTypeColor()`/`getTypeTextColor()`. `AutomaticFacetFieldset` now renders it (wrapped with a visually-hidden `sr-only` native checkbox, not a replacement for one) alongside the existing `Chip variant="type"` for every `CHIP_FIELDS` value (type/weaknesses/resistances — all are literal type names, so all three get the swatch, not just the `pokemontype` facet specifically). `FacetSpeed.tsx` and the non-chip branch of `AutomaticFacets.tsx` (generation, egg groups) are untouched — conventional checkbox + text only, per plan §6 ("swatching a non-color dimension is decoration without meaning"). `BrowseByType.tsx` (home page static type pills, no facet/selected-state) was **not** touched — it's in the plan's §6 file list only as a cross-reference, has no selection state for a swatch's check-mark to represent, and already renders `Chip variant="type"`; a scope call, flagged here rather than silently expanded. Also fixed, as the plan explicitly calls out: `Facet.tsx`'s facet-search branch rendered a `<button>` where the normal branch renders a checkbox — now both branches render a `<label>` + `<input type="checkbox">` (the search-result checkbox always renders unchecked, since `SpecificFacetSearchResult` carries no selected-state flag; checking it still calls the same `facet.facetSearch.select(result)`). No existing test covers `Facet.tsx` directly, so this had no test-contract risk.

**Verification.** `npm run lint` clean, `npm run typecheck` clean, `npm test` — 192/192 unit tests pass (29 files), including `AutomaticFacets.test.tsx` and `FacetSpeed.test.tsx` (`within(row).getByRole("checkbox")` on the `<li>` row, unmodified) and `ui/Chip.test.tsx` (`data-variant` contract, unmodified — its own assertions never covered `type-solid` since that variant is new, but the existing three tests all still pass unchanged). `npm run build` succeeds. `npm run test:e2e` as shipped: same 4 pre-existing `unconfigured.spec.ts` failures documented in the thirteenth session (this dev machine's `.env.local` has a live org configured, so the app is never actually "unconfigured" when Playwright's `webServer` boots it — a standing local-environment mismatch, not a regression; not reverified via `git stash` again this session since the thirteenth session already did that against a pristine checkout). Ran the 5 "configured" e2e tests (`search.spec.ts` ×3, `ask-about-pokemon.spec.ts` ×2) with `NEXT_PUBLIC_COVEO_ORGANIZATION_ID` exported into the Playwright process itself — all 5 pass, including `search.spec.ts`'s `role="list"`/`aria-label="Search results"` assertion and the multi-value-type-chip check, confirming the tile restyle didn't disturb the pinned `<ul role="list">`/`<li>` structure or the compare-checkbox-outside-`<Link>` placement (left untouched in this batch).

Files touched: `src/components/ResultList.tsx`, `src/components/ui/Chip.tsx`, `src/components/AutomaticFacets.tsx`, `src/components/Facet.tsx`, `src/app/globals.css` (new `.result-tile`/`::before` glow rules). New: `src/components/ui/TypeSwatch.tsx`.

**Not done this session** (later batches per the plan): PDP hero/stat-bar/evolution restyle (§9 — actually plan's §9, execution-order step 8), RGA scan reveal + passage-retrieval styling (§7/§8, execution-order step 9), the motion/a11y pass (execution-order step 10), and the ADR + final handoff write-up (execution-order step 11) — all still pending.

## Thirteenth session — v4 design pass, Batch 2 (chrome + Pokeball search bar)

Executed execution-order steps 4–5 of `docs/archive/EXECUTION-PLAN-v4-design-system.md` (§11), building on Batch 1's tokens/typography/content-extraction (already landed, uncommitted, lint/typecheck/test/build clean at session start). No Coveo org config touched; no controller/query behavior changed except the two deliberate `SearchBox.tsx` fixes called out in the plan's §4.1.

**Step 4 — Chrome.** Restyled `AppHeader.tsx`, `ui/Tabs.tsx`, `Breadcrumb.tsx`, `Pager.tsx`, and the page shells (`app/page.tsx`, `app/compare/page.tsx`, `app/pokemon/[name]/page.tsx`) off the old `border-black/10 dark:border-white/15` / `text-black/60 dark:text-white/60` pairs onto the `--shell-*` ramp from Batch 1 (`border-shell-100 dark:border-shell-600`, `text-shell-400`, `text-foreground` — the last one already flips with `prefers-color-scheme` via the existing `--foreground` custom property, so no `dark:` variant is needed for it at all). Deliberately left alone: semantic error red (`text-red-600 dark:text-red-400` in the two page shells) and `ConfigRequiredDialog.tsx`'s amber warning colors — neither is part of the quiet chrome ramp per plan §3.2. `src/app/search/page.tsx` had no `dark:` usages to begin with. Scope was the plan's own explicit Step-4 file list, not every one of the ~133 `dark:` sites in the repo — the rest (ResultList, facets, PDP panels, GeneratedAnswer, AskAboutPokemon) belong to later batches (6–9) per the plan's own execution order and weren't touched here.

**Step 5 — Pokeball search bar.** New `src/components/ui/PokeballGlyph.tsx`: a custom SVG (no emoji, no icon library) with the four addressable parts the plan specifies (`shell-top`/`shell-bottom` semicircle `<g>`s, a `<rect id="band">`, a `<circle id="button">`), driven by a `data-state` prop (`idle`/`focus`/`loading`/`settle`). All motion lives in `globals.css` as CSS keyframes/transitions gated on `[data-state]`, not inline JS animation — `shell-top` pivots on the band's left edge via `transform-box: view-box; transform-origin: 3px 16px` (not the element's own asymmetric bounding-box center, which `transform-box: fill-box` would have given). The spin keyframe (`pokeball-spin`) is non-linear (wobble via non-uniform keyframe stops), per the plan's explicit "constant linear rotate reads as a generic loader" warning.

`SearchBox.tsx`'s state machine: `isLoading = state.isLoading || state.isLoadingSuggestions` (both confirmed present but previously unused on `SearchBoxState`) drives the "loading" glyph state directly; the loading→not-loading transition is caught **during render** (React's documented "adjust state while rendering" pattern, comparing against a `prevIsLoading` state variable) rather than in a `useEffect` body, and one `useEffect` expires the resulting one-shot `isSettling` flag after `SETTLE_DURATION_MS` inside an async `setTimeout` callback. This split was necessary, not stylistic — the natural-looking `useEffect(() => { setGlyphState(...) }, [isLoading, isFocused])` version tripped this repo's `react-hooks/set-state-in-effect` ESLint rule (a synchronous `setState` call directly in an effect body); the working version calls `setState` either during render (React-blessed, not effect-based) or inside a genuinely async callback.

**`prefers-reduced-motion: reduce` — coded, then actually verified, and the first version was wrong.** The initial `@media (prefers-reduced-motion: reduce)` override block in `globals.css` used bare `.pokeball-shell-top`/`.pokeball-button` selectors, which have *lower* CSS specificity than the `.pokeball-shell-top[data-state="loading"]` etc. rules already in the stylesheet — so the override silently lost the cascade and the spin kept running even with reduced motion forced on. Caught by an actual computed-style check (a standalone HTML file with the real compiled production CSS inlined, loaded in Playwright with `page.emulateMedia({ reducedMotion: "reduce" })`, asserting `getComputedStyle(...).animationName`/`.transform` — not a visual glance or "the media query is present in the CSS" check). Fixed with `!important` on the reduced-motion block (documented inline in `globals.css` as deliberate, not a lazy specificity shortcut) and re-verified: under reduced motion, `shell-top`'s `animationName` is `"none"` and `transform` is the identity matrix in all four states (idle/focus/loading/settle — no rotation at all, focus included), and the button substitutes `pokeball-opacity-pulse` for both loading (infinite) and settle (one-shot) instead of the scale/spin motion. Under normal motion preference, both `pokeball-spin` (loading) and `pokeball-settle` (the one-shot ease-to-rest) render as expected.

**`SearchBox.tsx`'s two deliberate behavior changes (plan §4.1):**
1. Added `onBlur` (there was none before — the suggestion dropdown could never close on its own). The suggestion buttons use `onMouseDown={(e) => e.preventDefault()}` to prevent them from stealing focus (and thus firing `onBlur`, which would close/unmount the list before the paired `onClick` could fire) — the standard combobox-popup fix for that mousedown/blur race.
2. Full combobox ARIA: `role="combobox"` + `aria-expanded`/`aria-controls`/`aria-autocomplete="list"`/`aria-activedescendant` on the input, `role="listbox"`/`role="option"`/`aria-selected` on the dropdown, plus Up/Down/Escape/Enter keyboard handling (previously only Enter was handled, and only for submit — arrow keys did nothing, suggestions were mouse/Tab-only). `dangerouslySetInnerHTML` for `suggestion.highlightedValue` kept as-is (Coveo's own `<b>` highlight markup, not a bug).

New `tests/unit/components/SearchBox.test.tsx` (9 tests) covers ArrowDown/ArrowUp traversal (including no-wrap at both ends), Escape closing without clearing, Enter-with-highlight selecting the suggestion vs. Enter-with-nothing-highlighted submitting the raw query, blur closing the dropdown, and the mousedown-preventDefault click-selection path.

**e2e status — 4 pre-existing failures, confirmed unrelated to this batch, not touched.** `tests/e2e/unconfigured.spec.ts` has 4 tests that assert `isCoveoConfigured() === false` behavior (config banner, alertdialog popup, etc.), but this dev machine's `.env.local` has a real, live org configured (`NEXT_PUBLIC_COVEO_ORGANIZATION_ID=venkateshpokemonchallenges0qp5rpy`) — so the app genuinely is configured when Playwright's `webServer` boots it, and those 4 assertions fail regardless of any code change. **Verified via `git stash` against a pristine `main` checkout that all 4 fail identically before any Batch 2 code existed** — this is a standing local-environment mismatch (the top-level Playwright test process doesn't inherit `.env.local`, but Next's own dev/prod server subprocess does), not a regression, and not something to paper over by weakening the assertions. Separately confirmed all 6 "configured" e2e tests (`search.spec.ts` ×3, `ask-about-pokemon.spec.ts` ×2, plus one `unconfigured.spec.ts` test that doesn't depend on the unconfigured state) pass with `NEXT_PUBLIC_COVEO_ORGANIZATION_ID` exported into the Playwright process itself — i.e. the ARIA/keyboard/`onBlur` changes don't break real search, typeahead, PDP navigation, or passage retrieval against the live org. No e2e spec needed rewriting for this batch.

Full verification run this session: `npm run lint` clean, `npm run typecheck` clean, `npm test` — 192/192 unit tests pass (29 files), `npm run build` succeeds. `npm run test:e2e` as shipped in this repo's config: 6 passed / 4 pre-existing-and-unrelated failures (see above).

Files touched: `src/components/AppHeader.tsx`, `src/components/ui/Tabs.tsx`, `src/components/Breadcrumb.tsx`, `src/components/Pager.tsx`, `src/app/page.tsx`, `src/app/compare/page.tsx`, `src/app/pokemon/[name]/page.tsx`, `src/app/globals.css`, `src/components/SearchBox.tsx` (rewritten). New: `src/components/ui/PokeballGlyph.tsx`, `tests/unit/components/SearchBox.test.tsx`.

**Not done this session** (later batches per the plan): result-tile restyle (§5), facet swatches (§6), RGA scan reveal (§7), passage-retrieval styling (§8), PDP hero/stat-bar/evolution restyle (§9), the motion/a11y pass (§10), and the ADR + final handoff write-up (§11 step 11) — all still pending.

## Twelfth session — full remaining v3.2/v3.4 console sequence handed off (Fields, mappings, Full port, Chunk Inspector, RGA prompt enhancement)

Gave the user the complete remaining sequence from the eleventh session's "Prompt for next session" as exact numbered console steps, after confirming each mechanic live against docs.coveo.com rather than from memory (per this project's standing rule). One correction made to the user's own proposed plan before writing the steps: Fields are org-level (already established in the eleventh session for `pokemonevolvesto`'s Multi-value change), so the two new Fields (`pokemonevolvesfromimageurl`, `pokemonevolvestoimageurl`) only need creating once, not once per source as the user's step 2 implied — what actually needs porting per-source is the Web Scraping Configuration selectors **and** the Fields & Mappings entries. That mapping step (source Mappings tab → Add → Mapping → Field + Rules `%[fieldname]`) was missing entirely from the user's own 5-step list — without it the newly-extracted metadata would be invisible in the index, the same "unmapped metadata is invisible" trap this project already knew about (sixth session) resurfacing on a third field pair.

**New from this session's doc reads, not previously confirmed:**
- `docs.coveo.com/en/1982` (Add a field) — confirmed multi- vs single-valued is set via the mutually-exclusive **Facet**/**Multi-value facet** toggle pair on the Add-a-field screen, not a separate "Multi-value" checkbox — matches the sixth session's finding #2 about this being one mutually-exclusive choice, now confirmed from the actual doc rather than inferred from console behavior alone.
- `docs.coveo.com/en/1640` (Manage source mappings) — confirmed the Mappings tab flow: Sources → source → **Mappings** (Action bar) → **Edit mappings** → **Common** tab → **Add** dropdown → **Mapping** → select **Field**, enter **Rules** (`%[fieldname]` syntax) → **Apply mapping** → **Save and rebuild source**. (Sixth session referred to this same field as "Content"; current docs call it "Rules" — flagged for the user to double-check which label the live console actually shows, in case the UI has changed since the sixth session or the terminology differs from the doc.)
- `docs.coveo.com/en/nb6a0085` (RGA models) — **rendered fully this session**, unlike the eleventh session's attempt at the same URL (which hit the JS-rendering limitation and only got the Prompt Enhancement path from a web-search snippet). Directly confirms: Models → select model → Edit → **Configuration** tab → under **Prompt enhancement** → enable **Prompt instruction** → enter text (2,000-char limit) → Save. No longer an unconfirmed path — this is now a direct-fetch confirmation, not a search-snippet inference.
- `docs.coveo.com/en/nb6a0085`, `en/nb890247` (Semantic Encoder), `en/oaie5476` (Passage Retrieval) — all three state the same default: **"The model is preconfigured to rebuild and update the embeddings weekly based on when the model is created."** This resolves the eleventh session's "genuinely unresolved" question: a source reindex does not by itself trigger an immediate model rebuild; models pick up new content on their own weekly cycle by default, unless a config change forces a rebuild as a side effect of saving (also confirmed in the same pages) or the user contacts their Account Manager for a different interval. Chunk Inspector is still the actual ground truth regardless of what a model's status shows, per the eleventh session's own framing — this doesn't change that.
- `docs.coveo.com/en/1894` and a guessed `en/l1p9c0166` URL (404) — dead ends, no useful content.

**Step 1 (two new Fields + metadata + mappings on `Pokedex - Test`) — done and live-verified this session.** One real bug caught and fixed along the way: after the first rebuild, `pokemonevolvestoimageurl` came back as a single semicolon-joined string (`"...raichu.jpg;...raichu-alolan.jpg"`), not an array — the field had been created without **Multi-value facet** enabled, so Coveo wasn't splitting the semicolon-joined raw value (the same Facet/Multi-value-facet mutual-exclusivity this session's `en/1982` doc read described). Fixed by editing the field (Fields → `pokemonevolvestoimageurl` → Edit → enable Multi-value facet → Save) and rebuilding again. Second rebuild's Pikachu Item JSON confirmed correct: `pokemonevolvesfromimageurl: "https://img.pokemondb.net/sprites/home/normal/2x/pichu.jpg"` (matches `pokemonevolvesfrom: "Pichu"`), `pokemonevolvestoimageurl: ["https://img.pokemondb.net/sprites/home/normal/2x/raichu.jpg", "https://img.pokemondb.net/sprites/home/normal/2x/raichu-alolan.jpg"]` (real 2-element array, index-aligned with `pokemonevolvesto: ["Raichu","Raichu"]`). **Steps 2–5 (port to `Pokedex - Full`, verify Eevee/Charizard on Full, model rebuild status, Chunk Inspector, RGA Prompt Enhancement) not yet done as of this write-up.**

**Step 2 (port config to `Pokedex - Full`) and step 3 (verify Eevee/Charizard on Full) — done and live-verified this session.** User ported the Web Scraping Configuration (selectors + `exclude` rules + the two new image-field metadata entries) and the two new Fields & Mappings entries from Test to Full, then rebuilt Full (1025 items). Verified against real pasted output, not assumed:
- Eevee's Item JSON: all 8 real evolution branches in `pokemonevolvesto` (Vaporeon/Jolteon/Flareon/Espeon/Umbreon/Leafeon/Glaceon/Sylveon), `pokemonevolvestoimageurl` an 8-element array of sprite URLs in the same order. `pokemonevolvesfrom`/`pokemonevolvesfromimageurl` correctly absent (base-stage).
- Charizard's Quick View: confirms all three v3.4 `exclude` rules work on Full, not just Test — Moves-learned section reduced to boilerplate/tab-label text with no actual move-table rows, Sprites section reduced to its heading with no sprite table, Type-defenses section reduced to its intro sentence with no grid, and **Locations plus the PokéBase "Answers to Charizard questions" block are absent from the page entirely** (body jumps straight from the Sprites heading to Other languages). Kept content confirmed present and intact: intro prose, Pokédex-data/Training/Breeding/Base-stats tables, evolution chart, 30+ flavor-text entries, Other languages, Name origin — matching ADR-0012's "deliberately left in body" list exactly. Charizard's Item JSON also confirms `pokemonevolvesfrom: "Charmeleon"` / `pokemonevolvesfromimageurl: ".../charmeleon.jpg"`, with `pokemonevolvesto`/`pokemonevolvestoimageurl` correctly absent (fully evolved, no next stage).

**Step 4 (Chunk Inspector) and step 5 (RGA Prompt Enhancement) — substantively done this session, one loose end still open.**

- User saved a custom Prompt instruction on `Pokedex RGA` (Machine Learning → Models → `Pokedex RGA` → Edit → Configuration tab → Prompt enhancement → Prompt instruction), which triggered RGA's own model rebuild as a side effect (confirmed via docs.coveo.com/en/nb6a0085 this session — see the docs-read list above). Exact instruction text saved wasn't pasted back to this session to log verbatim.
- **Chunk Inspector, Item unique ID mode, run against `Pokedex RGA`** (confirmed live: the Model dropdown in this mode only lists RGA models, per docs.coveo.com/en/p5dc0110's own text — Semantic Encoder and Passage Retrieval were never going to appear there, this isn't a config gap) — Charizard's 7 real chunks all confirmed clean: **zero** Moves-learned/Sprites/Type-defenses-grid/Locations/PokéBase content in any of them; kept content (flavor text, vitals tables, evolution chart) present as expected. One real, pre-existing, out-of-scope observation surfaced by this check: two chunks contain full vitals/stat tables for **Mega Charizard X and Mega Charizard Y** (legitimately part of Charizard's own crawled page, not fabricated, not something ADR-0012 addressed) — a question like "what are Charizard's stats" could plausibly retrieve a Mega-form stat block instead of base Charizard's. Flagged as a possible future refinement, not fixed this session, not blocking v3.4.
- **Live behavioral confirmation, not just chunk inspection**: user asked `/search`'s generated answer directly "what moves does Charizard learn" — got back a concise, grounded answer that correctly said "Specific levels not provided" / "Specific moves not provided" rather than either dumping a full move table or fabricating move data. This independently confirms the exclusion rules are working end-to-end in the actual product, not just in isolated chunk inspection.
- **Search ID mode — attempted, not resolved, real open loose end.** Confirmed via Visit Browser (Analytics → Visit Browser → filter "a search event" by Query, expand a visit's All Visit Events) that the `Search` event and its paired `generatedAnswer`/`generatedAnswerStreamEnd` event share the same `Search Id` (verified for two separate real query events in the same visit, both pairs matching) — so the ID itself wasn't the problem. Pasting a confirmed-correct Search Id into Chunk Inspector's Search ID mode still returned nothing. Docs.coveo.com has no coverage of Search-ID-mode failure modes or analytics-to-Knowledge-Hub sync timing (checked `en/2994` this session, doesn't cover it) — genuinely unresolved, not something resolvable without direct console access. **Deprioritized rather than blocking**: Item unique ID mode plus the live behavioral check together already give strong direct evidence the exclusion rules work end-to-end; Search ID mode would only be a third confirmation. Worth raising with Coveo support/account contact if it matters for the panel demo, otherwise leave open.

**Search ID mode resolved itself** on retry a few minutes later with a fresh Search Id (`c31ad741-46fb-4859-ba73-71e24dba63d3`, from the same "what moves does Charizard learn" query) — no longer an open loose end, most likely was the propagation-delay theory from earlier in this session, not a real bug.

**New, real, separate finding from the Search ID inspection — cross-Pokemon retrieval relevance noise, distinct from v3.4's content-exclusion work.** Of the 100 candidate chunks returned (all passed threshold), the top-ranked ones by chunk score include chunks from entirely unrelated Pokemon (Charjabug 0.87, Shellder 0.85, Accelgor 0.85, Ponyta 0.85, Flapple 0.85 — scores nearly identical to Charizard's own 0.85–0.89), and those other Pokemon's chunks **do** contain full unexcluded move-learned tables (real Level/Move/Type/Category/Power/Accuracy rows) — confirming the v3.4 exclusion rules are working correctly for the item actually being asked about, but not explaining away this separate issue. Worse, of the 5 chunks actually marked **Sent to LLM** for this real query, only 3 belong to Charizard — the other 2 are one Charjabug chunk and one Shellder chunk, both off-topic. The RGA answer itself stayed correct and didn't leak the off-topic content (`Cited: 3` matches exactly the 3 Charizard chunks, suggesting the LLM's own grounding discarded the 2 irrelevant ones during generation) — but retrieval itself is noisy, and relying on the LLM to always filter correctly isn't a real fix. Most likely cause: Pokemon pages share near-identical move-section boilerplate phrasing ("Moves learnt by level up... at the levels specified... TM Move Type Cat. Power Acc..."), so the semantic embedding is matching on that shared structural pattern rather than weighting the specific Pokemon's identity strongly enough. This is retrieval-relevance tuning, not a content-exclusion problem — `docs/temp_improvements.md` §11-12 already anticipated this exact follow-up ("Items to consider"/chunk-relevancy-threshold tuning), explicitly scoped for **after** content is clean, which it now is per this session's work. Being addressed live in this same session — see below for the actual console change once made, or the next session's log if not finished.

**v3.2 and v3.4 (content exclusion) are both now substantively complete and closed** — code shipped, org config done on both sources, live-verified on both Test and Full, RGA behaviorally confirmed clean end-to-end for the specific junk this phase targeted. The Mega-form stat-chunk observation (above, non-blocking, not previously scoped) remains open and low-priority.

**The "cross-Pokemon relevance noise" finding above turned out to have a different, more specific root cause than first suspected — not a relevance-ranking problem, a stale-embedding problem.** Chased it live this session:
- Tried lowering **Items to consider** (Query Pipelines → `Pokedex` → Edit components → Machine learning tab → `Pokedex RGA` → Items to consider) from 100 to 20 — **no effect at all**, identical chunk ranking/scores/Sent-to-LLM set before and after. Reverted back to 100 (its default) since it didn't help and had no upside left at 20.
- **Diagnostic that isolated the real cause**: Content Browser Quick View for Charjabug (one of the two off-topic Pokemon whose chunks were reaching the LLM) confirmed its *currently indexed* `body` is correctly cleaned by the v3.4 exclusion rules — no real move-table data, no Locations section, matching Charizard's own already-confirmed-clean Quick View. But Charjabug's *RGA chunk* (from the same Chunk Inspector Search ID session) contained real, live move-table rows that don't exist in that clean indexed content. **Conclusion**: the v3.4 exclusion rules are correctly applied index-wide (confirmed on a second, independent item beyond Charizard) — the RGA model's own chunk/embedding cache for most of the 1025-item corpus is simply stale, generated before the exclusion rules existed. Charizard looking clean throughout this session was most likely a side effect of being the one item repeatedly re-queried, not evidence the rest of the corpus had caught up.
- **Checked `Pokedex RGA`'s own status**: shows **"next run in 7 days"** — the model's content refresh runs on a fixed weekly schedule, and saving the Prompt instruction config change earlier this session did not appear to force an immediate full-corpus re-embed (if it had, Charjabug would already be clean). No console-only lever forces this sooner — `docs.coveo.com/en/nb6a0085` explicitly says to contact your Account Manager for a different rebuild interval than the weekly default.
- **This is now a real, live risk to the presentation timeline**: the model's next scheduled rebuild (7 days out) lands in the same window as the **2026-09-06 booking deadline** (also 7 days out as of this write-up, 2026-08-30). Waiting it out is not a safe plan.

**New action item, same urgency tier as the still-unsent Phase 0 email**: contact Coveo (Account Manager / support) to request an off-cycle rebuild of **all three** models — RGA, Semantic Encoder, **and Passage Retrieval (CPR)** — given the demo deadline, rather than waiting for the default weekly cycle. Until that happens, **any live demo should stick to Pokemon already spot-checked this session as clean** (Charizard, Pikachu, Eevee) — the rest of the corpus may still surface pre-exclusion junk (old Moves/Sprites/Type-defenses/Locations/PokéBase content) in RGA/Passage Retrieval answers until the models actually rebuild.

**Confirmed CPR is also stale, likely worse than RGA — checked live via the PDP's "Ask about this Pokemon" on Charizard.** Passage Retrieval is a fully separate model from RGA (own embedding store, own independent weekly rebuild schedule per `docs.coveo.com/en/oaie5476`) — this session's Prompt Enhancement save only rebuilt `Pokedex RGA`, not CPR, so CPR never got even that partial nudge. The returned passages confirm it: a complete untrimmed Moves-learnt-by-level-up table, a full Type-defenses effectiveness grid (`Nor Fir Wat Ele Gra Ice Fig Poi Gro / ½ 2 2 ¼ — ½ — 0`) plus Mega X/Y vitals, and more raw move-table rows — none of the three v3.4 exclusion rules show any effect in CPR's output at all, on the one item (Charizard) where RGA is already clean. **The off-cycle rebuild request above must include CPR explicitly, not just RGA + Semantic Encoder** — updated in "What's next" item 0 below.

**Not done this session**: no console actions were taken by this session's agent directly (still no direct console/API access, same as every prior session) — every step was handed to the user to run, and steps 1–4 were verified against real pasted Item JSON/Quick View/Chunk Inspector/Visit Browser output, not assumed.

## Eleventh session — v3.2 (branching evolution + images) and v3.4 (content exclusion) — code shipped, org config partially done

Picked up both remaining v3 phases in one session deliberately, since both touch Web Scraping Configuration and each would otherwise force its own rebuild — batching means fewer rebuilds. Per the plan's own sequencing, started with v3.4's diagnosis step before deciding anything, so the evolution-selector fix (v3.2) and the exclusion rules (v3.4) landed as one informed source-config change together. This session's agent has no direct console/API access (per the sixth session's note) — every console action below was handed to the user as numbered steps and the user ran them, pasting back real Content Browser/Quick View output at each checkpoint for verification, not just trusting the plan.

**v3.4 diagnosis (done):** Content Browser → Charizard (real item, `Pokedex - Full`) → Quick View confirmed `body` is the entire scraped page — intro prose, all vitals tables, the Type-defenses grid, the evolution chart, 30+ Pokédex flavor-text entries, Moves-learned tables, Sprites, Locations, and (the most concrete finding, not anticipated going in) an **"Answers to Charizard questions" block of off-topic PokéBase community-thread titles** — e.g. "Why is non-mega Charizard in OU, while Typhlosion is in NU?" — embedded in the same wrapper as the Locations table. Likely the actual source of the "random text" complaint. Full reasoning: `docs/adr/0012-web-scraping-content-exclusion-for-rga-cpr.md`.

**v3.4 exclusion rules (org-config done and live-verified on `Pokedex - Test`):** three `exclude` entries added to the Web Scraping Configuration JSON (confirmed a real, documented Coveo schema key via `docs.coveo.com/en/mc1f3573`, sibling to the existing `metadata` key, not a GUI toggle) —
```json
"exclude": [
  {"type": "XPATH", "path": "//*[contains(@class,\"data-table\")]"},
  {"type": "XPATH", "path": "//*[contains(@class,\"type-table-pokedex\")]"},
  {"type": "XPATH", "path": "//div[@id=\"dex-locations\"]/following-sibling::div[1]"}
]
```
Verified two ways: (1) executing all three against real fetched HTML with `lxml` before the user touched the console, matching exact node counts; (2) after the user rebuilt `Pokedex - Test`, pasted the new Pikachu Quick View back — Moves-learned/Sprites/Type-defenses-grid/Locations/PokéBase-questions all confirmed gone, intro/evolution-chart/flavor-text/vitals tables all confirmed intact. **Not yet ported to `Pokedex - Full`.**

**v3.2 branching evolution chain (code + selectors done, `Pokedex - Test` rebuilt and verified; `Pokedex - Full` pending):** the pre-existing `pokemonevolvesfrom`/`pokemonevolvesto` selectors had **two separate real, live production bugs**, both from the same root cause (a whole-document `preceding::`/`following::` axis standing in for a same-parent sibling one) — full trace, including the wrong intermediate attempts before landing on the final fix, in `docs/coveo-source-spec.md`'s "Evolution-chart structure" section:
- `evolvesto` only ever returned the first sibling of the first branch group — on Eevee's own page this meant `["Vaporeon"]` only, silently dropping Jolteon/Flareon/Espeon/Umbreon/Leafeon/Glaceon/Sylveon.
- `evolvesfrom` was *also* broken on any branching family, in two ways: it returned `"Flareon"` for Eevee (a base-stage Pokemon with no pre-evolution — a false positive from Eevee's own node repeating for each branch group), and it returned nothing at all for Espeon/Umbreon/Vaporeon/Leafeon/Glaceon/Sylveon (all genuinely evolve from Eevee).

Both rewritten on strict same-parent sibling axes, verified by executing them with `lxml` against real freshly-fetched HTML for 9 real pages (not hand-traced) before ever touching the console, then verified again for real after the user pasted back Pikachu's actual Item JSON post-rebuild: `pokemonevolvesfrom: "Pichu"`, `pokemonevolvesto: ["Raichu","Raichu"]` (see below for why the duplicate is correct, not a bug). Final selectors are in `docs/coveo-source-spec.md`'s field table — copy from there, not from this summary, if reusing them.

`pokemonevolvesto`'s field type was also changed from single-value to Multi-value in the admin console (Fields page) — this is an org-level field, so it applies to `Pokedex - Full` automatically once set, no separate per-source step needed.

**v3.2 evolution images (a scope addition proposed by the user mid-session, code done, org config NOT done — see next-session steps):** the user proposed showing each evolution stage's real image, not just its name. Two real fields were extracted directly from the evolution-chart markup rather than by re-querying Coveo per-PDP-load — `pokemonevolvesfromimageurl` (single-value) and `pokemonevolvestoimageurl` (multi-value), mirroring the exact same sibling-axis predicate as the name fields, onto the sprite `<img>`'s `@src` sitting in the same infocard. This was a real design discussion worth reading in full in the chat log if it comes up again, not just the conclusion:
- First idea (mine): resolve `evolution.to`/`from` names into full `PokemonItem`s via a second `aq: @pokemonname==(...)` query on the PDP, mirroring `/compare`'s proven pattern (`docs/adr/0009-client-only-comparison-state.md`).
- User's challenge, and the actual winning approach: extract the sprite `@src` at crawl time instead, since it's already sitting in the evolution-chart HTML on the very page being crawled. This is strictly better than the query idea, for a reason beyond "fewer calls": **a name-based query cannot distinguish regular Raichu from Alolan Raichu** (both resolve to the same `pokemonname=="Raichu"` document with one image), but crawl-time extraction captures both real, distinct sprites (`raichu.jpg` vs `raichu-alolan.jpg`), because they're genuinely different `<img>` elements on Pikachu's own page even though they share a display name.
- This **reversed an earlier decision made earlier in this same session**: `mapPokemonResult.ts`'s `evolution.to` was briefly deduped down to one "Raichu" entry (treating the duplicate name as noise). Once images entered the picture, deduping by name alone would have discarded the one thing that makes the two branches visually different. Reverted: `evolution.to`/`from` are now typed as `EvolutionTarget[]`/`EvolutionTarget | undefined` (`{name, imageUrl?}` — new export in `mapPokemonResult.ts`), deduped only on an exact `(name, imageUrl)` pair. Verified the two independently-extracted arrays (names, images) stay index-aligned by zipping them against real fetched HTML for 4 pages before committing to the design, not assumed.
- `EvolutionChain.tsx` now renders each target's sprite via `next/image` (host already allowlisted, `img.pokemondb.net`) at `alt=""` deliberately — a real accessibility bug caught by its own test: a non-empty `alt` identical to the adjacent visible name double-announces it to screen readers.
- Both selectors verified with `lxml` against real fetched HTML (Pikachu, Eevee, Charizard, Charmander) before being handed to the console.
- **Org-config side not done**: these are brand-new field names, so — unlike `evolvesfrom`/`evolvesto`, which already existed and only needed selector/type changes — they need new Fields created first (Administration Console → Content → Fields → Add a field), or the extracted metadata is invisible per this project's own documented trap ("unmapped metadata is invisible... until a Field + mapping both exist"). Exact steps are in the "Prompt for next session" below.

**Code changes shipped this session** (all in one pass, 176/176 tests green, typecheck/lint clean):
- `src/coveo/fields.ts` — added `evolvesFromImage`/`evolvesToImage`.
- `src/coveo/mapPokemonResult.ts` — new `EvolutionTarget` export, `evolution.to`/`from` reshaped, new `zipEvolutionTargets` helper (dedupes only exact pairs, degrades gracefully to `imageUrl: undefined` if the image array is shorter than the name array for any reason).
- `src/components/EvolutionChain.tsx` — renders a sprite per entry (`alt=""`), keys on `${name}-${index}` (not just `name`, to survive two entries sharing a name — same defensive-key lesson as the tenth session's breadcrumb duplicate-key bug).
- Tests updated/added in `tests/unit/coveo/mapPokemonResult.test.ts` and `tests/unit/components/EvolutionChain.test.tsx` — including a dedicated test asserting regular/Alolan Raichu render as two separate entries, and a test asserting the `alt=""` accessibility fix.
- `docs/coveo-source-spec.md` and `docs/archive/EXECUTION-PLAN-v3.md` updated in the same session, not deferred.
- `docs/adr/0012-web-scraping-content-exclusion-for-rga-cpr.md` — new, covers the v3.4 exclusion-rules decision.

**Not touched at all this session, despite being in scope for v3.4**: RGA's Prompt Enhancement configuration, Passage Retrieval, and Knowledge Hub (Chunk Inspector was *researched* this session — see docs read below — but never actually run against a live query, since the Quick View inspection alone was decisive enough to write the exclusion rules). Also not touched: `Pokedex - Full` rebuild (only `Test` has the new config), RelatedPokemon (still fully deferred, per the tenth-session note).

### External docs.coveo.com pages read this session (eleventh)

The fetch tool hit its known JS-rendering limitation (per the tenth-session caveat) on most console-flow lookups this session — noted per page below, don't assume a "couldn't confirm" page is wrong, just unconfirmed by this session's tooling.

- [docs.coveo.com/en/1712](https://docs.coveo.com/en/1712/) — Review item properties. Confirmed: Content Browser → select item → **Properties** → **Fields** tab (metadata) or **Item JSON** tab (full untruncated raw value) vs. a separate **Quick view** tab (rendered content) — used Quick View for the v3.4 diagnosis.
- [docs.coveo.com/en/2751](https://docs.coveo.com/en/2751/) — Explore indexed content overview. Fetch returned only general capability text, not the exact menu path (JS-rendering limitation).
- [docs.coveo.com/en/p5dc0110](https://docs.coveo.com/en/p5dc0110/) — Inspect RGA chunks. Confirmed Chunk Inspector lives in the **Knowledge Hub** (Admin Console → application picker → Knowledge Hub → Chunk Inspector), a different application shell than every other console step logged in this file. Three modes: Item unique ID, Search ID (via Visit Browser), Answer ID (via generated-answer feedback). **Researched but not actually run this session.**
- [docs.coveo.com/en/mc1f3573](https://docs.coveo.com/en/mc1f3573/) — Web scraping configuration. **This is the key one, fetched twice for confidence.** Confirmed the real, documented JSON schema: top-level keys `name`, `for`, `exclude`, `metadata`, `subItems` — `exclude` is a real, documented feature (array of `{type: "CSS"|"XPATH", path}`), not a guess, resolving the user's direct question about whether Coveo actually supports it (it does; there's just no separate GUI form for it, the whole Web Scraping Configuration is one JSON blob).
- [github.com/coveo-labs/web-scraper-helper](https://github.com/coveo-labs/web-scraper-helper/blob/master/chrome_extension/README.md) — checked for schema confirmation; didn't have the exact keys, deferred to the docs.coveo.com page above instead.
- [docs.coveo.com/en/oa2d0178](https://docs.coveo.com/en/oa2d0178/) — Evaluate/improve RGA implementation. Fetch didn't surface Prompt Enhancement's console path (JS-rendering limitation).
- [docs.coveo.com/en/nb6a0085](https://docs.coveo.com/en/nb6a0085/leverage-machine-learning/create-and-manage-relevance-generative-answering-rga-models) — Create/manage RGA models (already read the sixth/tenth sessions for other RGA steps). Re-fetched specifically for Prompt Enhancement; same JS-rendering limitation.
- [docs.coveo.com/en/p5db9314](https://docs.coveo.com/en/p5db9314/) — Set up an answer configuration. Same limitation.
- A **web search** (not a single doc page) surfaced a specific, plausible console path for RGA's Prompt Enhancement — Models → select model → Edit → **Configuration** tab → under **Prompt enhancement** → enable **Prompt instruction** → enter text → Save — sourced from search snippets across the pages above rather than a directly-rendered page. **This path is unconfirmed by direct fetch and should be double-checked live in the console before relying on it, same caveat as any other fetch-unreliable page this project has flagged.**
- Also searched (no useful result either way): whether Semantic Encoder/RGA/Passage Retrieval models auto-pick-up new indexed content or need a manual rebuild after a source reindex. **Genuinely unresolved** — check the model's own status indicator live in the console after the `Pokedex - Full` rebuild, and treat Chunk Inspector as the real ground truth regardless of what the status shows.



## Tenth session, continued a third time — facet architecture: Automatic Facet Generation on /search, static pills on home

Full reasoning in `docs/adr/0011-automatic-facet-generation-on-search-page.md` — this is a summary.

- **Org config: done, confirmed live, no rebuild needed** — the user enabled the **Facet Generator** field option (Administration Console → Content → Fields → per field → Edit → enable **Facet Generator** → Save, same location as the "Sortable" toggle) on `pokemontype`, `pokemongeneration`, `pokemonegggroups`, `pokemonweaknesses`, `pokemonresistances` (not on `pokemonabilities` or `pokemonspeed`), and it took effect immediately — same no-rebuild behavior as Sortable.
- **`src/components/AutomaticFacets.tsx`** (new): built on Coveo's real `buildAutomaticFacetGenerator`, replacing 5 hand-built components (`FacetType`, `FacetGeneration`, `FacetEggGroups`, `FacetWeaknesses`, `FacetResistances`, all deleted). Preserves color-coded Chip rendering for type/weaknesses/resistances via a small field-based switch. `FacetSpeed` (numeric) and `FacetAbilities` (needs facet-search, which automatic facets don't support) stay manual.
- **`SearchSummaryBar.tsx`**: added a third breadcrumb block for `breadcrumbState.automaticFacetBreadcrumbs` (a real, separate array Headless already provides — confirmed in `headless-breadcrumb-manager.js`).
- **Correction to this ADR's own first draft**: automatic facet selections **do** restore from a URL — `SearchParameters.af` (`af-<field>=<value>`) is a real, dedicated key in `search-parameter-serializer.js`, the same mechanism as manual facets' `f-<facetId>=<value>`. An earlier pass claimed otherwise (misread `isValidBasicKey`'s list instead of the full interface) — verified live, corrected in the ADR before this session ended, not left wrong.
- **Home page**: `BrowseByType.tsx` rewritten from a live `buildFacet`-backed grid to a static list of the 18 real Pokemon types (`POKEMON_TYPES`, new export in `src/coveo/typeColors.ts`) — no live query, no per-type counts (accepted tradeoff; `/search` still shows live counts). Rendered unconditionally on `/` now (no longer gated behind `configured`).
- **Two real bugs caught and fixed mid-implementation, not shipped broken:**
  1. `buildTypeSearchHref` used to generate `/search?f-pokemontype=<value>`, which only works if a *manual* facet is registered under that exact facetId on `/search`. Once `FacetType` was replaced by `AutomaticFacets` (a different URL key, `af-pokemontype`, not `f-pokemontype`), that link would have silently stopped filtering anything. Fixed by switching to an `aq` (advanced query) expression — `@pokemontype=="<value>"`, the same exact-match pattern already used by the detail/compare pages.
  2. That fix then surfaced a second, pre-existing, unrelated bug: `/search` never registered Headless's `advancedSearchQueries` reducer (only the detail/compare pages did). `getAq()` (`search-parameter-manager.js`) silently returns `{}` when that reducer isn't loaded, so an `?aq=...` URL on `/search` round-tripped straight back to a bare `/search` with nothing filtered — confirmed via a captured request showing no `aq` reaching the Search API at all. Fixed by calling `loadAdvancedSearchQueryActions(engine)` in `SearchUrlSync.tsx` before `buildUrlManager` constructs. This predates this session; `aq` was simply never exercised via a `/search` URL before the Browse-by-type pills needed it.
- **Tests**: new `tests/unit/components/AutomaticFacets.test.tsx` (6 tests — fieldset-per-facet, Chip-vs-plain-text branching, checkbox state, `toggleSelect` wiring). `BrowseByType.test.tsx` deleted — the rewritten component is a pure `.map()` with no branching, matching this repo's own "only components with real logic get a test" convention (`docs/standards-adoption.md` #12b, updated accordingly), same bar `FacetType`/`FacetGeneration` were already held to before being deleted. `browseByTypeUrl.test.ts` and its component-level test updated for the new `aq`-based URL shape. Full suite: 169 tests, all green. Typecheck/lint clean.
- **Verified live**, both dev and a production build (`next build && next start`): home pills → `/search` filters correctly by type; automatic facets render real values/counts; selecting one filters results, shows a breadcrumb, and survives a page reload; the facetId-collision stress sequence (search → PDP → home → search → filter, repeated) produces zero `"already exists"`/duplicate-key warnings. One transient "Hydration failed" console message appeared once during dev-mode testing but did not reproduce across several repeats or in the production build — treated as an HMR artifact from active file editing, not a real defect, consistent with a similar false alarm earlier this session.

## Tenth session — Phase v3.1 (sort break) closed on the code side

- **Org config step, not yet confirmed done**: `pokemonname` needs the **Sortable** field option enabled (Administration Console → Content → Fields → search `pokemonname` → Edit → enable **Sortable** → Save; no rebuild required, allow a short propagation delay). This is the actual gate on `Name A-Z` working live — the code below assumes it, per Phase v3.1's own checklist.
- **`src/coveo/sortOptions.ts`**: re-added `name-asc` (`buildFieldSortCriterion(POKEMON_FIELDS.name, SortOrder.Ascending)`, label "Name A-Z"), replacing the ninth-session-era comment explaining why it was pulled.
- **`src/coveo/applicationError.ts`**: new `INVALID_SORT` error code. `toApplicationError` now special-cases `error.type === "InvalidSortValueException"` before the generic 401/403/PROVIDER branches, returning a recoverable error with `userMessage: "That sort option isn't available. Showing relevance instead."` — previously this fell into the generic `PROVIDER` catch-all indistinguishable from a real outage.
- **`src/coveo/searchRenderState.ts`**: `deriveSearchRenderState` now reports `{ status: "loading" }` (not `"error"`) when the error is `INVALID_SORT`. This was a deliberate choice, not an oversight: confirmed via `node_modules/@coveo/headless/dist/esm/features/search/search-slice.js`'s `handleRejectedSearch` that any query error — sort-related or not — clears `state.results` to `[]`, so there is no prior-results snapshot to fall back to render at this layer. The actual recovery (re-dispatching a relevance sort) has to happen at the point that dispatched the bad sort in the first place, which is `SearchSummaryBar.tsx`, not here.
- **`src/components/SearchSummaryBar.tsx`**: the sort `<select>`'s `onChange` now subscribes to `engine.subscribe(...)` once after dispatching `sort.sortBy(option.criterion)`, waits for `isLoading` to clear, unsubscribes, and — only if the resulting error is `InvalidSortValueException` — re-dispatches `sort.sortBy(SORT_OPTIONS[0].criterion)` (relevance) and shows a small amber inline notice (`role="status"`) under the sort control naming the option that failed. This is the actual fix for "sort keeps breaking when I change values": a future un-sortable field now degrades to a visible, contained notice instead of blanking the whole results grid — verified so far by the reasoning above and by unit tests; **not yet verified live against the org** (needs the Sortable toggle above, or a temporary sort-option pointed at a genuinely un-sortable field, per the plan's own Verification note).
- **Tests**: `tests/unit/coveo/sortOptions.test.ts` updated for the 4-option list (Relevance/Name A-Z/Dex number/Base stat total), the stale "never offers a sort by pokemonname" test replaced with one asserting the real `name-asc` criterion shape. New tests in `tests/unit/coveo/applicationError.test.ts` and `tests/unit/coveo/searchRenderState.test.ts` cover the `INVALID_SORT` branch end to end (raw error → `ApplicationError` → render state). Full suite: 166 tests, all green. Typecheck/lint clean.
- **Live-verified after the user enabled Sortable on `pokemonname`/`pokemonattack`/`pokemondefense`/`pokemondexnumber`/`pokemonhp`/`pokemonspatk`/`pokemonspdef`/`pokemonstattotal` in the console** (`pokemonspeed` was already Sortable): curl'd all nine fields directly against the live Search API — all 200. Plan's verification step complete.

## Tenth session, continued — Phase v3.3 (search page data) + a real, serious pre-existing bug found and fixed

Picked up v3.3 right after v3.1, per the four-phase list's independence. Treated Automatic Facet Generation (raised by the user mid-session) as a separate, deliberately-unscheduled future item — see `docs/archive/EXECUTION-PLAN-v3.md`'s new "Future item" section for the full findings (Coveo's real `buildAutomaticFacetGenerator`/Facet Generator feature, confirmed present in the installed `@coveo/headless`, and why it doesn't cleanly replace this app's fixed-shape facet sidebar).

**v3.3 built, all frontend, zero org-config changes needed** (data layer — `POKEMON_FIELDS`, `PokemonItem`, `registerFieldsToInclude` — was already complete from earlier sessions):
- `ResultList.tsx` cards: generation badge and an abilities preview (comma-joined, truncated).
- Three new facets, wired into `/search`'s `FacetRail`: `FacetEggGroups.tsx` (`pokemonegggroups`), `FacetWeaknesses.tsx` (`pokemonweaknesses`, labeled "Weak Against", rendered as type Chips), `FacetResistances.tsx` (`pokemonresistances`, labeled "Resistant To", same Chip treatment). All three fields were already Multi-value facet in the org (confirmed in `docs/coveo-source-spec.md`) — no console step needed, unlike the `pokemongrowthrate` option that was **not** picked (it has no facet enabled today, per that same spec table).
- `sortOptions.ts`: added `speed-desc` ("Speed (fastest first)", descending) now that `pokemonspeed` is confirmed sortable.
- Live-verified all three new facets return real, correctly-counted values, and the new sort works — via a scripted Playwright run against the dev server (see below for why a *second* production-build run was also needed).

**Real, serious bug found while live-verifying the Speed sort — pre-existing, not introduced by v3.1 or v3.3, and it explains the underlying "sort breaks the grid" symptom more completely than v3.1's fix alone does.** Selecting *any* sort option — including `Dex number`, which has worked since v2.3 — 400'd with `InvalidSortValueException: "@pokemondexnumber+ascending"` and blanked the whole page (not just the results grid: `SearchSummaryBar` itself disappeared, since `querySummary.state.hasResults` also went false, taking the sort `<select>` down with it — worse than v3.1's fix accounted for, since that fix assumed only `ResultList` needed protecting). Confirmed via `next build && next start` (production, not just dev — ruled out React Strict Mode double-invoke as the cause) and via reading Headless's own source, not guessed:
- The visible URL was correctly percent-encoded (`?sortCriteria=%40pokemondexnumber%20ascending`).
- `SearchUrlSync.tsx`'s URL→state effect fed that URL's params into `urlManager.synchronize()` via `searchParams.toString()` — but `URLSearchParams.toString()` serializes spaces as `+` (`application/x-www-form-urlencoded`, WHATWG URL spec), not `%20`.
- Headless's `buildSearchParameterSerializer()` (`features/search-parameters/search-parameter-serializer.js`) serializes with `encodeURIComponent` (`%20` for space) and deserializes with `decodeURIComponent`, which never un-escapes `+` back into a space. Read directly from the installed package's ESM source, not assumed.
- Net effect: a literal `+` survived into the restored `sortCriteria` value for *any* criterion containing a space (every field-sort option's `"<field> ascending/descending"` string), corrupting the request the moment `SearchUrlSync` round-tripped the URL it had itself just written. Also affects any facet value containing a space (e.g. `Generation 9`) the same way, just without a hard 400 — confirmed the fix also resolves that case live.
- **Fixed** in `SearchUrlSync.tsx`: new `toHeadlessFragment()` helper builds the fragment with `encodeURIComponent` per-value (matching Headless's own convention exactly), used in place of `searchParams.toString()` in both the initial `buildUrlManager` seed and the URL→state effect.
- **Re-verified after the fix**, production build: all 5 sort options + a space-containing facet value (`Generation 9`) all work with zero 400s and zero console errors; a cold reload from a bookmarked/shared sorted URL (`?sortCriteria=%40pokemonname%20ascending`) also restores correctly.
- New unit test in `tests/unit/components/SearchUrlSync.test.tsx` asserts the `%20`-not-`+` encoding directly. Full suite: 167 tests, all green. Typecheck/lint clean.
- **This bug's discovery changes how to read v3.1's fix**: the `INVALID_SORT` → transient-loading + relevance-fallback mechanism in `searchRenderState.ts`/`SearchSummaryBar.tsx` is still correct and still worth having (a genuinely unsortable field can still reach it), but it was never the actual cause of the recurring "sort keeps breaking" reports — this URL-encoding bug was. Both fixes are needed; neither alone would have fully resolved live sort breakage.

## Tenth session, continued again — a second real bug: duplicate facet registrations across navigation

Found live by the user, not by testing: `search -> click a result -> PDP -> back to home via breadcrumb -> search again -> apply a Type filter` produced `Encountered two children with the same key, "pokemontype-Grass"` in `SearchSummaryBar.tsx`'s breadcrumb rendering. Root-caused against Headless's own installed source, not guessed:

- The app's `engine` (`src/coveo/engine.ts`) is a persistent singleton for the whole SPA session — by design (`docs/adr/0004-no-server-layer.md`'s architecture). Every `Facet`/`FacetSpeed` component builds its controller via a bare `useState(() => buildFacet(...))` with **no explicit `facetId`** and no unmount cleanup.
- `determineFacetId`/`generateFacetId` (`controllers/core/facets/_common/facet-id-generator.js`) only auto-derives an id from the field name **the first time**; if that id is already taken in the engine's `facetSet` (because an earlier, still-registered `/search` mount's `Facet` never went away), it silently mints a new suffixed id (`pokemontype_2`, `_3`, ...) and logs `"A facet with field ... already exists"` — confirmed live: navigating `/search -> PDP -> back -> /search` produced exactly this warning for every facet field, and the URL after re-filtering showed `f-pokemontype_2=Grass`.
- `SearchSummaryBar.tsx`'s breadcrumb `<span key>` was built from `breadcrumb.field`, not `breadcrumb.facetId` — so once two differently-`facetId`'d-but-same-`field` breadcrumbs both hold a selected value (e.g. an old lingering `pokemontype` registration plus a fresh `pokemontype_2`, both showing "Grass"), React sees a literal duplicate key.
- **Fixed at the source**, not by patching the key alone: `Facet.tsx` and `FacetSpeed.tsx` now pass an explicit `facetId: field` (matching what Headless would have defaulted to anyway). Confirmed via `facet-set-slice.js`'s `registerFacet` reducer — `if (facetId in state) return;` — that pinning the id makes a remount silently **reuse** the existing registration instead of ever reaching the suffix-generation path, for any number of repeat visits. `BrowseByType.tsx` was already doing this correctly (explicit `facetId: "browse-by-type"`, a documented deliberate choice from the seventh session) — it just wasn't the project-wide convention yet.
- **Also hardened as defense-in-depth**: `SearchSummaryBar.tsx`'s two breadcrumb `key`s now use `breadcrumb.facetId` (guaranteed unique per Headless's own `Breadcrumb` type) instead of `breadcrumb.field` (not unique — `BrowseByType` deliberately shares a field with `FacetType` under a different id, by design).
- **Verified live**: scripted a 5-round stress loop (search → apply a facet → click a result → home → repeat) followed by a fresh `/search` visit and a new facet click — zero `"already exists"` warnings and zero duplicate-key warnings, versus reproducing both reliably before the fix. Full suite (167 tests), typecheck, lint all still green — no test previously covered a repeat-mount scenario, so no existing test caught this; none added either, since `Facet.tsx`/`FacetSpeed.tsx` are thin Headless-controller wrappers per the existing "pure presentational, no unit test" convention (`docs/standards-adoption.md` #12b) and the actual guarantee (`registerFacet`'s no-op-on-existing-id behavior) lives in the installed package, not in this repo's code.
- **Broader implication worth remembering**: any *other* Headless controller built via a bare `useState(() => buildX(...))` with an auto-derivable id, on this same persistent-engine architecture, is subject to the identical class of bug the moment two mounts of the same component can coexist in the engine's lifetime (which is always true here, since the engine outlives every page). `Pager`, `SearchBox`, `buildQuerySummary`, `buildBreadcrumbManager`, `buildSort`, `buildDidYouMean`, `buildGeneratedAnswer` don't take a `facetId`-style option at all (only facet-family controllers do), so they aren't exposed to this specific bug — but it's the reason this class of finding surfaced only now, with the search-page facets, and not earlier.

## Ninth session — shared `useControllerState` hook, `executeSearch/rejected` console error fixed

Two things prompted this session: a parity check against a sibling project's "component → custom hook → engine" architecture, and a real console error, `{} "Action dispatch error search/executeSearch/rejected"`, on `/search`. Full reasoning in `docs/adr/0010-shared-controller-state-hook.md` — this is a summary, that ADR is the source of truth.

- **Closed the eighth session's audit item.** New `src/coveo/useControllerState.ts` extracts the `useSyncExternalStore` recipe `SearchBox.tsx` proved correct last session (cached snapshot ref, stable `subscribe` identity, bound `subscribe` call — same three gotchas, now documented once instead of per call site) into a reusable hook. Migrated every other `.subscribe()` + `useEffect`-driven `setState` call site onto it: `Facet.tsx`, `Pager.tsx`, `FacetSpeed.tsx`, `DidYouMean.tsx`, `GeneratedAnswer.tsx`, `ResultList.tsx`, `BrowseByType.tsx`, `SearchSummaryBar.tsx` (3 controllers), plus `src/app/page.tsx`, the detail page, and the compare page. `SearchBox.tsx` itself now calls the extracted hook instead of its own inlined copy. `SearchUrlSync.tsx`'s `urlManager.subscribe()` was left as-is — it drives `router.replace()`, not React state, so it was never in the vulnerable class. This isn't just "confirmed inert today" like the eighth session's audit — it's structurally closed: any controller subscription feeding React state now goes through the same hardened mechanism, so this crash class can't resurface if a controller is ever duplicated into a persistent layout again.
- **Considered and explicitly rejected**: adopting the sibling repo's exact shape (one monolithic hook per feature owning the engine + every controller + a flattened snapshot). That fits a single cohesive feature; `/search` composes ~10 independent Headless controllers against an engine that already exists elsewhere, and collapsing them would make controller-ordering dependencies (`SearchUrlSync` must dispatch before `SearchBox` reads engine state) harder to reason about for no benefit. See the ADR for the full argument.
- **Root-caused and fixed the `executeSearch/rejected` console error.** Confirmed via a live Playwright repro (cold-load, cross-page navigation, browser back/forward, both dev and a production build) that this fires whenever two `executeSearch` dispatches race on the shared engine singleton (several pages each dispatch their own on mount — `src/app/page.tsx`, `SearchUrlSync.tsx`, the detail page) — and that results/facets are correct every time it fires. Root cause: Headless's logger middleware logs every cancelled/rejected action as `logger.error` unless `payload.ignored` is set, and the installed `executeSearch` thunk processor never sets that flag — confirmed by reading both files directly, not assumed. Headless's public `loggerOptions` has no way to suppress just this one message (only a global `level` or a non-filtering `logFormatter`). Since the requirement was that this must not show up in a live exec demo or on the hosted app, `src/coveo/engine.ts` now filters `console.error` narrowly — drops only this exact message, forwards everything else unchanged, documented as fail-open if Headless's message text ever changes.
- **New unit test** `tests/unit/coveo/useControllerState.test.tsx` (via `renderHook`), added to `vitest.config.mts`'s jsdom project via an extra glob entry (it's not a component, but needs the DOM environment `renderHook` requires). Full suite: 28 files / 164 tests, all green. Typecheck/lint clean. The 5 configured-org e2e specs (`search.spec.ts`, `ask-about-pokemon.spec.ts`) pass unchanged against the migrated code — confirmed by running them with `.env.local` sourced into the shell, since `playwright test`'s own process doesn't otherwise see those vars even though the Next.js build bakes them in (a pre-existing local-environment quirk, not something this session changed). `unconfigured.spec.ts`'s 4 failures are also pre-existing when run locally against a configured build (confirmed by reproducing them against the pre-session code via `git stash`) — unrelated to this session's changes.

## Eighth session — component unit-test harness, real `SearchBox` bug fix, `remark-gfm`

- **Testing convention changed**: React components now get unit tests when they carry real logic (state, computed values, conditionals, URL/localStorage sync); pure presentational components stay e2e-only. Documented as row 12b in `docs/standards-adoption.md`, with the explicit in-scope/out-of-scope component lists — that row is the source of truth, not this summary. New harness: `@testing-library/react`/`@testing-library/jest-dom`, `vitest.config.mts` now runs a `node` project (unchanged) and a `jsdom` project (`tests/unit/components/**/*.test.tsx`). 14 components got tests (75 new tests); full suite now 27 files / 159 tests, all green.
- **Real, previously-unnoticed bug found by that test pass and fixed**: `PokemonMarkdown.tsx` never had `remark-gfm` wired into its `react-markdown` pipeline, so GFM pipe-table syntax parsed as plain paragraph text instead of a table — the `table`/`th`/`td` overrides in `MARKDOWN_COMPONENTS` never fired. Since `AskAboutPokemon.tsx` and `GeneratedAnswer.tsx` both route text through this shared component, any RGA/Passage-Retrieval answer containing a markdown table would have rendered as raw unstyled pipe-text. Fixed: `remark-gfm` added as a dependency, passed via `remarkPlugins={[remarkGfm]}`. No `rehype-raw` — raw HTML is still never rendered, unrelated to this fix.
- **Real console error found and fixed, unrelated to the two items above** (surfaced by the user hitting it live, not by the test pass): navigating to `/search` threw "Cannot update a component (`SearchBox`) while rendering a different component (`SearchUrlSync`)". Root cause: `AppHeader`'s `SearchBox` instance lives in the persistent root layout and stays mounted/subscribed across navigations; `SearchUrlSync`'s `buildUrlManager` construction happens inside a `useState` initializer during render and its constructor synchronously dispatches `restoreSearchParameters`, which synchronously notified the already-subscribed `AppHeader` `SearchBox` mid-render. Fixed in `SearchBox.tsx` by switching its controller-state subscription from `subscribe()` + `useEffect`-driven `setState` to `useSyncExternalStore` — React's own mechanism for exactly this class of external-store synchronization hazard. Three non-obvious gotchas hit and fixed along the way, worth knowing if this pattern is copied elsewhere:
  1. A bare `searchBox.subscribe` reference loses its `this` binding (it's a class method) — must be called through the instance: `(callback) => searchBox.subscribe(callback)`.
  2. Headless's `.state` getter builds a fresh object on every read rather than returning a memoized/selector-cached value — handing it straight to `useSyncExternalStore`'s `getSnapshot` causes React's "getSnapshot should be cached" loop detection and an actual infinite render loop. Fixed by caching the last snapshot in a `useRef`, refreshed only from inside the subscribe callback (i.e. only on a real store notification), and having `getSnapshot` just return the ref.
  3. The `subscribe` function passed to `useSyncExternalStore` must have a **stable identity** across renders (`useCallback`, not an inline arrow) — Headless's `subscribe()` invokes the listener once synchronously on subscribe, so a fresh function identity every render causes React to resubscribe every render, each resubscribe re-triggering a synchronous notify, which is itself an infinite loop (a different one from #2, same symptom: "Maximum update depth exceeded").
  - Verified via a scripted Playwright check against the real dev server (not just typecheck/lint/unit tests) — zero console errors across load, a search-and-navigate-to-`/search` cycle, and a second back-then-search cycle.
- This pattern (`.subscribe()` + `useEffect`-driven `setState`) is still used as-is in ~12 other components (`Facet.tsx`, `Pager.tsx`, `FacetSpeed.tsx`, `DidYouMean.tsx`, `GeneratedAnswer.tsx`, `ResultList.tsx`, `SearchSummaryBar.tsx`, `BrowseByType.tsx`, and others) — **not changed this session**. They're only actually vulnerable to this exact crash if two things are both true: the same controller/engine has another already-mounted subscriber elsewhere in the tree, AND something else's render-phase controller construction synchronously dispatches to that shared engine. Today `SearchBox` is the only component duplicated into a persistent layout (`AppHeader`) alongside a page that also does a render-phase synchronous dispatch (`SearchUrlSync` on `/search`), so it was the only one that actually manifested. Worth a broader audit before adding a new controller-in-persistent-layout instance, but not blocking anything today.

## Seventh session — Phase v2.3 frontend, built end to end

Built via a single `headless-frontend-dev` subagent run through all 7 of the plan's build-order steps sequentially, each shipped complete (code + tests + typecheck + lint green) before the next started, per this session's own scoping. Final state: 84 unit tests (up from 49 at the end of the sixth session), typecheck/lint/build/e2e all green.

**Decision resolved before any component code was written, per the sixth session's explicit flag:** `PokemonItem` was reshaped from the flat fields the sixth session built into the grouped sub-objects (`stats`, `training`, `breeding`, `defenses`, `evolution`) that `docs/archive/EXECUTION-PLAN-v2.3-frontend.md` §2.2 specifies — the plan's own panel component signatures (`PokemonStatPanel({ stats, total })` etc.) are written against that shape, and reshaping before any of the ~15 new components existed to depend on the old one was the cheap point to do it. Two real bugs were found and fixed in the same pass, not just a mechanical reshape:
- `breeding.genderRatio` — the flat version ran this through `toStringArray` incorrectly typed as an array; investigation found `pokemongenderratio` is genuinely two-part multi-value data (e.g. `"87.5% male"` + `"12.5% female"`) collapsing to one part only for genderless species. Kept `toStringArray`, joined the parts with `", "`, typed the result as `string | undefined` to match the plan's interface. A naive switch to `asString` (my own initial suggestion) would have silently dropped half of every normal Pokemon's ratio — confirmed wrong before it was built, not after.
- `evolution.to` is `string[]` per the plan's type, but `docs/coveo-source-spec.md` documents `pokemonevolvesto` as a single-value field at the source — branching evolutions (Eevee-style) only ever capture the first branch in document order, an accepted extraction simplification from the sixth session, not something frontend typing can fix. The array type is still correct and forward-compatible if that selector is ever upgraded; today it always holds 0 or 1 entries, and the tests assert that honestly rather than pretending branching works.

**Step-by-step results:**
1. **Data contract** — `PokemonItem` reshaped (above), `dexNumber` mapped into it for the first time (field was already indexed and registered, just never read), `asNumber` extended to a real never-throw numeric coercion (was a bare `typeof === "number"` check), new `src/coveo/pokemonStats.ts` (`MAX_BASE_STAT = 255`, `STAT_ORDER`).
2. **Primitives** — `src/components/ui/{Chip,StatBar,DataList,Tabs}.tsx`, all new. `Chip` retrofitted into `ResultList.tsx`, `FacetType.tsx`, and the detail page in the same pass, replacing the dot+label markup that had been duplicated three times. Reused the existing `src/coveo/typeColors.ts` palette — nothing new invented. `Facet.tsx`'s old `renderIndicator` prop (rendered before the label) became `renderValue` (replaces the whole label node) since a self-contained Chip already renders its own label — a real, deliberate breaking change to that internal prop, not additive.
3. **Detail page rebuild** — `page.tsx` cut from 143 lines of mixed fetching/presentation down to orchestration only, composing 8 new components (`Breadcrumb`, `PokemonHero`, `PokemonStatPanel`, `PokemonProfilePanel`, `TrainingPanel`, `AbilityList`, `TypeDefenses`, `EvolutionChain`) under a `Tabs` layout (Overview / Abilities / Evolution — no "Similar" tab, deferred per plan §9). The exact-match `aq: @pokemonname=="X"` query and empty-searchbox-text strategy were left untouched, per the plan's §1.3 (RGA can't fire here; `AskAboutPokemon`/CPR is this page's AI surface, not RGA). `AskAboutPokemon.tsx` gained a row of suggested-question chips scoped to answerable content only. Confirmed live: `pokemondexnumber`'s raw value is already zero-padded to 4 digits at the source (`"0025"`), so `PokemonHero` only prepends `#`, no re-padding.
4. **Compare** — session-scoped, names-only, `sessionStorage`-backed (`src/coveo/compareStorage.ts`, cap 4, all storage I/O try/catch-wrapped for private-browsing throws). `CompareProvider` mounted in `layout.tsx`, `CompareTray` is the one deliberately-floating (`shadow-lg`) element in the whole app per `DESIGN.md`'s flat-unless-floating rule. `/compare` always re-resolves names through one live `aq: @pokemonname==("A","B","C")` query — never reads cached stat values from storage. The add-to-compare checkbox was pulled forward into `ResultList.tsx` in this step (not deferred to step 5 as the plan's table technically implied) since Compare is undemoable without any way to populate a selection; sits as a sibling to the card's `<Link>`, not nested in it, so `buildInteractiveResult`'s click-tracking is unaffected. At the 4-item cap, other cards' checkboxes go `disabled` with a `title` explaining why, rather than silently no-opping. **`docs/adr/0009-client-only-comparison-state.md` written**, covering why Favorites/"Add to team" were dropped outright rather than built as a lesser client-only stub.
5. **Search page** — the plan's riskiest step, `SearchUrlSync` (new, wraps `buildUrlManager`) vs. `SearchBox.tsx`'s existing Strict-Mode-safe `initialQuery` ref-guard (`SearchBox.tsx:59-80`, fixing a real fifth-session regression — see that session's D11 section). Resolved by controller-construction ordering, not by touching the guard: `SearchUrlSync` is mounted before `SearchBox` in the tree and dispatches `restoreSearchParameters` synchronously, which seeds `engine.state.query.q` before `SearchBox`'s own `buildSearchBox` controller reads its initial value at construction — confirmed against Headless's actual source (`headless-core-search-box.js`), not assumed. `SearchBox` is rendered without `initialQuery` on `/search` only; nothing about the guard itself changed. New: `FacetAbilities` (via a new `searchable` prop grown on the shared `Facet.tsx`, not a parallel component), `FacetSpeed` (`buildNumericFacet`, explicit ranges 0–49/50–89/90–119/120+, not auto-generated), `SearchSummaryBar` (count + breadcrumbs + sort), `DidYouMean`. `GeneratedAnswer.tsx` now passes `contentFormat: ["text/markdown"]` (previously defaulted to `text/plain`, which is why markdown had been printing raw — confirmed via Headless's `generated-response-format.d.ts`), renders through a new shared `PokemonMarkdown.tsx` (extracted from `AskAboutPokemon.tsx`'s prior inline copy), shows "Grounded in N sources" from the real `state.citations.length`, and wires real `like()`/`dislike()`. `ResultList.tsx` cards gained dex number, base-stat total, and a `?from=<current search URL>` param that `Breadcrumb.tsx` (step 3) reads back to link "Search results" to where the user actually came from. **Real finding, not worked around:** `pokemonname` isn't enabled for "Use for sorting" in the org (only `pokemondexnumber`/`pokemonstattotal` are) — a "Name A-Z" sort 400'd (`InvalidSortValueException`) and broke the whole results grid, not just that option. Removed from `sortOptions.ts` rather than shipped broken; **re-add it once `pokemonname` gets "Use for sorting" enabled in the admin console** (a coveo-index-architect task, not a code fix).
6. **Home + header** — `AppHeader.tsx` (wordmark + conditional compact search on the detail page) mounted in `layout.tsx`, superseding the old per-page "← Back to home"/"← Back to search" links (both removed). Home page gained a live indexed count (`buildQuerySummary().state.total`, never hardcoded) and `BrowseByType.tsx` (Type facet values/counts as links into pre-filtered `/search`). The mount-search for the live count deliberately does NOT use `engine.executeFirstSearch()` — that has a `firstSearchExecutedSelector` guard that silently no-ops after the engine's first search anywhere in its lifetime, which would show a stale count on a second visit to `/` in the same session; uses a direct guarded `executeSearch` dispatch instead, same pattern as `SearchUrlSync`. `BrowseByType`'s own internal `buildFacet` call uses an explicit distinct `facetId: "browse-by-type"` so it can't collide with `/search`'s `FacetType`, which relies on `pokemontype` being the default facet ID on the same shared engine singleton — verified live in both directions (toggling a facet on `/search` and loading a pre-filtered URL directly) before writing the link-generation code, not just read from source. **Judgment call made and flagged, not silently done:** removed the standalone `<h1>Pokedex Search</h1>` from `/` and `/search`, since `AppHeader`'s wordmark now shows the identical phrase on every page — leaving both would be visible duplicate chrome. Easy one-line revert on either page if unwanted; the detail page's `<h1>{item.name}</h1>` was untouched since that's genuinely distinct content.
7. **Docs sync** — `DESIGN.md` updated with the `Chip`/`StatBar` component entries, the "Two-Size" rule renamed "Three-Size" (12px caption formalized), and the Data Categories section's dot-only language replaced. `docs/coveo-source-spec.md`'s field tables were already current (no rows missing); two stale *prose* sections were fixed instead — its opening line and `## Status` section both still said the org was "blocked on access," rewritten to reflect that both sources are live. `docs/mockup-ui-analysis.md`'s filename↔screen mapping corrected per the plan's own stated correction (`A7D995E4…`=search, `03D97A8B…`=detail, `BC25DEA1…`=home).

**Standing instruction added mid-session, applies going forward:** before writing custom code for any Coveo/Headless feature, check whether Coveo's docs or the installed `@coveo/headless` package already provides it (a controller, a documented pattern, an Atomic/Quantic reference approach) before hand-rolling an equivalent. Every new Headless controller usage in steps 5–6 (`buildUrlManager`, `facet.facetSearch`, `buildNumericFacet`, `buildQuerySummary`, `buildBreadcrumbManager`, `buildSort`, `buildDidYouMean`, generated-answer `like()`/`dislike()`, `responseFormat.contentFormat`) was verified against the actual installed `.d.ts` files rather than assumed from the plan's prose — worth continuing for any future Headless work, not just this session's.

**Deferred, matching the plan's own §9, not new gaps:** `RelatedPokemon`/"Similar Creatures" tab (needs a second query source on a single-engine page), the full branching evolution chain, an Evolution Stage facet (needs a new IPE), any Habitat facet (no honest small-vocabulary source).

**Not run this session:** a full manual browser walkthrough of every new surface together (compare flow end-to-end in a real browser tab, deep-linked facet URLs from a cold load, the abilities facet-search typeahead). The live e2e suite (5 configured golden-path tests) passed after every step and covers the core query/facet/RGA/CPR paths, but hasn't been extended with new specs for compare-selection-survives-navigation or deep-linked-facet-URL-restores-state — the plan's own §8 "Testing" note flags these as e2e specs to add "once v2.2 lands," which it now has. Worth doing before treating v2.3 as demo-ready for the panel.

## Sixth session — Phase v2.1 field expansion, then Phase v2.2 migration to Full

Built interactively, one field group at a time, with the user driving the actual Coveo admin console UI (this session's agent doesn't have direct console/API access — every step was relayed as instructions, verified against pasted Content Browser output). Phase v2.1 was built and fully validated on `Pokedex - Test` first, per the plan's explicit sequencing; Phase v2.2 (porting the proven config to `Pokedex - Full`) followed in the same session once v2.1 passed all three trap cases.

- **21 new fields added** across six groups — identity (`pokemonspecies`, `pokemonheight`, `pokemonweight`, `pokemonabilities`), base stats (`pokemonhp/attack/defense/spatk/spdef/speed/stattotal`), training (`pokemonevyield/catchrate/basefriendship/baseexp/growthrate`), breeding (`pokemonegggroups/genderratio/eggcycles`), defenses (`pokemonweaknesses/resistances`, plus two intermediate `...raw` fields consumed only by an IPE), evolution (`pokemonevolvesfrom/evolvesto`). Full selector-by-selector spec, including every trap hit while building it, is in `docs/coveo-source-spec.md` — read that before touching any of these again, not this summary.
- **Console behavior findings worth knowing for `Pokedex - Full` (Phase v2.2) or any new field:**
  1. Integer-typed fields in this org's console bundle facet + sort capability together — no independent per-attribute toggle was found. Not a real problem (an unused facet/sort capability is inert unless the frontend explicitly builds a controller for it), but don't expect to configure `pokemonhp` etc. as "Integer, no facet" — the console won't offer that combination.
  2. The "Facet" vs "Multi Value Facet" field option is one mutually-exclusive choice, not two independent checkboxes — confirmed when creating `pokemonabilities`.
  3. A field mapping's **Content** value needs to be exactly `%[fieldname]` — a stray tab-separated paste corrupted `pokemonevolvesfrom`'s mapping once (value came back as `"Pichu\tpokemonevolvesfrom"`); worth double-checking mapping content by eye, not just by whether Content Browser shows *a* value.
- **Two real extraction bugs found and fixed, both root-caused against the actual fetched HTML rather than guessed:**
  1. The "Type defenses" section (weaknesses/resistances) renders multiple times per page — Pikachu (has an ability that alters type effectiveness) renders it once tabbed (Static/Lightning Rod) plus once again untabbed further down; Garchomp (no such ability) renders it 3 times as identical untabbed duplicates. An unscoped selector triple-counted values and leaked the hidden-ability variant in. Fixed by taking only the first two `type-table-pokedex` tables in document order — correct for both shapes without needing to detect which one applies.
  2. The evolution-chart selectors initially leaked into the page's moves-learned tables, since `class="ent-name"` is reused there (130+ occurrences on Garchomp's page) — fixed by scoping to the chart's own `<div class="infocard-list-evo">` wrapper. Separately, `pokemonevolvesto` had a reverse-XPath-axis bug (`preceding::[last()]` picks the *furthest* node, not nearest — `[1]` does) that silently broke every case except a fully-evolved Pokemon. Both fixed; see the spec doc's "Evolution-chart structure" note for the full trace, since this is exactly the kind of thing likely to get re-broken if these selectors are ever touched without reading that note first.
  3. An `ancestor::`-axis-based selector for both weaknesses/resistances and (in an earlier draft) evolution silently matched zero nodes on real pages, for a reason never diagnosed — abandoned in favor of simpler selectors built only from constructs already proven working elsewhere in this source. Worth remembering if a future field's "obviously correct" XPath just returns nothing: this crawler's XPath support has gaps beyond what generic docs describe, same lesson as this org's API-key privilege gaps found in the third session.
- **`pokemonevolvesfrom` is genuinely absent for base-stage Pokemon** (no pre-evolution) — confirmed correct, not a bug, via the Web Scraping Configuration test panel against Pichu (not in `Pokedex - Test`'s 3-doc crawl scope). `src/coveo/mapPokemonResult.ts` now derives `isBaseStage: boolean` from that absence, so the frontend (Phase v2.3, not built yet) has a ready-made fallback rather than needing to re-derive "no pre-evolution" from an undefined field itself.
- **`src/coveo/fields.ts`, `src/coveo/mapPokemonResult.ts`, `docs/coveo-source-spec.md` updated in lockstep**, per this repo's standing sync contract. Two pre-existing unit tests (`tests/unit/coveo/mapPokemonResult.test.ts`, `tests/unit/coveo/searchRenderState.test.ts`) hardcoded the old 5-field `PokemonItem` shape and needed updating for the new one — full suite (49 tests), typecheck, and lint all pass as of end of session.
- **Phase v2.2 (port to `Pokedex - Full`) also completed this session.** One real snag: the first config diff only carried over the scraping extraction rules and the two IPE-output field mappings (`pokemonweaknesses`/`pokemonresistances`) — not the other 19 field mappings. Content Browser showed only 7 of 26 fields on the first rebuild of Full, the same "unmapped metadata is invisible" trap this project already knew about, just resurfacing on a second source during a config copy rather than a fresh build. Fixed by adding all 21 missing mappings directly via the mappings JSON array (same raw-edit mechanism as the Web Scraping Configuration — Full's mapping list is exposed as pasteable JSON too, not just a one-row-at-a-time form). After the fix and a second rebuild: Pikachu/Garchomp/Sprigatito match `Pokedex - Test` field-for-field on `Pokedex - Full`, and a broader spot-check of the four multi-value facets (`pokemonabilities`, `pokemonegggroups`, `pokemonweaknesses`, `pokemonresistances`) across the full 1025-item index showed clean, correctly-split values throughout (hundreds of distinct ability names, all 15 real egg groups, 17/18 types in weaknesses — correctly missing Normal, which nothing is weak to — no semicolon-joined compounds anywhere). Both IPEs (`pokemongeneration`, weaknesses/resistances) were confirmed to be attached **per-source**, not per-pipeline — this needed an explicit second attachment on `Pokedex - Full`, it did not come along automatically with the scraping config.
- **Phase v2.3 (frontend UI using these fields) is the only phase still open** — see `docs/archive/EXECUTION-PLAN-v2.md`. Also not done: `docs/archive/EXECUTION-PLAN-v2.md`'s "Decisions carried forward" section flags a possible ADR-0009 for the moves/flavor-text-stays-as-body-content decision — now that v2.1/v2.2 are actually built, that's a real candidate for next session if the ADR discipline matters for the presentation.
- **A real divergence for whoever picks up Phase v2.3**: `docs/archive/EXECUTION-PLAN-v2.3-frontend.md` (an untracked planning doc already in the repo, not authored or read in full this session until the handoff pass) specs `PokemonItem` as **grouped sub-objects** (e.g. a nested `PokemonStats` interface so a stat-bars panel takes one prop). What actually got built this session extends `PokemonItem` as **flat fields**, the natural continuation of how the pre-existing 5 fields were already shaped — this session's task was field-group-by-field-group console work, not a `PokemonItem` redesign, so it wasn't reshaped to match that doc's plan. Reconciling the two (reshape the interface to match the doc, or update the doc to match what's built) is a real decision for the v2.3 session, not something to infer from this note.
- **Pre-existing, unrelated to this session's work**: `pokemondexnumber` has been in `POKEMON_FIELDS` since the original 5-field build but has never been mapped into `PokemonItem` (dex number isn't rendered anywhere in the current app). Already flagged in `docs/archive/EXECUTION-PLAN-v2.3-frontend.md` as something v2.3 should close — not a new finding, just confirmed still true.

## Prior sessions (through the fifth) — unchanged this session

## Org details

- Org name: `venkatesh-pokemon-challenge`, Org ID: `venkateshpokemonchallenges0qp5rpy`
- Created **2026-08-25** — 14-day trial deletion clock runs from this date. Book the presentation by **2026-09-06** (creation + 12 days). **Still not booked, and the Phase 0 email reply with the Org ID still hasn't been sent** — explicitly deferred by user decision, not forgotten, but now idle across **six** sessions and the deadline is 9 days out as of this writing.
- License: Enterprise, Demo type, expires 2026-11-24.
- Two sources: `Pokedex - Test` (3 items — Pikachu/Garchomp/Sprigatito, 26 fields, sandbox/prototyping only) and `Pokedex - Full` (1025 items, the real crawl — **now also on the full 26-field config as of the sixth session's Phase v2.2 work**, see that section above). Both fully verified. `Pokedex - Full` is what the running app actually queries (the pipeline's `filter cq @source==("Pokedex - Full")` rule excludes Test), so the new fields are genuinely live, not just prototyped.
- `Pokedex` query pipeline: condition `Search Hub is PokedexSearch`, filter rule `filter cq @source==("Pokedex - Full")`. Four ML models associated as of this session: `Pokedex Query Suggestions`, `Pokedex Semantic Encoder`, `Pokedex RGA`, `Pokedex Passage Retrieval` — all Active, all verified working end to end.
- Two API keys exist (see ADR-0006 for why it's two, not one — though see the note below, one of them is now dead weight):
  - `COVEO_API_KEY` — "Anonymous search" purpose. Privileges (confirmed via Coveo's own privilege-introspection endpoint): `EXECUTE_QUERY`/`SEARCH_API`, `ANALYTICS_DATA` (edit)/`USAGE_ANALYTICS`, `IMPERSONATE`/`USAGE_ANALYTICS`. Same value as `NEXT_PUBLIC_COVEO_ACCESS_TOKEN`; also now populated into `COVEO_API_KEY` in `.env.local` this session (was blank before) since `/api/passages` needs it.
  - `COVEO_ML_API_KEY` — Custom purpose, named `Pokedex - Content Preview`. `Allow content preview` only. **Confirmed unused by anything in this app as of this session** (ADR-0008) — nothing currently depends on deleting it, but don't build new code that reaches for it assuming it's load-bearing.

## What's done

**Stages A, B, C** (test source, fields/mappings/IPE, full crawl) — complete and verified, unchanged from prior sessions. See `docs/plan101.md` for full history if needed; not re-summarized here.

**Stage D1–D5 — prior (third) session, unchanged, summarized here since they're still load-bearing context.**

- **D1 (API keys).** Originally planned as one key with three privileges. Not buildable: this org's console can no longer grant Execute queries or Analytics-Push via the Custom key purpose — those are now locked to predefined templates (confirmed directly in the Custom wizard's Privileges step, not inferred). Built as two keys instead — see ADR-0006. The "Anonymous search" template's bundled `Impersonate` privilege was initially flagged as an unwanted-but-inert security overreach; that assessment was later corrected (see D2's finding below) — it's not the powerful cross-user impersonation privilege at all.
- **D2 (env wiring) — revised into a dual auth-mode design, ADR-0007.** `/api/token`'s token-minting call (`POST /rest/search/token`) 403s unconditionally, on every request including an empty body. Root-caused via Coveo's privilege-introspection endpoint: minting requires `Impersonate` under owner `SEARCH_API`, and this org's Anonymous-search key's `Impersonate` is scoped to owner `USAGE_ANALYTICS` instead — a different, unrelated privilege. No key obtainable from this console (template or Custom) carries the right one. Rather than deleting the server-minting work, added `NEXT_PUBLIC_COVEO_AUTH_MODE` (`"direct"` | `"server"`, default `"direct"`): `direct` mode uses `NEXT_PUBLIC_COVEO_ACCESS_TOKEN` as a static client-side credential (exactly what an "Anonymous search" key is documented to be for), `server` mode is ADR-0005's original minted-token design, fully intact and switchable via one env var the day a compatible key exists. Live now: `direct` mode, `NEXT_PUBLIC_COVEO_ACCESS_TOKEN` = same value as `COVEO_API_KEY`.
- **D3 (pipeline).** Done — `Pokedex` pipeline, condition `Search Hub is PokedexSearch`.
- **D3.5, unplanned.** Added a `filter cq @source==("Pokedex - Full")` rule to the pipeline. `Pokedex - Test` and `Pokedex - Full` are both live sources with nothing scoping the pipeline to one of them — without this, a query could return the same Pokemon twice (once per source). Verified via pipeline → More → Open in Content Browser: 2 results per query before the filter, 1 after.
- **D4 (searchHub alignment).** Confirmed working two ways: the pipeline screenshot, and — more conclusively — the e2e suite actually returning correctly-routed, correctly-faceted live results end to end.
- **D5 (e2e suite).** 3/3 passing against live org data. Two real app bugs found and fixed along the way, **neither of which was an org-config issue**:
  1. `src/coveo/config.ts`'s `resolveCoveoConfig()` had `environment = process.env` as a parameter default. That indirection isn't a literal `process.env.NEXT_PUBLIC_X` expression, which is the only pattern Next.js's build-time inlining (webpack's `DefinePlugin`) can see — so in every production client bundle, `NEXT_PUBLIC_COVEO_ORGANIZATION_ID` read back `undefined` regardless of `.env.local`, and the app always showed "Coveo isn't configured yet." Fixed by writing the literal expression into the default value itself. Any *new* `NEXT_PUBLIC_*` field added to this resolver must repeat that same pattern or the bug comes back.
  2. `src/coveo/engine.ts` never called Headless's `registerFieldsToInclude`. Coveo's Search API only returns a default field set (`title`, `uri`, etc.) per result unless custom fields are explicitly requested — facets still worked (a separate, server-computed aggregation), but every individual result's `pokemontype`/`pokemongeneration`/`pokemonimageurl` came back empty, so **no Pokemon images or per-result type/generation were rendering anywhere** — not on `/search`, not on the PDP — despite the source/mapping/IPE work all being correct. This is the kind of thing that would have been caught live during the panel demo. Fixed by dispatching `loadFieldActions(engine).registerFieldsToInclude(Object.values(POKEMON_FIELDS))` once at engine construction. Verified visually (screenshots) and via the e2e suite: images, type chips, and generation all render correctly now.

## What's next (in priority order)

**As of the twenty-first session, the real current priority list is:**

1. **Both presentation decks** (Advanced tier) — still not started:
   `presentation/topic1-technical-deepdive.md` and
   `presentation/topic2-escalation-recovery.md`. See item 4 in the older
   numbered list below, which still applies.
2. **Confirm the Phase 0 email + presentation-slot booking** (deadline
   2026-09-06) and the off-cycle RGA/Semantic-Encoder/CPR model-rebuild
   request actually went out — user indicated sending both 2026-08-31;
   **still not independently verified as sent** across two sessions now.
   Ask the user directly rather than assuming from stated intent.
3. **Chat agent — future goal, blocked externally, not actionable right
   now.** Investigated (twenty-sixth session) whether a real multi-turn
   "chat" experience is buildable: RGA (`GeneratedAnswer.tsx`) and Passage
   Retrieval (`AskAboutPokemon.tsx` → `/api/passages`, ADR-0008) are both
   confirmed single-shot per query — no conversation memory in either, by
   Coveo's own design. The actual multi-turn mechanism is the **Coveo Search
   Agent** (`docs.coveo.com/en/q2qg1117`), part of Knowledge Hub, built on
   top of a CPR model + a Semantic Encoder model — this org already has both
   Active and associated to the `Pokedex` pipeline (`Pokedex Passage
   Retrieval`, `Pokedex Semantic Encoder`), so the console work to stand one
   up would be short if unblocked. It requires a separate paid extension,
   **"Coveo Conversational Search"**, which the user confirmed live in the
   console (License & Usage page, and a direct attempt to add an agent under
   AI and ML → Agents) this org does **not** have. Nothing to build here
   until that extension is added to the org's license — if it ever is, skip
   straight to creating the agent (existing models, no new ML builds
   needed) rather than re-deriving this research.

All four nineteenth-session follow-up execution docs are now closed:
Doc 1 (ML recommendations, Branch B + ART) and Doc 2 (Similar Pokemon
carousel) in the twentieth session; Doc 3 (marketing assets, including its
§5 home hero carousel + PDP Highlights) and Doc 4 (async UI states) in this
(twenty-first) session — see "Twenty-first session" below.

The numbered list immediately below predates the nineteenth/twentieth/
twenty-first sessions and is largely historical (most of its own items are
marked done/superseded inline) — kept for the operational detail in items
0/4/5 (the ML-rebuild trail and the Phase 0 email context), not as the live
priority order.

Phase v2.3 is done as of the seventh session — the v2 roadmap (`docs/archive/EXECUTION-PLAN-v2.md`) is now fully closed. **New this session: `docs/archive/EXECUTION-PLAN-v3.md`** — a separate, independent track opened by live usage, four phases, pick any one:

- v3.1 — fix the sort break (`pokemonname` "Use for sorting" + a resilience fix so a bad sort criterion can't blank the whole grid again)
- v3.2 — PDP: RelatedPokemon tab + full branching evolution chain (the two items deferred from v2.3 §9)
- v3.3 — search page: surface `PokemonItem` data that's indexed/mapped but not shown (generation badge, abilities preview, new facets, stat-based sort)
- v3.4 — RGA/Passage Retrieval content cleanup (diagnose via Chunk Inspector first, then prompt enhancement + body content-exclusion rules — see that file for why the user's ChatGPT-drafted plan in `docs/temp_improvements.md` needed adjusting before use)

What's left from the original assessment, all pre-existing and unrelated to v2/v3:

0. **New, most urgent as of the twelfth session: contact Coveo (Account Manager/support) to request an off-cycle rebuild of all three ML models — RGA, Semantic Encoder, and Passage Retrieval (CPR).** The v3.4 content-exclusion rules are confirmed correctly indexed org-wide, but the embedding stores backing RGA (`/search`'s generated answer) and CPR (`Ask about this Pokemon` on the PDP) are both stale (pre-exclusion) for most of the 1025-item corpus, and RGA's own status shows its next scheduled rebuild 7 days out — landing in the same window as item 5's booking deadline below. CPR looks even more stale than RGA (confirmed live on Charizard, where RGA is otherwise clean but CPR still returns full Moves/Type-defenses-grid passages), since nothing this session forced even a partial CPR rebuild the way saving RGA's Prompt instruction did for RGA. Until this lands, live demos should stick to Pokemon already confirmed clean via RGA this session (Charizard, Pikachu, Eevee, Charjabug) and avoid `Ask about this Pokemon` (CPR) entirely except possibly on Charizard. Full trail in the twelfth-session section above.
1. **A manual end-to-end browser walkthrough of the new v2.3 surfaces together**, and the two e2e specs the plan's §8 flagged as ready to add "once v2.2 lands" (it now has): compare-selection-survives-navigation, and deep-linked facet URLs restoring state on a cold load. Cheap, and worth doing before treating the app as demo-ready for the panel.
2. ~~`pokemonname` needs "Use for sorting" enabled~~ — **done**, tenth session (see that section above); `name-asc` is back in `sortOptions.ts` and live-verified.
3. ~~**Vercel deploy** (Intermediate tier — "host your search app to make it accessible").~~ — **done**, same day following the eighteenth session (see that section above). Live at https://coveo-pokemon-assessment.vercel.app/, connected via GitHub import, `COVEO_API_KEY` env var issue found and fixed live.
4. **Both presentation decks** (Advanced tier). Not started — `presentation/topic1-technical-deepdive.md` and `presentation/topic2-escalation-recovery.md` are still unfilled outline checklists. Deliberately sequenced after Vercel, per user decision (predates the v2 work, may be worth revisiting given the v2 field-extraction debugging — the XPath axis bugs, the duplicate-DOM-block traps, the unmapped-metadata trap resurfacing on the Full migration — is genuinely good Topic 1 material). The twelfth session's stale-embedding/off-cycle-rebuild-request finding is also good material for either deck (real production-style operational issue, found and diagnosed live, not staged).
5. **Phase 0 email reply (Org ID) and presentation-slot booking (deadline 2026-09-06, 7 days out as of this writing).** Explicitly deferred by user decision, not forgotten. Turned out **not to be a real blocker for anything built so far** — both RGA and CPR were available and buildable in this org despite the email being unsent (see ADR-0008 for CPR). Still worth sending regardless — it's zero-dependency and the deadline is real, and now shares its window with item 0's rebuild request above. Now idle across **twelve** sessions.
6. **Lower priority, from the cross-repo inspiration pass** (`docs/inspiration-from-coveo-assesment.md`): a git-hook secret scan (item 1), and an explicit decision on whether `GeneratedAnswer.tsx` should regenerate on facet clicks (item 4) — investigated but not resolved, see that doc's Tier 2.

## This session (fifth) — CI, testing, and CSP hardening

Not a Coveo-org-config session — no admin console work, org state unchanged from the fourth session's snapshot above. All app/repo-level:

- **E4 done**: `docs/passage-retrieval-pov.md` — the RGA-vs-CPR point-of-view doc, built on the already-tested Eevee (RGA, clean synthesized answer) vs. Pikachu (CPR, raw noisy chunks) contrast, with three enterprise cases where CPR's raw-passage output is the better fit (RAG/agent pipelines, structured/tabular content, auditability).
- **e2e coverage gap closed**: added `tests/e2e/ask-about-pokemon.spec.ts` against the live org. Caught a real regression while running it — `AskAboutPokemon.tsx`'s "Ask about Pikachu" `<h2>` collided with an existing `search.spec.ts` heading selector (`/pikachu/i` matched both), which had never been caught because the configured e2e suite hadn't actually been run live since `AskAboutPokemon` was added. Fixed by scoping that selector to `level: 1`.
- **Pre-commit test-coverage guard widened**: `scripts/check-test-coverage.mjs`'s `TESTABLE_ROOTS` now includes `src/app/api/`, not just `src/coveo/*`. Added unit tests for both route handlers (rate limiting, validation, filter-escaping, upstream error handling) — 49 unit tests total now, up from 35. React components deliberately stay out of the unit-test guard (covered by e2e instead) — see the reasoning in the script's own comment and `docs/standards-adoption.md` #12.
- **CI was actually broken, unrelated to any of the above**: `npm ci` failed on GitHub Actions with an `EUSAGE` lockfile-consistency error — the committed lockfile had last been regenerated with npm 11 (Node 24), which resolved optional `@emnapi/*` platform deps differently than npm 10 (Node 20, CI's pin) expected. Fixed by regenerating the lockfile on the exact CI Node version via `nvm`. Then bumped CI from Node 20 → 24 entirely, since `coveo.analytics@2.33.0` (a `@coveo/headless` transitive dependency) declares `engines.node: ^22.11.0 || ^24.11.0` and doesn't support Node 20 at all — every prior CI run had been silently installing an unsupported dependency tree (`EBADENGINE` warning, not a failure, but a real risk).
- **D11 done**: `next.config.ts`'s CSP `connect-src` now derives the real org hostnames (`https://<orgId>.org.coveo.com` for search/query-suggest/RGA/CPR, `https://<orgId>.analytics.org.coveo.com` for analytics) from `NEXT_PUBLIC_COVEO_ORGANIZATION_ID` at build time — confirmed against `@coveo/headless`'s own `getOrganizationEndpoint()`/`getAnalyticsNextApiBaseUrl()`, not guessed — with a wildcard fallback for env-less builds (CI). Also added `base-uri 'self'`/`form-action 'self'` (`docs/inspiration-from-coveo-assesment.md` item 3), and dropped an unused Coveo wildcard from `img-src` (Pokemon images only ever come from `img.pokemondb.net`).
- **Two real bugs D11 itself surfaced**, both fixed same session:
  1. `script-src` had never included `unsafe-eval`, which React/Turbopack need in dev mode only (never production) for debugging features like callstack reconstruction — nobody had run `npm run dev` with the CSP active until this session. Fixed dev-only via `NODE_ENV`, production stays strict.
  2. A benign-but-noisy dev-mode console error, `"Action dispatch error search/executeSearch/rejected"`, on every `/search` and `/pokemon/[name]` page load. Root cause: React Strict Mode double-invokes mount effects in dev; both `SearchBox.tsx`'s `initialQuery` effect and the detail page's mount effect called `searchBox.submit()` unconditionally, so Strict Mode fired two submits back to back and Headless's own request-cancellation logic (correctly) aborted the first — but its logger reports that cancellation as an error rather than suppressing it. Fixed with a ref-guard on each effect so it only resubmits when its real input has actually changed, which is also just correct Strict-Mode-safe effect design.
- All 7 commits from this session (`b2f7101` through `723eb5d`) are on `main`; lint, typecheck, the full unit suite (49 tests, coverage thresholds clear), and the full e2e suite (5 live-org tests + 5 unconfigured smoke tests) all pass as of the last commit.

## D6/D7 — Query Suggest model (this session)

- Model `Pokedex Query Suggestions` created via **AI and ML → Models → Add model → Query Suggestions**. `modelId` = `venkateshpokemonchallenges0qp5rpy_querysuggest_e0cd009c_08f0_4c14_ba17_0ef3c0b4570f`.
- **Test Configuration Mode** enabled (Advanced tab) — the option *was* visible despite this org being Enterprise/Demo-licensed, so the docs' "sandbox organizations only" caveat didn't block it here.
- Associated to the `Pokedex` pipeline via **Edit components → Machine learning tab → Associate model**, no extra condition set (the pipeline's own `Search Hub is PokedexSearch` condition already scopes it).
- **D7 preload**: no API key was created or needed. Uploaded via the Machine Learning API's own Swagger UI (`platform.cloud.coveo.com/docs?urls.primaryName=Machine+Learning#/Advanced%20Model%20Configurations`), authenticated with the admin account's own browser session — an org admin account already carries `Machine learning - Models - Edit`, so this sidesteps the same Custom-key template-lock problem D1 hit. `PUT .../models/{modelId}/configs/DEFAULT_QUERIES?languageCode=en`, `configFile` = `docs/DEFAULT_QUERIES.csv`.
- The CSV (1070 rows: 1025 unique `pokemonname` values pulled live from the Search API — 3 pages of `numberOfResults=500`, not the plan's original guess of "1025 names" typed by hand — plus 45 curated intent phrases like `"fire type"`, `"generation 1"`, `"starter pokemon"`) is committed at `docs/DEFAULT_QUERIES.csv`.
- Response: `200`, `{"modelId": "...", "filePath": "/venkateshpokemonchallenges0qp5rpy/..._querysuggest_.../DefaultQueries/en"}`. Screenshot at `docs/temp/stage-d/d7-default-queries-200-response.png`.
- **Note for D7's original endpoint path**: `COVEO_API_KEY` in `.env.local` is actually blank (only `NEXT_PUBLIC_COVEO_ACCESS_TOKEN` and `COVEO_ML_API_KEY` are filled in) — the app works fine since it's in `direct` auth mode and doesn't need it, but don't assume it's populated if a future step wants to script against it with curl.

## D9/D10 — Semantic Encoder + RGA model (this session)

- **D9**: model `Pokedex Semantic Encoder` created via **Add model → Semantic Encoder**, "Learn from" scoped to `Pokedex - Full` only (not `Pokedex - Test`, same source-scoping reasoning as D3.5). No field mapping/IPE dependency — SE works off Coveo's default `title`/`body` content, unrelated to the custom `pokemontype`/etc. fields. Associated to `Pokedex` pipeline while still building (association isn't gated on model status), no condition needed.
- **D10**: model `Pokedex RGA` created via **Add model → Relevance Generative Answering**, same source scoping (`Pokedex - Full`). **The licensing gate flagged before starting did not block this** — the RGA card was present and buildable despite the Phase 0 enablement email still being unsent, meaning RGA is already included in this org's license (see the "What's next" note above — don't generalize this to Passage Retrieval, which is still explicitly gated in the original plan).
- RGA association required a **`Query is not empty`** condition (not optional, unlike SE/QS) — built via the condition dialog: `When: Query` → operator **`Is not empty`** (a dedicated operator, not `Is not` + blank value) → no value field needed → **Add condition**.
- RGA's Advanced configuration left at defaults: Items to consider = 100, Chunk relevancy threshold = Medium, Rich text formatting = on, Thesaurus rules = off (this org has no thesaurus rules configured, so that toggle is currently a no-op either way).
- Both models confirmed **Active** this session (along with the QS model — all three now Active). RGA's build took closer to the docs' up-to-1-hour estimate than QS's ~30 min, consistent with it processing embeddings across all 1025 items rather than a simpler analytics-based build.
- **Verified end-to-end in the running app**: query "how does Eevee evolve" returned a correct, well-formed generated answer citing `[1] Eevee`, alongside working facets and result images. Screenshot at `docs/temp/stage-d/d9-d10-rga-generated-answer-eevee.png`. Prose-style query, as recommended — a stat-lookup query wasn't tested and may behave differently per the known tabular-content limitation.
- **Worth checking next session, not yet verified**: whether `src/components`'s `GeneratedAnswer` (if that's the component name — confirm by reading the code) sets `contentFormat: "text/markdown"` on the generated-answer request. Rich text formatting is on by default for the RGA model, but per docs it only renders correctly if the Headless-based frontend explicitly requests markdown; otherwise raw markdown syntax prints as plain text in the UI.

## Stage E — Passage Retrieval (this session)

- Testing the live Passage Retrieval endpoint directly (not assuming from docs) found the "conditional on enablement" framing in the original `plan101.md` Stage E was wrong — see ADR-0008 for the full writeup. Short version: `/api/passages` was 403ing because it authenticated with `COVEO_ML_API_KEY` (`ALLOW_CONTENT_PREVIEW` only), and the endpoint actually needs `EXECUTE_QUERY`. Fixed the route to use `COVEO_API_KEY` instead (which required populating that var in `.env.local` — it was blank), and added the required `localization` request-body field the original implementation was missing entirely. Verified: the route now reaches Coveo's real `422` ("no CPR model associated") instead of a privilege `403`.
- Model `Pokedex Passage Retrieval` created via **Add model → Passage Retrieval**, "Learn from" `Pokedex - Full` (same content as the SE model — CPR's docs require CPR and SE share content). Associated to `Pokedex` pipeline while still building, no condition (CPR's condition is genuinely optional, unlike RGA's mandatory `Query is not empty`). Advanced config left at defaults: Maximum number of items = 40, Thesaurus rules = off.
- **Fully verified once the model went Active**: both the raw Coveo endpoint and the app's own `/api/passages` route return `200` with real content — passage `text` (crawled markdown), a `relevanceScore`, and `document.title`. Confirms `EXECUTE_QUERY` alone is sufficient; `ALLOW_CONTENT_PREVIEW` is not needed anywhere in this app. `COVEO_ML_API_KEY` and the `mlApiKey` config field are now confirmed dead — not deleted this session (inert, non-urgent), but a future cleanup pass can remove them along with revisiting ADR-0006's original justification for the key split.
- **E3 — "Ask about this Pokemon" UI, built and verified this session.** New `src/components/AskAboutPokemon.tsx`, mounted on `src/app/pokemon/[name]/page.tsx` below the type/generation info. `/api/passages/route.ts` was extended to accept an optional `pokemonName` and build a `filter: '@pokemonname=="<name>"'` — the *real* CPR request schema, found by pulling the actual API guide (`docs.coveo.com/en/o86c8334`) rather than reusing this app's Search API v2 shape: `pipeline` isn't a real field on this endpoint, and `aq`/`cq` are silently ignored (verified by testing — asking specifically for Eevee with the wrong field name returned Moltres/Kabuto/etc.; only `filter` actually constrained results). Also added `maxPassages: 3`. Verified live: `/pokemon/Eevee` asking "how does this evolve" returns exactly 3 passages, all correctly scoped, with distinct relevance scores.
- **Markdown rendering fix, same session.** Passage text is crawled page content converted to markdown by Coveo, and was rendering as raw `#`/`|`/`**` syntax. Added `react-markdown` (10.1.0) with a link-safety override (forces `target="_blank" rel="noreferrer"` on any link in passage text, no `rehype-raw` — raw HTML in third-party crawled content is never rendered) plus custom `table`/`th`/`td`/`h1`/`h2` component styling, since passage chunks are frequently raw stat/move tables (the known tabular-content limitation applies to CPR the same way it does to RGA). Pattern lifted from a sibling project — see the cross-repo section below. Typecheck, lint, production build, and all 35 unit tests confirmed green after this change.
- **A real UX finding worth remembering**: CPR and RGA answer the same question very differently on the same content. Asking RGA "how does Eevee evolve" (D10) produced a clean synthesized sentence. Asking CPR the same style of question about Pikachu returned raw, noisy chunks — an info table, a moves table, unrelated FAQ links — because CPR doesn't synthesize an answer, it hands back raw retrieved passages for a downstream LLM/app to interpret. This is real, tested material for E4's POV doc, not a guess.

## Cross-repo inspiration pass (this session)

A separate, more mature sibling Coveo take-home project exists at `/Users/venalla/coveo-assesment` (same author, a commerce/catalog search app — not part of this repo). At the user's request, three Explore agents scanned it in parallel for patterns worth porting here (security, analytics/config, listing/facets/markdown, RGA-rerender behavior/relevance/conversation architecture), and the findings were written up — grounded against this repo's actual current code, not blindly copied — as a new standalone doc: **`docs/inspiration-from-coveo-assesment.md`**. Read it before the next session touches security headers, `AskAboutPokemon.tsx`, or `GeneratedAnswer.tsx` — it has 9 prioritized recommendations across 3 tiers (do-soon/cheap, needs-an-explicit-decision, deliberately-out-of-scope), two of which are already actioned:

- Item 2 (markdown rendering) — done this session, see the Stage E section above.
- Item 3 (CSP `base-uri`/`form-action`) — folded into the D11 "what's next" item above, not yet done.
- Item 4 (RGA re-render on facet change) — investigated but **not resolved**. The sibling repo's RGA is a hand-built component that deliberately does not regenerate on facet change (an explicit design decision there). This repo's `GeneratedAnswer.tsx` is architecturally different — it subscribes to Coveo Headless's native `buildGeneratedAnswer` controller directly, so its regeneration behavior is governed by Headless itself, tied to the engine's search-execution cycle (which facet changes do trigger here, unlike the sibling's isolated custom provider). The sibling's specific fix doesn't transfer. What's actually needed: watch the Generated Answer box while toggling a Type/Generation facet in the running app and decide on purpose whether that's the wanted behavior — not yet done.
- Item 1 (git-hook secret scanning) — not started, flagged as cheap/high-value.
- Items 5–9 (analytics abstraction, typed feature flags, facet UI patterns, answer-banner animation, `ConfigurationNotice` consolidation) — deliberately not recommended for this project's scope; reasoning is in the doc, don't re-litigate without a reason the scope changed.

## Documentation findings from this session — don't re-derive these

Full detail in ADR-0006, ADR-0007, and `docs/plan101.md`'s Stage D table.

1. **A Coveo Custom-purpose API key can no longer be granted Execute queries or Analytics-Push in this org's console.** Confirmed directly by inspecting the Custom wizard's full Privileges list (Search domain: no "Execute queries" row at all; Analytics data domain: dropdown offers only `View`/`no access`, no `Push`) — not inferred from generic docs, which still describe these as ordinary assignable privileges. The console's own banner explains why: *"certain privileges are now limited to predefined templates."* Treat this as true for this org/console build as of 2026-08-26–27, not necessarily a durable platform fact — worth a caveat if it comes up in the Topic 1 deck.
2. **Minting a search token requires `Impersonate` under owner `SEARCH_API` specifically**, confirmed via Coveo's privilege-introspection endpoint (`POST /rest/organizations/<org>/privileges/token?accessToken=<key>`, docs.coveo.com/en/109) and a documented example payload showing that exact owner/domain pair. A same-named `Impersonate` privilege under a *different* owner (`USAGE_ANALYTICS`, what the Anonymous search template actually grants) does not satisfy this — the privilege model isn't just "does the key have X," it's "does the key have X under the right owner."
3. **Search hub restriction on an API key is populated from usage-analytics history, not free text.** The "Select a search hub" dropdown when creating a key only lists hub values that have actually appeared in real traffic (e.g. `AdminConsole`) — `PokedexSearch` won't appear until the app has sent at least one real query with that hub, which is exactly what creating the key is a prerequisite for. Chicken-and-egg; the field is optional, leave it unset. Also: whatever you pick (including unset) is locked in permanently on save — there is no "add it later" for an existing key.
4. **Next.js's `NEXT_PUBLIC_*` build-time inlining only recognizes the literal syntactic expression `process.env.NEXT_PUBLIC_X` wherever it appears verbatim in source.** A variable that merely *defaults to* `process.env` (`function f({ environment = process.env } = {})`) and is then indexed dynamically (`environment.NEXT_PUBLIC_X`) does not get inlined — in the browser, `process.env` is a stub object containing only the keys Next's static scanner found via that literal pattern, so the dynamic access silently reads `undefined` forever, independent of what's actually set in `.env.local`. This is easy to reintroduce by adding a new env-driven field to `resolveCoveoConfig` without preserving the literal-expression form in its default value — see the comment block in `src/coveo/config.ts` before touching it.
5. **Coveo's Search API does not return custom fields in a result's `raw` object by default** — only a small standard set (title, uri, etc.). Custom fields need `loadFieldActions(engine).registerFieldsToInclude([...])` dispatched once against the engine. Facet value counts are unaffected either way, since facet aggregation is computed server-side independent of what's echoed back per result — which is exactly why this bug was invisible in the facet sidebar while breaking every result card and the PDP.
6. **`ALLOW_CONTENT_PREVIEW` is not what gates Passage Retrieval — `EXECUTE_QUERY` is.** ADR-0005/0006's original design was wrong about this; see ADR-0008. Confirmed by direct testing, not docs: a key with only content-preview got a 403 before the pipeline even resolved, a key with EXECUTE_QUERY reached real business-logic errors (missing model, then success once the model existed).
7. **The Passage Retrieval request schema is not the same shape as this app's other Search API v2 calls.** `pipeline` is not a real field on `POST /rest/search/v3/passages/retrieve` (silently accepted and ignored); `aq`/`cq` are also silently ignored — the real scoping field is `filter`, using the same query-expression syntax (e.g. `@pokemonname=="Eevee"`). `localization` (`{locale, timezone}`) is required, undocumented as such in this app's original Phase 2 implementation. Source: docs.coveo.com/en/o86c8334 — a different page from the CPR model/console docs, found via web search, not doc navigation.
8. **A Coveo org admin's own browser session can authorize Machine Learning Swagger UI calls without a separate API key**, as long as the admin account carries the needed privilege (`Machine learning - Models - Edit` for D7's CSV upload). Worth remembering any time a "we need a key with privilege X" problem comes up — check whether the admin's own session already has it before reaching for a new Custom key, which may hit the same template-lock problem as D1.

## Traps carried over from prior sessions (Stage A–C, still relevant, unchanged)

Full list in `docs/plan101.md`; the short version: selectors must end in `text()`/`@attr`; the `№` character selector works in the Chrome extension but not in Coveo's actual crawler (match on `"National"` instead); the vitals table has two `№` rows needing positional truncation; `fetchpriority="high"` isn't unique to hero artwork; unmapped metadata is invisible in Content Browser until a Field + mapping both exist; mapping rules are first-match-wins, top-to-bottom.

## External docs.coveo.com pages read this session (log, so the next session doesn't re-derive them)

Grouped by what they were read to resolve. Where a page's actual rendered content didn't match what the search snippet promised (docs.coveo.com is JS-rendered and the fetch tool available in this session got inconsistent results), that's noted — don't assume a page is useless just because it's listed as "unhelpful," it just means the same URL might render differently in a real browser and could be re-checked manually.

**Query pipeline filters (for the D3.5 source-scoping fix):**
- [docs.coveo.com/en/3410](https://docs.coveo.com/en/3410/) — Manage filter rules. Gave the actual navigation path and `filter cq @source==(...)` syntax used.
- [docs.coveo.com/en/1449](https://docs.coveo.com/en/1449/) — Query pipeline language (QPL) reference.
- [docs.coveo.com/en/1440](https://docs.coveo.com/en/1440/), [docs.coveo.com/en/1959](https://docs.coveo.com/en/1959/) — Filter feature overview, and managing query pipeline conditions. Background reading, not directly quoted.

**Field sortability (for the tenth-session Phase v3.1 fix):**
- [docs.coveo.com/en/1982](https://docs.coveo.com/en/1982/index-content/add-or-edit-a-field) — requested first; the fetch tool reported this page as obsolete, auto-redirecting to `/en/1833/`. Diverged from what the search snippet promised (a live "Add or Edit a Field" page); worth a manual re-check in a real browser if this comes up again, per this doc's own caveat about JS-rendered pages.
- [docs.coveo.com/en/1833](https://docs.coveo.com/en/1833/) — the redirect target, and the one actually used. Confirmed the console field option is named **Sortable**, not "Use for sorting" (that phrasing in prior sessions' `sortOptions.ts` comments and this file was an informal paraphrase, not the literal control name) — menu path Administration Console → Content → Fields, per-field Edit panel, mandatory for non-string fields, optional toggle for string fields like `pokemonname`. No rebuild required, propagation delay expected. Also documents a separate "Use cache for sort" performance option, not needed for this fix.

**Testing a pipeline without a Search Page (for verifying the D3.5 filter):**
- [docs.coveo.com/en/1791](https://docs.coveo.com/en/1791/) — Manage query pipelines. Gave the "pipeline → More → Open in Content Browser" method actually used to verify the filter.
- [docs.coveo.com/en/2088](https://docs.coveo.com/en/2088/), [docs.coveo.com/en/mc2g0358](https://docs.coveo.com/en/mc2g0358/) — Troubleshoot/inspect query pipeline rules (`executionReport`). Background reading, not directly used.
- [docs.coveo.com/en/89](https://docs.coveo.com/en/89/), [docs.coveo.com/en/las95231](https://docs.coveo.com/en/las95231/) — Determine which pipeline a search page uses; enforcing searchHub in auth. Background reading.

**API keys and privileges (for D1, and diagnosing why Custom couldn't grant Execute queries/Push):**
- [docs.coveo.com/en/1718](https://docs.coveo.com/en/1718/) — Manage API keys. Gave the Add-key wizard's step names (Key Purpose → Identification → Configuration → Access → Review → Confirmation) and the list of Key Purpose templates (Anonymous search, Authenticated search, Usage analytics, Search pages, Anonymous Case Assist, Push API, Crawling Module administration, View all content, Custom).
- [docs.coveo.com/en/60](https://docs.coveo.com/en/60/) — Get the privileges you can assign to an API key.
- [docs.coveo.com/en/1707](https://docs.coveo.com/en/1707/) — Privilege reference. Confirmed domain/access-level names (Execute queries, Analytics data → Push, Allow content preview) — useful for what *should* exist generically, though the live Custom wizard (verified by screenshot, not docs) turned out not to expose all of them.
- [docs.coveo.com/en/82](https://docs.coveo.com/en/82/) — Manage API keys programmatically. Background reading, confirmed the owner/targetDomain privilege model shape.
- [docs.coveo.com/en/105](https://docs.coveo.com/en/105/build-a-search-ui/api-key-authentication) — Use API key authentication with the Search API. Fetch attempts returned mostly nav-shell content, not much usable detail extracted.

**Search token minting and the SEARCH_API/IMPERSONATE finding (ADR-0007, the session's most consequential investigation):**
- [docs.coveo.com/en/56](https://docs.coveo.com/56) — Use search token authentication. Confirmed the "Authenticated Search" template pattern; didn't directly state the Impersonate/owner requirement.
- [docs.coveo.com/en/109](https://docs.coveo.com/en/109) — Get the privileges of an access token. **This is the key one** — gave the exact `POST /rest/organizations/<org>/privileges/token?accessToken=<key>` introspection call used to directly see what privileges a key actually carries (owner + targetDomain pairs), which is what surfaced that the Anonymous-search key's `Impersonate` was scoped to `USAGE_ANALYTICS` instead of `SEARCH_API`. Re-run this call on any new key before assuming its privileges match what the console UI implies.
- A general web search (not a specific docs.coveo.com page) surfaced the documented example payload showing `SEARCH_API`/`IMPERSONATE` is what token minting actually requires — worth trying to find the specific source page directly next time rather than relying on a search-engine summary of it.

**D6–D10, Stage E model creation/association (Query Suggest, Semantic Encoder, RGA, CPR):**
- [docs.coveo.com/en/3398](https://docs.coveo.com/en/3398/) — Create/manage a QS model; gave the exact console flow (Add model → card → Learn from/filters → name → Start building → Advanced tab → Test configuration mode) and confirmed the "sandbox organizations only" caveat, which turned out not to block this org.
- [docs.coveo.com/en/l1mf0321](https://docs.coveo.com/en/l1mf0321/) — Associate a QS model with a pipeline; confirmed association isn't gated on model status (tested live, matched).
- [docs.coveo.com/en/l3od9093](https://docs.coveo.com/en/l3od9093/), [docs.coveo.com/en/l3td0254](https://docs.coveo.com/en/l3td0254/) — Advanced Model Configurations API / Swagger upload flow for D7's `DEFAULT_QUERIES` CSV. Confirmed the Swagger-UI-with-admin-session auth path (no API key needed).
- [docs.coveo.com/en/nb890247](https://docs.coveo.com/en/nb890247/) — Create/manage Semantic Encoder models.
- [docs.coveo.com/en/nb6a0085](https://docs.coveo.com/en/nb6a0085/) — Create/manage RGA models; gave the licensing-prerequisite text ("paid product extension") that turned out not to actually block this org.
- [docs.coveo.com/en/nb6a0104](https://docs.coveo.com/en/nb6a0104/) — Associate an RGA model with a pipeline; gave the mandatory `Query is not empty` condition requirement and the Advanced configuration options (Items to consider, Chunk relevancy threshold, Rich text formatting, Thesaurus rules).
- [docs.coveo.com/en/1959](https://docs.coveo.com/en/1959/) — Query pipeline condition operators; needed specifically to find the dedicated `Is not empty` operator (not `Is not` + a blank value) for the RGA condition.
- [docs.coveo.com/en/oaoe7068](https://docs.coveo.com/en/oaoe7068/), [docs.coveo.com/en/oaie5476](https://docs.coveo.com/en/oaie5476/), [docs.coveo.com/en/oaie6403](https://docs.coveo.com/en/oaie6403/) — CPR implementation overview, model creation, pipeline association. Confirmed CPR's condition is genuinely optional (unlike RGA's), and that CPR/SE must share content.

**Passage Retrieval's actual request schema and privilege requirement (ADR-0008, this session's most consequential investigation):**
- [docs.coveo.com/en/o86c8334](https://docs.coveo.com/en/o86c8334/) — Use the Passage Retrieval API. **This is the key one** — the only page found with the real request body schema (`query`, `filter`, `maxPassages`, `searchHub`, `localization`, `context`, `analytics`). Found via web search after the Swagger-UI page and the CPR overview page both failed to render the schema through the fetch tool available this session (JS-rendered content, inconsistent extraction) — don't assume a page doesn't have the answer just because one fetch attempt came back empty; try a different page or a targeted web search for the same content before concluding it's undocumented.

## What the next session should read first, by task

- **E4 (Passage Retrieval vs. RGA POV doc) — not started, the only real open Stage D/E item:** no new docs needed — the material is empirical, already gathered this session (see the Stage E section above: RGA synthesizes, CPR retrieves raw chunks for downstream use). Writing it is drafting, not research.
- **D11 (CSP tightening):** no docs needed, just apply `docs/inspiration-from-coveo-assesment.md` item 3's two directives (`base-uri 'self'`, `form-action 'self'`) alongside the already-planned wildcard→real-hostname change in `next.config.ts`.
- **The RGA-on-facet-change question** (`docs/inspiration-from-coveo-assesment.md` item 4) — no docs needed either, this is a live-behavior check: toggle a facet on `/search` while a Generated Answer is showing and watch what happens, then decide.
- **General caveat, still true:** this session repeatedly found that docs.coveo.com's generic documentation and this org's/this API's actual live behavior disagreed (Custom key privileges; CPR's real request schema vs. what the Swagger UI page rendered; RGA/CPR licensing not actually gating despite the "paid extension" language). Treat every doc page as a starting hypothesis to verify against the real console/API — the privilege-introspection endpoint (`docs.coveo.com/en/109`) and Content Browser (`docs.coveo.com/en/1791`) remain the reliable ground-truth checks, and for API request shapes specifically, testing with curl and reading the actual response beats trusting any single docs page.

## Reference docs

- `docs/plan101.md` — full step-by-step build plan, status per step, live-findings appendix, now current through Stage E3 (only E4 and D11 open).
- `docs/archive/EXECUTION-PLAN.md` — overall plan across Phases 0–6, Phase 4/5 sections kept in sync with plan101's Stage D/E.
- `docs/adr/0005-server-token-and-passage-routes.md` — original server-minting design and original Passage Retrieval privilege assumption (both superseded, see ADR-0007 and ADR-0008 respectively).
- `docs/adr/0006-split-api-key-for-content-preview.md` — why two keys instead of one. Now stale on one point: `COVEO_ML_API_KEY`, the key this ADR justified creating, turned out unused by anything (ADR-0008) — not rewritten, since the two-key *reasoning* (Custom purpose's template-lock) is still accurate even though the specific consumer it was built for isn't real.
- `docs/adr/0007-dual-auth-mode-direct-vs-server-token.md` — why `/api/token` can't work on this org, and the `direct`/`server` auth-mode split that replaces it.
- `docs/adr/0008-passage-retrieval-needs-execute-query-not-content-preview.md` — new this session. Why `/api/passages` was 403ing (wrong key/privilege assumption), the fix, and the now-closed question of whether content-preview is needed at all (it isn't).
- `docs/inspiration-from-coveo-assesment.md` — new this session. Prioritized recommendations mined from a sibling Coveo project, cross-checked against this repo's actual code — not a build-status doc, a to-pull-from list.
- `docs/coveo-source-spec.md` — **updated this (sixth) session**, no longer stale. Now the real, live-verified selector/field/mapping/IPE spec for all 26 `Pokedex - Test` fields (the original 5 plus all of Phase v2.1), including the extraction bugs hit and fixed while building it. Read this before touching any field extraction rule, not the summary in this file.
- `docs/final_config.json` — the Full source's complete saved JSON configuration, from the end of the fourth session — **stale as of this (sixth) session's Phase v2.2 migration**: `Pokedex - Full` now has 24 real fields, not the 5 this file describes. Not re-exported/updated this session; treat the live console as ground truth over this file until it's refreshed.
- `docs/DEFAULT_QUERIES.csv` — the D7 Query Suggest preload file, committed in the fourth session (1070 rows: 1025 live-pulled Pokemon names + 45 curated intent phrases).
- `docs/temp/` — screenshots across the first four sessions; `docs/temp/stage-d/` holds fourth-session evidence (D7's 200 response, D9/D10's RGA answer).
- `docs/archive/EXECUTION-PLAN-v2.md` — a second-phase plan (richer indexed data + a mockup-inspired frontend), separate from and building on `EXECUTION-PLAN.md` above — not a build-status doc, a forward-looking roadmap. Phase v2.1's checkboxes are now checked off (sixth session). Read alongside its two research docs: `docs/pokemon-data-inventory.md` (factual survey of real pokemondb.net data, feasibility-rated) and `docs/mockup-ui-analysis.md` (breakdown of the `mock-ups/*.png` designs against real data availability).
- `docs/archive/EXECUTION-PLAN-v2.3-frontend.md` — an untracked frontend design doc already in the repo (not yet committed as of this session). Specs a grouped-sub-object `PokemonItem` shape that diverges from what actually got built this session (flat fields) — see the sixth-session section above before starting Phase v2.3 work from this doc as if it already matches the code.
