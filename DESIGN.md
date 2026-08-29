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
  caption:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
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
  chip-type:
    backgroundColor: "type color at ~12% alpha"
    borderColor: "type color at full strength"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
  chip-neutral:
    backgroundColor: "transparent"
    borderColor: "{colors.hairline}"
    textColor: "ink at 70% opacity"
    rounded: "{rounded.md}"
    padding: "2px 8px"
  stat-bar:
    trackColor: "{colors.hairline}"
    fillColor: "ink at 85% opacity"
    rounded: "{rounded.md}"
    height: "8px"
---

# Design System: Pokedex Search

## Overview

**Creative North Star: "The Field Reference"**

A restrained, data-forward reference tool — closer to a lab notebook or a technical manual than a consumer app. The system is monochrome by default (pure ink-on-paper, no light/dark accent beyond a single functional caution color), because the primary audience is a Coveo panel evaluating whether this reads as a credible, production-shaped search implementation rather than a themed toy. Density and legibility outrank personality; nothing calls attention to itself except a real state change (an error, a warning, a focused input).

The monochrome palette was originally a **placeholder**, documented as the honest state of a project still waiting on Coveo org access (see PRODUCT.md § Operating Context). That placeholder period is over: Phase v2.3 promoted Pokemon type color from a decorative dot to a real `Chip` component (see Components below and PRODUCT.md/`docs/EXECUTION-PLAN-v2.3-frontend.md` §1.1) — the system's first and only decorative-color exception, still bounded by The One Accent Rule.

**Key Characteristics:**
- Ink-on-paper monochrome, one functional caution color, plus the bounded Pokemon-type-color exception confined to `Chip` — nothing else
- Flat at rest — no shadows except a suggestion dropdown and the config-required modal
- Thin (10–15% opacity) hairline borders instead of fills or shadows to separate content
- Small radius (6px) applied uniformly — never sharp, never pill-shaped
- Compact type scale, left-aligned, no display/hero typography beyond a 30px bold h1

## Colors

Monochrome with a single functional accent (caution/amber) reserved for configuration-error states, plus one bounded decorative exception (Pokemon type color, confined to the `Chip` component's `type` variant — see Data Categories).

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
Pokemon type gets its own small color set — one hue per type, from the community-standard convention used across fan reference sites (Bulbapedia/pokemondb.net's own type-color scheme; not an official Nintendo/Pokemon Company brand asset, so it's safe for a publicly hosted app). See `src/coveo/typeColors.ts` for the 18 hex values.

As of Phase v2.3, this renders as the `Chip` component's `type` variant (see Components below) — a real filled chip (type color at ~12% alpha background, the same hue at full strength for the 1px border, ink text), not the small decorative dot this section previously described. The dot/badge distinction still matters: this is a chip, not a text-on-color badge (no white-on-saturated-color text anywhere), and the type name text is always rendered alongside the color, never color alone. Used on the Type facet's options, every result card, the detail page hero, and anywhere else a type or type-derived value (weaknesses, resistances) is shown.

### Named Rules
**The One Accent Rule.** Saturated *system* color (currently: caution/amber) is reserved for functional meaning and never used decoratively. Pokemon type colors are a separate, bounded exception: a fixed 18-hue data-category palette, used only inside the `Chip` component's `type` variant (a low-alpha fill + full-strength border, paired with the type name as text) — never a solid/saturated fill, never a general-purpose accent, and never applied to anything that isn't a real type/weakness/resistance value.

## Typography

**Body Font (as rendered):** Geist Sans (`var(--font-sans)`, loaded via `next/font` in `layout.tsx`), falling back to Arial/Helvetica/sans-serif — set on `body` in `globals.css`.

**Character:** A quiet, functional grotesk — deliberately unremarkable rather than expressive, in keeping with The Field Reference. Hierarchy is carried entirely by size + weight, not by a font pairing.

### Hierarchy
- **Title** (700, 30px `text-3xl`, 1.2 line-height): the detail page's Pokemon-name h1. (`/` and `/search` no longer carry their own "Pokedex Search" h1 as of Phase v2.3's `AppHeader` — that wordmark is a persistent link in the header, not a page heading, so it isn't part of this hierarchy.)
- **Label** (600, 14px `text-sm font-semibold`, uppercase, `tracking-wide`): facet group legends ("Type", "Generation", "Abilities", "Speed"), the generated-answer heading, panel section headings (Abilities, Weaknesses, Resistances, Browse by type).
- **Body** (400, 14px `text-sm`): result names, facet option labels, banner/dialog copy, loading/empty/error states — the workhorse size for nearly everything below the h1.
- **Body Muted** (400, 14px, ink at 40–60% opacity): secondary/deemphasized body text (subhead copy, result counts, breadcrumbs).
- **Caption** (400, 12px `text-xs`): the third size, formalized in Phase v2.3. Used where 14px is too loud for a dense, repeated value: stat numerals and labels in `StatBar`/`PokemonStatPanel`, dex numbers and base-stat totals on result cards, `Chip` label text, profile/training table values. This formalizes usage that already existed ad hoc in `ResultList.tsx` and `AskAboutPokemon.tsx` (`text-xs`) before Phase v2.3 named it — see `docs/EXECUTION-PLAN-v2.3-frontend.md` §1.1.

### Named Rules
**The Three-Size Rule** (formerly the Two-Size Rule). Three real sizes exist below the h1 — 12px for dense/repeated data (stat numerals, chip labels, per-card metadata), 14px for regular content, and the h1's own 30px for the one remaining page title (the detail page's Pokemon name). This is a deliberate, documented expansion, not scope creep: `ResultList.tsx` and `AskAboutPokemon.tsx` were already using `text-xs` before this rule existed, contradicting the old Two-Size Rule in practice; formalizing 12px as the third step and naming its real use cases (above) closes that gap rather than leaving the rule wrong. Resist adding a fourth size — weight and opacity still do the rest of the differentiation work.

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
- **Floating bar (`shadow-lg`, no overlay)**: `CompareTray` (Phase v2.3), fixed to the viewport bottom edge — the one persistent (not transient) floating element in the system. It earns the shadow for the same reason as the other two: it visually detaches from the page's normal document flow.

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

### Chip (`src/components/ui/Chip.tsx`)
Introduced in Phase v2.3 as a real, shared primitive — the extraction point for markup that used to be duplicated across `ResultList.tsx`, `FacetType.tsx`, and the detail page. Two variants, both 6px radius, 1px border, 12px (`text-xs`) label text, never a fully-rounded pill:
- **`type` variant:** background at the Pokemon type's color at ~12% alpha, border at that same hue full-strength, ink text. The type name is always rendered as text alongside the color — this is the one place decorative color exists in the system (see Data Categories), and it never appears without the label. Used on result cards, the Type facet's option rows, the detail page hero, `TypeDefenses` (weaknesses/resistances), and `BrowseByType`.
- **`neutral` variant:** no color — a plain hairline-bordered pill, ink text at 70% opacity. Used for abilities, egg groups, Compare tray name chips, and active-filter breadcrumb chips — anything that's a real, discrete value but has no color mapping.

### Chips (Facet options — checkbox rows, not the `Chip` component above)
- **Style:** no visible chip container — rendered as a checkbox + label row (`flex items-center justify-between`), not a pill. This is a checklist, not a filter-tag pattern; a facet option's *label* may itself render as a `Chip` (e.g. `FacetType`'s type-colored rows) without the row itself becoming one.
- **State:** result count shown at 40% opacity trailing each label; no distinct selected-state background, only the native checkbox's checked state.

### StatBar (`src/components/ui/StatBar.tsx`)
Introduced in Phase v2.3 for the six base stats (HP/Attack/Defense/Sp. Atk/Sp. Def/Speed) — deliberately monochrome, not the mockup's per-stat color ramp: a red→green gradient would assert a value judgement about base stats the data doesn't make.
- **Style:** an 8px-tall track at hairline opacity (1px border, 6px radius, no fill), filled with a solid ink-at-85%-opacity bar sized proportionally to the value.
- **Scale:** anchored to `MAX_BASE_STAT = 255` (`src/coveo/pokemonStats.ts`) — the real in-game base-stat cap (Blissey's HP), not an invented 0–100 or auto-scaled range.
- **Numeral:** always printed as 12px text beside the bar — the bar's fill length is a visual aid, never the sole way the value is conveyed.
- **Missing data:** when a stat value is `undefined`, renders a muted em dash row instead of a zero-width bar — a missing field and a real `0` are different facts and must never look the same.
- **Accessibility:** `role="meter"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax`.

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
- **Do** keep Pokemon type colors scoped to the `Chip` component's `type` variant (low-alpha fill + full-strength border, paired with text) — never a solid/saturated fill, never a general accent.
- **Do** use the 6px radius on every new bordered surface; don't introduce a second radius scale.
- **Do** default new surfaces to flat/no-shadow; escalate to a shadow only for something that visually floats above the page (dropdown, modal, toast).
- **Do** keep pages as a centered, max-width column — pick the width (`2xl`/`6xl`) by page purpose, not by habit.
- **Do** show a working UI first and surface Coveo-configuration problems contextually (a popup on interaction), never as a page-blocking swap — this is a confirmed product principle (see PRODUCT.md), not just a visual preference.

### Don't:
- **Don't** add a second accent color without a plan for what it means (see PRODUCT.md's note on future type-color theming) — an accent added purely for visual variety breaks The One Accent Rule.
- **Don't** introduce shadows on in-flow elements (cards, buttons, banners) to add emphasis — use the caution/danger color instead.
- **Don't** override `body`'s font-family with a literal fallback stack again — it should always resolve through `var(--font-sans)` first so the loaded Geist font actually renders.
