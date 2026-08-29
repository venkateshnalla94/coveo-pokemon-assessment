# Coveo Pokemon Challenge — Execution Plan v3

## Context

`docs/EXECUTION-PLAN-v2.md` (field expansion + v2.3 frontend) is done — see `docs/HANDOFF.md`'s ninth-session summary. This plan is a third, separate track, opened by a live-usage session: a real sort bug, a PDP that's still missing its two originally-deferred v2.3 items, a search results page that shows far less of the already-indexed/mapped `PokemonItem` data than it has, and RGA/Passage Retrieval output that's noisy because the indexed `body` is very likely the full scraped page rather than curated content.

The RGA/CPR diagnosis in Phase v3.4 is a right-sized version of a plan the user got from ChatGPT (`docs/temp_improvements.md`) — its architecture is correct, but two parts don't fit this project: it assumes a Push-API source (this is a Web crawler — its §5 doesn't apply), and its example of a "cleaned" body is fabricated descriptive prose, which conflicts with this project's no-fabricated-data principle (`CLAUDE.md`/`PRODUCT.md`). Phase v3.4 below keeps the diagnostic sequencing and the prompt-enhancement idea, but replaces "rewrite the body" with "exclude junk from the body via scraping rules" — same mechanism already used for field extraction in `docs/coveo-source-spec.md`.

These four phases are independent — pick any one per session, no required order, except v3.1 is cheap and worth clearing first since it's an active user-facing break.

## Phase v3.1 — Fix the sort break

The results grid currently blanks out entirely if a bad sort criterion is selected — this already happened once with `pokemonname` (see `src/coveo/sortOptions.ts`'s comment block and `docs/HANDOFF.md`'s "What's next" #2), and nothing stops it from happening again with the next field added here.

- [ ] Org config: enable **Sortable** on `pokemonname` in the admin console (Administration Console → Content → Fields → `pokemonname` → Edit → enable Sortable → Save) — coveo-index-architect/user task, not a code fix. **Not yet confirmed done as of the tenth session.**
- [x] Code: re-added `name-asc` to `SORT_OPTIONS` in `src/coveo/sortOptions.ts`, stale comment replaced — see `docs/HANDOFF.md`'s tenth-session section.
- [x] Resilience: `deriveSearchRenderState` now special-cases `InvalidSortValueException` (via a new `INVALID_SORT` `ApplicationErrorCode` in `src/coveo/applicationError.ts`) as a transient `"loading"` state instead of blanking the grid; `SearchSummaryBar.tsx` owns the actual recovery — detects the same error after dispatching a sort, falls back to relevance, and shows a small amber inline notice. Unit-tested; not yet verified live (blocked on the org-config step above).

**Verification:** select every entry in `SORT_OPTIONS` live on `/search`, confirm none 400 and the grid never blanks; if feasible, temporarily point a sort option at a field without "Use for sorting" enabled and confirm the fallback (not the blank-page error) fires.

## Phase v3.2 — PDP: close the two deferred v2.3 items

Both items below were explicitly deferred in the seventh session, per `docs/EXECUTION-PLAN-v2.3-frontend.md` §9 — not new scope, just picking up what was already flagged.

- [ ] **RelatedPokemon / "Similar Creatures" tab.** Add a second, independently-scoped result list on `src/app/pokemon/[name]/page.tsx` — Pokemon sharing type or generation with the current one, excluding itself. Needs its own controller instance with a distinct `facetId`/query scope on the shared engine singleton, same pattern already proven safe by `BrowseByType.tsx`'s explicit `facetId: "browse-by-type"` (kept deliberately separate from `/search`'s `FacetType` on the same engine — verified live in both directions per the seventh-session log). Reuse `ResultList.tsx`'s card rendering rather than building a second card component.
- [ ] **Branching evolution chain.** `pokemonevolvesto` is single-value at the source today (`docs/coveo-source-spec.md`), so Eevee-style branching evolutions only ever show the first branch in document order. Rework the extraction selector to capture every `evolvesto` target as genuine multi-value (same `preceding::`/`[1]` axis care documented in the source spec's "Evolution-chart structure" note — this selector has already broken once from a reversed axis, read that note before touching it again). `PokemonItem.evolution.to` is already typed `string[]` for exactly this case — the frontend consumer (`EvolutionChain` component) needs to render all entries, not just assume 0 or 1.

**Verification:** load a Pokemon with a real branching evolution (Eevee) and confirm every branch renders; load two same-generation Pokemon and confirm RelatedPokemon shows real, distinct, non-self suggestions.

## Phase v3.3 — Search page: surface data that's already indexed and mapped

`PokemonItem` (`src/coveo/mapPokemonResult.ts`) already carries `species`, `height`, `weight`, `abilities`, full `stats`, `training`, `breeding`, `defenses`, and `evolution` — built for the PDP, but the search grid only shows name, dex number, types, and stat total.

- [x] **Cards** (`ResultList.tsx`): generation badge and a short (truncated, comma-joined) abilities preview added.
- [x] **Facets**: Egg Groups, Weaknesses, and Resistances added — superseded shortly after landing by a broader facet-architecture change the same session (`docs/adr/0011-automatic-facet-generation-on-search-page.md`): these three, plus Type and Generation, now come from Coveo's Automatic Facet Generation (`AutomaticFacets.tsx`) rather than individual hand-built `Facet.tsx` wrappers. Growth rate still not picked — it has no facet enabled in the org today (`docs/coveo-source-spec.md`).
- [x] **Sort**: `speed-desc` ("Speed (fastest first)") added to `SORT_OPTIONS`, now that `pokemonspeed` (and the rest of the base-stat fields) are confirmed Sortable.

**Verification:** done live via a scripted Playwright run — all three new facets return real, correctly-counted values (spot-checked against known Pokemon implicitly via count sanity); card additions don't break layout. Full detail in `docs/HANDOFF.md`'s tenth-session section, including a serious pre-existing sort/URL-encoding bug found and fixed while verifying the Speed sort — not a v3.3 regression, but it blocked verifying this phase honestly, so it's fixed here (`SearchUrlSync.tsx`'s `toHeadlessFragment` fix) rather than deferred.

## Phase v3.4 — RGA / Passage Retrieval content cleanup

Both RGA and Passage Retrieval draw from the same indexed `body`, which is very likely the entire scraped pokemondb.net page (nav, footer, move tables, related-Pokemon links) — nothing in `docs/coveo-source-spec.md` currently trims body separately from the field-level XPath extraction rules. That's the probable root cause of both "RGA dumps every stat" and "Passage Retrieval returns random text."

- [ ] **Diagnose before changing anything.** Content Browser → a real item (Charizard or Pikachu) → inspect the actual `body`/`excerpt` value, confirming or correcting the assumption above. Separately, ask RGA a real question ("tell me about Charizard") and use Chunk Inspector to see exactly which chunks it drew from. This distinguishes an indexing-quality problem from a generation-behavior problem — don't skip straight to reconfiguring the source.
- [ ] **RGA prompt instruction** — cheap, no reindex required, worth doing regardless of what step 1 shows. Machine Learning → Models → `Pokedex RGA` → Configuration → Prompt Enhancement: instruct concise, synthesized answers (2-4 sentence overview by default; full stats only when explicitly asked). Coveo's own current docs for Prompt Enhancement should be checked directly when implementing this, not assumed from `docs/temp_improvements.md`'s draft wording.
- [ ] **Content exclusion at the source**, if step 1 confirms body = full page. Add Web Scraping exclusion rules for nav/footer/move-tables/related-Pokemon sections — scoped the same way the existing field extractors already scope to `vitals-table`/`type-table-pokedex` (`docs/coveo-source-spec.md`). This is exclusion of real content, not authored rewriting — keeps the no-fabricated-data principle intact and improves RGA and CPR together, since both chunk the same body.
- [ ] **Reindex both sources**, re-run the same Chunk Inspector query from step 1, confirm the chunks are now on-topic before considering `Items to consider`/chunk-relevancy-threshold tuning (`temp_improvements.md` §11-12 — tune only after content is clean, not instead of cleaning it).

Explicitly **not** doing, flagged rather than silently dropped:
- A dedicated Pokemon-only RGA model/pipeline (`temp_improvements.md` §7) — unnecessary isolation for a single-pipeline app; skip unless this org starts serving more than one experience.
- Push-API body authoring (`temp_improvements.md` §5) — wrong mechanism, this source is a Web crawler.
- The `chunkerConfig: STRUCTURE_AWARE` toggle (`temp_improvements.md` §10) — don't assume this API shape exists; verify directly against Coveo's current CPR model docs before planning around it.

**Verification:** re-run `temp_improvements.md`'s own evaluation queries (general summary, specific stat, comparison, ability, evolution) against both RGA on `/search` and Ask-about-this-Pokemon on the PDP; confirm answers are scoped and concise rather than full-page dumps.

## Decisions carried forward, not yet formalized

- Whether Phase v3.4's content-exclusion work needs its own ADR (a real architectural change to what gets indexed into `body`) — likely yes, given this repo's "new architectural decision gets a new ADR file" rule; write it once the actual exclusion rules are decided, not before.
- Phase v3.2's RelatedPokemon tab reintroduces the "second query source on a single-engine page" problem the seventh session explicitly deferred rather than solved — worth confirming the chosen controller-isolation approach against Headless's actual multi-controller-per-engine guidance before building, not just assuming the `BrowseByType` pattern generalizes cleanly.

## Future item, deliberately not scheduled — Automatic Facet Generation

Raised in the tenth session, kept separate from the four phases above rather than folded into v3.3. Coveo's real feature for this: a per-field **Facet Generator** toggle (Fields page, STRING fields only, requires "Facet"/"Multi-value facet" already enabled) plus Headless's `buildAutomaticFacetGenerator` controller (confirmed present in this project's installed `@coveo/headless`) — the index picks some number of query-relevant facets at query time instead of the app declaring a fixed set. Full findings in that session's chat log; summary:

- Doesn't cover `FacetSpeed` (`pokemonspeed`, Integer/`buildNumericFacet`) — STRING-only.
- The facet *set* varies per query, which conflicts with `/search`'s current fixed-shape sidebar and `SearchUrlSync`'s deep-link/restore logic — adopting this for the whole sidebar is a real architectural change, not a drop-in swap, and works against demo predictability during a live panel walkthrough.
- Good fit as a cheap *discovery pass* before v3.3's facet work: flip Facet Generator on for the STRING candidate fields v3.3 already lists (egg groups, weaknesses/resistances, growth rate), see what the index actually surfaces as query-relevant, then decide which earn a permanent hand-built `Facet*.tsx`. Not started — do this only if/when v3.3 is picked up, not as its own phase.
