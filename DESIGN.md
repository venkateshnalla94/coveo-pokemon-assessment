---
name: Pokedex Search
description: Coveo-powered search over pokemondb.net, built for the Coveo Pokemon Challenge assessment
colors:
  ink: "#171717"
  ink-dark: "#ededed"
  paper: "#ffffff"
  paper-dark: "#0a0a0a"
  hairline: "rgba(0,0,0,0.10)"
  hairline-dark: "rgba(255,255,255,0.15)"
  hairline-strong: "rgba(0,0,0,0.30)"
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
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    letterSpacing: "0.05em"
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "6px"
  md: "6px"
  lg: "8px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  input-search:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  input-search-focus:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card-result:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px"
  button-pager:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
  banner-caution:
    backgroundColor: "{colors.caution-bg}"
    textColor: "{colors.caution}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Design System: Pokedex Search

## Overview

**Creative North Star: "The Field Reference"**

A restrained, data-forward reference tool — closer to a lab notebook or a technical manual than a consumer app. The system is monochrome by default (pure ink-on-paper, no light/dark accent beyond a single functional caution color), because the primary audience is a Coveo panel evaluating whether this reads as a credible, production-shaped search implementation rather than a themed toy. Density and legibility outrank personality; nothing calls attention to itself except a real state change (an error, a warning, a focused input).

The monochrome palette is explicitly a **placeholder**, not a permanent rule: it's the honest state of a project still waiting on Coveo org access (see PRODUCT.md § Operating Context), and it's expected to gain a real accent — most likely Pokemon type-color theming on facets and result chips — once that work happens. Document the current state as-is; don't invent color usage that doesn't exist yet.

**Key Characteristics:**
- Ink-on-paper monochrome, one functional caution color, nothing else
- Flat at rest — no shadows except a suggestion dropdown and the config-required modal
- Thin (10–15% opacity) hairline borders instead of fills or shadows to separate content
- Small radius (6px) applied uniformly — never sharp, never pill-shaped
- Compact type scale, left-aligned, no display/hero typography beyond a 30px bold h1

## Colors

Monochrome with a single functional accent (caution/amber) reserved for configuration-error states; no decorative color exists yet.

### Primary
- **Ink** (`#171717` light / `#ededed` dark): body text, headings, primary interactive text. The system's only "color" — everything else is a tint or opacity step of this.

### Neutral
- **Paper** (`#ffffff` light / `#0a0a0a` dark): page and card background.
- **Hairline** (`rgba(0,0,0,0.10)` light / `rgba(255,255,255,0.15)` dark): default borders on inputs, cards, buttons, dividers.
- **Hairline Strong** (`rgba(0,0,0,0.30)` light): focus-state border on the search input — the only border-weight escalation in the system.
- **Muted Text** (ink at 40–60% opacity, e.g. `text-black/60`, `text-black/50`, `text-black/40`): secondary copy, facet labels, result counts, loading/empty state text — opacity steps substitute for a separate gray scale.

### Functional (not decorative)
- **Caution** (`#b45309` text / `#fffbeb` bg / `#fcd34d` border, light — `#fde68a` text / `#451a03` bg / `#b45309` border, dark): the config-required banner and popup. Reserved exclusively for "Coveo isn't configured" states.
- **Danger** (`#dc2626` light / `#f87171` dark): inline error text (`ResultList`'s error render state). No background/border treatment yet — text color only.

### Data Categories
Pokemon type gets its own small color set — one hue per type, from the community-standard convention used across fan reference sites (Bulbapedia/pokemondb.net's own type-color scheme; not an official Nintendo/Pokemon Company brand asset, so it's safe for a publicly hosted app). See `src/coveo/typeColors.ts` for the 18 hex values. Used only as a small (8–10px) decorative dot next to the type's text label — on the Type facet's options and on each result card — never as a text-on-color badge and never as the sole conveyor of meaning; the type name text is always present alongside the dot.

### Named Rules
**The One Accent Rule.** Saturated *system* color (currently: caution/amber) is reserved for functional meaning and never used decoratively. Pokemon type colors are a separate, bounded exception: a fixed 18-hue data-category palette, used only as small identification dots paired with text, never expanded into fills, backgrounds, or a general-purpose accent.

## Typography

**Body Font (as rendered):** Geist Sans (`var(--font-sans)`, loaded via `next/font` in `layout.tsx`), falling back to Arial/Helvetica/sans-serif — set on `body` in `globals.css`.

**Character:** A quiet, functional grotesk — deliberately unremarkable rather than expressive, in keeping with The Field Reference. Hierarchy is carried entirely by size + weight, not by a font pairing.

### Hierarchy
- **Title** (700, 30px `text-3xl`, 1.2 line-height): the single page h1 ("Pokedex Search"), used identically on `/` and `/search`.
- **Label** (600, 14px `text-sm font-semibold`, uppercase, `tracking-wide`): facet group legends ("Type", "Generation"), the generated-answer heading.
- **Body** (400, 14px `text-sm`): result names, facet option labels, banner/dialog copy, loading/empty/error states — the workhorse size for nearly everything below the h1.
- **Body Muted** (400, 14px, ink at 40–60% opacity): secondary/deemphasized body text (hero subhead, result counts, back links).

### Named Rules
**The Two-Size Rule.** Only two real sizes exist below the h1 — 14px for content, and the h1's own size for page titles. Resist adding a third intermediate size; use weight and opacity to differentiate instead.

## Layout

Single-column, centered, max-width-constrained containers — no full-bleed sections. Home (`/`) centers a narrow column (`max-w-2xl`) with generous vertical breathing room (`py-24`) since it holds only a hero and the search box. `/search` widens to `max-w-6xl` and splits into a fixed 200px facet rail + fluid main column (`grid-cols-[200px_1fr]`) above `md`, collapsing to a single stacked column below it. The result grid itself steps 2 → 3 → 4 columns across `base → sm → md` breakpoints with a consistent 16px gap.

Horizontal page padding is a flat 24px (`px-6`) at every breakpoint — the system does not scale outer padding by viewport, only the grid inside it. Vertical rhythm between stacked blocks is either 24px (`gap-8`/`mb-6`) between major sections or 8–16px between closely related elements (label to list, input to dropdown).

### Named Rules
**The Constrained Column Rule.** Every page is a centered, max-width column, never full-bleed. Width varies by page purpose (2xl for a single input, 6xl for a results grid), but the centering and the cap are constant.

## Elevation & Depth

Flat by default — the vast majority of surfaces (cards, inputs, buttons, banners) have no shadow at all; depth is implied only by the hairline border and a paper/ink contrast. Two exceptions escalate to a real shadow because they visually float above page content rather than sitting in flow: the Query Suggest dropdown (`shadow-md`) and the config-required popup (`shadow-lg`, over a 40%-opacity black overlay).

### Shadow Vocabulary
- **Floating (`shadow-md`)**: the suggestion dropdown — a transient overlay anchored to the input.
- **Modal (`shadow-lg` + `bg-black/40` overlay)**: the config-required dialog — the only true modal in the system.

### Named Rules
**The Flat-Unless-Floating Rule.** A shadow appears only when an element visually detaches from the page's normal flow (a dropdown, a modal) — never on a card, button, or banner that sits in flow, no matter how much emphasis it needs. Emphasis there comes from the caution/danger color, not elevation.

## Shapes

Uniform 6px radius (`rounded-md`) on every bordered surface — inputs, buttons, cards, banners, the modal, facet legends have none (they're plain text). No sharp corners and no pill/fully-rounded shapes exist anywhere in the system; 6px is the only radius value used.

## Components

Quiet and utilitarian: thin low-contrast borders, no shadow at rest, minimal padding, and hover/focus states that shift opacity or border weight rather than introducing color or elevation.

### Buttons (Pager prev/next, dialog "Got it")
- **Shape:** 6px radius, 1px hairline border.
- **Style:** transparent background, ink text, `px-3 py-1` padding.
- **Disabled (Pager only):** `opacity-40`, no pointer affordance beyond that.
- **Hover:** the dialog button gets a subtle background tint (`hover:bg-amber-100`/`hover:bg-amber-900`, matching the caution palette since it lives inside that dialog); Pager's numbered buttons swap to a filled `bg-black/[0.05]`/`bg-white/10` state when active/current page.

### Chips (Facet options)
- **Style:** no visible chip container — rendered as a checkbox + label row (`flex items-center justify-between`), not a pill. "Chip" language doesn't apply yet; this is a checklist, not a filter-tag pattern.
- **State:** result count shown at 40% opacity trailing each label; no distinct selected-state background, only the native checkbox's checked state.

### Cards (Result grid items)
- **Corner Style:** 6px radius.
- **Background:** paper, no tint.
- **Shadow Strategy:** none (see Elevation) — separation is the hairline border only.
- **Border:** 1px hairline.
- **Internal Padding:** 12px (`p-3`).

### Inputs (Search box)
- **Style:** 1px hairline border, 6px radius, `px-4 py-2` padding, transparent background.
- **Focus:** border opacity escalates from 10% to 30% (`focus:border-black/30`) — no ring, no color shift, no shadow.
- **Error/Disabled:** not yet implemented on this component (the config-required state is handled entirely by the popup, not an input-level error style).

### Navigation (Pager)
- Text-only prev/next buttons flanking numbered page buttons in a centered horizontal row (`justify-center gap-2`), all sharing the button style above. No icons; "Prev"/"Next" are literal text labels.

### Banner / Dialog (CoveoConfigBanner, ConfigRequiredDialog)
Signature component pair for the system's one real state it has to communicate today. `CoveoConfigBanner` is an inline block (used on `/search` and `/pokemon/[name]` in place of content); `ConfigRequiredDialog` is the same message promoted to a centered modal with an overlay, used on `/` so the config problem never blocks the page and only appears once the user actually tries to search. Both share the caution color exactly — the dialog is the banner's content reused inside a modal shell, not a separate voice.

## Do's and Don'ts

### Do:
- **Do** keep system-level saturated color (caution/amber) reserved for functional meaning — never decorative.
- **Do** keep Pokemon type colors scoped to small identification dots paired with text — never a fill, background, or general accent.
- **Do** use the 6px radius on every new bordered surface; don't introduce a second radius scale.
- **Do** default new surfaces to flat/no-shadow; escalate to a shadow only for something that visually floats above the page (dropdown, modal, toast).
- **Do** keep pages as a centered, max-width column — pick the width (`2xl`/`6xl`) by page purpose, not by habit.
- **Do** show a working UI first and surface Coveo-configuration problems contextually (a popup on interaction), never as a page-blocking swap — this is a confirmed product principle (see PRODUCT.md), not just a visual preference.

### Don't:
- **Don't** add a second accent color without a plan for what it means (see PRODUCT.md's note on future type-color theming) — an accent added purely for visual variety breaks The One Accent Rule.
- **Don't** introduce shadows on in-flow elements (cards, buttons, banners) to add emphasis — use the caution/danger color instead.
- **Don't** override `body`'s font-family with a literal fallback stack again — it should always resolve through `var(--font-sans)` first so the loaded Geist font actually renders.
