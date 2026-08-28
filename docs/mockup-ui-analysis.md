# Mockup UI analysis

Three AI-generated mockups in `mock-ups/` (a fictional "Monsterdex" app, not a real product) were supplied as design inspiration for the next frontend iteration. This doc breaks down what each screen shows, whether real Pokemon data can back it (cross-referenced against `docs/pokemon-data-inventory.md`), and calls out where the mockup's fictional content conflicts with this project's own rules — meant to be read alongside the mockup PNGs themselves before the next session's detailed FE component planning.

## The core tension, upfront

`PRODUCT.md` Principle 4 is a hard rule: *"No fabricated data: every Pokemon name, type, generation, or answer shown must come from the real Coveo index or pokemondb.net, never invented placeholder content presented as real."* The mockups invent data that has no real Pokémon equivalent: a numeric "Rarity" tier, a "Level," a "Synergy Score," "Personality" trait tags, a flat "Habitat" tag, "Add to team"/user-collection features. None of these can be ported literally — either drop them, or replace with the closest real equivalent noted per element below.

Principle 1 additionally favors *"a credible, restrained Coveo customer-style search implementation... not maximal Pokemon theming."* The mockups are a gamified consumer app: gradients, particle/glow effects, emoji-adjacent iconography, a purple "AI Discovery Assistant" chat persona. The recommendation below is to adopt the mockups' **information architecture and interaction patterns** — density, tabs, stat visualization, panel structure, richer AI-answer surfacing — while keeping the visual register closer to this project's current restrained styling than to the mockups' full gamified chrome. This is a judgment call for the next session to make concretely, not resolved here.

## Screen 1: Home page (`A7D995E4...png`)

Hero banner with a search bar, quick-filter chips (Electric/Water/Fire/Grass/Rare/Beginner-friendly/Fast/Cute), a right-rail "AI Discovery Assistant" chat box that answers a typed question with a grounded creature list, a "Featured Creatures" row, and a "Browse by Element" icon grid, plus a "Why you'll love this search experience" feature-callout row (Semantic Search / Powerful Facets / Compare Creatures / AI Answers).

| Mockup element | Real data available? | Notes |
|---|---|---|
| Search bar + quick-filter chips | Type chips: yes (`pokemontype`, indexed). "Rare"/"Beginner-friendly"/"Cute" chips: no real equivalent | Keep type chips; drop or replace the fabricated ones — "Fast" could map to a real high-Speed-stat filter once base stats are indexed (v2.1) |
| Right-rail AI assistant answering with a grounded creature list | Yes, closely — this is what `GeneratedAnswer.tsx` (RGA) already does today, just not styled this prominently on the home page | Reuse the existing component; this screen argues for surfacing RGA more prominently rather than building a new one |
| "Browse by Element" icon grid | Yes — same as the Type facet, presented as a grid instead of a sidebar list | Straightforward reskin of existing facet data |
| Featured Creatures row | Would need a "pick N Pokemon" curation mechanism — no real "featured" flag exists | Could default to "most recently viewed" or a fixed curated list; not a data-indexing task |
| "1,284 Creatures. Infinite Discoveries." headline | Real count is 1025 (this project's actual indexed total) | Straightforward swap to a real, live count |

## Screen 2: Explore / search results (`03D97A8B...png`)

Left sidebar with Type, Habitat, Abilities, a Speed Rating range slider, Rarity, and Evolution Stage facets; an "AI Discovery Assistant" summary bar above the grid; result cards showing Agility/Speed stats and quick-view/compare actions; a persistent comparison tray (up to 3–4 items) with a side-by-side stat table.

| Mockup element | Real data available? | Notes |
|---|---|---|
| Type facet | Yes — already built (`FacetType.tsx`) | No change needed |
| Habitat facet | No — real per-game location data (§13 of the inventory doc) is a ~21-row-per-Pokemon list of specific in-game areas, not a clean small-set "habitat" tag | Would need real data reshaped into a small controlled vocabulary (e.g. bucketing into a handful of biome categories) to be honest and facetable — nontrivial, not v2.1 scope |
| Abilities facet | Yes, once abilities are indexed (v2.1) — abilities are a small, real, multi-value field | Straightforward new facet once the field exists |
| Speed Rating range slider | Yes, once base Speed stat is indexed (v2.1) — Coveo supports numeric range facets | Real, buildable once the stat field exists |
| Rarity facet | No real equivalent — Pokemon don't have a "rarity tier" in pokemondb.net data | Drop, or consider Generation as a loose proxy if a facet is wanted in that visual slot |
| Evolution Stage facet | Partially — a derived "basic/stage 1/stage 2" classification is inferable from the evolution chain data (§7), similar in spirit to how `pokemongeneration` is already derived via an Indexing Pipeline Extension | Feasible as a v2 stretch goal, not v2.1 core scope (evolution data itself is only "Medium" feasibility) |
| Result-card Agility/Speed stats | Speed: yes, real, once indexed. Agility: no real stat by that name (Pokemon's six stats are HP/Attack/Defense/Sp.Atk/Sp.Def/Speed) | Drop "Agility," show real Speed only |
| Comparison tray (side-by-side stat table) | Yes, entirely — once base stats are indexed, a side-by-side stat comparison across selected Pokemon is real, honest, and a nice reuse of existing data | Client-side feature (selection state, no new backend); good v2.3 candidate |

## Screen 3: Detail page (`BC25DEA1...png`)

Hero image, breadcrumb, name + dex-style badge + Type/Rarity/Level chips, description, Habitat/Personality rows, action buttons (Add to team/Favorite/Compare), a stat-bar row (HP/Attack/Defense/Agility/Speed + "Special Ability"/"Synergy Score"), tabs (Overview/Abilities/Evolution/Habitat/Similar Creatures), an Evolution Chain visual, an "Abilities & Moves" panel (name/type/power/accuracy/description per move), a "Creature Profile" panel (Height/Weight/Category/Egg Group/Hatch Time/Catch Rate/Base XP/Release XP), a Related Creatures grid, and a right-rail "AI Insights" (RGA summary + citation count) plus an "Ask AI about X" chat box with suggested-question chips.

| Mockup element | Real data available? | Notes |
|---|---|---|
| Name, dex number, Type chip | Yes — already rendered today | No change |
| "Rarity"/"Level" chips | No real equivalent | Drop |
| Description | Species/category ("Mouse Pokémon") is real and short; a full narrative description would need to come from Pokédex flavor text (Hard-feasibility, §9) — recommend using the short species/category line here, not fabricating prose | Use real `species` field once indexed |
| Habitat / Personality rows | No real equivalent for either as shown (see Habitat note above; "Personality" traits like Energetic/Playful/Loyal don't exist in Pokemon data at all) | Drop both, or replace Habitat with a real location summary once that data is evaluated |
| Add to team / Favorite / Compare buttons | Compare: yes, feasible as a client-side feature (see Screen 2). Add to team / Favorite: no backing data model, would need new client-side-only state (e.g. `localStorage`) with no server persistence — a scope decision, not a data-availability question | Compare is the strong candidate; team/favorites need an explicit go/no-go decision, likely out of scope per `docs/adr/0004`'s no-server-layer constraint (no account system exists to persist "favorites" server-side) |
| Stat bars: HP/Attack/Defense/Agility/Speed | HP/Attack/Defense/Speed: yes, real, once indexed. "Agility": not a real stat — the real sixth/fifth stats are Sp. Atk and Sp. Def | Show all 6 real stats (HP/Attack/Defense/Sp.Atk/Sp.Def/Speed), not the mockup's 5 with a fictional "Agility" |
| "Special Ability" / "Synergy Score" | Special Ability: closest real equivalent is the Abilities field (once indexed). Synergy Score: entirely fabricated, no real equivalent of any kind | Rename to real "Ability," drop Synergy Score entirely |
| Tabs: Overview/Abilities/Evolution/Habitat/Similar Creatures | Overview/Abilities/Evolution: yes, once those fields are indexed. Habitat: no (see above). Similar Creatures: yes — same-type or same-generation query against the existing index | Drop or repurpose the Habitat tab; the other four are realistic once v2.1 fields land |
| Evolution Chain visual | Yes, in simplified form (evolves-from/evolves-into text, not full branching chain — see inventory doc §7) | Build against the simplified pair first; full branching chain is a stretch goal |
| Abilities & Moves panel (with power/accuracy per move) | Abilities: yes. Per-move power/accuracy/description table: no — this is exactly the "Hard/not field-shaped" moves data (inventory doc §10), 100+ rows across 9 generation sub-pages | Show real Abilities as a list; do NOT attempt a structured moves table as new fields — if move detail is wanted, point users at the existing Ask-about-this-Pokemon (Passage Retrieval) feature, which already surfaces raw move-table content from the page body today |
| Creature Profile panel (Height/Weight/Category/Egg Group/Hatch Time/Catch Rate/Base XP/Release XP) | Nearly 1:1 real match — Height, Weight, Species/Category, Egg Groups, Egg Cycles (≈"Hatch Time"), Catch Rate, Base Exp all real and Easy-feasibility per the inventory doc. "Release XP" has no real equivalent (not a real Pokemon concept) | This panel is the single best-aligned piece of the whole mockup — nearly every field maps directly to real data once v2.1 lands; drop only "Release XP" |
| Related Creatures grid | Yes — reuse existing search/facet machinery (e.g. same type, same generation) | No new data needed |
| "AI Insights" (RGA summary + citation count) | Yes — this is exactly `GeneratedAnswer.tsx` today, just needs richer presentation (citation count framing, "grounded in N sources" style copy) | Enhance existing component, don't rebuild |
| "Ask AI about X" chat box + suggested-question chips | Yes — this is exactly `AskAboutPokemon.tsx` today. Suggested-question chips ("What moves work best?", "How does it evolve?") are a pure UI enhancement, no new data needed, though a couple of the mockup's example questions ("Best team comps," "How to train for PvP") don't have real answerable content behind them yet | Enhance existing component with suggested-question chips scoped to questions the real data can actually answer (evolution, abilities, stats) |

## Net takeaway for the next (Opus/FE) session

The detail page's **Creature Profile panel** and the **stat-bar concept** are the strongest, most directly portable pieces of the mockups — nearly every field they need becomes real once `docs/EXECUTION-PLAN-v2.md`'s v2.1 fields land. The **Abilities & Moves table**, **Habitat**, **Rarity/Level/Synergy Score/Personality**, and **Add-to-team/Favorites** are the pieces that need an explicit decision (drop, adapt, or accept as a client-side-only feature with no real backing) before component work starts — that decision is exactly what got flagged rather than silently resolved in this doc.
