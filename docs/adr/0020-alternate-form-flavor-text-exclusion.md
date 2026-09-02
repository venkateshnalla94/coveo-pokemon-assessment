# 0020: Exclude alternate-form Pokédex flavor-text subsections from body (refines ADR-0012)

Status: Accepted

## Context

`docs/adr/0012-web-scraping-content-exclusion-for-rga-cpr.md` excluded Moves-learned/Sprites, the Type-defenses grid, and Locations/PokéBase-questions from crawled `body` content, to improve RGA and Passage Retrieval (CPR) quality. That analysis was done on Charizard and deliberately kept the ~30 per-game Pokédex flavor-text entries in `body`, reasoning they were genuine, non-repetitive content.

This session compared Pikachu's Content Browser Quick View (`docs/temp/quick-view/`) against the live `pokemondb.net/pokedex/pikachu` page and found a source of repetitive text ADR-0012 never saw, because Charizard doesn't have it: **Cap Pikachu variant flavor-text subsections** — World Cap, Unova Cap, Sinnoh Cap, Partner Cap, Original Cap, Kalos Cap, Hoenn Cap, Alola Cap, and Gigantamax — each repeating near-identical templated sentences across four game versions. This is the scenario ADR-0012 explicitly flagged as a possible future call ("If a future session finds the Pokédex flavor-text volume is still dominating chunk relevance... that's a separate, distinct decision").

Hard requirement carried over from ADR-0012 and restated by the user for this change: none of the 27 metadata fields already extracted via XPath in `docs/final_config.json` may be affected.

## Findings

Fetched and grepped the raw HTML of `pokemondb.net/pokedex/pikachu` directly (not inferred from the rendered screenshots alone):

- The Cap-variant flavor tables use `class="vitals-table"` — the same class the field-extraction XPaths key off of positionally (`pokemonspecies` = `(//table[@class="vitals-table"])[1]`, ... `pokemonhp`/stats = `[4]`, etc.). A class-based exclude on `vitals-table` would have broken every one of those fields.
- The "Pokédex entries" section is a flat sibling sequence directly after the empty anchor `<div id="dex-flavor"></div>`: `h2`, then repeating `h3` (form name) + `div class="resp-scroll"` (wrapping the table) pairs — one pair per form, base species always first.
- The 4 field-extraction `vitals-table` instances all occur earlier in the document, inside `div#dex-basics`'s tab panels — structurally before, and never a sibling of, `div#dex-flavor`. An exclude scoped to siblings *after* `div#dex-flavor` cannot reach them regardless of how many alternate forms a given page has.
- Locations and Other-languages sections wrap their own tables two levels deeper (`div.grid-row > div.grid-col`), and Moves-learned tables three levels deeper (`div.sv-tabs-wrapper`) — none are direct siblings of `div#dex-flavor`, so this change has zero overlap with ADR-0012's existing exclusions.
- Coveo's own web scraping configuration docs (`docs/coveo.com/en/mahe0350`) don't spell out exclude/metadata execution order explicitly, but ADR-0012 already exercised this exact scenario in production — it excluded `type-table-pokedex`, a class also used by the `pokemonweaknessesraw`/`pokemonresistancesraw` metadata XPaths, and confirmed post-rebuild that both the exclusion and the fields worked. That precedent is treated as the operative evidence that body-`exclude` and metadata XPath extraction are independent in this org, rather than re-deriving it from scratch.

## Decision

Add two new `exclude` rules to the same Web Scraping Configuration JSON, additive to ADR-0012's three (nothing removed or reordered):

```json
{"type": "XPATH", "path": "//div[@id=\"dex-flavor\"]/following-sibling::h3[position()>1]"}
{"type": "XPATH", "path": "//div[@id=\"dex-flavor\"]/following-sibling::h3[position()>1]/following-sibling::div[1]"}
```

The first strips the alternate-form heading text itself; the second strips each alternate form's flavor-text table by taking the immediate next `div` sibling of each excluded heading — the same single-step "next sibling" pattern ADR-0012's own `dex-locations` rule already used successfully in production. Both are scoped by **sibling position relative to `div#dex-flavor`**, not by class name, which is what keeps them from ever touching the 4 field-bearing `vitals-table` instances.

**Correction (same day, after the first rebuild):** the second rule originally shipped as `//div[@id="dex-flavor"]/following-sibling::div[contains(@class,"resp-scroll")][count(preceding-sibling::h3) > 1]`. Post-rebuild, the user's Content Browser Quick View on Pikachu showed the alternate-form headings gone (rule 1 worked) but every Cap-variant table's text still fully present — rule 2 had no effect. Re-tested both the original and the replacement expression against the real fetched HTML with a full XPath 1.0 engine (`lxml`) across all 4 sampled pages: the `count()`/`contains()` version was already unreliable even there (it over-matched by exactly one node on every page with alternate forms — on Garchomp it also caught the unrelated Sprites-gallery table, since that table coincidentally has the same preceding-`h3` count), and evidently isn't evaluated the way a full XPath engine would by Coveo's crawler, since it removed nothing at all in production. Replaced it with the current, simpler expression above and reverified exact match counts against Pikachu/Garchomp/Sprigatito/Charizard (10/1/0/3 — matching each page's alternate-form heading count exactly, no over- or under-matching). Lesson carried forward: prefer single-step `following-sibling::X[1]` adjacency over `count()`/`contains()` predicates for this crawler's XPath engine, and verify any exclude rule found this way against a real XPath library before treating it as accepted.

The base species' own Pokédex entries (first `h3` + table) are untouched, consistent with ADR-0012's decision to keep that content. "Pikachu changes" (the small per-generation stat-diff list) is out of scope — small, not repetitive boilerplate.

This generalizes beyond Pikachu: any Pokémon page with alternate-form flavor subsections (Rotom, Deoxys, Arceus, Necrozma, Zygarde, etc.) gets the same treatment — primary form's entries stay, later-form boilerplate goes. For cosmetic variants (Pikachu's caps) this is an unambiguous win. For Pokémon where forms carry meaningfully different information (Arceus's 18 types, Necrozma's formes), this trims more real content than the Pikachu case alone — flagged for a spot-check post-rebuild rather than assumed equally low-value everywhere.

## Consequences

- Requires a full reindex of both `Pokedex - Test` and `Pokedex - Full` to take effect, same as ADR-0012.
- Per ADR-0012's own sequencing, RGA's Semantic Encoder and CPR's embeddings need to pick up the new `body` content after reindexing — this should be bundled into the same pending off-cycle RGA/SE/CPR rebuild request already sent to Coveo (2026-08-31), not filed as a second, separate ask.
- Verification must include a field-regression pass (Pikachu plus a no-alternate-forms control item) confirming all 27 metadata fields are unaffected, before considering this done — the hard requirement carried over from ADR-0012.
- If the Arceus/Necrozma-style spot-check finds real information loss, that's a follow-up decision (e.g. scoping the exclusion to a denylist of cosmetic-only forms) — not pre-decided here.
