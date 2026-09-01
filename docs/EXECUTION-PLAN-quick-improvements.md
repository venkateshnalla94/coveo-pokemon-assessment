# Coveo Pokemon Challenge — Execution Plan: Quick Improvements

**Status: Phase 2 complete (thirtieth session); Phase 1 not started.** Planned twenty-ninth session via three parallel Explore agents plus a three-question decision round with the user, recorded below.

## Context

Five "quick improvements" were flagged as missing from the codebase in this session:
1. Add `axe-playwright` to the e2e suite for a11y regression detection.
2. Structure API errors on `/api/similar` and `/api/passages` — consistent shape, correct status codes.
3. Add explicit request validation to the POST routes instead of relying on type coercion.
4. Consider a `src/utils/` helper folder as the codebase grows — `SearchUrlSync.tsx` named as a candidate to split into URL-parsing vs. Headless-integration concerns.
5. Document one "complex logic" file inline (`mapPokemonResult.ts` or `engine.ts`) — evolution-chain dedup, SSR engine isolation.

Exploration found item 5 already done: `mapPokemonResult.ts`'s `zipEvolutionTargets()` and `engine.ts`'s SSR singleton guard in `getSearchEngine()` both already carry explanatory comment blocks at the function and type level. **Dropped from scope** — confirmed with the user rather than manufacturing busywork on an already-documented file.

Items 2–4 turned out to share the same two files (`src/app/api/similar/route.ts`, `src/app/api/passages/route.ts`) and a common fix (extract duplicated/ad-hoc logic into a shared home), so they're bundled into one phase. Item 1 (a11y) is independent and forms its own phase.

**Decisions made with the user this session:**
- Item 3: the routes already do manual `typeof`/type-guard validation (not raw coercion) — formalize that existing pattern into a shared `src/utils/` helper rather than adopting zod (no new dependency; zod isn't in `package.json` and no ADR calls for it — matches this project's lean-dependency default).
- Item 1: new dedicated `tests/e2e/a11y-scan.spec.ts` for automated axe scans, not folded into the existing (manual-only) `tests/e2e/a11y-motion.spec.ts`.

## Phase 1 — `src/utils/` extraction + shared API error/validation/rate-limit helpers

**New files:**
- [ ] `src/utils/searchUrlFragment.ts` — move `toHeadlessFragment()` out of `src/components/SearchUrlSync.tsx` (currently private, lines 28–32) as a named export. `SearchUrlSync.tsx` imports it back; the component file shrinks to pure Headless-integration concerns (URL manager construction in `useLayoutEffect`, the two sync effects, `loadAdvancedSearchQueryActions`).
- [ ] `src/utils/apiRateLimit.ts` — extract the identical in-memory per-IP token-bucket rate limiter currently duplicated verbatim in both routes (20 req/min). Both routes import and call the same function instead of maintaining two copies.
- [ ] `src/utils/apiError.ts` — a small, closed-set response envelope for API routes, following the precedent set by `src/coveo/applicationError.ts` (`docs/standards-adoption.md` #8's normalized-error-typing convention) but for the HTTP layer:
  - `type ApiErrorCode = "INVALID_BODY" | "RATE_LIMITED" | "NOT_CONFIGURED" | "UPSTREAM_FAILURE"`
  - `jsonError(code, message, status)` → `NextResponse.json({ error: { code, message } }, { status })`, replacing today's inconsistent bare `{ error: string }` bodies.
  - Both routes swap existing `NextResponse.json({ error: "..." }, { status: N })` calls for `jsonError(...)`, keeping the same status codes already in use (400/403/429/502/503) — a response-shape consistency fix, not a status-code redesign.
- [ ] `src/utils/validateRequestBody.ts` — formalizes the existing manual-guard pattern. Small typed-field validators (matching what `similar/route.ts`'s `isNonEmptyStringArray` and `passages/route.ts`'s manual checks already do) that both routes call instead of hand-rolling the same checks twice. Returns a discriminated result (`{ ok: true, value }` / `{ ok: false, message }`) that routes turn into `jsonError("INVALID_BODY", ...)`.

**Modified files:**
- [ ] `src/components/SearchUrlSync.tsx` — shrinks per above; behavior unchanged.
- [ ] `src/app/api/similar/route.ts`, `src/app/api/passages/route.ts` — swap in the three new helpers; net result is less code per file, identical external behavior, consistent `{ error: { code, message } }` body shape on both.

**Tests:**
- [ ] Update `tests/unit/app/api/similar/`, `tests/unit/app/api/passages/` to assert the new `{ error: { code, message } }` shape (pre-commit hook per `docs/standards-adoption.md` #12 requires these stay mirrored).
- [ ] New `tests/unit/utils/apiError.test.ts`, `apiRateLimit.test.ts`, `validateRequestBody.test.ts` — outside the hook's enforced scope but should carry real coverage since this is logic extracted from previously-tested files.
- [ ] `tests/unit/components/SearchUrlSync.test.tsx` — confirm still passes with `toHeadlessFragment` imported rather than local; add `tests/unit/utils/searchUrlFragment.test.ts` for the extracted function directly.

## Phase 2 — Automated a11y scanning in e2e — DONE (thirtieth session)

- [x] Added `@axe-core/playwright@4.13.0` as a devDependency (peer dep `playwright-core >= 1.0.0`, compatible with the installed `@playwright/test@^1.62.1`).
- [x] New `tests/e2e/a11y-scan.spec.ts`, gated behind the same `test.skip(!process.env.NEXT_PUBLIC_COVEO_ORGANIZATION_ID, ...)` pattern `search.spec.ts`/`ask-about-pokemon.spec.ts` already use. Runs `new AxeBuilder({ page }).analyze()` against home (`/`), `/search?q=pikachu`, `/pokemon/pikachu`, and `/compare?names=pikachu,eevee` (bare `/compare` only renders an empty-selection message, so query params were needed to get real content to scan).
- [x] `tests/e2e/a11y-motion.spec.ts` left untouched — manual computed-style/keyboard checks (reduced motion, focus rings, keyboard nav) that axe doesn't cover; the two files are complementary.
- **The scan found real, pre-existing violations on every route the first time it ran**, confirmed with the user rather than silently allowlisted: `color-contrast` (`text-shell-400` gray text, `text-black/40`/`text-white/40` labels all fall under the WCAG AA 4.5:1 threshold), `landmark-one-main` (no `<main>` element), `page-has-heading-one` (no top-level heading on some routes), `region` (page content not contained in any landmark). User chose "allowlist now, fix later" over expanding this session to a full remediation pass. `KNOWN_PRE_EXISTING_RULE_IDS` in the spec disables exactly those four rule ids via `AxeBuilder#disableRules()`, with an inline comment naming what was found and pointing back to this doc. **The actual remediation (color tokens + landmark/heading structure across every route) is new, unscoped follow-up work — not yet planned as its own phase or doc.**

## Verification — run before calling this plan done

- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:coverage` (≥80% gate) all clean.
- [ ] `npm run test:e2e` — new `a11y-scan.spec.ts` passes against a real configured org; confirm it correctly skips when unconfigured.
- [ ] Manual `curl` check on `/api/similar` and `/api/passages` (a bad body, a rate-limited burst) to confirm the new `{ error: { code, message } }` shape is live, not just unit-tested.
- [ ] Update `docs/HANDOFF.md` with a session entry per `CLAUDE.md`'s process rule (this changes app-visible behavior: API error response shape, plus new e2e coverage).
