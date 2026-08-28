# Coveo Pokemon Challenge — Execution Plan v2

## Context

`docs/EXECUTION-PLAN.md` covered the original assessment build — that plan is done (Essential/Intermediate-GitHub/Advanced/Bonus tiers all built and verified live; only Vercel deploy and the two presentation decks remain open there, tracked in `docs/HANDOFF.md`). This file is an **extension**, not a replacement: a second phase the user asked for after seeing the built app — enrich what's indexed from pokemondb.net well beyond the current 5 fields, and redesign the frontend around three AI-generated "Monsterdex" mockups the user supplied (`mock-ups/*.png`).

Two research docs back this plan, written the same session:
- `docs/pokemon-data-inventory.md` — a factual survey of every data section on a real pokemondb.net Pokemon page, with a feasibility rating (Easy/Medium/Hard) for Coveo custom-field extraction.
- `docs/mockup-ui-analysis.md` — a per-screen breakdown of the three mockups, cross-referenced against the inventory doc, flagging which mockup elements have real data behind them and which are fabricated (per `PRODUCT.md` Principle 4, fabricated elements get dropped or adapted, never invented).

**Explicit rollout order, per user decision:** prototype new fields on `Pokedex - Test` (3 docs: pikachu/garchomp/sprigatito, the same trap-case set used in the original build) first, validate, then port to `Pokedex - Full` (1025 docs) once proven. **Detailed frontend component design is explicitly deferred** — the user plans a separate session using Opus to deconstruct the mockups against real data; this plan's frontend phase (v2.3) stays at the roadmap/feasibility level on purpose, not a component spec.

## Phase v2.1 — Prototype new fields on `Pokedex - Test`

New custom fields to add, all rated **Easy** feasibility in `docs/pokemon-data-inventory.md` (scalar or small fixed-set, same extraction pattern as the existing `pokemontype`/`pokemongeneration`/etc.):

- [x] `pokemonspecies` — the category line (e.g. "Mouse Pokémon")
- [x] `pokemonheight`, `pokemonweight` — from the Pokédex data table
- [x] `pokemonabilities` — multi-value, e.g. `Static`, `Lightning Rod (hidden)`
- [x] Base stats: `pokemonhp`, `pokemonattack`, `pokemondefense`, `pokemonspatk`, `pokemonspdef`, `pokemonspeed`, `pokemonstattotal` — 7 numeric fields
- [x] Training info: `pokemonevyield`, `pokemoncatchrate`, `pokemonbasefriendship`, `pokemonbaseexp`, `pokemongrowthrate`
- [x] Breeding info: `pokemonegggroups`, `pokemongenderratio`, `pokemoneggcycles`
- [x] `pokemonweaknesses`, `pokemonresistances` — multi-value type-name lists (simplified from the full 18-type multiplier grid — see inventory doc §6)
- [x] `pokemonevolvesfrom`, `pokemonevolvesto` — simplified evolution relationship as short text (not the full branching chain — see inventory doc §7)

Steps:
1. Add extraction rules for the above to `Pokedex - Test`'s scraping configuration (via the `coveo-index-architect` agent/skill — reuse the established gotcha patterns: positional `(...)[1]` scoping for duplicate elements, avoid the `№` character in favor of matching `"National"`, selectors must end in `text()`/`@attr`, mapping rules are first-match-wins).
2. Rebuild `Pokedex - Test` (fast, depth 0, seconds not minutes).
3. Validate via Content Browser against all 3 trap-cases (Pikachu = baseline, Garchomp = multi-form/duplicate-type trap, Sprigatito = Gen-9 boundary case) — confirm each new field extracts correctly and doesn't regress the existing 5 fields.
4. Update in lockstep (per the existing "keep these two in sync" contract already documented in `src/coveo/fields.ts` and enforced by `coveo-index-architect`'s constraints):
   - [x] `src/coveo/fields.ts` — add the new `POKEMON_FIELDS` entries
   - [x] `src/coveo/mapPokemonResult.ts` — extend `PokemonItem` and the mapping logic (reuse `asString`/`toStringArray` helpers where shapes match; new numeric fields will need a small `asNumber`-style helper, following the same "must never throw" defensive pattern `toStringArray` already uses)
   - [x] `docs/coveo-source-spec.md` — add the new field rows with real selectors (and, while touching this file, fix its two already-stale rows for `pokemonimageurl`/`pokemondexnumber` per the current-state audit — they still describe the superseded `og:image`/`contains(№)` plan instead of the real `fetchpriority`/`"National"` selectors already live in `docs/final_config.json`)
5. Confirm the pipeline's existing `filter cq @source==("Pokedex - Full")` rule (D3.5) keeps Test-source prototyping isolated from live search results throughout — already in place, just verify it still holds.

**Status: done.** All eight field groups built, validated in Content Browser against Pikachu and Garchomp (the multi-form/duplicate-type trap), plus Pichu (base-stage evolution edge case, verified via the Web Scraping Configuration test panel since Pichu isn't in `Pokedex - Test`'s crawl scope). Sprigatito was spot-checked early (group a) but not re-verified field-by-field for every subsequent group — worth a full pass before Phase v2.2 if the Gen-9 boundary case matters for any of the newer fields specifically. Two real bugs found and fixed along the way, both documented in `docs/coveo-source-spec.md`: the weaknesses/resistances extraction initially picked up duplicate/tabbed renders of the "Type defenses" section (fixed via positional table scoping), and the evolution-chart selectors initially leaked into the page's moves-learned tables (`class="ent-name"` is reused there) and had a reverse-XPath-axis bug (`preceding::[last()]` vs `[1]`) — both fixed, see the spec doc's "Evolution-chart structure" section for the full account. `src/coveo/mapPokemonResult.ts` also gained an `isBaseStage` derived flag so the frontend can treat an absent `evolvesFrom` as "no pre-evolution" rather than a missing-data error. Two pre-existing unit tests (`mapPokemonResult.test.ts`, `searchRenderState.test.ts`) were updated for the new `PokemonItem` shape; full suite (49 tests), typecheck, and lint all pass.

## Phase v2.2 — Port to `Pokedex - Full`

Only after v2.1 is fully verified on Test.

- [x] Diff Test's proven `ScrapingConfiguration`/mappings JSON into Full's `resourceId`-scoped config (mapping `id`s are auto-generated on save — safe to copy the array wholesale with `id`s stripped, per the audit's finding).
- [x] **Attach both IPEs to `Pokedex - Full`'s own Extensions list** (Content → Sources → `Pokedex - Full` → Extensions) — confirmed extensions are attached per-source, not per-pipeline, so this doesn't happen automatically by copying the scraping config JSON.
- [x] Rebuild `Pokedex - Full` (~35–45 min, per the original build's timing).
- [x] Re-verify the same trap-cases plus a broader spot-check across the 1025-item index (facet counts, a few random Pokemon detail pages).
- [x] Update `docs/HANDOFF.md` per this project's standing process rule (org config changed).

**Status: done.** One real snag hit and fixed along the way: the initial config diff only copied the scraping extraction rules and the two IPE-output field mappings (`pokemonweaknesses`/`pokemonresistances`), not the other 19 field mappings — Content Browser showed only 7 of 26 fields on the first rebuild. Root cause: the same "unmapped metadata is invisible" trap this project already knew about, just resurfacing on a second source. Fixed by adding all 21 missing mappings directly via the mappings JSON (same raw-edit mechanism as the Web Scraping Configuration), then rebuilding again. After the fix: Pikachu, Garchomp, and Sprigatito all match `Pokedex - Test`'s values field-for-field, and the four multi-value facets (`pokemonabilities`, `pokemonegggroups`, `pokemonweaknesses`, `pokemonresistances`) all show clean, correctly-split values at full 1025-item scale — hundreds of distinct ability names, all 15 real egg groups, 17/18 types in weaknesses (correctly missing Normal, which nothing is weak to), no semicolon-joined compounds anywhere.

## Phase v2.3 — Frontend enhancement (roadmap only — component spec deferred to the Opus/mockup session)

Per `docs/mockup-ui-analysis.md`'s per-screen breakdown, the pieces with real data support once v2.1/v2.2 land:

- [ ] **Creature Profile panel** on the detail page — height/weight/species/egg groups/catch rate/etc. This is the mockup's best-aligned panel; nearly every field maps directly to a v2.1 field.
- [ ] **Stat bars** — all 6 real base stats (HP/Attack/Defense/Sp.Atk/Sp.Def/Speed), replacing the mockup's fictional 5-stat set (which included a non-existent "Agility" stat).
- [ ] **Abilities** shown as a real list (replacing the mockup's fabricated "Synergy Score").
- [ ] **Simplified evolution display** — evolves-from/evolves-into text; full branching-chain visual is a stretch goal.
- [ ] **Speed range facet + Abilities facet** on the search results page, once those fields exist.
- [ ] **Comparison tray** (side-by-side stat table across selected Pokemon) — client-side feature, no new data needed beyond stats already being indexed.
- [ ] **Richer `GeneratedAnswer.tsx`/`AskAboutPokemon.tsx` presentation** — both already exist and work; enhance with suggested-question chips and citation-count framing, not a rebuild.

Explicitly **not** building (no real data, or out of scope — see `docs/mockup-ui-analysis.md` for the full per-element reasoning): Rarity, Level, "Synergy Score," Personality tags, a flat Habitat tag, a structured Abilities & Moves table (the real moves data is Hard-feasibility per the inventory doc — point users at the existing Ask-about-this-Pokemon/Passage Retrieval feature instead, which already surfaces move-table content from page body), Add-to-team/Favorites (no server-side persistence model exists per `docs/adr/0004`'s no-server-layer constraint — client-side-only `localStorage` is the only way to build this at all, and that's an explicit scope decision for the FE session, not assumed here).

## Decisions carried forward, not yet formalized

- Whether "large tables (moves, per-game flavor text) stay as passage-retrievable body content rather than becoming new Coveo custom fields" deserves its own ADR (next number: `docs/adr/0009-...`) — not written now since nothing's been implemented yet; write it if/when v2.1 is actually built, matching this project's "ADR on real decisions, not code comments" convention.
- Whether a derived "Evolution Stage" facet (basic/stage 1/stage 2, inferable from the simplified evolution fields) is worth building — flagged as a stretch goal in `docs/mockup-ui-analysis.md`, not core v2.1 scope.
- The Habitat facet/tag has no honest real-data backing as shown in the mockups (see inventory doc §13 and the UI analysis doc) — needs an explicit go/no-go before any FE work assumes it exists.
