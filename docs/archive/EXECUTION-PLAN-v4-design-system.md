# Execution Plan v4 — UI/UX Design Pass

Status: **complete.** All 11 execution-order steps (§11) shipped across six
batches; see `docs/HANDOFF.md`'s thirteenth-through-seventeenth session
entries for what each batch did and `docs/adr/0013-type-driven-design-system.md`
for the decisions taken along the way.

Scope: front-end visual redesign of the search page, result tiles, facets,
the PDP, and both AI answer surfaces. No Coveo org config changes. No query
or controller behavior changes, with two deliberate exceptions noted in §4.1.

Follows `EXECUTION-PLAN-v3.md` (feature work). Every controller, facet, route,
and analytics call from v3 stays as-is; this pass changes presentation. If a
step here seems to require changing what data is fetched, stop — that is a
signal the step is wrong, not a licence to widen scope.

---

## 0. Why this pass exists

The app is functionally complete: real Coveo results, working facets, RGA on
search, Passage Retrieval on the PDP. Visually it is the untouched Next.js
starter.

- `src/app/globals.css` is 33 lines of stock scaffolding. Its `@theme inline`
  block holds four tokens: two colors and two font families.
- `DESIGN.md` is a token spec that **no code reads** (grep of `src/` and
  `scripts/` finds only four prose citations in comments). Every typography
  entry in it is still `Arial, Helvetica, sans-serif`.
- The 18 Pokemon type colors already exist in `src/coveo/typeColors.ts` but
  reach the UI only as a 12%-alpha tint on a small chip.
- The PDP renders its hero image at 160px inside a `max-w-2xl` container.

The goal is a design system with a point of view, driven by the type palette,
that keeps every existing behavior intact and moves all hardcoded copy into
one editable object.

Reference quality bar: Sephora's product discovery. Imagery-led tiles, swatch
facets, two-register typography, one signature motion moment. Not its palette.

---

## 1. Constraints that override anything below

Read these first. Where this plan and one of these conflict, these win.

- **No fabricated data** (`PRODUCT.md` Principle 4). Every Pokemon name, type,
  stat, and passage span rendered must trace to the Coveo index. This
  eliminates one part of the original design brief; see §7.2.
- **Restraint over theming** (`PRODUCT.md` Principle 1): "a credible,
  restrained Coveo customer-style search implementation, not maximal Pokemon
  theming." This is why the chrome palette in §3.2 is deliberately quiet.
- **No server layer** (`docs/adr/0004`, refined by 0005/0007). Nothing here
  needs a backend. Fonts are self-hosted at build time by `next/font`, not
  fetched at runtime.
- **CSP is already strict** (`next.config.ts`). `default-src 'self'`, no
  `font-src` declared (so it inherits `'self'`), and
  `style-src 'self' 'unsafe-inline'` with no remote host. Consequences:
  - A `<link>` to `fonts.googleapis.com` **is blocked**. Use
    `next/font/google`, which self-hosts under `/_next/static/`. It is the
    only route that works.
  - Inline `<style>` tags and `style` attributes **are** permitted.
  - `img-src` is `'self' data: https://img.pokemondb.net`, so any local
    artwork must live in `public/`.
- **Coverage gate** (`scripts/check-test-coverage.mjs`, wired into
  `.githooks/`). Staged files under `src/coveo/` or `src/app/api/` need a
  matching test under `tests/unit/`. `typeColors.ts` is in scope and not
  exempt, so §3.1's new exports require extending
  `tests/unit/coveo/typeColors.test.ts`. `src/components/` and the new
  `src/content/` are outside the gate.
- **Existing render-state unions stay** (`src/coveo/searchRenderState.ts`,
  `generatedAnswerRenderState.ts`). New visual states hang off the existing
  branches. One new arm is added in §7.1; do not build a parallel state
  machine.

---

## 2. Research findings that shaped this plan

Three exploration agents ran during planning. Five findings changed the design
from what the original brief specified. They are recorded here so a later
session does not re-derive them or, worse, revert to the brief.

### 2.1 RGA cannot support inline span highlighting

The brief asked to inline-highlight the exact retrieved passage span inside
the generated answer. It is not possible. From
`@coveo/headless@3.55.2` type definitions, verbatim:

```ts
export interface GeneratedAnswerCitation {
    id: string;
    title: string;
    uri: string;
    permanentid: string;
    source: string;
    clickUri?: string;
    text?: string;
    filetype?: string;
    fields?: Raw;
}
```

No `start`, `end`, `offset`, `position`, or `length`. No parallel array on the
state mapping answer ranges to citations. Citations arrive on a **separate SSE
event** (`genqa.citationsType`) from the text deltas
(`genqa.messageType` → `{ textDelta: string }`), never interleaved with an
anchor into the text.

`citation.text` is the *source* snippet, not answer text, and the answer is a
paraphrase of it. Substring matching would usually fail; when it accidentally
succeeded it would assert provenance the API never claimed. That is fabricated
data under `PRODUCT.md`. **Dropped from the search surface.** See §7.2 for
what replaces it, and §8 for where real highlighting does work.

Also checked: there is no SDK guarantee that the model emits inline `[1]`
markers in the answer body. The `[1] Eevee` string in `docs/HANDOFF.md:304`
matches this app's own citation-list rendering
(`GeneratedAnswer.tsx:169` renders `[{index + 1}] {citation.title}`), so it is
almost certainly the footnote list, not a marker in the body. Do not build on
the assumption that `[N]` can be located in the text.

### 2.2 A better reveal already exists in state, unused

`GeneratedAnswerState` carries two things the app ignores today:

```ts
isStreaming: boolean;
generationSteps: GenerationStep[];
// GENERATION_STEP_NAMES = ["searching", "thinking", "answering"]
// GenerationStep { name, status: 'active' | 'completed', startedAt, finishedAt? }
```

That is a literal scan sequence the backend already emits, which is a better
fit for the brief's "Pokedex scan" framing than any simulated effect.

It also settles the typewriter question. `generated-answer-slice.js` shows
`state.answer += incomingText` on every delta: **the answer already streams
token by token.** Layering a typewriter on top means buffering that stream and
replaying it slower, degrading the app's most latency-sensitive feature. Use
the native stream as the reveal.

### 2.3 `types[0]` is not a verified primary type

`mapPokemonResult.ts:99` is `toStringArray(result.raw["pokemontype"])`. No
sort, no primary designation, no test asserting order. Order is whatever the
multi-value field returns.

Type-driven lighting is decorative, so using `types[0]` for it is acceptable.
Two rules follow:
- Never **label** it "primary type" in the UI. It is not a verified fact.
- Prefer the dual-type gradient (which uses both colors) as the default
  treatment, since it does not depend on ordering.

### 2.4 Sephora could not be fetched directly

`sephora.com` and `sephora.co.uk` returned **HTTP 403** to every attempt,
including via a reader proxy; `web.archive.org` was blocked at the tool level.
The analysis in Appendix A is built from published teardowns (Baymard, Pixc,
Valido, UX Collective) with unverifiable specifics flagged as such. Do not
re-run this research expecting different access. Do not treat Appendix A's
numeric estimates as measurements.

### 2.5 The search box has no icon at all today

`SearchBox.tsx` has no `<svg>`, no icon component, no submit button, no clear
button, no focus state variable, and no `onBlur` (so the suggestion list never
closes once opened). `public/` contains only the five stock Next starter SVGs;
no icon library is installed. The Pokeball glyph is entirely net-new work, and
the focus/blur handlers it needs also fix a real bug.

---

## 3. Design tokens

### 3.1 Type colors — generated from one source

`src/coveo/typeColors.ts` already holds the exact 18 values the brief
specifies. **Do not add a second hardcoded list in CSS.** Add two exports:

- `typeCssVariables(): string` — serializes `TYPE_COLORS` into
  `--type-fire: #F08030; --type-water: #6890F0; …`, emitted from
  `src/app/layout.tsx` inside a `<style>` tag. Permitted by CSP.
- `getTypeTextColor(type): "#FFFFFF" | "#1A1C22"` — for solid-fill badges.
  `electric`, `ice`, `steel`, `ground`, `fairy`, and `normal` are too light
  for white text. **Verify all 18 pairs clear 4.5:1 before shipping.**

Extend `tests/unit/coveo/typeColors.test.ts` in the same commit; the coverage
gate requires it.

```
--type-normal:   #A8A878    --type-fire:     #F08030
--type-water:    #6890F0    --type-electric: #F8D030
--type-grass:    #78C850    --type-ice:      #98D8D8
--type-fighting: #C03028    --type-poison:   #A040A0
--type-ground:   #E0C068    --type-flying:   #A890F0
--type-psychic:  #F85888    --type-bug:      #A8B820
--type-rock:     #B8A038    --type-ghost:    #705898
--type-dragon:   #7038F8    --type-dark:     #705848
--type-steel:    #B8B8D0    --type-fairy:    #EE99AC
```

Derived forms are computed with `color-mix()` against a per-element
`--type-primary` / `--type-secondary` set as an inline `style`, not written as
54 more hex values. Use `oklab`, not sRGB: sRGB mixing turns `ice` and `steel`
grey.

| Form | Recipe | Used by |
|:--|:--|:--|
| glow | `color-mix(in oklab, var(--type-primary) 18%, transparent)` | tile lighting, PDP hero band |
| tint | `color-mix(in oklab, var(--type-primary) 8%, var(--surface))` | passage body, facet hover |
| edge | `color-mix(in oklab, var(--type-primary) 55%, transparent)` | tile border, type focus ring |

**Color-alone rule, already established in `typeColors.ts`'s header comment
and `DESIGN.md`'s Data Categories section: every type color must be
accompanied by the type's text label.** Glow and gradient are decorative
reinforcement; the label carries the meaning. Do not drop a label to make a
tile look cleaner.

### 3.2 Chrome palette

Quiet on purpose, so the type colors carry all the chroma. A cool "device
housing" ramp with a slight blue cast, reading as moulded plastic rather than
paper.

```
--shell-900: #14161C   /* deepest chrome, dark-mode ground */
--shell-800: #1E212A
--shell-600: #3A3F4C
--shell-400: #767D8E
--shell-200: #C7CBD4
--shell-100: #E4E7EC   /* hairlines, light-mode dividers */
--shell-050: #F4F5F8   /* light-mode panel */
--shell-000: #FFFFFF

--signal-red:  #E3350D
--signal-glow: #FF6B4A
```

**`--signal-red` is restricted to exactly two uses: the Pokeball glyph and the
global focus ring.** Never body text, never links, never error states — errors
keep the existing semantic red from `DESIGN.md`. If red spreads through the
UI it stops reading as a Pokeball cue and starts reading as alarm.

One structural move from Sephora that survives a palette swap: **the tile is
lighter than the page chrome.** Keep that relationship in both schemes.

Explicitly not: cream background with terracotta accent; black background with
a single neon accent; hairline-rule broadsheet layout.

### 3.3 Typography

Sephora runs a two-register system: a sans doing all functional work, a
display face doing editorial work only. The failure they themselves corrected
was letting the display face leak into navigation lists, where it slows
scanning. Keep the architecture, drop the beauty-editorial serif.

| Role | Face | Applied to |
|:--|:--|:--|
| Display | **Chakra Petch** 600/700 | page and section headings, Pokemon names, tab labels |
| Body | **IBM Plex Sans** 400/500/600 | all running text, facet labels, buttons, counts |
| Micro | **IBM Plex Mono** 400/500 | dex numbers, stat figures, scan tags, field keys |

Plex Sans and Plex Mono are one superfamily, so this is two typefaces in
practice. The dex number earns the mono register on its own merits: tabular
figures make stat columns align, which the current proportional Geist does
not.

All three load via `next/font/google` in `layout.tsx` (see §1 on CSP). Remove
Geist once nothing references it.

Scale at a 16px root: 3.0 / 2.0 / 1.5 / 1.125 / 1.0 / 0.875 / 0.75. Six steps
is the ceiling. Display gets `-0.01em` tracking; mono micro-labels get
`+0.08em` and uppercase.

Rewrite `DESIGN.md` to match. It is documentation only, and it currently
describes a design that does not exist.

---

## 4. Search bar — the signature moment

Files: `src/components/SearchBox.tsx`, new
`src/components/ui/PokeballGlyph.tsx`.

Custom SVG, no emoji, no icon library. Four addressable parts so they animate
independently: `<g id="shell-top">`, `<g id="shell-bottom">`,
`<rect id="band">`, `<circle id="button">`.

| State | Behavior | Driven by |
|:--|:--|:--|
| Idle | Closed, desaturated (shell-top `--shell-400`, button `--shell-200`) | — |
| Focus | `shell-top` rotates ~35° about a transform-origin at the band's left edge, spring ease ~320ms; button fills `--signal-red`; input lifts and gains a `--signal-red` ring | new local `isFocused` |
| Loading | Shells snap shut (~120ms), then the glyph spins continuously, ~900ms per turn with a slight wobble | `state.isLoading` / `state.isLoadingSuggestions` — both already on `SearchBoxState`, both unused today |
| Settle | Spin eases to rest at 0°, button pulses once | — |

Use a non-linear keyframe set for the spin. A constant `linear` rotate reads
as a generic loader and throws away the one moment the design is spending its
motion budget on.

**`prefers-reduced-motion: reduce` → no rotation, no spin.** Substitute an
opacity pulse on the button. Required, not optional.

The rest of the header goes near-monochrome. This is the only element in the
chrome permitted to move.

### 4.1 Two behavior changes, deliberately in scope

Both are pre-existing defects in the file this step already opens.

1. **`onBlur`.** There is none today, so the suggestion list never closes. The
   focus animation needs a blur handler anyway.
2. **Typeahead accessibility.** The suggestion list is a plain
   `<ul>`/`<li>`/`<button>` with no `role="combobox"`, `aria-expanded`,
   `aria-controls`, `aria-activedescendant`, `role="listbox"`, or
   `role="option"`, and Enter is the only key handled — suggestions are
   reachable only by mouse or Tab. Add the combobox roles and
   Up/Down/Escape/Enter handling.

`SearchBox.tsx` has **no unit test**. Add
`tests/unit/components/SearchBox.test.tsx` covering keyboard traversal, since
this is behavior, not styling.

Keep `dangerouslySetInnerHTML` for `suggestion.highlightedValue`. Coveo
returns `<b>` markup there; that is existing intended behavior, not a bug.

---

## 5. Result tiles

Files: `src/components/ResultList.tsx` (`ResultCard`),
`src/components/ui/Chip.tsx`.

Today the card renders image → name + dex → generation → type chips → stat
total → abilities, inside a plain `rounded-md border` `<li>` with no hover
state.

- Drop the drawn border. The tile is defined by its light, not its outline.
- Radial glow of the type token bleeding up from behind the sprite:
  `radial-gradient(120% 90% at 50% 30%, var(--glow), transparent 70%)`.
- **Dual-type gets a 135° linear gradient across both type tokens** and is the
  preferred treatment (§2.3). Single-type keeps the radial.
- Sprite renders oversized, overflowing the tile's top edge by ~12%. Add a
  `sizes` prop to `next/image` — there is none today, so Next currently serves
  the largest candidate for every tile.
- Hover and focus: lift 4px, glow intensity roughly doubles, and the dex
  number plus a compact stat-total bar fade in. Those elements are present at
  `opacity: 0` at rest so nothing reflows.
- **Synchronized hover.** The one tile pattern Baymard credits Sephora for:
  sprite, name, and dex number highlight together as a single path, while type
  chips stay independently hoverable because they lead somewhere else.
- Type badges become solid fills using `getTypeTextColor()`. Add a
  `"type-solid"` variant to `Chip`; do not rewrite the component. Its
  `data-variant` attribute is an asserted test contract in three test files.

Grid stays 2 / 3 / 4 columns, with the gap raised to suit the larger sprites.

**Must survive untouched:** the `<ul role="list" aria-label="Search results">`
with `<li>` cards (pinned by `e2e/search.spec.ts`), and the compare checkbox's
position *outside* the `<Link>` (inside it, every compare toggle would fire
`interactiveResult.select()`'s click-tracking event).

---

## 6. Facets

Files: `AutomaticFacets.tsx`, `Facet.tsx`, `FacetSpeed.tsx`,
`BrowseByType.tsx`.

Runtime identification of the type facet is already solved:
`AutomaticFacets.tsx` reads `facet.state.field` against a `CHIP_FIELDS` set
containing `POKEMON_FIELDS.type` (`"pokemontype"`). Automatic Facet Generation
means the type facet may or may not be present for a given query
(`docs/adr/0011`), so keep the conventional control as the fallback and do not
assume facet order.

Type facet values render as a color swatch plus the type name. Selected state
is a 2px ring in the type color plus a check mark inside the swatch. Non-type
facets (generation, abilities, speed) keep conventional controls — swatching a
non-color dimension is decoration without meaning.

**Keep the native `<input type="checkbox">` under the swatch, visually
hidden.** Two independent reasons:
- Sephora's own swatch facets are documented as failing screen readers and
  keyboard navigation. This is the part of the reference not to copy.
- `AutomaticFacets.test.tsx` and `FacetSpeed.test.tsx` locate rows with
  `getByText(...).closest("li")` then `within(row).getByRole("checkbox")`, so
  both the `<li>` wrapper and the checkbox role must survive.

Swatch geometry: 24px visual inside a 32px hit target, ≥8px spacing. Derived
from the 7mm target / 2mm spacing minimum in the swatch-UX literature.

Also fix while here: `Facet.tsx`'s facet-search branch renders a `<button>`
where its normal branch renders a checkbox, so a facet value reads differently
to assistive tech depending on whether the user typed in the facet search box.
Small and contained.

---

## 7. RGA panel (search page)

File: `src/components/GeneratedAnswer.tsx`,
`src/coveo/generatedAnswerRenderState.ts`.

### 7.1 The scan reveal

Frame the panel as an instrument readout: mono uppercase `POKEDEX ENTRY`
label, thin `--shell-600` rule, no rounded-card look.

- Render `generationSteps` as a live scan sequence (searching → thinking →
  answering) with the active step marked. Real backend state, not simulation.
- A blinking block cursor while `isStreaming`, removed on completion.
- Per-line fade-up as each line completes, ~180ms.
- No typewriter. See §2.2.

`deriveGeneratedAnswerRenderState` currently checks `state.answer` before
`state.isLoading`, so a partially streamed answer is indistinguishable from a
finished one. **Add a `streaming` arm.**

`tests/unit/coveo/generatedAnswerRenderState.test.ts` pins all six current
cases with exact `toEqual` objects, so it must be updated in the same commit.
The coverage gate enforces that the file stays covered.

### 7.2 Citations

Per §2.1, no inline spans. Each citation renders as a mono scanline tag in its
source's type color, placed after the answer:

```
⟶ retrieved from: Bulbasaur — Base Stats
```

Keep `buildInteractiveCitation` click tracking on each tag. This replaces both
the numbered `[1][2]` ordered list and the "Grounded in N sources" line.

Note that citations arrive incrementally and are deduplicated
(`filterOutDuplicatedCitations`), so the count can grow mid-render. Do not
render a total that flickers.

---

## 8. Passage retrieval (PDP)

Files: `src/components/AskAboutPokemon.tsx`.

This is where the brief's inline-highlight idea works, because
`/api/passages` returns **verbatim crawled markdown** and the route passes it
through unmodified (`return NextResponse.json(passages)`). The passage *is*
the unit. The mapping is 1:1 and needs no offset inference.

**A constraint this pass must respect.** `docs/passage-retrieval-pov.md`
states a position: building a UI that hides CPR's chunk boundaries and
relevance scores behind an "answer" framing would misrepresent what the API is
doing. So keep chunk boundaries and relevance scores visible. Style them as
scan readouts; do not merge the three passages into one answer block.

- Line-by-line fade-in per passage. The response is complete rather than
  streamed, so a staged reveal costs no latency here.
- Passage body tinted with `--type-tint` and edged in `--type-edge` for the
  current Pokemon's type.
- **Do not attempt substring matching against rendered DOM text.**
  `PokemonMarkdown` consumes `|`, `#`, and `**` into structure, so rendered
  text is not character-identical to `passage.text`. `docs/HANDOFF.md` also
  notes the CPR embedding store is stale for most of the corpus, so passages
  are often raw move tables and type grids. Design for long, ugly, tabular
  content.
- `document.title` and `document.primaryid` come back today and are never
  rendered. Surface the title in the `⟶ retrieved from:` tag. There is no
  `uri` in the payload, so a "view source" link is not available without a
  separate lookup.
- Key list items off `document.primaryid`, not the array index (`key={index}`
  today).

**`tests/e2e/ask-about-pokemon.spec.ts` is the most restructure-fragile test
in the repo.** It uses `page.locator('[aria-label="Passages"] > li')` — a
*direct-child* selector — with `toHaveCount(3)`, plus
`getByPlaceholder(/how does eevee evolve/i)`,
`getByRole("button", { name: "Ask" })`, and a `/Relevance: \d+(\.\d+)?%/`
regex. Inserting any wrapper element between the list and its items breaks it.

---

## 9. PDP

Files: `src/app/pokemon/[name]/page.tsx`, `PokemonHero.tsx`,
`PokemonStatPanel.tsx`, `ui/StatBar.tsx`, `TypeDefenses.tsx`,
`EvolutionChain.tsx`, `ui/Tabs.tsx`.

The page is capped at `max-w-2xl` (672px) with an `h-40 w-40` (160px) hero
image. Those two facts are most of why it reads as a skeleton. Three
independent sources fault Sephora for exactly this failure — small hero,
click-to-zoom. Invert it: the artwork is the subject.

- Container to `max-w-5xl`; hero band full-bleed.
- Sprite to ~360px, overlapping the band and the content below it.
- Dex number as an oversized low-opacity mono watermark behind the sprite.
  `dexNumber` arrives from the source already zero-padded to four digits
  (`"0025"`). Add the `#` prefix only; no `padStart`. There is a comment in
  `PokemonHero.tsx` warning about this.
- `StatBar` fills in the type color and animates width on mount
  (`prefers-reduced-motion` → render at final width, no transition).
  `MAX_BASE_STAT = 255` is a hardcoded absolute cap, not derived from the
  data; bars stay absolute-scaled.
- `TypeDefenses` weakness and resistance lists become the same swatches as the
  facets, so the selection language is continuous across the app.
- `EvolutionChain` becomes a horizontal stage of lit sprite tiles with the
  trigger condition between them; the current stage gets a `--type-edge` ring.
- Tabs restyle to mono uppercase labels with a `--signal-red` active
  underline.

**Test couplings to preserve on this page:**
- `StatBar.test.tsx` reads `container.querySelector(".bg-black\\/85")` and its
  inline `style.width`. This is the single most fragile assertion in the repo
  and **must be rewritten** to the `role="meter"` / `aria-valuenow` the
  component already exposes. Do it before restyling the bar.
- `EvolutionChain.test.tsx` does `container.querySelector("img")`, so sprites
  must stay `<img>`, and the sprite's `alt=""` must stay empty or it joins the
  link's accessible name.
- `Tabs.test.tsx` asserts the inactive panel is *not in the document*. Keep
  rendering `null`, not merely `hidden`.
- `e2e/search.spec.ts` scopes to `heading level 1` because `AskAboutPokemon`
  renders an `h2`. The hero name must stay an `<h1>`.

---

## 10. Content extraction

New file: `src/content/pokedex.ts` — one typed `CONTENT` object the user edits
directly instead of hunting through components.

```ts
export const CONTENT = {
  brand:   { name, tagline, headerLabel },
  home:    { heroTitle, heroSubtitle, browseByTypeHeading, … },
  search:  { placeholder, emptyTitle, emptyBody, errorTitle, loadingLabel, … },
  pdp:     { tabs: { overview, abilities, evolution },
             sectionHeadings: { stats, profile, training, defenses, … },
             notFoundTitle, notFoundBody, … },
  answer:  { panelLabel, loadingLabel, citationPrefix, feedbackUp, feedbackDown },
  compare: { trayLabel, fullMessage, … },
  art:     { heroBackdrop, homeBanner, emptySearch, typeFacetHeader },
} as const;
```

**Rules, to be restated as a comment at the top of the file.** It holds chrome
copy only: labels, headings, placeholders, empty and error messages, art
paths. It must **never** hold a Pokemon name, type, stat, or any other Pokemon
fact. Those come from the index at runtime; hardcoding one is precisely the
fabrication `PRODUCT.md` prohibits.

Migration is mechanical: move each user-visible literal in `src/components`
and `src/app`, replace with a `CONTENT.*` reference.

**Copy currently pinned by tests.** Either keep these byte-identical or update
the test in the same commit — preferably the latter, pointing the test at
`CONTENT` so future copy edits stop breaking tests:

| String | Pinned by |
|:--|:--|
| `Search for a Pokemon...` | `e2e/unconfigured.spec.ts` (placeholder) |
| `Pokedex Search` | `e2e/unconfigured.spec.ts` (wordmark link) |
| `Coveo isn't configured yet` | `e2e/unconfigured.spec.ts` |
| `Ask` | `e2e/ask-about-pokemon.spec.ts` (button name) |
| `e.g. "how does {name} evolve?"` | `e2e/ask-about-pokemon.spec.ts` (placeholder regex) |
| `Relevance: N%` | `e2e/ask-about-pokemon.spec.ts` (regex) |
| `Weaknesses` / `Resistances` | `unit/components/TypeDefenses.test.tsx` |

Fix during extraction: the PDP renders *"No match found for X. Expected until
a Coveo source is indexing pokemondb.net."* twice, verbatim, in two different
render branches. It leaks internal ops detail to end users. Rewrite it.

`src/content/` sits outside the coverage gate's testable roots, so it needs no
unit test.

### 10.1 Image placeholders

New `src/components/ui/ImageSlot.tsx`. If `CONTENT.art[name]` points at a file
under `public/art/`, render the real image; otherwise render a labeled dashed
frame at the exact final aspect ratio and dimensions, so the layout is already
correct when real art arrives.

```tsx
<ImageSlot name="heroBackdrop" ratio="21/9" label="PDP hero backdrop" />
```

Replacing art then means dropping a file in `public/art/` and setting one path
in `pokedex.ts`. No component edits.

Slots needed: PDP hero backdrop (21:9), home hero banner (16:5), empty-search
illustration (1:1), type-facet section header (4:1).

Pokemon sprites are **not** placeholders. They are real indexed `imageUrl`
values from `img.pokemondb.net` and must keep coming from the index. `public/`
currently holds only the five stock Next starter SVGs.

---

## 11. Execution order

Each step should leave the app working, lint-clean, and type-clean.

1. **Tokens.** `typeCssVariables()` + `getTypeTextColor()` in
   `typeColors.ts`; extend `typeColors.test.ts`; emit from `layout.tsx`;
   rewrite the `@theme` block and `DESIGN.md`. Verify all 18 contrast pairs.
2. **Typography.** Chakra Petch + IBM Plex Sans/Mono via `next/font/google`.
   Remove Geist. Apply the scale.
3. **Content extraction.** `src/content/pokedex.ts` + `ImageSlot`; repoint the
   tests that pin copy. Do this *before* the visual work, so restyling touches
   copy-free markup.
4. **Chrome.** `AppHeader`, page shells, `Tabs`, `Breadcrumb`, `Pager` onto
   the new neutrals. Quiet, so step 5 lands loud.
5. **Pokeball search bar**, plus the `onBlur` fix and typeahead ARIA (§4.1).
6. **Result tiles.** Type lighting, solid badges, synchronized hover.
7. **Facets.** Type swatches; `Facet.tsx` control consistency.
8. **PDP.** Rewrite `StatBar.test.tsx` first, then hero band, 360px sprite,
   stat bars, defenses, evolution stage.
9. **AI surfaces.** RGA `streaming` arm + `generationSteps` scan + scan tags;
   then PDP passage styling.
10. **Motion and a11y pass.** `prefers-reduced-motion` on every animation,
    `focus-visible` everywhere, contrast audit, keyboard walk of the facets,
    compare tray, and typeahead.
11. **ADR + handoff.** Write `docs/adr/0013-type-driven-design-system.md`
    covering the generated-token decision, the `--signal-red` restriction, and
    the §2.1 decision not to inline-highlight RGA spans. Update
    `docs/HANDOFF.md`.

---

## 12. Verification

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run test:e2e`
after each step. The pre-commit hook runs lint + typecheck + the coverage
gate.

**Tests that need rewriting, not just re-running:**

| Test | Why |
|:--|:--|
| `unit/components/ui/StatBar.test.tsx` | reads literal `.bg-black/85` class and inline `style.width` |
| `unit/components/ui/Chip.test.tsx` | pins exact inline `rgb()` / `rgba()` style strings |
| `unit/coveo/generatedAnswerRenderState.test.ts` | exact `toEqual` on all six union cases |
| `unit/components/PokemonMarkdown.test.tsx` | `toHaveClass("bg-black/5")` on the `th` |

Prefer moving assertions to roles and ARIA over reintroducing markup to
satisfy a brittle selector.

**Structures that must survive untouched:**
- `role="list"` + `aria-label="Search results"` with `<li>` cards
- `aria-label="Passages"` with **direct-child** `<li>`
- facet value rows as `<li>` containing a checkbox role
- the PDP hero name as `<h1>`
- `Chip`'s `data-variant` attribute

**Manual checks:** light and dark at 375 / 768 / 1440; keyboard-only
traversal; `prefers-reduced-motion: reduce` forced on. Run `npm run dev` and
confirm no CSP violations in the console after the font swap.

---

## 13. Decisions taken during planning

1. **Display face: Chakra Petch.** Body and micro registers are IBM Plex
   Sans / Mono.
2. **Dark mode stays system-driven.** No toggle, no class strategy, no
   persistence. Both schemes get restyled under the new tokens; the ~133
   existing `dark:` usages are rewritten in place against the shell ramp.
3. **Typeahead accessibility is in scope** (§4.1).
4. **`mock-ups/` — the visual register is decided here.**
   `docs/mockup-ui-analysis.md` recommended adopting the mockups'
   *information architecture* while keeping the visual register restrained,
   and explicitly left the second half as "a judgment call for the next
   session to make concretely, not resolved here."

   This plan resolves it. The IA was already built in v2.3 — tabs, compare
   tray, stat bars, richer AI surfaces all exist. The mockups' gamified chrome
   is rejected: no particle or glow effects, no purple "AI Discovery
   Assistant" persona, no emoji-adjacent iconography. The restrained
   device-panel direction in §3 follows `PRODUCT.md` Principle 1 instead.

   The mockups also invent data with no real pokemondb.net equivalent — Rarity
   tiers, Level, Synergy Score, Personality tags, Habitat. None enters this
   design, and nothing in this plan introduces a visual slot that would need
   fabricated data to fill.

---

## Appendix A — Sephora reference notes

Recorded because the source is not re-fetchable: `sephora.com` and
`sephora.co.uk` return **403** to direct fetches and reader proxies, and
`web.archive.org` was blocked at the tool level. Findings below come from
published teardowns. Anything not attributed is unverified.

**Verified patterns worth taking**

- *Synchronized hover across a multi-path tile.* Hovering the thumbnail
  highlights the title and the "more colors" link together, while the ratings
  link stays visually separate, clarifying that some tile elements lead
  elsewhere. Baymard cites Sephora positively for this. Applied in §5.
- *Combine variants into one list item* with swatches, rather than one tile
  per variant. 42% of sites get this wrong. The Pokedex analogue — regional
  forms and Mega/Gigantamax as chips on one tile instead of four Charizard
  tiles — is not in this pass's scope but is the strongest candidate for a
  follow-up.
- *3+ images per list item*, cycled on hover. Sprite / official art / shiny is
  the analogue. Also out of scope here; noted for later.
- *Applied-filters overview with clear-all.* `SearchSummaryBar` already does
  this; the swatch language from §6 should extend to those chips so selection
  reads continuously.
- *Two-register type system.* Sephora commissioned Sephora Sans (all
  functional work) plus a display serif (editorial only), and later pulled the
  serif back out of navigation lists where it slowed scanning. Architecture
  adopted in §3.3, face not.
- *One signature moment.* Their app added a sparkle animation to a single tab
  to encourage exploration, with restrained chrome everywhere else. This is
  the pattern §4 spends its motion budget on.
- *Tile lighter than page chrome* — white product tiles on dark chrome. Kept
  in §3.2.

**Verified patterns to avoid**

- *List/grid view toggle.* Built for search results, measured at **zero**
  engagement despite users asking for it in interviews.
- *Sticky purchase bar.* In Baymard testing it crowded autocomplete down to
  two partially obscured suggestions. There is no conversion action to pin
  here anyway; give the space to the typeahead.
- *Small hero images requiring click-to-zoom.* Named a failure by three
  independent sources. §9 inverts it.
- *Unlabeled color swatches.* Sephora's filters and hover affordances are
  documented as failing screen readers and keyboard navigation. A shade has no
  name a shopper knows; **a Pokemon type does**, so ours keep the text label
  and the native checkbox (§6).
- *Promo urgency, banners, four near-identical recommendation modules,
  loyalty/store-locator scaffolding.* Ecommerce-specific, meaningless on a
  reference tool.
- *Price as an axis.* No analogue. Do not invent a "rarity" or "power" stand-in
  for it.

**Not verifiable** (do not treat estimates as measurements): exact tile crop
ratios and bounding treatment, grid column counts per breakpoint, swatch
geometry and selected-state visuals, hover motion durations and easing, PDP
hero dimensions, gallery pattern, ingredient-section formatting.
