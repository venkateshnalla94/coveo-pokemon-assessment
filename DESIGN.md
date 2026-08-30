---
name: Pokedex Search
description: Coveo-powered search over pokemondb.net, built for the Coveo Pokemon Challenge assessment
colors:
  shell-900: "#14161C"
  shell-800: "#1E212A"
  shell-600: "#3A3F4C"
  shell-400: "#767D8E"
  shell-200: "#C7CBD4"
  shell-100: "#E4E7EC"
  shell-050: "#F4F5F8"
  shell-000: "#FFFFFF"
  signal-red: "#E3350D"
  signal-glow: "#FF6B4A"
  caution: "#b45309"
  caution-bg: "#fffbeb"
  caution-border: "#fcd34d"
  caution-dark: "#fde68a"
  caution-bg-dark: "#451a03"
  caution-border-dark: "#b45309"
  danger: "#dc2626"
  danger-dark: "#f87171"
  overlay: "rgba(0,0,0,0.40)"
typography:
  display:
    fontFamily: "'Chakra Petch', Arial, Helvetica, sans-serif"
    fontWeight: "600 | 700"
    trackingEm: -0.01
  body:
    fontFamily: "'IBM Plex Sans', Arial, Helvetica, sans-serif"
    fontWeight: "400 | 500 | 600"
  micro:
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace"
    fontWeight: "400 | 500"
    trackingEm: 0.08
    textTransform: uppercase
  scale:
    3xl: "3rem"
    2xl: "2rem"
    xl: "1.5rem"
    lg: "1.125rem"
    base: "1rem"
    sm: "0.875rem"
    xs: "0.75rem"
rounded:
  sm: "6px"
  md: "6px"
  lg: "8px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
---

# Design System: Pokedex Search

## Status of this document

This describes the design system as of the v4 token pass
(`docs/EXECUTION-PLAN-v4-design-system.md`). Two layers exist right now, at
different stages:

- **Tokens (implemented, this pass):** the Pokemon-type color palette
  (`src/coveo/typeColors.ts`, emitted as CSS custom properties from
  `src/app/layout.tsx`), the chrome neutral ramp, the three-font type system
  (Chakra Petch / IBM Plex Sans / IBM Plex Mono via `next/font/google`), and
  the 7-step type scale — all real, in `src/app/globals.css` and
  `src/app/layout.tsx`, not aspirational.
- **Component visual application (not yet done):** the search bar's Pokeball
  motion moment, type-lit result tiles, swatch facets, the RGA scan reveal,
  and the PDP hero rework are specified in
  `docs/EXECUTION-PLAN-v4-design-system.md` §4–§9 but land in later batches
  of that plan. Most components today still use the old monochrome
  ink-on-paper classes described further below — that's accurate as of this
  pass, not a documentation error.

Chrome copy (labels, headings, placeholders, empty/error messages) has been
extracted to `src/content/pokedex.ts` — edit that file, not the components,
for any copy change.

## Creative direction

**"The device panel."** Type-driven color is the one place this system
allows real chroma, deliberately bounded (see The One Accent Rule, below,
now extended to two accents: caution/amber for config errors, and
`--signal-red` restricted to exactly the Pokeball glyph and the global focus
ring). Everything else — the shell/chrome neutrals — stays a quiet, cool
"device housing" ramp, so the type palette and the Pokemon artwork carry the
personality instead of the chrome. See
`docs/EXECUTION-PLAN-v4-design-system.md` §0 and §3.2 for the full
reasoning, including why the earlier "ink-on-paper lab notebook" framing
(this document's previous version) was retired in favor of this direction.

## Colors

### Chrome (`--shell-*`)

A cool neutral ramp — `--shell-900` (deepest) through `--shell-000` (white)
— replacing the old flat ink/paper pair. Both light and dark schemes map
onto this same ramp (see `src/app/globals.css`'s `:root` / `prefers-color-scheme:
dark` blocks): light mode uses `--shell-050` as page background and
`--shell-000` as the tile/card surface; dark mode uses `--shell-900` as page
background and `--shell-800` as the tile/card surface. In both schemes the
tile surface is lighter than the page chrome — a deliberate, scheme-agnostic
relationship (`docs/EXECUTION-PLAN-v4-design-system.md` §3.2).

### Signal (`--signal-red` / `--signal-glow`)

`--signal-red` (`#E3350D`) is restricted to exactly two uses across the
whole app: the Pokeball glyph and the global focus ring. Never body text,
never links, never error states. `--signal-glow` (`#FF6B4A`) is its lighter
companion for the glyph's motion states. If red ever shows up anywhere else,
that's a bug against this rule, not a stylistic choice — see
`docs/EXECUTION-PLAN-v4-design-system.md` §3.2 for why (it stops reading as
a Pokeball cue and starts reading as an alarm).

### Functional (not decorative)

- **Caution** (`#b45309` text / `#fffbeb` bg / `#fcd34d` border, light —
  `#fde68a` text / `#451a03` bg / `#b45309` border, dark): the
  config-required banner and popup. Reserved exclusively for "Coveo isn't
  configured" states.
- **Danger** (`#dc2626` light / `#f87171` dark): inline error text
  (`ResultList`'s error render state). Text color only.

### Data Categories — Pokemon type

18 hues, one per Pokemon type, from the community-standard convention used
across fan reference sites (Bulbapedia/pokemondb.net's own type-color
scheme — not an official Nintendo/Pokemon Company brand asset). The single
source of truth is `TYPE_COLORS` in `src/coveo/typeColors.ts`; nothing else
hardcodes these 18 hex values.

Two derived exports off that same file:

- `typeCssVariables()` — serializes all 18 into `--type-<name>: <hex>;`
  custom-property declarations, emitted from an inline `<style>` in
  `src/app/layout.tsx` (permitted under this app's CSP — see
  `docs/EXECUTION-PLAN-v4-design-system.md` §1).
- `getTypeTextColor(type)` — returns whichever of `#FFFFFF` / `#1A1C22`
  clears 4.5:1 (WCAG AA) contrast against that type's hex, for solid-fill
  badge treatments. Every one of the 18 pairs is checked with the actual
  WCAG relative-luminance formula in
  `tests/unit/coveo/typeColors.test.ts`, not eyeballed — only 5 of the 18
  types (fighting, poison, ghost, dragon, dark) clear the threshold with
  white text; the other 13 use the dark fallback.

Derived per-element forms (glow/tint/edge) are computed with `color-mix()`
in `oklab` against an inline `--type-primary`/`--type-secondary` pair, not
baked into CSS as more hex values — see
`docs/EXECUTION-PLAN-v4-design-system.md` §3.1 for the exact recipes. This
wiring lands with the component restyle batches, not this token pass.

**The color-alone rule still holds, unchanged:** every type color is always
paired with the type's text label. Color is decorative reinforcement, never
the sole carrier of meaning.

### Named Rules

**The Two-Accent Rule** (supersedes the old One Accent Rule). Two saturated
*system* colors exist, each reserved for one specific functional meaning and
never used decoratively: caution/amber for configuration errors,
`--signal-red` for the Pokeball glyph and focus ring. Pokemon type colors
remain a separate, bounded data-category exception — a fixed 18-hue palette,
always paired with the type name as text, never a general-purpose accent.

## Typography

Three faces, two registers (display and body/micro count as one
functional register — see the note below), loaded via `next/font/google` in
`src/app/layout.tsx` and self-hosted at build time (no runtime font fetch,
per this app's no-server-layer default):

| Role | Face | Weights | Applied to |
|:--|:--|:--|:--|
| Display | Chakra Petch | 600, 700 | page/section headings, Pokemon names, tab labels |
| Body | IBM Plex Sans | 400, 500, 600 | running text, facet labels, buttons, counts |
| Micro | IBM Plex Mono | 400, 500 | dex numbers, stat figures, scan tags, field keys |

IBM Plex Sans and IBM Plex Mono are one type superfamily, so this is two
typefaces in practice: a display face doing editorial work only, and a
Plex pairing doing everything functional. The display face must never leak
into a scanning list (facet options, breadcrumbs) — that's the specific
failure this two-register split exists to avoid.

### Scale

Seven steps at a 16px root, defined once as CSS custom properties in
`src/app/globals.css`'s unlayered `:root` block (which outranks Tailwind's
own layered defaults for the same utility names, so `text-3xl` etc. resolve
to these values app-wide):

| Token | Value | Px |
|:--|:--|:--|
| `--text-3xl` | 3rem | 48px |
| `--text-2xl` | 2rem | 32px |
| `--text-xl` | 1.5rem | 24px |
| `--text-lg` | 1.125rem | 18px |
| `--text-base` | 1rem | 16px |
| `--text-sm` | 0.875rem | 14px |
| `--text-xs` | 0.75rem | 12px |

Display text gets `-0.01em` tracking (`.font-display` utility class in
`globals.css`); mono micro-labels get `+0.08em` tracking and uppercase
(`.font-mono-label`).

### Historical note

Components written before this pass (most of them, as of this batch) still
use ad hoc Tailwind text sizes (`text-3xl`, `text-sm`, `text-xs`) rather
than referencing the named scale tokens directly by name, and render in the
body face everywhere (no heading yet opts into `.font-display`). That's
accurate today, not a gap in this document — see "Status of this document"
above. Component-level application of the display face and the exact 7-step
scale is `docs/EXECUTION-PLAN-v4-design-system.md` §4–§9 work.

## Layout

Unchanged by this pass. Single-column, centered, max-width-constrained
containers — no full-bleed sections. Home (`/`) centers a narrow column
(`max-w-2xl`); `/search` widens to `max-w-6xl` with a 200px facet rail +
fluid main column above `md`. The result grid steps 2 → 3 → 4 columns across
`base → sm → md`. Horizontal page padding is a flat 24px (`px-6`) at every
breakpoint.

`docs/EXECUTION-PLAN-v4-design-system.md` §9 widens the PDP specifically
(`max-w-2xl` → `max-w-5xl`, full-bleed hero band) in a later batch — not yet
applied.

### Named Rules

**The Constrained Column Rule.** Every page is a centered, max-width column,
never full-bleed (the PDP hero band is the one deliberate, scoped exception
once §9 lands). Width varies by page purpose, but the centering and the cap
are constant.

## Elevation & Depth

Unchanged by this pass. Flat by default; a shadow appears only when an
element visually detaches from normal page flow: the Query Suggest dropdown
(`shadow-md`), the config-required modal (`shadow-lg` + overlay), and the
Compare tray (`shadow-lg`, fixed to the viewport bottom).

### Named Rules

**The Flat-Unless-Floating Rule.** A shadow appears only when an element
visually detaches from the page's normal flow — never on a card, button, or
banner that sits in flow, no matter how much emphasis it needs.

## Shapes

Unchanged by this pass. Uniform 6px radius on every bordered surface.

## Components

Component-level visual treatment (Chip solid-fill variant, type-lit result
tiles, swatch facets, the Pokeball search glyph, the RGA scan reveal, the
PDP hero rework) is specified in
`docs/EXECUTION-PLAN-v4-design-system.md` §4–§9 and lands in later batches
of that plan, not this one. As of this pass, components still render with
the pre-existing monochrome hairline-border treatment; only the underlying
tokens (colors, fonts, scale) and the chrome copy (now sourced from
`src/content/pokedex.ts`) changed.

`src/components/ui/ImageSlot.tsx` is new this pass: a named, ratio-locked
image slot (`<ImageSlot name="heroBackdrop" ratio="21/9" label="..." />`)
that renders a real image once `CONTENT.art[name]` points at a file under
`public/art/`, or a labeled dashed placeholder frame at the correct
aspect ratio otherwise — so page layout is correct before any art exists.
Four slots are wired in this pass (PDP hero backdrop 21:9, home hero banner
16:5, empty-search illustration 1:1, type-facet section header 4:1); all
four currently render as placeholders, since no art files exist yet.

## Do's and Don'ts

### Do:
- **Do** keep `--signal-red` restricted to the Pokeball glyph and the global
  focus ring — nothing else, ever.
- **Do** keep Pokemon type colors sourced from the single `TYPE_COLORS` map
  in `src/coveo/typeColors.ts` — never a second hardcoded hex list in CSS or
  a component.
- **Do** pair every type color with the type's text label; color alone never
  conveys the value.
- **Do** use `getTypeTextColor()` for any solid-fill type badge — never
  assume white or dark text without checking it.
- **Do** add new chrome copy to `src/content/pokedex.ts`, not inline in a
  component.
- **Do** keep pages as a centered, max-width column — pick the width by page
  purpose, not by habit.

### Don't:
- **Don't** let `--signal-red` spread into body text, links, or error
  states — that's what the existing caution/danger colors are for.
- **Don't** let the display face (Chakra Petch) leak into a scanning list
  (facet options, breadcrumbs, table rows) — that's the specific failure
  the two-register system exists to prevent.
- **Don't** hardcode a Pokemon name, type, stat, or any other Pokemon fact
  in `src/content/pokedex.ts` — chrome copy only; real values come from the
  Coveo index at runtime.
- **Don't** introduce shadows on in-flow elements (cards, buttons, banners)
  to add emphasis — use the caution/danger color instead.
