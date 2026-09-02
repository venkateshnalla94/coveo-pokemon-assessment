# 0021: Exclude Moves/Sprites/Type-defenses heading-and-label scaffolding from body

Status: Accepted

## Context

`docs/adr/0012-web-scraping-content-exclusion-for-rga-cpr.md` excluded the Moves-learned/Sprites tables (`data-table` class) and the Type-defenses effectiveness grid (`type-table-pokedex` class) from crawled `body` content. That removed the tabular *data*, but left the surrounding template scaffolding in place: the "Moves learned by X" heading, per-generation nav links (1-9), game-version tab labels ("Legends: Z-A", "Scarlet/Violet"), "Moves learnt by level up/reminder/TM" sub-headings and their one-sentence intros, "X sprites" heading, "See all X sprites" link, "Type defenses" heading, its intro sentence, and the "Static ability"/"Lightning Rod ability" tab labels.

The user found this scaffolding still showing up in Pikachu's Content Browser Quick View after ADR-0012's rebuild and flagged it as the same class of problem: generic, per-page-templated text with no standalone information content, still polluting RGA/Semantic Encoder/CPR. Same hard requirement as ADR-0012/0020: none of the 27 metadata fields may be affected.

## Findings

Fetched and grepped the raw HTML of 4 pages — Pikachu, Garchomp, Sprigatito, Charizard (the Test source's 3 sample items plus Charizard, ADR-0012's original subject) — to confirm the pattern is template-driven and stable, not Pikachu-specific:

- All 4 pages lay out the same anchor divs in the same order as flat top-level siblings: `div#dex-flavor` → `div#dex-moves` → `div#dex-sprites` → `div#dex-locations`. Everything between `dex-moves` and `dex-locations` is exactly the Moves-learned and Sprites scaffolding described above — nothing of value sits in that stretch beyond what's already excluded.
- `Type defenses` always renders as `<div class="grid-col span-md-12 span-lg-4"><h2>Type defenses</h2><p>The effectiveness of each type on <em>Name</em>.</p>...</div>` — one such block per form/tab. The count matches each page's form count exactly (2 for Pikachu, 3 for Garchomp/Charizard's Mega forms, 1 for Sprigatito), confirming this is a per-tab template block, not a one-off.
- The wrapping class `grid-col span-md-12 span-lg-4` is **not unique** — it's reused for unrelated layout blocks elsewhere on the page (6 occurrences on Pikachu's page vs. only 2 `<h2>Type defenses</h2>`), so a class-based exclude would have been too broad. Scoped the exclude to the heading text instead (`//h2[text()="Type defenses"]/parent::div`), which matched exactly once per form on every sampled page.
- None of the 27 metadata XPaths reference `dex-moves`, `dex-sprites`, or a "Type defenses" heading, so removing this scaffolding cannot affect field extraction — consistent with ADR-0012's established precedent that body-`exclude` and metadata XPath extraction are independent in this org.

## Decision

Add two new `exclude` rules, additive to the 32 already in place (ADR-0012's 3 plus ADR-0020's 2):

```json
{"type": "XPATH", "path": "//div[@id=\"dex-moves\"]/following-sibling::*[following-sibling::div[@id=\"dex-locations\"]]"}
{"type": "XPATH", "path": "//h2[text()=\"Type defenses\"]/parent::div"}
```

The first removes everything between the Moves and Locations anchors in one shot — both the Moves-learned section and the Sprites section, heading/nav/tabs/tables included. The second removes the Type-defenses heading, intro sentence, ability tabs, and effectiveness grid together, once per form.

**Known redundancy, left as-is:** these two rules make ADR-0012's `data-table` and `type-table-pokedex` exclude entries redundant for this content, since their targets now sit inside the newly-excluded blocks anyway. Not removing those old rules — `data-table` may still matter if pokemondb adds another data-table elsewhere later, and there's no cost to leaving a now-redundant rule in place.

## Consequences

- Applied to both `docs/pokedex-full_final_config.json` and `docs/pokedex-test_final_config.json` (34 exclude rules each now, 29 metadata fields unchanged in both).
- Requires a full reindex of both `Pokedex - Test` and `Pokedex - Full`, same as ADR-0012/0020.
- Per the same sequencing as ADR-0012/0020, fold the resulting re-embed need into the already-pending off-cycle RGA/SE/CPR rebuild request (2026-08-31) rather than filing a new one.
- Verification must include the same field-regression pass as ADR-0020 (Pikachu plus a control item) before considering this done.
