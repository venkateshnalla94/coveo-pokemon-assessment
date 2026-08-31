# Execution Plan — Consistent Idle/Loading/Success/Error States Across Async Components

Status: **complete.** `SimilarPokemon.tsx` shipped built to this contract
from day one (twentieth session). `GeneratedAnswer.tsx`, `AskAboutPokemon.tsx`,
and `ResultList.tsx` were brought onto it in the twenty-first session — see
`docs/HANDOFF.md`'s "Twenty-first session" entry, including
`docs/adr/0016-generated-answer-error-state.md` for the one real design
decision this pass required (a new, previously-absent "error" status on
`GeneratedAnswer`).

Scope: every component in this app that waits on Coveo or this app's own API
routes gets the same four-state contract, so the surrounding page never jumps
the instant a response lands.

---

## 0. The actual bug, in concrete terms

Two real, confirmed cases, not a vague "feels off":

- **`GeneratedAnswer.tsx`** returns `null` for its `"hidden"` state, then
  mounts a `Panel` for `"loading"`, then a taller `Panel` for
  `"streaming"`/`"answer"` — three different DOM shapes, directly above
  `ResultList`/`Pager` in normal flow on `/search`
  (`src/app/search/page.tsx:57-59`). Every transition reflows everything
  below it. This is the "whole page moves" complaint.
- **`AskAboutPokemon.tsx`** renders a small form; its results block (error /
  no-passages / passages `<ol>`) doesn't exist in the DOM at all until a
  response lands, at which point a multi-card list appears where there was
  nothing — described this session as "tiny box... then whole PDP moves."

`ResultList.tsx`'s `loading` branch is plain text next to a `success` branch
that's a 2-4 column image grid — same class of problem, lower complaint
priority since it's the very first thing on `/search` rather than something
appearing mid-page.

The codebase already has a working answer to *part* of this — `ResultCard`
reserves space for its dex-number/stat-bar reveal by rendering them always at
`opacity-0` and fading in on hover, rather than mounting them conditionally
(`ResultList.tsx:154-155,184`, "so nothing reflows on reveal"). This doc
extends that same idea from a hover interaction to an async-data reveal.

## 1. The contract

Every Coveo-or-own-API-backed component renders exactly one of four states,
always, never skipping straight from nothing to full content:

1. **Idle / call-to-action** — nothing has been requested yet. A real prompt
   or affordance sized close to its eventual footprint, not empty space.
   (`AskAboutPokemon`'s question form already qualifies as this state; it
   just doesn't reserve space *below* itself for what comes next.)
2. **Loading** — a shimmer/skeleton shaped like the eventual content (rough
   line/card outlines sized close to a typical real response), not a bare
   loading-text string or spinner.
3. **Success** — the real content.
4. **Couldn't retrieve** — a distinct, real state for both a hard error and a
   response that came back empty (zero passages, zero citations, zero
   results) — never silently rendering nothing in either case.

## 2. Mechanism — one wrapper, animated, never unmounted

Each component in scope keeps a single persistent wrapper element mounted
across all four states — no `return null`, no conditional mount/unmount that
changes whether the element exists in the DOM. Height changes between states
animate via the CSS grid collapse/expand technique:

```css
.async-panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 260ms ease;
}
.async-panel[data-open="true"] {
  grid-template-rows: 1fr;
}
.async-panel > * {
  overflow: hidden;
}
```

This is declarative and framework-free (no JS height measurement), and
degrades safely under `prefers-reduced-motion: reduce` (set `transition:
none` in that media query, matching every other motion rule already in
`src/app/globals.css`).

This **smooths** a size change into an animated resize instead of an instant
snap — it does not make genuinely variable-height content (streamed
markdown, a variable number of passages/citations) perfectly stationary.
Say this plainly rather than promising pixel-perfect stability: the loading
skeleton should be sized close to a *typical* real response specifically to
keep the remaining jump small, not eliminate it.

## 3. Per-component changes

- **`GeneratedAnswer.tsx`**: replace the `"hidden"` → `null` return with the
  wrapper always mounted (collapsed via `data-open="false"` when hidden).
  Give `"loading"` a real skeleton (2-3 `animate-pulse` bars roughly matching
  a short answer's height) in addition to the existing `ScanSequence` label.
  `"streaming"`/`"answer"` open the wrapper to its content height as today.
  Add an explicit **couldn't-retrieve** rendering for a genuine RGA failure
  state (check whether `GeneratedAnswerState`/`deriveGeneratedAnswerRenderState`
  in `src/coveo/generatedAnswerRenderState.ts` already models an error case —
  if not, that mapper needs a new arm, not just a UI change).
- **`AskAboutPokemon.tsx`**: wrap the results block (currently only rendered
  post-response) in the same `.async-panel`, open on `"loading"` with a
  skeleton sized to roughly one passage card, and keep it open through
  `"error"`/`"success"` so the region the user's eye is already on doesn't
  relocate.
- **`ResultList.tsx`**: give the `"loading"` branch a skeleton using the same
  `grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4` shape as `"success"`,
  with placeholder tiles roughly matching `ResultCard`'s box (sprite-square +
  two text lines) so `loading → success` swaps tile content, not grid shape.
  `"empty"` stays its own distinct centered layout (a real content
  difference, not a bug) — just confirmed not to collapse to a drastically
  different height band than the grid it replaces.
- **New carousel** (`docs/EXECUTION-PLAN-similar-pokemon-carousel.md`): built
  against this same `.async-panel` pattern from the start.

## 4. Files touched

- `src/app/globals.css` (new `.async-panel` rule + reduced-motion override,
  new skeleton/shimmer utility classes)
- `src/components/GeneratedAnswer.tsx`, `src/components/AskAboutPokemon.tsx`,
  `src/components/ResultList.tsx`
- `src/coveo/generatedAnswerRenderState.ts` (only if it needs a new error arm
  — confirm first, don't add one speculatively)

## 5. Verification

- Unit tests for each component's new skeleton/error render branches,
  extending their existing test files rather than replacing them.
- e2e: extend `tests/e2e/search.spec.ts` (or a new spec) with a real
  `getBoundingClientRect()` check on a stable element below each affected
  component (e.g. `Pager` below `GeneratedAnswer`) taken before and after the
  async response lands, asserting the shift stays within a small tolerance —
  proving the fix live, matching this project's existing verification style
  (e.g. the `prefers-reduced-motion` computed-style checks from the v4 design
  pass) rather than trusting the CSS by inspection.
- Manual: throttle the network (dev tools) on `/search` and a PDP's "Ask
  about this Pokemon," watch for any remaining hard jumps, and confirm the
  reduced-motion override actually removes the transition under forced
  `prefers-reduced-motion: reduce`.
