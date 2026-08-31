# 0013: A type-driven design system — generated tokens, a two-use red, and no inline RGA highlighting

Status: Accepted

## Context

`docs/archive/EXECUTION-PLAN-v4-design-system.md` (batches 2-6) replaced the untouched
Next.js starter look with a design system built around the 18 Pokemon type
colors already sitting unused in `src/coveo/typeColors.ts`. Three decisions
from that plan are architectural enough, and load-bearing enough for future
sessions, to record here rather than leave scattered across component
comments.

## Decision 1: generated CSS tokens, not a second hardcoded color list

`TYPE_COLORS` in `src/coveo/typeColors.ts` is the single source of truth for
all 18 type hexes. Two functions derive everything the CSS layer needs from
it instead of a parallel hand-authored list:

- `typeCssVariables()` serializes `TYPE_COLORS` into `--type-<name>: <hex>;`
  custom-property declarations, emitted once from a `<style>` tag in
  `src/app/layout.tsx` (permitted under the existing strict CSP — inline
  `<style>` tags are allowed, a remote stylesheet host is not).
- `getTypeTextColor()` returns whichever of `#FFFFFF` / `#1A1C22` clears
  4.5:1 (WCAG AA) against that type's hex, computed with the standard
  relative-luminance formula and re-verified independently in
  `tests/unit/coveo/typeColors.test.ts` (the test re-derives the ratio
  itself rather than asserting against the implementation's own output, so a
  future `TYPE_COLORS` edit that quietly breaks a pairing fails loudly there,
  not silently in the UI).

Every other color a type needs on screen — tile glow, dual-type gradient,
facet-hover tint, focus-ring edge — is computed at the point of use with
`color-mix()` against a per-element `--type-primary` / `--type-secondary`
pair set as an inline `style`, not baked into CSS as more hex values:

| Form | Recipe |
|:--|:--|
| glow | `color-mix(in oklab, var(--type-primary) 18-32%, transparent)` |
| tint | `color-mix(in oklab, var(--type-primary) 8%, var(--surface))` |
| edge | `color-mix(in oklab, var(--type-primary) 55%, transparent)` |

`oklab`, not sRGB — sRGB mixing turns `ice` and `steel` visibly grey, which
`oklab` doesn't.

Net effect: one 18-entry source of truth, computed forms everywhere else.
Adding a 19th type (never happening, but as a design constraint) or
re-tuning a single hex touches exactly one file.

## Decision 2: `--signal-red` restricted to two uses, with one plan-directed exception

`docs/archive/EXECUTION-PLAN-v4-design-system.md` §3.2 states `--signal-red` is
"restricted to exactly two uses: the Pokeball glyph and the global focus
ring." Both exist:

- The Pokeball glyph's button fill on focus/loading/settle
  (`src/components/ui/PokeballGlyph.tsx` + `.pokeball-button` in
  `globals.css`).
- A global `:focus-visible` ring (`src/app/globals.css`, unlayered so it
  outranks Tailwind's `outline-none` utility regardless of source order —
  the same cascade rule already documented in that file for `--text-3xl`),
  reaching every interactive element added across the design pass without a
  per-component ring utility.

**This ADR documents a real inconsistency in the plan rather than smoothing
it over.** `Tabs`' active-tab underline (`src/components/ui/Tabs.tsx`) also
uses `--signal-red`, directed by the same plan document (§9: "Tabs restyle
to mono uppercase labels with a `--signal-red` active underline"). That is a
third use under §3.2's literal "exactly two" wording. It was flagged as a
known tension during batch 4 and reconfirmed during this pass (batch 6, the
motion/a11y audit) rather than "fixed" — removing it would mean either
abandoning the plan's own explicit PDP direction or inventing a different
accent color for tab state that nothing else in the system uses, and neither
is an improvement over documenting the contradiction plainly. If a future
session wants true "exactly two," the fix is a plan-level decision (pick a
different Tabs accent, or restate §3.2 as "exactly two decorative uses plus
the focus ring's semantic-adjacent Tabs case"), not a silent code change
here.

Two additional focus-ring specifics worth recording, since they were bugs
found and fixed during this same pass:

- SearchBox's own input wrapper shows an **always-on** (not `:focus-visible`
  -gated) signal-red ring whenever `isFocused` is true — a deliberate part
  of the Pokeball glyph's focus animation (§4), not a second violation of
  the "focus ring" use. The global `:focus-visible` rule is suppressed on
  that specific `<input>` (`.search-box-input:focus-visible { outline: none;
  }`) so keyboard focus doesn't draw a redundant second ring inside the
  already-ringed wrapper.
- The type-facet swatch's native checkbox is `sr-only` (visually hidden
  under the `TypeSwatch` decoration, per §6's "keep the native checkbox,
  don't replace it" rule). `sr-only`'s `clip`/`overflow:hidden` would have
  clipped any outline drawn on the checkbox itself, so the ring is painted
  on the swatch's visible sibling instead
  (`.swatch-checkbox:focus-visible + *` in `globals.css`), verified live via
  keyboard focus + `getComputedStyle`, not assumed from the CSS source.

## Decision 3: no inline highlighting of RGA citation spans

The original brief asked for the exact retrieved passage span to be
highlighted inline inside the generated answer. `@coveo/headless@3.55.2`'s
`GeneratedAnswerCitation` type carries no `start`/`end`/`offset`/`position`/
`length`, and no parallel array maps answer character ranges to citations.
Citations arrive on a separate SSE event (`genqa.citationsType`) from the
answer's text deltas (`genqa.messageType`), never interleaved with an anchor
into the text. `citation.text` is the *source* snippet, not answer text, and
the streamed answer is a paraphrase of it — a substring match would usually
fail, and on the rare case it accidentally succeeded it would assert a
provenance claim the API never made. Under `PRODUCT.md` Principle 4 (no
fabricated data), that's exactly the kind of invented certainty this app
elsewhere refuses to ship.

**Dropped from the search surface.** `GeneratedAnswer.tsx` renders each
citation as a standalone mono scanline tag after the answer
(`⟶ retrieved from: <title>`), keeping `buildInteractiveCitation` click
tracking per tag, rather than attempting inline spans or the old numbered
`[1][2]` list.

The PDP's Passage Retrieval surface (`AskAboutPokemon.tsx`) is the
deliberate contrast: `/api/passages` returns verbatim crawled markdown
untouched, so a passage *is* the unit — there's no offset to infer, and no
paraphrase in the way. Chunk boundaries and relevance scores stay visible
per passage there (per `docs/passage-retrieval-pov.md`'s stated position),
never merged into one answer block. This is why the two AI surfaces on this
app look and behave differently: RGA synthesizes one answer from many
sources with no addressable span, Passage Retrieval surfaces raw, individually
addressable, unmodified passages — and the UI is honest about which is
which rather than forcing both into the same "answer" framing.

## Consequences

- A future type-color edit is a one-file change (`typeColors.ts`); the CSS
  layer never needs touching for it.
- `--signal-red`'s scope is enforceable by grep (`grep -rn "signal-red"
  src/components`) with exactly three real hits (Pokeball, focus ring,
  Tabs) — a fourth hit in a future PR is the signal to re-open this ADR's
  Decision 2, not silently accept scope creep.
- Nothing on the search page claims a provenance-verified span inside the
  generated answer; anything that reads as "this exact text came from that
  exact source" only appears where it's actually true (the PDP's
  passage-per-card view).
