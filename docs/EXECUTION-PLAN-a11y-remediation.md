# Coveo Pokemon Challenge — Execution Plan: A11y Remediation

**Status: not started.** Scoped thirtieth session (a11y-scan-finding writeup) and expanded with a full audit run this session (thirty-first). Tracks the four real, pre-existing violations `tests/e2e/a11y-scan.spec.ts` found and allowlisted rather than fixed (`docs/EXECUTION-PLAN-quick-improvements.md`'s Phase 2), plus `docs/HANDOFF.md`'s "Thirtieth session" entry.

## Context

`tests/e2e/a11y-scan.spec.ts` runs `AxeBuilder#analyze()` against `/`, `/search?q=pikachu`, `/pokemon/pikachu`, and `/compare?names=pikachu,eevee`. Four rule ids are currently disabled via `KNOWN_PRE_EXISTING_RULE_IDS` so the suite ships green: `color-contrast`, `landmark-one-main`, `page-has-heading-one`, `region`. This doc scopes fixing the underlying issues and removing that allowlist.

An ad-hoc audit run this session (same four routes, same rule ids, `withRules()` instead of `disableRules()` to see what's actually failing) produced the findings below — concrete element targets and contrast ratios, not a re-guess of the thirtieth session's summary.

## Findings

### 1. `color-contrast` — `text-shell-400` and `text-black/40`/`text-white/40` under WCAG AA 4.5:1

- **`text-shell-400`** (`--shell-400: #767d8e` on `--shell-050: #f4f5f8`) measures **3.78:1**. Used widely: `src/app/page.tsx:68`, `src/app/pokemon/[name]/PokemonDetailPageClient.tsx:116,121`, `src/app/compare/page.tsx` (multiple `<th>` labels and body text), `src/components/SimilarPokemon.tsx:232,251`, `src/components/TypeDefenses.tsx:35,50`, and more (`grep -rn "text-shell-400" src` for the full list — double digits of call sites).
- **`text-black/40 dark:text-white/40`** (facet option counts on `/search`) measures **2.82:1** — worse than `shell-400`. Confirmed live: `fieldset > .space-y-1 > li > .cursor-pointer > .text-black\/40.dark\:text-white\/40` on `/search?q=pikachu`, 64 nodes flagged (every facet-value row's result count).
- Per-route node counts from the live audit: home 17 nodes, `/search` 64 nodes, PDP 1 node, `/compare` 1 node.

**Fix shape:** this is a color-token problem, not a per-usage one. Two sub-decisions needed before touching code:
- Whether `--shell-400` itself gets darkened (affects every current usage, including non-text uses like icon fills — check `globals.css:378,416,463` for non-text consumers before just editing the CSS variable) or a new, darker token (`--shell-500`?) is introduced for text specifically and `shell-400` stays for non-text/decorative use.
- Whether `text-black/40`/`text-white/40` (an opacity-based utility, not a `shell-*` token) gets replaced with a `shell-*` token entirely or just a higher opacity value — test the resulting ratio against both light (`shell-050`) and dark (`shell-800`) backgrounds before picking one, since this is `dark:`-variant-aware.

### 2. `landmark-one-main` — no `<main>` element anywhere

Confirmed on every route except `/search` (which the audit run didn't flag for this rule, worth re-confirming — may be inconsistent between routes, or an artifact of what the loaded page looked like at scan time). `grep` confirms zero `<main>` tags or `role="main"` attributes anywhere under `src/`.

**Fix shape:** each top-level page (`src/app/page.tsx`, `src/app/search/page.tsx`, `src/app/compare/page.tsx`, `src/app/pokemon/[name]/PokemonDetailPageClient.tsx`) needs its primary content wrapped in a real `<main>` — not a `layout.tsx`-level global wrapper, since `AppHeader`/chrome content should stay outside it. Check each page's current top-level JSX structure individually; this likely resolves the `region` violation (#4 below) for free once content has a landmark to sit inside.

### 3. `page-has-heading-one` — no level-one heading on some routes

Confirmed on home, `/search`, and PDP. Not flagged on `/compare` in this run (worth re-checking — `/compare` may already have an `<h1>` for the page but not the other three).

**Fix shape:** audit each route's existing heading structure (an `<h2>` might already exist where an `<h1>` belongs, e.g. `region` finding #4 below shows an `h2` on the home page) — likely a level fix (`h2` → `h1`) rather than adding new copy, but confirm per-route rather than assuming.

### 4. `region` — page content outside any landmark

Home: 4 nodes (`.mb-8.w-full`, a `<p>`, an `<h2>`, `.mt-12 > .w-full > .overflow-hidden`). PDP: 1 node (a `<span>`). `/compare`: 1 node (`.min-w-0`). Likely resolved as a side effect of #2's `<main>` wrap — verify after that fix lands rather than treating as independent work.

## Phase 1 — landmark structure (`<main>` + heading levels)

- [ ] Add a real `<main>` wrapping primary content on each of the four routes.
- [ ] Fix heading levels so each route has exactly one `<h1>`.
- [ ] Re-run the audit script/spec with `region` and `landmark-one-main` re-enabled to confirm both clear (see Verification).

## Phase 2 — color contrast

- [ ] Decide the token fix shape (see Finding 1's two sub-decisions) — this needs a quick live contrast check against both light and dark backgrounds before picking values, not a guess.
- [ ] Apply the fix (token edit and/or usage-site swap) across every flagged call site.
- [ ] Re-run with `color-contrast` re-enabled to confirm it clears on all four routes, light and dark.

## Verification — run before calling this plan done

- [ ] Remove entries from `KNOWN_PRE_EXISTING_RULE_IDS` in `tests/e2e/a11y-scan.spec.ts` as each is fixed (or all four at once at the end) — the array should be empty (and probably deleted, with `disableRules()` calls removed) once both phases land.
- [ ] `npm run test:e2e` — `a11y-scan.spec.ts` passes with no disabled rules, against a real configured org.
- [ ] Manual visual check in both light and dark mode — a contrast fix that clears axe but looks visually broken (e.g. text too dark against its actual card background, not just the page background axe sampled) is not done.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` clean.
- [ ] Update `docs/HANDOFF.md` with a session entry (this changes app-visible behavior: color tokens, heading structure, DOM landmarks).
