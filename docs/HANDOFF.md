# Session handoff — Coveo org build status

Written 2026-08-26, end of the second org-configuration session (Stage B close-out + Stage C full crawl setup). Read this first in a new chat before touching the Coveo admin console — it has the state and gotchas that aren't obvious from the plan docs alone. The prior session's handoff content is now folded into this one; treat this file as the current snapshot, not an addendum.

## Org details

- Org name: `venkatesh-pokemon-challenge`, Org ID: `venkateshpokemonchallenges0qp5rpy`
- Created **2026-08-25** — 14-day trial deletion clock runs from this date, not from today. Book the presentation by **2026-09-06** (creation + 12 days).
- License: Enterprise, Demo type, expires 2026-11-24. RGA and Passage Retrieval both listed as available extensions.
- Project: `Pokemon Search` (type "Corporate website / blog", point of contact `venkateshnalla94@gmail.com`)
- Two sources now exist:
  - **`Pokedex - Test`** — `resourceId` ending `...ubnz3efi7azirsb2hwpsrhkini`. 3 start URLs (pikachu, garchomp, sprigatito), depth 0. Fast-iteration sandbox — keep it untouched.
  - **`Pokedex - Full`** (or whatever it's named in-console) — `resourceId` ending `...romeudhx44e76uszrvtsyysjeu`. Start URL `/pokedex/national`, depth 1. This is the real crawl.

**Still not done, independent of the build work:** reply to the Phase 0 recruiting/enablement email thread with the Org ID (for RGA/Semantic Encoder/Passage Retrieval enablement); presentation slot not booked. Both are zero-dependency and have now sat untouched across two sessions — do these first in the next session before more console work.

## What's done

**Stage A — test source.** Complete, unchanged from before. 3 start URLs, depth 0, extraction verified clean for all 3 test Pokemon.

**Stage B — fields, mappings, generation IPE. Fully done and verified this session.**

- The `Derive Pokemon Generation` Python extension (org-level resource, `extensionId` ending `...vgoamtj2n3wsduyhdgis4pccsq`) was created, hardened (index-`[0]` instead of `[-1]`, `.strip()` before `int()`), and attached to `Pokedex - Test` at **Post-conversion**, action-on-error **Skip extension**.
- The `%[pokemongeneration]` mapping rule — missing from the original Stage B pass — was added.
- Verified via Content Browser Item JSON: Pikachu = Generation 1, Garchomp = Generation 4, Sprigatito = Generation 9. All 5 custom fields populated correctly for all 3 test Pokemon.

**Stage C — full source. Built and configured this session; rebuild launched, results not yet checked.**

- Created as a genuinely separate source from Test (confirmed via distinct `resourceId`s — see "Traps hit this session" below for why this needed double-checking).
- Start URL `https://pokemondb.net/pokedex/national`, `MaxCrawlDepth: 1`.
- Inclusion: `^https://pokemondb\.net/pokedex/[a-z0-9%.-]+$`, via **"Include non-excluded pages that match at least one rule"** (not the default "include all non-excluded pages" — see traps below for why this matters).
- Exclusion: `^https://pokemondb\.net/pokedex/(national|all|shiny)$|^https://pokemondb\.net/(move|type|ability|item)/.*$` — explicitly names Moves/Types/Abilities/Items per the challenge doc's own wording, not just the 3 pokedex-level list pages.
- `ExpandBeforeFiltering: true` set via raw JSON (see traps below — this is not a UI toggle).
- Full parity with the Test source confirmed by diffing raw JSON: `ScrapingConfiguration` (default + `Pokemon page fields` with all 4 XPath rules), all 6 custom mappings (`pokemonname`×2 into `pokemonname`/`title`, `pokemondexnumber`, `pokemontype`, `pokemonimageurl`, `pokemongeneration`), and the `Derive Pokemon Generation` extension attachment.
- **Build was launched at end of session. Not yet verified.**

## What's next (in priority order)

1. **Check the Stage C build results.** Verify:
   - Item count ≈ 1025
   - No `/move/`, `/type/`, `/ability/`, `/item/`, or `/pokedex/(national|all|shiny)` items leaked in
   - Facets show 18 types and 9 generations, **no compound values** (e.g. no `Fire;Flying`)
   - If count is materially off or crawl exceeds ~90 min: Stage C8 fallback is a Sitemap source with identical filters (~20 min), since scraping config/mappings/extension are all source-type-independent.
2. **Send the two zero-dependency items that have now been idle across two sessions:** the Phase 0 email reply with the Org ID, and booking the presentation slot (deadline 2026-09-06, i.e. in a few days from this handoff's date).
3. **Then Stage D onward** (API key, `.env` config, `Pokedex` pipeline, Query Suggest model + preload, Semantic Encoder, RGA, Passage Retrieval) — none of this started yet. Full detail in `docs/plan101.md`.

## Documentation findings from this session — don't re-derive these

These are things that took real back-and-forth (including web searches against docs.coveo.com) to pin down. Full detail also in `docs/plan101.md` under "Live build findings" and mirrored in `docs/EXECUTION-PLAN.md` Phase 3.

1. **`ExpandBeforeFiltering` is a JSON-only setting, not a UI checkbox.** It doesn't appear anywhere in the Inclusions/Exclusions form. Access it via the source's action bar → **More → Edit configuration with JSON**, then add/edit `configuration.parameters.ExpandBeforeFiltering` as `{"sensitive": false, "value": "true"}`. Documented at [docs.coveo.com/en/mc1f0219](https://docs.coveo.com/en/mc1f0219/) (Web source JSON modification) and the navigation path at [docs.coveo.com/en/1685](https://docs.coveo.com/en/1685/) (Edit a source JSON configuration).
2. **Why `ExpandBeforeFiltering` was needed at all:** the exclusion regex correctly targets `/pokedex/national` (a list page, not a Pokemon) — but that page is also the crawl's own start URL. Coveo's console proactively surfaces a warning ("Excluded starting URL(s) detected") when this happens, because by default the crawler applies exclusion filters *before* expanding a page's outbound links — meaning the start page could get excluded before its links to individual Pokemon pages are ever discovered, yielding a near-empty crawl. Setting `ExpandBeforeFiltering: true` splits "expand this page's links" from "index this page as a result," which is exactly what's needed here.
3. **"Include all non-excluded pages" (the default inclusion mode) is a weaker filter design than an explicit allowlist.** Relying purely on an exclusion blocklist means any site section the blocklist doesn't specifically name (forums, tools, help pages, etc.) would get crawled if linked from the depth-1 start page. Switching to **"Include non-excluded pages that match at least one rule"** plus the `/pokedex/[a-z0-9%.-]+$` regex closes that gap. This is also the stronger, more defensible answer for the Essential tier's filter-design grading criterion — worth a line in the Topic 1 deck.
4. **Mapping `id` fields are auto-generated by Coveo on save — they are not required input.** Confirmed via [docs.coveo.com/en/29](https://docs.coveo.com/en/29/) ("Manage the mapping configuration of a source"), which states: *"A unique alphanumeric id is automatically assigned to each mapping and type."* Its documented request-payload examples omit `id` entirely; only the response includes it. Practical upshot: to replicate a working source's full mapping configuration onto a new source, you can copy the entire `mappings` JSON array wholesale and strip every `id` field — no need to hand-splice individual entries. Verified in practice too: after pasting the Test source's mappings (IDs stripped) into the Full source and saving, re-reading the Full source's JSON showed fresh IDs scoped to the Full source's own `resourceId`.
5. **Always check `resourceId` before trusting a pasted JSON dump.** Two sources' raw JSON can look superficially similar (same field names, same general shape), and mid-session it briefly looked like two pasted JSON blobs might have been the *same* source shown twice rather than two different ones — which would have meant the Test source had been overwritten. Cross-checking `resourceId` immediately confirmed they were genuinely separate. Worth doing this check reflexively whenever comparing two sources' configs, not just when something looks wrong.
6. **The challenge doc's exact wording ("exclude everything else (Moves, Types, etc.)") names only two categories as examples, not an exhaustive list.** Abilities and Items are the same kind of encyclopedia page on pokemondb.net and were added to the exclusion regex on that reasoning, even though not literally named in the challenge text.

## Traps carried over from the previous session (still relevant, unchanged)

1. Element-level selectors index raw HTML, not text — every selector must end in `text()`, `//text()`, or `/@attr`.
2. The `№` (U+2116) character selector worked in the Web Scraper Helper Chrome extension but silently failed in Coveo's real crawl/extraction — matching on plain-ASCII `"National"` fixed it.
3. The vitals table has two rows matching `contains(text(),"№")` ("National №" and "Local №") — needed content-scoping plus positional `[1]` truncation.
4. `fetchpriority="high"` is not unique to the hero artwork image — combined with a `/artwork/` path filter and positional first-match to fix.
5. Unmapped extracted metadata is invisible in Content Browser until a Field exists *and* a source mapping wires it up.
6. Source mappings live under a separate "Mappings" action on the source, not under Configuration.
7. Mapping rules for the same target field are first-match-wins, evaluated top-to-bottom.
8. The Web Scraper Helper extension's UI lives inside Chrome DevTools, under a "Web Scraping" tab.

## Final web scraping config (unchanged, now live on both sources)

```json
{
  "pokemonname": { "type": "XPATH", "path": "//h1/text()" },
  "pokemondexnumber": { "type": "XPATH", "path": "((//table[@class=\"vitals-table\"])[1]//tr[th[contains(text(),\"National\")]]/td[1])[1]//text()" },
  "pokemontype": { "type": "XPATH", "path": "(//table[@class=\"vitals-table\"])[1]//tr[th[contains(.,\"Type\")]]/td//a/text()" },
  "pokemonimageurl": { "type": "XPATH", "path": "(//img[@fetchpriority=\"high\" and contains(@src,\"/artwork/\")])[1]/@src" }
}
```

## Generation IPE (final, hardened, live on both sources)

```python
try:
    boundaries = [151, 251, 386, 493, 649, 721, 809, 905, 1025]
    dex_values = document.get_meta_data_value('pokemondexnumber')
    if dex_values:
        dex_raw = dex_values[0] if isinstance(dex_values, list) else dex_values
        dex_number = int(str(dex_raw).strip())
        generation = next(i + 1 for i, upper in enumerate(boundaries) if dex_number <= upper)
        document.add_meta_data({'pokemongeneration': f'Generation {generation}'})
except Exception:
    pass
```

## Decisions made (carried over + this session's additions)

- **Web source (cloud-hosted crawler), not Push API or Crawling Module.** Unchanged reasoning from before.
- **Web source over Sitemap source**, kept as documented fallback.
- **Facet Generator left unchecked on `pokemontype`.**
- **Two separate sources (Test, Full), not one reused source.** Keeps the fast-iteration sandbox intact independent of what happens to the full crawl.
- **Explicit inclusion allowlist over "include all non-excluded pages."** See documentation findings above.
- **Exclusion list explicitly names Moves/Types/Abilities/Items**, not just the 3 pokedex-level list pages, even though the allowlist regex alone would have implicitly blocked those categories — explicit is a stronger presentation story than "it happened to work out."

## Reference docs

- `docs/plan101.md` — the full step-by-step org build plan with status per step and the live-findings appendix, now updated through end of Stage C setup.
- `docs/EXECUTION-PLAN.md` — the overall assessment plan across all phases (0–6), Phase 3 section kept in sync with plan101.
- `docs/coveo-source-spec.md` — original field/mapping spec (predates the org; field *names* still correct, selectors superseded).
- `docs/final_config.json` — the Full source's complete, saved JSON configuration as of end of session (post-parity-fix, `MaxCrawlDepth: 1` applied). Useful as a reference if the source config ever needs to be reconstructed.
- `docs/temp/` — screenshots from both sessions.
