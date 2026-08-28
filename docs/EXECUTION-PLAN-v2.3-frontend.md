# Execution Plan v2.3 — Frontend component spec

The component-level design `docs/EXECUTION-PLAN-v2.md` deferred. Written against the three mockups in `mock-ups/`, `docs/mockup-ui-analysis.md`, `docs/pokemon-data-inventory.md`, and the code as it stands today. Everything below is a build instruction, not analysis — the analysis lives in the two research docs and isn't repeated.

**Correction to `docs/mockup-ui-analysis.md`:** its filename-to-screen mapping is wrong. The real mapping is `A7D995E4…` = search results, `03D97A8B…` = detail page, `BC25DEA1…` = home. Fix that doc's Screen 1/2/3 headings when this plan is actioned.

---

## 1. Decisions made up front

### 1.1 Visual register: adopt the IA, refuse the chrome

**Call: take the mockups' information architecture and interaction patterns in full; take roughly one-fifth of their visual vocabulary.** `DESIGN.md`'s "Field Reference" north star stands. The panel is judging whether this reads like a real Coveo customer implementation, and Coveo's own reference UIs (Atomic, Quantic) are neutral surfaces, one accent, dense facet rails, quiet cards. The mockups' register would read as a themed toy.

Dropped outright, and not negotiable per PRODUCT.md Principles 1 and 4: gradient backgrounds, glow and particle effects, the purple "AI Discovery Assistant" persona and its BETA badges, the illustrated hero, emoji-adjacent iconography, avatar/notification/clipboard chrome, "Grounded in 128 Monsterdex sources" style invented provenance counts, the marketing "Why you'll love this search experience" row.

Three deliberate concessions, each because the data got richer and monochrome now under-serves it. `DESIGN.md` already flags its monochrome palette as a placeholder pending exactly this.

1. **Type color is promoted from dot to chip.** Today the 18-hue palette renders as an 8px dot beside a text label, repeated inline in three places. It becomes a real `Chip`: type color at ~12% alpha as background, the same hue at full strength for the border, ink for the text. The type name stays present in every instance, so the "never color alone" rule in `DESIGN.md` § Data Categories holds. This is the accent the design system said it was waiting for.
2. **Stat bars exist, and stay monochrome.** The mockup colors each stat differently, which is decorative noise, and any red→green ramp would assert a value judgement about base stats that the data does not make. Bars fill with ink at 85% against a hairline track, the numeric value is always printed beside the bar, and the track's full width is anchored to **255** — the real base-stat cap in the games (Blissey's HP), not an invented scale.
3. **The Two-Size Rule breaks to three.** `DESIGN.md` claims only 14px and the h1 size exist; `ResultList.tsx` and `AskAboutPokemon.tsx` already use `text-xs`. Stat numerals and the profile tables need it. Formalize 12px as a third step and update `DESIGN.md` rather than leaving the rule contradicted by the code.

Everything else in `DESIGN.md` is unchanged: 6px radius everywhere, flat-unless-floating (the compare tray is genuinely floating and earns `shadow-lg`), hairline borders, caution/amber reserved for configuration states.

`DESIGN.md` needs updating in the same pass: the Chip component entry, a new StatBar component entry, the three-size type scale, and the Data Categories section's dot-only language.

### 1.2 Favorites and Add-to-team: dropped. Compare: built, session-scoped.

Favorites and "Add to team" imply a user account that does not exist and cannot exist under ADR-0004. A `localStorage` favorites list would be a feature the assessment never asked for (Principle 3), pretending to be persistence it isn't.

Compare is different — it is real, it needs no new data, and it's a credible search-UX pattern. It is built as **selection state in a React context in `layout.tsx`, mirrored to `sessionStorage`**, holding Pokemon *names only*. Names, not snapshots: the `/compare` page re-resolves them through a live Headless query (`aq: @pokemonname==("A","B","C")`), so a comparison can never display stale indexed values. `sessionStorage` rather than `localStorage` is deliberate — tab-scoped and ephemeral reads honestly as UI state, not as a saved user collection.

This is an architectural decision under CLAUDE.md's rule, so it gets **`docs/adr/0009-client-only-comparison-state.md`**: what was built, why favorites weren't, and why session-scoped is the honest ceiling under a no-server-layer constraint.

### 1.3 The mockup's detail-page "AI Insights" panel is not buildable as RGA

Worth knowing before anyone tries. The detail page resolves its Pokemon with `updateAdvancedSearchQueries({ aq: '@pokemonname=="X"' })` and `searchBox.updateText("")` — the query text is empty by design ([page.tsx:57-69](src/app/pokemon/[name]/page.tsx#L57-L69)). The `Pokedex` pipeline's RGA model carries a mandatory **`Query is not empty`** association condition (`docs/HANDOFF.md` § D9/D10). An empty query means RGA never fires on this page, and it would stay silently blank.

Two ways out: change the detail page to send the name as query text (which changes relevance and abandons the exact-match fix that C2 exists to provide), or accept that the detail page's AI surface is Passage Retrieval. **Take the second.** `AskAboutPokemon.tsx` already occupies that slot, and RGA-on-search vs. CPR-on-detail is a sharper story for the panel than running the same feature twice — it's the contrast `docs/passage-retrieval-pov.md` already argues.

### 1.4 Sequencing: build now, do not mock, degrade honestly

**Recommendation: start v2.3 before v2.1/v2.2 finish, and never build a fixture of fake stats.**

A mocked-data file of invented Pokemon stats is a Principle 4 violation sitting one careless commit away from a live demo. It is also unnecessary. This codebase already has the right pattern everywhere: `item.generation ?? "—"`, `FacetType` returning `null` when `state.values.length === 0`, `mapPokemonResult`'s never-throw helpers. Every new field lands as `T | undefined` or `[]`, every new panel hides or shows an em dash when its field is absent, and the whole v2.3 UI can merge and run correctly against today's index — then fills in on its own the day v2.2's crawl lands.

Order of work: **Step A (the data contract) first**, since it is pure local code with no org dependency, then components, then the org work in parallel or after.

One real constraint to know: the `Pokedex` pipeline's `filter cq @source==("Pokedex - Full")` rule (D3.5) means the app cannot see `Pokedex - Test`. Prototyping the frontend against v2.1's 3-document test source would require temporarily lifting that filter, which risks duplicate results. Don't. Build against Full with fields absent, and verify for real after v2.2.

Two hard dependencies on how the v2.1 fields are *configured* in Coveo, not just what they're named — flag these to whoever does v2.1:

- `pokemonspeed` must be an **Integer** field with **Use for facets** enabled, or the Speed range facet cannot exist.
- `pokemonabilities` must be a **multi-value facet** field, same configuration as `pokemontype`. If it's configured as a plain Facet, values arrive semicolon-joined and silently break (the trap already documented in `mapPokemonResult.ts`'s `toStringArray` comment).
- Sort options beyond Relevance need **Use for sorting** on `pokemondexnumber` and `pokemonstattotal`.

---

## 2. Data contract

### 2.1 `src/coveo/fields.ts` — extend `POKEMON_FIELDS`

Add the v2.1 names as new keys on the existing object. `engine.ts` dispatches `registerFieldsToInclude(Object.values(POKEMON_FIELDS))`, so new entries are picked up with no second change — the one place this contract is enforced.

```ts
export const POKEMON_FIELDS = {
  // existing
  type: "pokemontype",
  generation: "pokemongeneration",
  image: "pokemonimageurl",
  name: "pokemonname",
  dexNumber: "pokemondexnumber",
  // v2.1 — identity
  species: "pokemonspecies",
  height: "pokemonheight",
  weight: "pokemonweight",
  abilities: "pokemonabilities",
  // v2.1 — base stats
  hp: "pokemonhp",
  attack: "pokemonattack",
  defense: "pokemondefense",
  spAtk: "pokemonspatk",
  spDef: "pokemonspdef",
  speed: "pokemonspeed",
  statTotal: "pokemonstattotal",
  // v2.1 — training
  evYield: "pokemonevyield",
  catchRate: "pokemoncatchrate",
  baseFriendship: "pokemonbasefriendship",
  baseExp: "pokemonbaseexp",
  growthRate: "pokemongrowthrate",
  // v2.1 — breeding
  eggGroups: "pokemonegggroups",
  genderRatio: "pokemongenderratio",
  eggCycles: "pokemoneggcycles",
  // v2.1 — defenses / evolution
  weaknesses: "pokemonweaknesses",
  resistances: "pokemonresistances",
  evolvesFrom: "pokemonevolvesfrom",
  evolvesTo: "pokemonevolvesto",
} as const;
```

Registering all 27 on every search inflates each result's payload for a results grid that only needs six of them. Keep one set anyway — these are short scalars over 24 results per page, and a second "list fields vs. detail fields" registration would need two engines or a re-dispatch, which is real complexity for no measured problem. Revisit only if payload size is actually observed to matter.

### 2.2 `src/coveo/mapPokemonResult.ts` — extend `PokemonItem`

Grouped sub-objects rather than 27 flat keys, so a panel takes one prop. Every field optional; `stats` is a partial record so a half-extracted Pokemon still renders what it has.

```ts
export interface PokemonStats {
  hp?: number; attack?: number; defense?: number;
  spAtk?: number; spDef?: number; speed?: number;
}

export interface PokemonItem {
  id: string;
  name: string;
  imageUrl: string | undefined;
  types: string[];
  generation: string | undefined;
  dexNumber: string | undefined;      // already indexed, not currently mapped
  species: string | undefined;
  height: string | undefined;         // "0.4 m" — string; the page renders "0.4 m (1′04″)"
  weight: string | undefined;
  abilities: string[];
  stats: PokemonStats;
  statTotal: number | undefined;
  training: {
    evYield?: string; catchRate?: string; baseFriendship?: string;
    baseExp?: number; growthRate?: string;
  };
  breeding: { eggGroups: string[]; genderRatio?: string; eggCycles?: string };
  defenses: { weaknesses: string[]; resistances: string[] };
  evolution: { from?: string; to: string[] };
}
```

New helper beside `asString`/`toStringArray`, same never-throw contract, exported for unit testing:

```ts
export function asNumber(value: unknown): number | undefined
// number → itself unless NaN/Infinity; numeric string → parsed; anything else → undefined
```

`dexNumber` is mapped for the first time here — the field is already indexed and already registered, it just was never read.

### 2.3 `src/coveo/pokemonStats.ts` — new

Display metadata for the stat panel, kept out of components so the ordering and labels have one home.

```ts
export const MAX_BASE_STAT = 255;   // real in-game cap (Blissey HP), the bar's full width
export const STAT_ORDER: { key: keyof PokemonStats; label: string }[] = [
  { key: "hp", label: "HP" },
  { key: "attack", label: "Attack" },
  { key: "defense", label: "Defense" },
  { key: "spAtk", label: "Sp. Atk" },
  { key: "spDef", label: "Sp. Def" },
  { key: "speed", label: "Speed" },
];
```

Labels match pokemondb.net's own, so nothing is renamed relative to the source.

**Test gate:** `scripts/check-test-coverage.mjs` covers `src/coveo/*`, so `asNumber`, the extended `mapPokemonResult`, and `pokemonStats.ts` need unit tests or the pre-commit hook blocks the commit. Not optional.

---

## 3. New shared primitives — `src/components/ui/`

These are extractions, not inventions. The first two replace markup that already exists two or three times.

| File | Props | Replaces / used by |
|---|---|---|
| `Chip.tsx` | `{ label, color?, variant?: "type" \| "neutral" }` | The dot+label markup duplicated in `ResultList.tsx:83-96`, `pokemon/[name]/page.tsx:116-133`, `FacetType.tsx`. Also used for abilities, egg groups, weaknesses, resistances. |
| `StatBar.tsx` | `{ label, value: number \| undefined, max?: number }` | New. `role="meter"` with `aria-valuenow/min/max` and the numeral always rendered as text. Renders a muted "—" row when `value` is undefined rather than a zero-width bar. |
| `DataList.tsx` | `{ rows: { label: string; value: ReactNode }[] }` | A `<dl>` on the existing grid pattern from `pokemon/[name]/page.tsx:113`. Renders "—" for nullish values. Used by the profile, training, and breeding panels. |
| `Tabs.tsx` | `{ tabs: { id, label, panel }[] }` | New. Real `role="tablist"` / `role="tab"` / `role="tabpanel"` with roving tabindex and arrow-key movement. Client-side only; **not** Headless's `buildTab`, which switches *query* constant expressions and is the wrong tool for switching panels of one already-loaded result. |

---

## 4. Detail page — `/pokemon/[name]`

`page.tsx` becomes a thin composition. Today it is 143 lines holding data fetching, error states, and all presentation.

```
PokemonDetailPage                                 (rewrite — orchestration + render states only)
├─ Breadcrumb                          NEW        Home / Search results / <Name>
├─ PokemonHero                         NEW        image, name, dex #, type Chips, species line
├─ PokemonStatPanel                    NEW        6 × StatBar + total, from item.stats
├─ Tabs                                NEW
│   ├─ "Overview"    → PokemonProfilePanel   NEW  height/weight/species/egg groups/hatch/catch/base exp
│   │                  TrainingPanel          NEW  EV yield, friendship, growth rate
│   ├─ "Abilities"   → AbilityList            NEW  Chips + TypeDefenses NEW (weaknesses/resistances)
│   ├─ "Evolution"   → EvolutionChain         NEW  evolves-from ← this → evolves-to, as links
│   └─ "Similar"     → RelatedPokemon         NEW  own buildResultList, aq on shared type
└─ aside
    └─ AskAboutPokemon                 ENHANCE    + suggested-question chips
```

Notes per piece:

- **`Breadcrumb.tsx`** — "Search results" needs the query the user came from. Have `ResultCard` link to `/pokemon/<name>?from=<encoded search querystring>` and read it here. Absent `from`, render Home / `<Name>` only. No fabricated back-target.
- **`PokemonHero.tsx`** — dex number rendered as `#0025` from the newly-mapped field. No "Rarity" or "Level" chips; those have no real equivalent and are dropped per the analysis doc.
- **`PokemonStatPanel.tsx`** — `{ stats: PokemonStats, total: number | undefined }`. Returns `null` if every stat is undefined, so it simply isn't there pre-v2.2 rather than showing six empty bars.
- **`PokemonProfilePanel.tsx`** — the mockup's best-aligned panel, near 1:1 with real fields. "Release XP" is dropped (not a real concept). Egg cycles is labelled "Egg cycles", not the mockup's "Hatch Time", because that's what the source calls it.
- **`TypeDefenses.tsx`** — weaknesses and resistances as two Chip rows, type-colored, from the simplified multi-value fields. Not the 18-type multiplier grid.
- **`EvolutionChain.tsx`** — `{ from?: string; to: string[]; current: string }`. Renders as links to the sibling detail pages. Simplified pair only; the full branching chain with conditions stays a stretch goal per the inventory doc §7.
- **`RelatedPokemon.tsx`** — its own `buildResultList` against a second query is not possible on one engine without clobbering the page's own search state. **Build this instead as a plain `fetch` against the Coveo Search API** through the same pattern `/api/passages` uses, or defer it. Recommendation: **defer `RelatedPokemon` to a follow-up** and ship the other three tabs — it's the one piece here with real architectural cost, and the "Similar Creatures" tab is the least load-bearing of the four.
- **`AskAboutPokemon.tsx` enhancement** — add a row of suggested-question chips that fill the input on click. Scope them to what the indexed content can actually answer: "How does it evolve?", "What are its abilities?", "What moves does it learn?". Not the mockup's "Best team comps" or "How to train for PvP", which have no answerable content behind them.
- **Habitat and Personality rows: dropped.** No real equivalent, per the analysis doc.
- **The mockup's "Abilities & Moves" table with power/accuracy per move: dropped.** That's inventory doc §10's Hard-feasibility data across nine sub-pages. Move content stays reachable through the Passage Retrieval box, which already returns it.

---

## 5. Search page — `/search`

```
SearchPageContent
├─ SearchUrlSync                       NEW        buildUrlManager — owns URL ⇄ search state
├─ SearchBox                           REUSE      unchanged component; loses `initialQuery` here
├─ FacetRail                           NEW        sticky wrapper
│   ├─ FacetType                       ENHANCE    Chip styling
│   ├─ FacetGeneration                 REUSE      unchanged
│   ├─ FacetAbilities                  NEW        buildFacet + facetSearch
│   └─ FacetSpeed                      NEW        buildNumericFacet, explicit ranges
├─ main
│   ├─ SearchSummaryBar                NEW        buildQuerySummary + buildBreadcrumbManager + buildSort
│   ├─ DidYouMean                      NEW        buildDidYouMean
│   ├─ GeneratedAnswer                 ENHANCE    markdown + citation framing + feedback
│   ├─ ResultList                      ENHANCE    richer card
│   └─ Pager                           REUSE      unchanged
└─ CompareTray                         NEW        floating, from context
```

All controllers named here are confirmed present in the installed `@coveo/headless@3.55.2`.

**Dropped facets:** Rarity (no real equivalent), Habitat (inventory doc §13 is a ~21-row per-game location list, not a small controlled vocabulary — dishonest to present as a flat tag), Evolution Stage (derivable but needs an IPE, stretch goal, out of v2.3), Favorites.

- **`SearchUrlSync.tsx`** — `buildUrlManager` makes facet selections and the query shareable and bookmarkable, and it's how a real Coveo implementation does deep linking. It's also a prerequisite for the home page's "browse by type" grid linking into a pre-filtered `/search`. **This conflicts with `SearchBox`'s `initialQuery` effect**, which submits on mount and would fight the URL manager for ownership. Resolution: on `/search`, the URL manager owns query and facet state and `<SearchBox>` is rendered without `initialQuery`; the home page's `onNavigate` path is untouched. Contained, but it is a real refactor of the one thing that currently works — do it deliberately, and keep the Strict-Mode ref-guard reasoning in `SearchBox.tsx:59-80` intact.
- **`FacetAbilities.tsx`** — abilities have a few hundred distinct values, so a checkbox list is unusable. Use `facet.facetSearch.updateText()` / `.search()`, which the `Facet` controller exposes. This means `Facet.tsx` grows an optional `searchable` prop rather than a second component.
- **`FacetSpeed.tsx`** — `buildNumericFacet` with explicit ranges (0–49, 50–89, 90–119, 120+) rather than `generateAutomaticRanges`. Numeric labels only; "Slow"/"Fast" would be an invented classification.
- **`SearchSummaryBar.tsx`** — result count, active-filter breadcrumbs with individual × and a clear-all, and a sort select (Relevance / Name A–Z / Dex number / Base stat total). Directly matches the mockup's row above the grid and every element is real.
- **`DidYouMean.tsx`** — in the mockups and genuinely supported. Cheap, and it demonstrates another real Coveo capability.
- **`GeneratedAnswer.tsx` enhancement** — render the answer through the existing `react-markdown` setup rather than `whitespace-pre-wrap` (`docs/HANDOFF.md` D9/D10 flags that the RGA model has rich-text formatting on, and markdown prints raw unless the client requests it — check `contentFormat: "text/markdown"` on the controller while in here). Add "Grounded in N sources" using the real `state.citations.length` — never a fixed number like the mockup's 128. Add the thumbs up/down the mockup shows, wired to Headless's real `like()`/`dislike()`.
- **`ResultList.tsx` enhancement** — card gains dex number, type Chips replacing the dot row, base-stat total when present, and a compare checkbox. Card link gains the `?from=` param for the breadcrumb. Keep `buildInteractiveResult` exactly as is — the compare checkbox must not sit inside the `<Link>` or it fires a click-tracking event on every selection.

---

## 6. Compare

| File | Role |
|---|---|
| `src/components/compare/CompareProvider.tsx` | Context holding `string[]` of names, cap 4, mirrored to `sessionStorage` under one key. Reads inside `try/catch` — a private window that throws on access must not break the page. Mounted in `layout.tsx`. |
| `src/components/compare/CompareTray.tsx` | Floating bottom bar, `shadow-lg` (genuinely detached — consistent with the Flat-Unless-Floating rule). Name chips with ×, a clear-all, and a "Compare" button to `/compare`. Renders nothing when the selection is empty. |
| `src/app/compare/page.tsx` | Reads `?names=`, runs one `aq: @pokemonname==("A","B","C")` query, renders a side-by-side stat table plus height/weight/abilities rows. Live index data every time, never a stored snapshot. |

Selection lives across navigation because the provider is in the layout. It does not survive a new tab or a browser restart, and that is the stated tradeoff, recorded in ADR-0009.

---

## 7. Home page — `/`

The mockup's home is mostly marketing. Keep the page minimal and add exactly two things that are real:

- **A live indexed count** — "1,025 Pokemon indexed from pokemondb.net", read from `buildQuerySummary().state.total` after one empty query on mount. The mockup's "1,284 Creatures" is fabricated; this number is whatever the index actually holds.
- **`BrowseByType.tsx`** — the Type facet's values and counts rendered as a grid of links into a pre-filtered `/search`, which is the mockup's "Browse by Element" with nothing invented. Depends on `SearchUrlSync` existing, so it comes after §5.

Both need one empty-query search on mount. That's fine: an empty query means RGA's `Query is not empty` condition doesn't fire, so nothing renders half-built.

Dropped: the illustrated hero (PRODUCT.md's Brand Commitments forbid introducing Pokemon imagery beyond what pokemondb.net serves as the indexed source), "Featured Creatures" (no featured flag exists — any curation would be invented), the home-page AI assistant rail (RGA has no query to answer before the user types one), the feature-callout row.

**`AppHeader.tsx`** — a minimal persistent header in `layout.tsx`: the "Pokedex Search" wordmark linking home, and on `/pokemon/[name]` a compact search box. This replaces the ad-hoc "← Back to search" links currently duplicated on two pages. None of the mockup's nav items (Home/Explore/Types/Favorites/Compare), avatar, or notification bell.

---

## 8. Build order

1. **Data contract** — `fields.ts`, `mapPokemonResult.ts`, `pokemonStats.ts`, plus their unit tests. No org dependency; unblocks everything else and satisfies the coverage gate.
2. **Primitives** — `Chip`, `StatBar`, `DataList`, `Tabs`. Retrofit `Chip` into `ResultList`, `FacetType`, and the detail page in the same pass so the duplicated markup dies rather than gaining a fourth copy.
3. **Detail page** — hero, stat panel, tabs, profile/training/abilities/defenses/evolution, `AskAboutPokemon` chips. Highest value per unit of work, and everything degrades to hidden or "—" until v2.2 lands.
4. **Compare** — provider, tray, `/compare`, ADR-0009.
5. **Search page** — `SearchUrlSync` first (it's the risky refactor), then summary bar, facets, did-you-mean, `GeneratedAnswer` and `ResultList` enhancements.
6. **Home + header** — depends on step 5's URL manager.
7. **Docs** — update `DESIGN.md` (Chip, StatBar, three-size scale, Data Categories), `docs/coveo-source-spec.md` (new field rows, and its two already-stale rows), `docs/HANDOFF.md`, and fix `docs/mockup-ui-analysis.md`'s filename mapping.

Steps 1–6 can all land before v2.1/v2.2 index the new fields. Nothing here blocks on the crawl.

**Testing:** unit tests for step 1 are gated by the pre-commit hook. E2E specs to add once v2.2 lands: stat bars render real numbers on a known Pokemon, the ability facet filters, compare selection survives navigation, deep-linked facet URLs restore state. React components stay out of the unit-coverage guard per `docs/standards-adoption.md` #12.

## 9. Deferred, with reasons

- `RelatedPokemon` / "Similar Creatures" tab — needs a second query source on a single-engine page (§4).
- Full branching evolution chain with conditions — inventory doc §7.
- Evolution Stage facet — needs a derived field via an IPE, same pattern as `pokemongeneration`.
- A "Habitat" facet in any form — no honest small-vocabulary source exists.
