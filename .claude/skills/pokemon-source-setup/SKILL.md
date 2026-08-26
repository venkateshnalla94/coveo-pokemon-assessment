---
name: pokemon-source-setup
description: Checklist for creating and validating the Coveo Cloud source that crawls pokemondb.net Pokemon pages. Use when setting up or debugging the crawler/source in the Coveo admin console.
---

# Pokemon source setup

Reference checklist for the Essential-tier indexing requirement. Keep `docs/coveo-source-spec.md` updated as the source of truth — this skill describes the process to get there.

## Steps

1. **Test source first.** Create a Web source pointed at a single pokedex page (e.g. `https://pokemondb.net/pokedex/pikachu`) before crawling the whole site. Iterate field extraction against this one page.
2. **Inclusion pattern.** Once the test source works, scope the real crawl to `pokemondb.net/pokedex/*` only.
3. **Exclusion patterns.** Explicitly exclude `/move/*`, `/type/*`, `/ability/*`, `/item/*`, and any other non-Pokedex path — these are real pages on the same domain and will get swept in by a naive crawl.
4. **Web Scraping Configuration.** Default Coveo extraction gives you the page body as free text; it will not automatically know "this text is the Type" or "this image is the artwork." Add explicit extraction rules (CSS selector based) for:
   - Pokemon Type(s) → a multi-value field (a Pokemon can have two types)
   - Pokemon Generation → a field usable as a facet value
   - Artwork/thumbnail image URL → a field the result template can render as `<img>`
5. **Field naming.** Pick field names once and record them in `docs/coveo-source-spec.md`. The Next.js app's facet and result components must reference these exact names — treat a rename as a breaking change across both the source config and `src/coveo/`.
6. **Validate.** After indexing the test source, use the admin console's content browser to confirm the extracted field values are correct for that one page before scaling up to the full crawl.
7. **Full crawl.** Only after step 6 passes, switch the source to the full `/pokedex/*` inclusion pattern and re-run.

## Common pitfalls

- Forgetting multi-value Type fields (e.g. Charizard: Fire + Flying) and only capturing the first type.
- Crawling `/pokedex/national` (the index/list page) as if it were a Pokemon detail page.
- Image field pointing at a low-res icon instead of the artwork used in the result card.
