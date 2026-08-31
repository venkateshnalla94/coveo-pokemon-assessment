# 0012: Web Scraping content-exclusion rules for RGA/CPR body quality

Status: Accepted

## Context

Phase v3.4 (`docs/archive/EXECUTION-PLAN-v3.md`) set out to diagnose two live complaints — RGA "dumps every stat" and Passage Retrieval "returns random text" — by inspecting what's actually indexed into `body` before changing anything. `docs/temp_improvements.md` (a draft plan the user got from ChatGPT) hypothesized the crawler indexes the entire scraped page; this session confirmed that directly via Content Browser's Quick View on Charizard, a real live item on `Pokedex - Full`, not a guess.

## Findings

Charizard's Quick View is the full rendered page: intro prose, Pokédex data/Training/Breeding/Base-stats tables, a Type-defenses effectiveness grid, the evolution chart, 30+ per-game-version Pokédex flavor-text entries, Moves-learned tables (level-up/evolution/TM, repeated across 9 generations), a Sprites table, a Locations table, and — found only by actually reading the Quick View, not anticipated by the draft plan — an **"Answers to Charizard questions" block**: titles of unrelated PokéBase community forum threads (e.g. "Why is non-mega Charizard in OU, while Typhlosion is in NU?"), which is the most plausible concrete source of the "random text" complaint, since it's off-topic community discussion, not Pokémon fact content at all.

Pulled real HTML for Charizard and Eevee to identify stable, scoped selectors rather than guessing at boundaries:
- Moves-learned and Sprites tables both use `class` containing `data-table` (confirmed via `grep` against the raw fetched HTML: this class string appears nowhere else on the page).
- The Type-defenses grid uses `type-table-pokedex` — the same class already used by the existing `pokemonweaknessesraw`/`pokemonresistancesraw` field extraction, so this is a proven-safe selector, not a new guess.
- The Locations table reuses the generic `vitals-table` class shared with the Pokédex-data/Training/Breeding tables we want to keep, so a class-based exclude would also wrongly remove those. Its section is scoped structurally instead: `//div[@id="dex-locations"]/following-sibling::div[1]` — the single wrapper `<div class="grid-row">` that contains both the Locations table and the PokéBase questions block (confirmed by inspecting the raw HTML — both live inside the one sibling div right after the `dex-locations` anchor).

## Decision

Add three `exclude` rules to the Web Scraping Configuration JSON (same config blob as the existing field-extraction rules, `docs/coveo-source-spec.md`):

1. `{"type": "XPATH", "path": "//*[contains(@class,\"data-table\")]"}` — removes Moves-learned and Sprites content.
2. `{"type": "XPATH", "path": "//*[contains(@class,\"type-table-pokedex\")]"}` — removes the Type-defenses grid (unreadable as flattened text; already fully captured structurally in `pokemonweaknesses`/`pokemonresistances`).
3. `{"type": "XPATH", "path": "//div[@id=\"dex-locations\"]/following-sibling::div[1]"}` — removes Locations and the PokéBase questions block together.

**Deliberately left in `body`, not excluded** — real content, not boilerplate, even though some of it duplicates already-extracted fields:
- Pokédex-data/Training/Breeding/Base-stats tables — short, read fine as flattened key-value text, low cost to leave.
- The 30+ per-game Pokédex flavor-text entries — genuine official content, not repetitive boilerplate in the nav/footer sense, even though voluminous.
- Other-languages and Name-origin — small, and name-origin (etymology) is decent standalone content.

This keeps the no-fabricated-data principle (`CLAUDE.md`/`PRODUCT.md`) fully intact: nothing is rewritten or invented, only real boilerplate/off-topic sections are prevented from entering the index at all — the same mechanism already used for field-level extraction, just aimed at content exclusion instead of extraction.

## Consequences

- One rebuild of both `Pokedex - Test` and `Pokedex - Full` is required (Web Scraping Configuration changes need a full reindex to take effect, unlike a field's Sortable/Facet Generator toggle). **Done** — both sources reindexed, twelfth session.
- Batched into the same rebuild as v3.2's evolution-selector rework (`docs/coveo-source-spec.md`), per this session's own sequencing — one rebuild covers both phases instead of two.
- RGA's Semantic Encoder and CPR's embeddings must be rebuilt against the new `body` content after reindexing (both draw from the same indexed content) — verify via the same Chunk Inspector query used for diagnosis, re-run after the rebuild, before considering any `Items to consider`/chunk-relevancy-threshold tuning (`docs/temp_improvements.md` §11-12's own sequencing advice, which this ADR follows). **Followed through on, twelfth session, and this is exactly where a real problem surfaced**: the source-level exclusion is confirmed working — Quick View on both Charizard and Charjabug (a second, independently-checked item) shows the targeted sections stripped from the current index. But RGA's own chunk embeddings for most of the 1025-item corpus are **stale** — Charjabug's chunk (pulled via Chunk Inspector, Search ID mode, on a real "what moves does Charizard learn" query) still contained raw move-table data that no longer exists in its indexed `body`. The model's status shows its next scheduled content refresh 7 days out; nothing in the console forces an earlier full-corpus re-embed. Tried `Items to consider` (100 → 20) exactly as this ADR's own sequencing anticipated — it had zero effect, which itself is useful evidence: the problem isn't which chunks get selected from an otherwise-current pool, it's that the pool itself is outdated for most items. Reverted to 100. **New action item**: request an off-cycle RGA + Semantic Encoder rebuild from Coveo (Account Manager/support) rather than waiting out the weekly cycle, given the 2026-09-06 presentation deadline lands in the same window. Full trail in `docs/HANDOFF.md`'s twelfth-session section.
- If a future session finds the Pokédex flavor-text volume is *still* dominating chunk relevance after this change, that's a separate, distinct decision (whether to further trim flavor text) — not assumed or pre-decided here.
- **New, unrelated observation from the same Chunk Inspector pass**: Charizard's own chunks include full vitals/stat tables for its Mega Evolution X/Y forms (real page content, not fabricated, not something this ADR's exclusion rules were scoped to address) — a stats question could occasionally retrieve a Mega-form stat block instead of base Charizard's. Flagged as a possible future refinement, not acted on.
