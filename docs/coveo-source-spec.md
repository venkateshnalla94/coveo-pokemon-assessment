# Coveo source & field-mapping spec

The live reference for what's actually configured in the Coveo admin console — org access arrived and both `Pokedex - Test` and `Pokedex - Full` are built and indexing (see `docs/HANDOFF.md`). Keep this in sync with whatever is actually configured — this is the contract between the source and `src/coveo/fields.ts`.

See `docs/EXECUTION-PLAN.md` (Findings that change the build, Adjudicated rulings C1/C2/C3/C6) for the full reasoning behind the fields and rules below — not duplicated at length here.

## Test source (build this first)

- Source type: Web (crawler)
- Start URL: `https://pokemondb.net/pokedex/pikachu`
- Purpose: iterate on field extraction against one page before crawling the full site. See `.claude/skills/pokemon-source-setup`.

## Full source

- Source type: Web (crawler)
- Start URL: `https://pokemondb.net/pokedex/national` (or the site's Pokedex index page — confirm the actual crawl entry point once in the admin console)
- Inclusion pattern: `https://pokemondb.net/pokedex/*`
- Exclusion patterns:
  - `https://pokemondb.net/move/*`
  - `https://pokemondb.net/type/*`
  - `https://pokemondb.net/ability/*`
  - `https://pokemondb.net/item/*`
  - `https://pokemondb.net/pokedex/national` (the index/list page itself — not a single Pokemon)
  - `https://pokemondb.net/pokedex/stats/*` (stat comparison pages, if present)

## Field extraction (Web Scraping Configuration)

| Field name | Source | Notes |
|---|---|---|
| `pokemontype` | Type badges on the Pokemon page, scoped to `(//table[@class='vitals-table'])[1]` | **Must be configured as Multi-value facet**, not plain Facet — most Pokemon have 1-2 types (e.g. Charizard: Fire + Flying). A plain-Facet misconfiguration still "works" (compound values like `Fire;Flying` render and survive a casual demo) but breaks per-type filtering; verify facet and field **separately** (facet value list in the admin console, `raw.pokemontype` in the browser Network tab) — see C3 in docs/EXECUTION-PLAN.md. The frontend defends against this shape via `toStringArray()` in `src/coveo/mapPokemonResult.ts` regardless. |
| `pokemongeneration` | Not present on the Pokemon page — derived from `pokemondexnumber` by an Indexing Pipeline Extension, post-conversion | Single value, used as a facet. Values are `"Generation 1"` … `"Generation 9"` (bare digits are ambiguous next to dex numbers; roman numerals sort wrong) — see C6 in docs/EXECUTION-PLAN.md for the dex-number boundaries. |
| `pokemonimageurl` | `(//img[@fetchpriority="high" and contains(@src,"/artwork/")])[1]/@src` | Points at the artwork used in `src/components/ResultList.tsx`'s result card. `og:image` doesn't exist on these pages — confirmed by fetching the live page directly (see `docs/pokemon-data-inventory.md` §1). |
| `pokemonname` | `//h1/text()` | Extracted separately from the crawled page `Title` (which reads e.g. "Bulbasaur Pokédex: stats, moves, evolution & locations", not the bare name) — see C2. Consumed by the frontend with a `?? result.title` fallback (`mapPokemonResult.ts`) for the cases (RGA citations, Query Suggest) that bypass this field mapping entirely. |
| `pokemondexnumber` | `((//table[@class="vitals-table"])[1]//tr[th[contains(text(),"National")]]/td[1])[1]//text()` | Match on the text `"National"`, not the `№` character (`&#8470;`) — works in the Chrome extension used to prototype selectors but not in Coveo's real crawler. The vitals table has two `№` rows (National and Local); the `(...)[1]` positional truncation on the outer expression selects the National row. Also the input to the generation IPE above. |
| `pokemonspecies` | `(//table[@class="vitals-table"])[1]//tr[th[text()="Species"]]/td/text()` | The category line, e.g. "Mouse Pokémon". Single value. |
| `pokemonheight` | `(//table[@class="vitals-table"])[1]//tr[th[text()="Height"]]/td/text()` | Includes units as authored on the page, e.g. `"0.4 m (1′04″)"` — not stripped to a bare number. |
| `pokemonweight` | `(//table[@class="vitals-table"])[1]//tr[th[text()="Weight"]]/td/text()` | Same units-included convention as height, e.g. `"6.0 kg (13.2 lbs)"`. |
| `pokemonabilities` | `(//table[@class="vitals-table"])[1]//tr[th[text()="Abilities"]]/td//a/text()` | **Must be Multi-value facet**, same reasoning as `pokemontype` — most Pokemon have 1-2 abilities plus an optional hidden ability (e.g. Pikachu: Static, Lightning Rod). |
| `pokemonhp`, `pokemonattack`, `pokemondefense`, `pokemonspatk`, `pokemonspdef`, `pokemonspeed` | `(//table[@class="vitals-table"])[4]//tr[th[text()="<Stat label>"]]/td[@class="cell-num"][1]/text()` (per-stat, substitute the row label — `HP`, `Attack`, `Defense`, `Sp. Atk`, `Sp. Def`, `Speed`) | `[4]` is the base-stats table (Identity/Training/Breeding/Base-stats are tables 1–4 in that fixed order). Each stat row has two `td[@class="cell-num"]` cells (base value, then min-at-Lv100); `[1]` isolates the base value. Integer fields. This org's console ties Integer fields' facet/sort options together (no independent per-attribute toggle observed) — `pokemonspeed`'s required facet-usability and `pokemonstattotal`'s/`pokemondexnumber`'s required sortability arrive as a side effect of typing them Integer, not from a field-level checkbox choice. |
| `pokemonstattotal` | `(//table[@class="vitals-table"])[4]//tfoot//td[contains(@class,"cell-total")]/text()` | Lives in the table's `<tfoot>`, not `<tbody>` alongside the six stat rows. The cell's real class attribute is `"cell-num cell-total"` (two classes) — an exact-equality `@class="cell-total"` match fails silently; `contains()` is required. Integer, sortable. |
| `pokemonevyield`, `pokemonbaseexp`, `pokemongrowthrate` | `(//table[@class="vitals-table"])[2]//tr[th[text()="<Row label>"]]/td/text()` (per-field, substitute the row label — `EV yield`, `Base Exp.`, `Growth Rate`) | `[2]` is the Training table. String fields, no facet/sort. |
| `pokemoncatchrate` | `(//table[@class="vitals-table"])[2]//tr[th[text()="Catch rate"]]/td/text()[1]` | `td/text()[1]` isolates the leading number ahead of a `<small>` parenthetical note (e.g. `45` then `(5.9% with PokéBall, full HP)`). |
| `pokemonbasefriendship` | `(//table[@class="vitals-table"])[2]//tr[th/a[text()="Friendship"]]/td/text()[1]` | The `<th>` wraps "Friendship" in a link (`Base <a>Friendship</a>`), so its direct text is just `"Base "` — matching on the `<a>` child instead of the `<th>`'s own text is required. Same `text()[1]` trap as catch rate (e.g. `50` then `(normal)`). |
| `pokemonegggroups` | `(//table[@class="vitals-table"])[3]//tr[th[text()="Egg Groups"]]/td//a/text()` | `[3]` is the Breeding table. **Multi-value facet** — most Pokemon have 1-2 egg groups (e.g. Garchomp: Dragon, Monster). |
| `pokemongenderratio` | `(//table[@class="vitals-table"])[3]//tr[th[text()="Gender"]]/td//span/text()` | Multi-value — normal species render two `<span>`s (`"50% male"`, `"50% female"`); genderless species render one (`"Genderless"`), which degrades gracefully to a single-value result. |
| `pokemoneggcycles` | `(//table[@class="vitals-table"])[3]//tr[th/a[text()="Egg cycles"]]/td/text()[1]` | Same link-wrapped-`<th>` and two-text-node `<td>` traps as `pokemonbasefriendship`/`pokemoncatchrate` (`<th>` is `<a href="/glossary#def-eggcycle">Egg cycles</a>`; `<td>` holds the number then a `<small>` steps range). |
| `pokemonweaknessesraw` | `(//table[contains(@class,"type-table-pokedex")])[position()<=2]//td[contains(@class,"type-fx-200") or contains(@class,"type-fx-400")]/@title` | Intermediate field, not consumed by the frontend directly — see IPE below. |
| `pokemonresistancesraw` | `(//table[contains(@class,"type-table-pokedex")])[position()<=2]//td[contains(@class,"type-fx-50") or contains(@class,"type-fx-0")]/@title` | Intermediate field, not consumed by the frontend directly — see IPE below. |

**Type-defense structure, why `weaknessesraw`/`resistancesraw` need position-scoping:** the "Type defenses" section (§6 of `docs/pokemon-data-inventory.md`) renders as two 9-column `<table class="type-table type-table-pokedex">` blocks (18 types total), with the type name in each `<th><a title="...">` header and the multiplier in a same-column `<td class="type-fx-N">` — no direct DOM link between a header and its cell, so extraction reads the cell's own `@title` attribute (e.g. `"Ground → Electric = super-effective"`) instead, and a postConversion IPE below strips it to just the leading type name. Confirmed against the two trap Pokemon, both fetched directly:

- **Pikachu** (has an ability that alters type effectiveness): the whole "Type defenses" section renders *twice* — once inside a `tabset-typedefcol` with two tabs (`Static ability` active, `Lightning Rod ability` inactive), once again untabbed further down the page (a responsive/print duplicate) — 6 `type-table-pokedex` tables total on the page for what's really one 18-type chart.
- **Garchomp** (no such ability): no tabset at all, but the whole section still renders **3 times** as identical untabbed duplicates — also 6 tables total, but content-identical across all three.
- `(//table[contains(@class,"type-table-pokedex")])[position()<=2]` — the first two tables in document order — resolves both shapes correctly without needing to detect which one applies: on a tabbed page, the active tab is listed/rendered first, so its two tables come first; on an untabbed page, the first duplicate block's two tables come first (and since the duplicates are identical, it wouldn't matter if it picked a later one). A more "correct-looking" version using `ancestor::` and an `h2[text()="Type defenses"]` predicate was tried first and silently matched zero nodes on both pages — not diagnosed further, just abandoned in favor of this simpler approach built only from constructs already proven to work elsewhere in this source (`contains()`, `position()`, plain attribute paths).
- `type-fx-0`/`type-fx-50`/`type-fx-200`/`type-fx-400` are the multiplier classes actually observed (`type-fx-100` = normal, excluded). No `type-fx-25` (quadruple resistance) was observed on either trap page — if a future Pokemon needs it, add `contains(@class,"type-fx-25")` to the resistances selector's `or` clause rather than assuming it's already covered.

**Weaknesses/resistances postConversion IPE** (Content → Extensions, org-level — same place the `pokemongeneration` IPE lives, attached to `Pokedex - Test`'s pipeline the same way):

```python
try:
    def extract_type(raw):
        return raw.split(" ")[0]

    weaknesses_raw = document.get_meta_data_value('pokemonweaknessesraw')
    if weaknesses_raw:
        values = weaknesses_raw if isinstance(weaknesses_raw, list) else [weaknesses_raw]
        document.add_meta_data({'pokemonweaknesses': [extract_type(v) for v in values]})

    resistances_raw = document.get_meta_data_value('pokemonresistancesraw')
    if resistances_raw:
        values = resistances_raw if isinstance(resistances_raw, list) else [resistances_raw]
        document.add_meta_data({'pokemonresistances': [extract_type(v) for v in values]})
except Exception:
    pass
```

`extract_type` takes the leading word before the first space — type names are always single tokens, so this is simpler than parsing out the arrow character. Output fields:

| Field name | Type | Notes |
|---|---|---|
| `pokemonweaknesses` | String, **multi-value facet** | Simplified from the full 18-type multiplier grid to just type names at 2×/4× (see `docs/pokemon-data-inventory.md` §6) — Pikachu: `Ground`; Garchomp (Dragon/Ground): `Ice`, `Dragon`, `Fairy`. |
| `pokemonresistances` | String, **multi-value facet** | Type names at 0.5×/0.25×/0× — Pikachu: `Electric`, `Flying`, `Steel`; Garchomp: `Fire`, `Electric` (0×, Ground-type immunity), `Poison`, `Rock`. |
| `pokemonevolvesfrom` | `(//a[@class="ent-name"][text()=//h1/text()]/ancestor::div[@class="infocard "][1]/preceding-sibling::div[@class="infocard "][1]//a[@class="ent-name"]/text() \| //a[@class="ent-name"][text()=//h1/text()]/ancestor::div[@class="infocard "][1]/ancestor::span[@class="infocard-evo-split"][1]/preceding-sibling::div[@class="infocard "][1]//a[@class="ent-name"]/text())[1]` | String, single-value. The immediate pre-evolution's name, or absent for a base-stage Pokemon with no pre-evolution (not an extraction failure — the frontend's `mapPokemonResult.ts` treats an absent value as `isBaseStage: true`). Rewritten in the eleventh session — see below, the pre-eleventh-session version had a real, live production bug on branching families. |
| `pokemonevolvesto` | `//a[@class="ent-name"][ancestor::div[@class="infocard "][1]/preceding-sibling::div[@class="infocard "][1]//a[@class="ent-name"]/text()=//h1/text() or ancestor::div[@class="infocard "][1]/ancestor::span[@class="infocard-evo-split"][1]/preceding-sibling::div[@class="infocard "][1]//a[@class="ent-name"]/text()=//h1/text()]/text()` | **Multi-value** (changed from single-value in the eleventh session). Every real next-evolution branch (e.g. Eevee → all 8 Eeveelutions), or empty for a fully-evolved Pokemon. **Not deduped** — see `pokemonevolvestoimageurl` below and `EvolutionTarget`'s doc comment in `mapPokemonResult.ts`: Pikachu's two branches to regular/Alolan Raichu both render the ent-name text "Raichu", a real duplicate *name*, but the two branches have genuinely different sprites, so the frontend keeps them as separate entries rather than collapsing them. |
| `pokemonevolvesfromimageurl` | `(//a[@class="ent-name"][text()=//h1/text()]/ancestor::div[@class="infocard "][1]/preceding-sibling::div[@class="infocard "][1] \| //a[@class="ent-name"][text()=//h1/text()]/ancestor::div[@class="infocard "][1]/ancestor::span[@class="infocard-evo-split"][1]/preceding-sibling::div[@class="infocard "][1])[1]//img/@src` | String, single-value. New in the eleventh session. Exact same predicate as `pokemonevolvesfrom`, just resolving to the sibling `<img class="img-fixed img-sprite">`'s `@src` (a small sprite, e.g. `.../sprites/home/normal/2x/pichu.jpg`) instead of the `<a class="ent-name">`'s text — sitting in the same `<div class="infocard ">` as the name. |
| `pokemonevolvestoimageurl` | `//a[@class="ent-name"][ancestor::div[@class="infocard "][1]/preceding-sibling::div[@class="infocard "][1]//a[@class="ent-name"]/text()=//h1/text() or ancestor::div[@class="infocard "][1]/ancestor::span[@class="infocard-evo-split"][1]/preceding-sibling::div[@class="infocard "][1]//a[@class="ent-name"]/text()=//h1/text()]/ancestor::div[@class="infocard "][1]//img/@src` | **Multi-value.** New in the eleventh session. Exact same predicate as `pokemonevolvesto`, mirrored onto the sprite `@src` inside each matching candidate's own infocard. Deliberately a *second*, independent field rather than folding the image into `pokemonevolvesto` somehow — Coveo's Web Scraping Configuration has no "extract two things per matched node into one field" construct, so this relies on both selectors walking the identical document-order node stream under the identical predicate to stay index-aligned. **This was verified, not assumed** — both arrays were zipped and printed side by side against real fetched HTML for Pikachu, Eevee, Charizard, and Charmander before committing to the design; see the eleventh-session chat log for the full output. Regular vs. Alolan Raichu (Pikachu's two `evolvesto` branches) resolve to genuinely different sprite URLs (`raichu.jpg` vs `raichu-alolan.jpg`) despite sharing a name — the reason `pokemonevolvesto` is left undeduped. |

**Evolution-chart structure, why these selectors are shaped the way they are:** the chart is a sequence of `<a class="ent-name">` links, each wrapped in its own `<div class="infocard ">`, with no explicit "this is the current page's own Pokemon" marker — every stage renders identically. Two real bugs were hit and fixed while first building this (pre-eleventh-session):

1. **`class="ent-name"` is not unique to the evolution chart** — it's reused for every move name in the page's moves-learned tables (130+ occurrences on Garchomp's page). Fixed by scoping to the chart's own wrapper.
2. **`preceding::`/`following::` are whole-document axes, not sibling axes** — position `1` on either is the nearest matching node *anywhere before/after in document order*, regardless of DOM nesting. `[last()]` on a reverse axis like `preceding::` is the *furthest* node, not the nearest (`following::`'s `[1]` is nearest — the two axes are mirror images). An early version used `preceding::a[@class="ent-name"][last()]` for `evolvesto`, which silently picked the wrong node.

**Third and fourth real bugs, found and fixed in the eleventh session while building v3.2's branching-evolution support** — both from the same underlying mistake as bug 2 above (a whole-document axis standing in for a same-parent one), just not caught the first time because `Pokedex - Test`'s 3-doc crawl (Pikachu/Garchomp/Sprigatito) has no branching-evolution family in it:

3. **A branching family (e.g. Eevee → 8 Eeveelutions) repeats the base Pokemon's `<a class="ent-name">` node once per branch-group** — pokemondb lays out Eevee's chart as 4 separate top-level `<div class="infocard-list-evo">` blocks (one per row of ≤3 branches), each starting with its own "Eevee" infocard. The pre-eleventh-session `evolvesto` selector scoped to `(//div[@class="infocard-list-evo"])[1]` (only the *first* such block) and used `preceding::a[@class="ent-name"][1]` (nearest-in-whole-document, not nearest-sibling) — so on Eevee's own page it returned only `"Vaporeon"` (the first child of the first block), silently dropping Jolteon/Flareon and all 5 branches in blocks 2–4. Confirmed by parsing Eevee's and Charizard's actual fetched HTML with `lxml`, not assumed. Fixed by scoping to `ancestor::div[@class="infocard "][1]/preceding-sibling::div[@class="infocard "][1]` (true same-parent sibling) as the primary case, with a second disjunct for a candidate nested inside `<span class="infocard-evo-split">` (branch fan-out wrapper) whose *preceding sibling* is the shared parent's infocard — this correctly attributes every sibling in a branch group to the shared parent instead of to the previous sibling.
4. **The pre-eleventh-session `evolvesfrom` selector had the mirror bug, also live in production, also invisible in `Pokedex - Test`:** it used `following::a[@class="ent-name"][1]/text()=//h1/text()` (whole-document nearest-following), which on Eevee's page matched **Flareon** (the last node of block 1) as Eevee's "pre-evolution", because the nearest *following* ent-name in document order after Flareon is the next block's repeated "Eevee" node — a false positive from a self-repeat, not a real parent. It also returned *nothing* for any of the 5 branch-target Pokemon in blocks 2–4 (Espeon, Umbreon, Leafeon, Glaceon, Sylveon), since they aren't descendants of `(//div[@class="infocard-list-evo"])[1]` at all. Confirmed live-broken for both cases by executing the old selector against real fetched HTML before touching anything. Fixed with the same same-parent-sibling logic as `evolvesto`, mirrored: find the node(s) matching `text()=//h1/text()`, then walk to that node's preceding sibling (directly, or via its enclosing `infocard-evo-split`). This selector needs no extra guard against Eevee's own repeated occurrences — none of Eevee's 4 repeats has a preceding infocard sibling under this definition, so it naturally comes back empty for Eevee, correctly.

All four selectors (2 pre-existing linear cases, 2 new branching cases) were verified by executing them with `lxml` against real, freshly-fetched HTML for Charmander/Charmeleon/Charizard (linear), Pichu/Pikachu (linear + a same-target branch to regular/Alolan Raichu), and Eevee/Vaporeon/Espeon/Umbreon (the full branching family, both from the hub's own page and from three different branch-target pages) — not hand-traced, not assumed. Full results kept in this session's chat log rather than duplicated here.

**Title override (C2):** in addition to the `pokemonname` field mapping above, the source's field mappings must also override the item's `Title` metadata directly (map `%[pokemonname]` to `Title`, not just to `pokemontype`'s sibling `pokemonname` field). Both fixes are required — the field mapping alone doesn't fix result titles shown by surfaces (RGA citations, Query Suggest candidates) that read `Title` and never touch this frontend's field-based mapper.

Field names must match `POKEMON_FIELDS` in `src/coveo/fields.ts` exactly. If a field is renamed here, update that file in the same change.

## Content exclusion (Web Scraping Configuration `exclude`, eleventh session)

`docs/adr/0012-web-scraping-content-exclusion-for-rga-cpr.md` is the source of truth for the reasoning — this is the config summary. Three `exclude` entries, same JSON config blob as the field-extraction rules above:

```json
"exclude": [
  {"type": "XPATH", "path": "//*[contains(@class,\"data-table\")]"},
  {"type": "XPATH", "path": "//*[contains(@class,\"type-table-pokedex\")]"},
  {"type": "XPATH", "path": "//div[@id=\"dex-locations\"]/following-sibling::div[1]"}
]
```

Removes Moves-learned + Sprites (rule 1), the Type-defenses effectiveness grid (rule 2, unreadable as flattened text, already fully captured in `pokemonweaknesses`/`pokemonresistances`), and Locations + the off-topic "Answers to X questions" PokéBase block (rule 3). Deliberately left in `body`: Pokédex-data/Training/Breeding/Base-stats tables, the per-game Pokédex flavor-text entries, Other-languages, Name-origin — see the ADR for why.

## Facet Generator (field-level, admin console)

As of the tenth session's facet-architecture change (`docs/adr/0011-automatic-facet-generation-on-search-page.md`), five fields have the **Facet Generator** field option enabled in the admin console (Fields page, per-field toggle — same location as "Sortable"), feeding `/search`'s `AutomaticFacets.tsx` (`buildAutomaticFacetGenerator`) instead of a hand-built `Facet` component: `pokemontype`, `pokemongeneration`, `pokemonegggroups`, `pokemonweaknesses`, `pokemonresistances`. All five were already Facet/Multi-value facet-enabled per the rows above, which is the only prerequisite. `pokemonabilities` (kept manual/searchable — hundreds of values, Automatic Facet Generation has no facet-search API) and `pokemonspeed` (Integer, Facet Generator is STRING-only) deliberately do not have this enabled.

## Validation

After indexing the test source, use the admin console's content browser to confirm extracted values for Pikachu match expectations (type = Electric, generation = I) before switching to the full crawl.

## Status

Both sources exist and are indexing: `Pokedex - Test` (the 3-document prototyping source referenced throughout this file) and `Pokedex - Full` (the real crawl, 24+ fields as of the Phase v2.1/v2.2 migration — see `docs/HANDOFF.md`'s sixth-session section for the live field count and any drift from this file). The `Pokedex` query pipeline's `filter cq @source==("Pokedex - Full")` rule means the app only ever sees `Pokedex - Full` at runtime; `Pokedex - Test` remains for prototyping new extraction rules before promoting them here.
