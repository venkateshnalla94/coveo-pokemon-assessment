# Pokemon data inventory (pokemondb.net)

A factual survey of what data actually exists on a pokemondb.net Pokemon page, gathered by fetching `https://pokemondb.net/pokedex/pikachu` directly (not assumed from memory) as research for `docs/archive/EXECUTION-PLAN-v2.md`. This is a reference doc, not a phased plan — it stays useful regardless of which fields v2 actually ships, and is the place to check "does real data exist for X" before inventing a UI element around it.

Each section below: what's on the page, real values for Pikachu, and a feasibility classification for Coveo custom-field extraction:

- **Easy** — scalar or small fixed-set, same shape as the fields already indexed (`pokemontype`, `pokemongeneration`, etc.)
- **Medium** — small structured list, feasible but bigger than a one-line selector
- **Hard / not field-shaped** — large repeating table or free-text list; a poor fit for scalar metadata extraction, better left as page body content (already reachable via Passage Retrieval/RGA today)

## 1. Page header / artwork

`og:image` doesn't exist on these pages (already known — see `docs/coveo-source-spec.md`'s stale-vs-`final_config.json` note). Real artwork: `https://img.pokemondb.net/artwork/large/pikachu.jpg`, already indexed as `pokemonimageurl`.

**Feasibility:** Easy — already done.

## 2. Pokédex data table

National №: 0025 · Type: Electric · Species: "Mouse Pokémon" · Height: 0.4 m (1′04″) · Weight: 6.0 kg (13.2 lbs) · Abilities: Static, Lightning Rod (hidden).

Also a small "Local №" sub-list (one row per game/region) — not the same as National №, already the source of the `№` selector trap documented in `docs/plan101.md`.

**Feasibility:** Easy. Species, Height, Weight, and Abilities (1–3 values incl. hidden) are all scalar/small-set, same extraction pattern as the existing fields.

## 3. Training info

EV Yield: 2 Speed · Catch Rate: 190 (24.8% with PokéBall at full HP) · Base Friendship: 50 (normal) · Base Exp.: 112 · Growth Rate: Medium Fast.

**Feasibility:** Easy — 5 scalar fields.

## 4. Breeding info

Egg Groups: Fairy, Field · Gender: 50% male / 50% female · Egg Cycles: 10 (2,314–2,570 steps).

**Feasibility:** Easy — 3 scalar/small-set fields.

## 5. Base stats

| Stat | Base | Min (Lv.100) | Max (Lv.100) |
|---|---|---|---|
| HP | 35 | 180 | 274 |
| Attack | 55 | 103 | 229 |
| Defense | 40 | 76 | 196 |
| Sp. Atk | 50 | 94 | 218 |
| Sp. Def | 50 | 94 | 218 |
| Speed | 90 | 166 | 306 |
| **Total** | **320** | — | — |

**Feasibility:** Easy — 6 base-stat numbers + total, all scalar. The Min/Max-at-Lv.100 columns are derived arithmetic, not worth indexing separately. The bar-chart width class (`barchart-rank-N`) in the HTML is a rendering hint only, not real data.

## 6. Type defenses (damage taken chart)

Full 18-type multiplier grid, present as two `<table class="type-table">` blocks. For Pikachu: resists (0.5×) Electric, Flying, Steel; weak (2×) to Ground; normal (1×) to everything else. A second grid exists for the Lightning Rod ability variant (Electric becomes immune) behind a CSS tab — both panels are in the raw server HTML, no JS execution needed to reach either.

**Feasibility:** Medium. 18 separate multiplier fields is too many for this project's existing pattern; simplifying to two multi-value list fields (weaknesses, resistances — just the type names at 2×/0.5×/0×, skip the exact multiplier) is the practical version. The ability-variant chart (Lightning Rod's altered defenses) is a nice-to-have, not core.

## 7. Evolution chart

Pichu (#0172) → Pikachu (#0025) [requires high Friendship] → Raichu (#0026) [Thunder Stone, outside Alola] or Alolan Raichu (#0026, Electric/Psychic) [Thunder Stone, in Alola].

**Feasibility:** Medium. The full chain (with branch conditions) is a small structured list, but genuinely harder than a one-line selector — Pikachu's own chain branches in two directions. A simplified "evolves from" / "evolves into" pair of short text fields (dropping the branch conditions) is the realistic v2 scope; the full branching chain is a stretch goal, not a blocker.

## 8. "Pikachu changes" (historical stat/mechanic notes)

Free-text bullet list, e.g. "In Generation 1, Pikachu has a base Special stat of 50." 7 bullets for Pikachu; count varies a lot per Pokemon (some have none).

**Feasibility:** Hard / not field-shaped. Variable-length free text, not a reliable field across 1025 Pokemon.

## 9. Pokédex entries (flavor text per game)

One row per game/version-group — **~30 rows** for the base form alone (Red/Blue through Scarlet/Violet), each a distinct 1–3 sentence description, e.g.:
- Red/Blue: "When several of these POKéMON gather, their electricity could build and cause lightning storms."
- Legends: Arceus: "Possesses cheek sacs in which it stores electricity. This clever forest-dweller roasts tough berries with an electric shock before consuming them."

**Feasibility:** Hard / not field-shaped. All server-rendered, no JS needed to reach it, but ~30 rows per Pokemon (repeated again per cosmetic form — see §12) is a poor scalar-field fit. This content is exactly the kind of thing already reachable as page body text through Passage Retrieval/RGA — no new indexing work needed to make it queryable, just not as a structured field.

## 10. Moves learned (the big one)

Split by generation via 9 separate sub-pages (`/pokedex/pikachu/moves/1` through `/9`) — the main page only inline-renders the current generation (9). Within Gen 9, both CSS-tabbed panels (Legends: Z-A vs. Scarlet/Violet) are fully present in the static HTML. Contents per generation: moves learnt by level-up (~16 rows for Gen 9), by TM (40+ rows for Gen 9 alone), egg moves (~7 rows), reminder moves. Across all 9 generations, likely 100+ total move-learning rows.

**Feasibility:** Hard / not field-shaped, by a wide margin. Large repeating tables, multiplied across 9 separate URLs per Pokemon. Not a candidate for custom-field extraction under any reasonable scope. Already reachable as body content for the current-generation table at least (single-page crawl); full historical move data would require crawling 9 additional URLs per Pokemon (9,225 extra pages for the full 1025-Pokemon index) — explicitly out of scope.

## 11. Sprites gallery

Table: Normal/Shiny rows × Generation 1–9 columns (~18 image cells), plus a link to a much larger dedicated `/sprites/pikachu` gallery page (not fetched, likely far bigger).

**Feasibility:** Medium for the inline 18-cell table (bounded, real image URLs); the linked full gallery page is a separate crawl target, out of scope for v2.

## 12. Alternate/cosmetic forms

The Pokédex-entries block (§9) repeats once per cosmetic variant (Cap Pikachu, World/Unova/Sinnoh/Partner/Original/Kalos/Hoenn/Alola Cap, Gigantamax) — potentially 50–100+ additional flavor-text rows. Partner Pikachu (Let's Go) has its own distinct base stats (HP 45/Atk 80/Def 50/SpAtk 75/SpDef 60/Speed 120, Total 430).

**Feasibility:** Hard / not field-shaped for the flavor text; the Partner-form stat block alone would be Easy if ever wanted, but form-specific stats are out of scope for v2 (the base form's stats already cover the primary use case).

## 13. Locations (where to find Pikachu)

One row per game/version-group, ~21 rows, e.g. Red/Blue: Power Plant, Viridian Forest; Scarlet/Violet: East Province (Area One), etc. Some rows are non-location text ("Trade/migrate from another game").

**Feasibility:** Medium-to-hard. More structured than flavor text but still a per-game list (~21 rows); borderline value for a search UI. Out of scope for v2, revisit only if a specific UI need arises.

## 14. Community Q&A links

~10 links to PokéBase community question threads. Not official Pokédex data.

**Feasibility:** Out of scope — community-generated, not authoritative.

## 15. Other languages

Two 9-row tables: the Pokemon's name and its species/category name, each in English/Japanese/German/French/Italian/Spanish/Korean/Chinese (Simplified & Traditional).

**Feasibility:** Easy if wanted (short scalar strings), but low priority — no current UI need for localized names.

## Summary: what a Coveo headless-browser crawler can actually reach

Everything on the single `/pokedex/<name>` page is server-rendered static HTML, including every CSS-tabbed panel (type-defense ability variants, Gen-9 move-table variants) — a crawler doesn't need to execute any JS or click any tab to see all of it. The genuine gap is **pagination via real hyperlinks**: full historical move data (Generations 1–8) and the full sprite gallery live on separate URLs the main page only links to, not inline content. No AJAX-loaded/JS-gated content was found anywhere on the page.
