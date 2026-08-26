# Coveo source & field-mapping spec

Paste-ready reference for the Coveo admin console once org access arrives. Keep this in sync with whatever is actually configured — this is the contract between the source and `src/coveo/fields.ts`.

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
| `pokemonimageurl` | Artwork/sprite `<img>` `src` (or `og:image`) | Should point at the artwork used in `src/components/ResultList.tsx`'s result card, not a low-res icon |
| `pokemonname` | Pokemon name from the page `<h1>` | Extracted separately from the crawled page `Title` (which reads e.g. "Bulbasaur Pokédex: stats, moves, evolution & locations", not the bare name) — see C2. Consumed by the frontend with a `?? result.title` fallback (`mapPokemonResult.ts`) for the cases (RGA citations, Query Suggest) that bypass this field mapping entirely. |
| `pokemondexnumber` | National dex number from the vitals table `<th>` containing `№` (match via `contains()`, not equality — the character is `&#8470;`) | Also the input to the generation IPE above. |

**Title override (C2):** in addition to the `pokemonname` field mapping above, the source's field mappings must also override the item's `Title` metadata directly (map `%[pokemonname]` to `Title`, not just to `pokemontype`'s sibling `pokemonname` field). Both fixes are required — the field mapping alone doesn't fix result titles shown by surfaces (RGA citations, Query Suggest candidates) that read `Title` and never touch this frontend's field-based mapper.

Field names must match `POKEMON_FIELDS` in `src/coveo/fields.ts` exactly. If a field is renamed here, update that file in the same change. The proposed `pokemonspecies` (genus) field was evaluated and dropped — unused by any current UI surface.

## Validation

After indexing the test source, use the admin console's content browser to confirm extracted values for Pikachu match expectations (type = Electric, generation = I) before switching to the full crawl.

## Status

Not yet created — blocked on Coveo Cloud org access.
