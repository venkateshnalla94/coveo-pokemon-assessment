# Coveo Cloud org setup — step-by-step

## Context

The trial org invite arrived, unblocking Phase 3 onward of `docs/EXECUTION-PLAN.md`. Phase 2 (all local code changes) is already done and verified, so the app's field names, mapping expectations, and multi-value handling are fixed points — the org must be configured to match them, not the other way around. This plan sequences the admin-console work end to end: test source → fields/mappings/IPE → full crawl → API key/connect → Query Suggest → RGA → (conditionally) Passage Retrieval. It exists so you can review the order and reasoning before touching the console, since several steps have irreversible-ish costs (a bad crawl config means a 35–45 min rebuild) or silent-failure traps documented in the execution plan (C1–C8).

Nothing here writes code — it's console configuration. No files change as a result of this plan itself; it's a checklist to execute by hand in the Coveo admin UI, with the local repo's `docs/coveo-source-spec.md` and `docs/EXECUTION-PLAN.md` updated to mark status as steps complete.

## Day-zero actions (do these first, before any config)

| Step | Action | Why | Status |
|---|---|---|---|
| 1 | Log into the org, record its **creation date** | The trial has a 14-day deletion clock that runs from creation, not from today. If it's already >7 days old, escalate to recruiting the same day — see the 14-day constraint in the execution plan. | ✅ Done — org created 2026-08-25, org ID `venkateshpokemonchallenges0qp5rpy` |
| 2 | Note the **Org ID** | Needed to reply to the Phase 0 email requesting RGA/Semantic Encoder/Passage Retrieval enablement, and for `.env` config later. | ✅ Done |
| 3 | Reply to that email thread with the Org ID | Passage Retrieval enablement has multi-day latency; firing this now overlaps it with everything below instead of serializing it after. | ⏸️ Not yet sent |
| 4 | Book the presentation slot no later than creation date + 12 days (by 2026-09-06) | Leaves a buffer inside the 14-day window for slippage. | ⏸️ Not yet booked |

## Stage A — Test source (iterate fast, no full crawl)

**Status: ✅ Done.** Project `Pokemon Search` and source `Pokedex - Test` (Web, cloud-hosted crawler) created with all 3 start URLs at depth 0, delay 2000ms. Extraction verified clean end-to-end for Pikachu, Garchomp, and Sprigatito via Content Browser — see "Live build findings" below for the real selectors used, which differ from the plan's original guesses.

| Step | Action | Why | Status |
|---|---|---|---|
| A1 | Create a **Web source** named e.g. `Pokedex - Test`, start URLs: `pokemondb.net/pokedex/pikachu`, `.../garchomp`, `.../sprigatito`, crawl depth **0** | Three specific pages, not one: Pikachu is the baseline, Garchomp exposes the multi-form duplicate-type trap, Sprigatito is the Gen-9 boundary case. Depth 0 means it indexes only those exact URLs — rebuilds in seconds instead of minutes, so field-extraction iteration doesn't cost a full crawl each time. | ✅ Done |
| A2 | Write the **web scraping (extraction) configuration** as JSON, scoped per the spec in `docs/coveo-source-spec.md` | Coveo auto-extracts generic metadata by default; the specific fields the app needs (type, dex number, image, name) require explicit extraction rules or they won't exist as queryable fields. | ✅ Done |
| A3 | Scope the type-badge selector to `(//table[@class='vitals-table'])[1]` — parentheses load-bearing | Garchomp's page has 17 `vitals-table` occurrences and 3 dex rows; an unscoped or wrongly-parenthesized XPath returns `Dragon,Ground,Dragon,Ground,Dragon` instead of 2 clean types. `//table[...][1]` (no outer parens) means something different in XPath and won't catch this. | ✅ Done — confirmed exactly 2 types for Garchomp |
| A4 | Match the dex-number `<th>` — originally planned via `contains()` on `№` | **Superseded in practice** — see "Live build findings": the `№` character doesn't survive Coveo's server-side extraction the same way it does in a browser, so the real fix matches on `"National"` (plain ASCII) instead. | ✅ Done (different selector than planned) |
| A5 | Extract Pokemon name from `<h1>`, not the page `<title>` | Crawled titles read like "Bulbasaur Pokédex: stats, moves, evolution & locations" — not usable as a display name or for exact-match lookups on the detail page. | ✅ Done |
| A6 | Extract image from `og:image` — originally planned | **Superseded** — `og:image` doesn't exist on these pages. Real fix uses the artwork `<img>`'s `fetchpriority="high"` attribute combined with a `/artwork/` path filter and a positional first-match, since some Pokemon (Let's Go forms, Mega evolutions) have multiple high-priority artwork images on one page. See "Live build findings". | ✅ Done (different selector than planned) |
| A7 | Rebuild the test source and open **Content Browser** to spot-check | This is the checkpoint before anything is treated as trustworthy — verify by reading raw extracted values, not by assuming the config is right. | ✅ Done — note: unmapped extracted metadata does NOT show in Content Browser until Stage B mapping exists; don't mistake that for extraction failure |
| A8 | **Trap check**: confirm Garchomp shows exactly 2 types (not 5), Sprigatito shows dex 906 | Directly validates A3 and the generation-boundary logic before it's built (Stage B). Catching this here costs a depth-0 rebuild; catching it after the full crawl costs 35–45 minutes. | ✅ Done — Garchomp: 2 types, dex 0445; Sprigatito: dex 0906; Pikachu: dex 0025, all clean |

## Stage B — Fields, mappings, generation IPE

**Status: ✅ Done — all 5 fields populated and verified for all 3 test Pokemon.**

| Step | Action | Why | Status |
|---|---|---|---|
| B1 | Create 5 fields under Content → Fields: `pokemonname`, `pokemondexnumber`, `pokemontype`, `pokemongeneration`, `pokemonimageurl` | These exact names are already load-bearing in `src/coveo/fields.ts` on the frontend. Renaming here without updating that file breaks the app silently (fields just come back empty). | ✅ Done |
| B2 | Configure `pokemontype` specifically as **Multi-value facet**, not plain Facet | Most Pokemon have 1–2 types (e.g. Charizard: Fire + Flying). A plain-Facet misconfiguration still *looks* fine — it renders a compound value like `Fire;Flying` in the sidebar and survives a casual demo — but breaks per-type filtering the moment someone clicks "Fire". This is the single easiest mistake to ship unnoticed (see C3 in the execution plan). | ✅ Done |
| B3 | Create field mappings (`%[pokemonname]` → `pokemonname`, etc.) for all 5 fields | Connects the extraction rules from Stage A to the field schema from B1 — without this the fields exist but stay empty. | ✅ Done (via Source → Mappings, not under Configuration — see note below) |
| B4 | **Also** map `%[pokemonname]` to the item's `Title` metadata, in addition to B3 | RGA citations and Query Suggest candidates read the crawled `Title` directly and never touch this app's field-based mapper — the field mapping alone doesn't fix what those surfaces display. Both the field mapping and the Title override are required (C2). | ✅ Done — required moving the new rule *above* the default `%[title:crawler]` rule; mapping rules for the same field are first-match-wins, not last-match-wins as originally assumed |
| B5 | Write the **generation Indexing Pipeline Extension** (Python), deriving generation from `pokemondexnumber` post-conversion, using boundaries 151/251/386/493/649/721/809/905/1025 | Generation isn't present anywhere on a Pokemon page — it only exists as `<h2 id="gen-N">` headers on the unrelated `/pokedex/national` list page. It must be computed, not extracted. | ✅ Done — extension `Derive Pokemon Generation`, attached at Post-conversion, action-on-error "Skip extension" |
| B6 | Output values as `"Generation 1"` … `"Generation 9"`, single-value | Bare digits (`"1"`) read ambiguously next to dex numbers in a raw-field view; roman numerals (`"I"`–`"IX"`) sort lexicographically wrong in a facet list. | ✅ Done |
| B7 | Wrap the IPE body in try/except | An unhandled exception in an IPE drops the item from the index entirely — a Pokemon silently vanishes from search results rather than just missing its generation facet. | ✅ Done |
| B8 | Attach the IPE to the test source, rebuild, verify all 5 fields populated for all 3 Pokemon in Content Browser | Confirms the full extraction → mapping → IPE pipeline end to end before committing to the 35–45 min full crawl. | ✅ Done — Pikachu = Generation 1, Garchomp = Generation 4, Sprigatito = Generation 9, all verified via Content Browser Item JSON. Required also adding the `%[pokemongeneration]` mapping rule, which had been missed in the original Stage B pass. |

### Live build findings (2026-08-26) — real selectors, not the plan's original guesses

The plan's original A4/A6 selector guesses didn't survive contact with the real page and Coveo's extraction engine. Final working config (Coveo Web Scraping Configuration, `Pokemon page fields`):

```json
{
  "pokemonname": { "type": "XPATH", "path": "//h1/text()" },
  "pokemondexnumber": { "type": "XPATH", "path": "((//table[@class=\"vitals-table\"])[1]//tr[th[contains(text(),\"National\")]]/td[1])[1]//text()" },
  "pokemontype": { "type": "XPATH", "path": "(//table[@class=\"vitals-table\"])[1]//tr[th[contains(.,\"Type\")]]/td//a/text()" },
  "pokemonimageurl": { "type": "XPATH", "path": "(//img[@fetchpriority=\"high\" and contains(@src,\"/artwork/\")])[1]/@src" }
}
```

New traps discovered that the original plan didn't anticipate:
- **Element selectors store raw HTML, not text.** A selector like CSS `h1` or XPath ending at an element (not `text()`/`@attr`) indexes the full `<h1>Garchomp</h1>` markup as the field value, not the string "Garchomp". Every selector needs to end in `/text()`, `//text()` (if the text is nested inside a child tag, e.g. `<td><strong>0445</strong></td>`), or `/@attr`.
- **The `№` (U+2116) character doesn't survive Coveo's server-side extraction the same way it renders in a browser.** A selector using `contains(text(),"№")` worked perfectly in the Web Scraper Helper Chrome extension (which evaluates against the live rendered DOM) but silently returned nothing when the identical selector ran through Coveo's actual crawl/extraction pipeline — repeatedly, across several rebuild cycles. Root cause not confirmed, but matching on the plain-ASCII `"National"` text instead resolved it immediately. **Lesson: don't trust the extension as a perfect proxy for Coveo's production extraction, especially for non-ASCII characters — always verify against a real rebuild before considering a selector done.**
- **The vitals table has two rows whose header contains "№"** — "National №" and "Local №" (a per-game regional dex number list). An unscoped `contains(text(),"№")` match returns both; needs either content-scoping to "National" or positional `[1]` truncation (or both).
- **`fetchpriority="high"` is not unique to the hero artwork image.** The site's header logo, and secondary form artwork (Mega evolutions, Let's Go variants) can also carry it. Needed combining with a `/artwork/` path filter *and* a positional first-match `(...)[1]` to reliably land on just the primary artwork.
- **Unmapped extracted metadata is invisible in Content Browser.** Coveo's Fields view and Item JSON only show formally mapped Fields — raw metadata captured by a Web Scraping Configuration doesn't appear anywhere in the UI until a Field exists and a source mapping wires it up (Stage B). Don't mistake "not visible yet" for "extraction failed" — use the Chrome extension to test extraction in isolation instead.
- **Source mappings live under a separate "Mappings" action on the source, not under its Configuration tab** (Content security/Web scraping/Advanced settings live there; Mappings is a sibling screen with Common/Specific/JSON tabs).
- **Mapping rules for the same target field are first-match-wins, evaluated top-to-bottom** — not last-match-wins. The `title` override needed to be reordered above the default `%[title:crawler]` rule to take effect.

## Stage C — Full source

**Status: build launched — mid-crawl, awaiting results.**

| Step | Action | Why | Status |
|---|---|---|---|
| C1 | Create the full **Web source** (`resourceId` ending `...romeudhx44e76uszrvtsyysjeu`), same scraping config/fields/mappings/IPE as the test source, start URL `pokemondb.net/pokedex/national`, depth 1 | Source-type-independent config carries over unchanged from Stage A/B — this is why the test source used the same JSON, not a simplified one. | ✅ Done — full parity confirmed via JSON diff against the Test source: `ScrapingConfiguration` (default + `Pokemon page fields`), all 6 custom mappings, and the `Derive Pokemon Generation` extension all carried over correctly |
| C2 | Set inclusion pattern `^https://pokemondb\.net/pokedex/[a-z0-9%.-]+$`, selected via "Include non-excluded pages that match at least one rule" (not the default "include all non-excluded") | The trailing `$` with no `/` in the character class is what excludes the ~5,391 `/pokedex/<name>/moves` and similar subpages. Using an explicit allowlist rather than "include all non-excluded" also rules out unrelated site sections the exclusion list doesn't name. | ✅ Done |
| C3 | Set exclusion pattern `^https://pokemondb\.net/pokedex/(national\|all\|shiny)$\|^https://pokemondb\.net/(move\|type\|ability\|item)/.*$`, plus `ExpandBeforeFiltering: true` | Removes the three index/list pages, plus explicitly names Moves/Types/Abilities/Items per the challenge doc's wording. `ExpandBeforeFiltering` is required because the exclusion pattern also matches the crawl's own start URL (`/pokedex/national`) — without it, the crawler may never expand that page to discover the individual Pokemon links. | ✅ Done — confirmed via Coveo docs (`docs.coveo.com/en/mc1f0219`) that this is a JSON-only setting (`configuration.parameters.ExpandBeforeFiltering`), not exposed in the Inclusions/Exclusions UI; set via Source → More → Edit configuration with JSON |
| C4 | Set crawl delay | pokemondb.net's `robots.txt` specifies `Crawl-delay: 2`; `RespectRobotsDotTxt: true` already enforces this regardless of the configured minimum. | ✅ Done (via RespectRobotsDotTxt) |
| C4a | Set `MaxCrawlDepth` to `1` | Matches the documented depth-1 design; the inclusion allowlist is the real gate, but bounding depth explicitly is cheaper and more defensible. | ✅ Done |
| C5 | Rebuild and monitor (~35–45 min expected) | This is the one long-latency step in Stage C — no action needed during the wait, but don't start it near end-of-day if you need to react to a bad result. | 🔄 In progress — build launched |
| C6 | Verify final item count ≈ 1025, no `/moves/`, `/type/`, `/all`, `/shiny` items in the index | Confirms C2/C3 actually excluded what they were meant to at full scale, not just in the 3-page test source. | ⏸️ Pending build completion |
| C7 | Verify facet lists show 18 types and 9 generations with **no compound values** | Final check that B2 (multi-value facet) held at scale — a compound value like `Fire;Flying` appearing here means it needs to be fixed before Stage D, not discovered during a demo. | ⏸️ Pending build completion |
| C8 | Fallback if count is materially off or crawl exceeds ~90 min: switch to a Sitemap source with identical filters (~20 min) | Scraping config, fields, mappings, and the IPE are all source-type-independent, so this swap is cheap if the Web crawler underperforms. | ⏸️ Not needed unless C6/C7 fail |

## Stage D — Connect the app and build ML models

| Step | Action | Why |
|---|---|---|
| D1 | Create a **private API key** with Search–Execute queries, Analytics–Push, ML–Allow content preview | The last privilege is specifically required for Passage Retrieval later (Stage E) and for RGA — request it now rather than re-issuing a key mid-stage. |
| D2 | Set `.env.local` and the Vercel env vars, point `/api/token` at the real org | Wires the already-built `/api/token` route (Phase 2, done) to real credentials instead of the placeholder token it seeds by default. |
| D3 | Create a dedicated `Pokedex` search pipeline | Keeps this app's query pipeline isolated from any org defaults, and gives Stage D's ML models an explicit association target. |
| D4 | Confirm `searchHub` in the app matches the pipeline's associated search hub — check the Network tab | If these mismatch, ML features (Query Suggest, RGA) fail with **no error anywhere** — a silent no-op that's expensive to debug after the fact. The app already exports one `searchHub` constant for exactly this reason (C8); this step confirms it lines up server-side. |
| D5 | Run the configured Playwright e2e suite (`search.spec.ts`) | It was written env-gated specifically to unskip once real org config exists, and validates the C2 (title), C3 (multi-value type), and C6 (generation) fixes against live data in one run — a faster signal than manual clicking. |
| D6 | Create the Query Suggest model, associate to `Pokedex`, enable **Test Configuration Mode** | Test Configuration Mode surfaces suggestions immediately instead of waiting for organic click-through data to accumulate — without it, Query Suggest stays empty for a long time since it only promotes a query after it's been performed *and clicked* at least once. |
| D7 | Preload the model: `PUT /rest/organizations/<ORG>/machinelearning/models/<MODEL>/configs/DEFAULT_QUERIES?languageCode=en`, multipart `configFile`, UTF-8 CSV, no header, `query,weight`, ≤5000 rows — all 1025 Pokemon names at weight 1 plus ~40 curated intent phrases | This CSV upload is the documented, verifiable mechanism the challenge means by "preload a Query Suggest model" — screenshot the 2xx response as evidence for Stage F. |
| D8 | Wait ~30 min for the model build, then verify typeahead manually | Model builds are async; nothing to configure during the wait, just don't assume it's live immediately after D7. |
| D9 | Create the Semantic Encoder model on the same indexed content | Required prerequisite for both RGA (D10) and Passage Retrieval (Stage E) — build it once, reuse for both. |
| D10 | Create the RGA model, associate to `Pipeline: Pokedex` | Completes the Advanced-tier "deploy RGA" requirement. |
| D11 | Tighten CSP `connect-src` in `next.config.ts` to the real org hostnames | Currently permissive for local dev against an unconfigured build; narrowing it is a small security hardening step now that the real endpoint is known. |

**Known limitation to plan around, not fix:** RGA embeds only the `body` field in 250-word chunks, and pokemondb pages are heavily tabular (stat tables, not prose). Demo RGA on prose questions (evolution chains, Pokedex flavor text) rather than stat lookups — the app already fails soft if RGA has nothing useful to say, but discovering the limitation live during the panel reads worse than naming it proactively in the deck.

## Stage E — Passage Retrieval (conditional on enablement)

| Step | Action | Why |
|---|---|---|
| E1 | If the Day-zero email (RGA/Semantic Encoder/CPR enablement) has landed: create the CPR model on the same pipeline | Passage Retrieval is a separate enablement (paid extension) from RGA — confirm it actually came through before building on top of it. |
| E2 | Point the already-built `/api/passages` route at `POST /rest/search/v3/passages/retrieve` | The route, rate limiting, and 500-char input cap were already built in Phase 2 — this step is just supplying the real endpoint. |
| E3 | Build/verify the "Ask about this Pokemon" UI showing top-3 passages with relevance scores | Fulfills the Bonus tier's "build something interesting on top of" bar. |
| E4 | Write the point-of-view doc: where passage retrieval beats whole-document RGA in enterprise settings | The Bonus tier's stated floor is "understand the API and have a point of view" — this is required regardless of whether E1–E3 ship. |
| E5 | **If enablement never lands**, screenshot the 403 from a real call attempt as evidence of having built it | Satisfies the stated minimum bar without blocking on external enablement latency — don't let this stage hold up Stage F. |

## Stage F — Capture before the org can die

| Step | Action | Why |
|---|---|---|
| F1 | Record a 5–8 min demo of the full flow, commit to the repo | The org is on a 14-day deletion clock; a recorded demo is what makes the presentation survive the org disappearing before or during it. |
| F2 | Screenshot: source config, URL filters, scraping config, fields, mappings, IPE code + log, Content Browser (Pikachu + Garchomp), QS model, the D7 2xx response, RGA model, pipeline associations, CPR model | Each screenshot is evidence for a specific claim made in the Topic 1 technical deep-dive — collect them as each stage completes rather than reconstructing after the org is gone. |
| F3 | Export and commit: scraping config JSON, IPE Python source, `DEFAULT_QUERIES` CSV, the mapping table | Same rationale as F2 — these are the actual artifacts referenced in the deck, not descriptions of them. |
| F4 | Update `docs/coveo-source-spec.md` status line and `docs/EXECUTION-PLAN.md` phase checkboxes as each stage above completes | Keeps the plan-of-record accurate; both files are referenced directly in the presentation prep. |

## Ongoing, from Stage A onward

- Log in and run at least one query **every day** — trial orgs go idle without query activity, independent of the 14-day deletion clock.
- Verify facet and field correctness **separately** at every checkpoint (admin console facet list vs. `raw.pokemontype` in the browser Network tab) — a broken field can hide behind a working-looking facet and vice versa (C3).

## Top risks carried into this stage

| Risk | Mitigation |
|---|---|
| `pokemontype` configured as plain Facet instead of Multi-value | Caught at B2/C7 — inspect the facet value list before moving past Stage C. |
| Garchomp duplicate-type trap ships unnoticed | Caught at A8 — asserted in the 3-page test source before the full crawl. |
| `searchHub` ≠ pipeline's search hub | Silent no-op with no error anywhere — checked explicitly at D4. |
| QS model stays empty | D6 (Test Configuration Mode) plus the app's non-ML fallback layers (`buildFieldSuggestions`, `buildRecentQueriesList`) already in place from Phase 2. |
| RGA not enabled on the trial, or Passage Retrieval enablement doesn't land in time | `GeneratedAnswer` already fails soft (Phase 2); Stage E5 has an explicit no-enablement fallback. |
| Full crawl overshoots time or item count | C8 — Sitemap-source fallback, ~20 min, same config. |

## Verification checklist (end state)

- `npm run lint`, `npm run typecheck`, `npm run test:coverage` still green (unaffected by org work, but re-run after any code touch)
- `npx playwright test` green in both worlds — unconfigured suite without `.env.local`, `search.spec.ts` now unskipped and passing against the real org (D5)
- Full source doc count ≈ 1025, zero `/moves/`, `/type/`, `/all`, `/shiny` items (C6)
- Facets show 18 types / 9 generations, no compound values (C7)
- Deployed Vercel URL returns real results with both facets, typeahead, and an RGA answer
