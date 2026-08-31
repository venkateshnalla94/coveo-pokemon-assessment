# Coveo Pokemon Challenge — Execution Plan

## Context

This repo is a take-home assessment for a Coveo Forward Deployed Engineer role. The requirements come from two documents in `docs/`, both read via markitdown for this plan:

- `Pokemon Challenge (Pre-Sales) - 2026.txt` — the four requirement tiers (Essential, Intermediate, Advanced, Bonus)
- `Technical_Challenge_-_FDE.pdf` — panel logistics and the two presentation topics

**The two documents disagree on Topic 2.** The .txt says "identify an enterprise customer who could benefit from a similar Coveo solution." The PDF says "Escalation & Recovery: a large customer's search platform is intermittently failing under peak traffic." Per your decision, both get prepared.

Current state: a substantial Next.js 16 + React 19 + `@coveo/headless` v3 frontend already exists (facets, result grid, detail page, generated-answer scaffold) but has **never been committed** — zero commits, no remote. Nothing exists on the Coveo cloud side because the trial org invite has not arrived. Three research agents audited the code, the Coveo docs, and pokemondb.net; a fourth adjudicated their conflicts.

**Confirmed decisions:** scope is everything including Bonus; target ~2 weeks from 2026-08-26; wait for the invite with a 48-hour escalation; email Coveo for RGA/Passage Retrieval enablement today and send the Org ID later.

Written 2026-08-26. This file is the working checklist for the whole assessment.

**Status as of 2026-08-30 (Vercel deploy, following the eighteenth session):** Phase 1's doc/CI fixes and all of Phase 2 are done — GitHub hosting is also actually done now (the repo is pushed and current; the "deliberately parked" framing below is stale, kept only for history). **Vercel deploy is also done** — live at https://coveo-pokemon-assessment.vercel.app/, see `docs/HANDOFF.md`'s "Vercel deploy" section. Phase 1 is now fully closed; only the two presentation decks (Phase 6/Advanced tier, tracked separately) and Phase 0's email/booking remain open project-wide. Phase 3 is complete (Stage A/B/C). Phase 4 is complete, including step 10 (CSP tightening) — API keys, pipeline, auth wiring, Query Suggest, Semantic Encoder, RGA, and the CSP hardening pass (plus two bugs the CSP change itself surfaced: dev-mode `unsafe-eval`, a Strict-Mode console error) are all done and verified live. Phase 5 (Passage Retrieval) is now **fully done, including the point-of-view writeup** (`docs/passage-retrieval-pov.md`) — see the Phase 5 section below and `docs/adr/0008-passage-retrieval-needs-execute-query-not-content-preview.md`. The fifth session also fixed a genuinely broken CI pipeline (`npm ci` was failing on GitHub Actions) and widened unit-test coverage from `src/coveo/*` to also cover `src/app/api/*/route.ts` — neither was part of this plan's original phases, both are done. Phase 0's email reply and presentation-slot booking are still not sent — explicitly deferred by user decision to the weekend or early next week, deadline 2026-09-06, now five sessions idle.

---

## Findings that change the build

Four defects and one architectural conflict were found. Each is fixed in Phase 2.

**Generation is not on the Pokemon page.** It appears only on `/pokedex/national` as `<h2 id="gen-N">` headers. The moves-tab proxy was tested and disproved: Sprigatito (Gen 9) has zero generation tabs. Generation must be derived from the national dex number by an Indexing Pipeline Extension. Boundaries: 151, 251, 386, 493, 649, 721, 809, 905, 1025.

**Multi-value types are silently dropped.** `asString()` in [mapPokemonResult.ts:27-29](src/coveo/mapPokemonResult.ts#L27-L29) returns `undefined` for anything that is not a string. A multi-value `pokemontype` arrives as an array or a semicolon-joined string, so the type line vanishes from every card and the detail page. The facet can look perfect while the result field is broken, and the reverse is also possible: a field configured as plain "Facet" instead of "Multi-value facet" produces compound sidebar entries like `Fire;Flying`, which still renders and survives a casual demo until a panelist clicks "Fire".

**Crawled titles are not Pokemon names.** Pages title as `Bulbasaur Pokédex: stats, moves, evolution & locations`. [ResultList.tsx](src/components/ResultList.tsx) uses `result.title` as the display name, and [pokemon/[name]/page.tsx](src/app/pokemon/[name]/page.tsx) requires an exact case-insensitive match against it, so the detail page would always miss.

**Analytics is disabled.** `analytics: {enabled: false}` at [engine.ts:34-36](src/coveo/engine.ts#L34-L36) is the single line that makes the entire Advanced tier impossible. Query Suggest only promotes a query to a candidate if it was performed *and clicked at least once*.

**ADR-0004 (no server layer) is superseded.** It predicted its own trigger: "server-only Passage Retrieval calls would require a Route Handler." Original reasoning (Passage Retrieval needs the *Machine Learning – Allow content preview* privilege) was later found wrong by direct testing — it actually needs `EXECUTE_QUERY`, the same privilege already exposed client-side via `NEXT_PUBLIC_COVEO_ACCESS_TOKEN` in this app's `direct` auth mode — see ADR-0008. The Route Handler stays regardless (rate limiting and the 500-char input cap are real, privilege-independent reasons to keep it server-side), but the *specific* justification in this line is stale; don't cite "content-preview privilege unsafe in browser" as the reason anymore.

---

## Adjudicated rulings

| # | Conflict | Ruling |
|---|---|---|
| C1 | Field naming: existing `pokemon*` vs proposed `pkm*` | **Keep `pokemon*`.** Already load-bearing in `fields.ts`, `docs/coveo-source-spec.md`, and the `pokemon-source-setup` skill. Add `pokemonname` and `pokemondexnumber`. Drop the proposed `pokemonspecies` (unused genus). |
| C2 | Result title | **Both fixes.** Extract `pokemonname` from `h1`, consume with `?? result.title` fallback; *also* override item Title via mapping, because RGA citations and Query Suggest candidates escape the frontend. No title-cleaning IPE. |
| C3 | Multi-value type | `PokemonItem.type: string \| undefined` → `types: string[]`, never undefined. New `toStringArray` handling array, semicolon-joined string, single string, and garbage. Verify facet and field **separately** — they fail independently. |
| C4 | ADR-0004 vs Passage Retrieval | **Supersede with ADR-0005; leave 0004's text intact.** An ADR that correctly predicted its own supersession is a better Topic 1 artifact than one silently rewritten. |
| C5 | Sitemap source vs Web source | **Web source**, start `/pokedex/national`, depth 1. The Essential tier is literally worded "include only the actual Pokemon pages *in the crawler*" — filter design is the graded skill. Sitemap kept as a documented, evaluated-and-rejected alternative and a 20-minute fallback. |
| C6 | Generation via IPE | **Confirmed.** Dex number from the vitals table, generation derived post-conversion. Facet values `"Generation 1"…"Generation 9"` (roman numerals sort wrong; bare digits are ambiguous next to dex numbers). |
| C7 | E2E tests invert once configured | **Env-gated split**, delete nothing. The unconfigured degraded mode is real shipped behavior that forks and preview builds hit. |
| C8 | Engine config | Analytics **on**, `analyticsMode: "next"`, one exported `searchHub` constant used by client *and* token route, dedicated `Pokedex` pipeline. |

**The scraping selectors have three verified traps.** `/pokedex/garchomp` has 17 `vitals-table` occurrences and 3 dex rows, so a naive selector returns `Dragon,Ground,Dragon,Ground,Dragon`; scope with the parenthesised `(//table[@class='vitals-table'])[1]` (the parentheses are load-bearing, `//table[...][1]` means something different). A bare `.type-icon` selector also picks up the 18-entry type-effectiveness chart at the page bottom. The dex `<th>` uses `№` (`&#8470;`), so match with `contains()`, not equality.

---

## Phase 0 — Fire the long-latency external requests (today, ~60 min, unblocked)

Highest value per minute in the plan. Every item has multi-day latency that nothing downstream can compress.

1. Email recruiting: chase the invite, state the build is written and waiting, **ask for the org's creation date**, request a 30-day org or renewal commitment.
2. Request the presentation slot for ~2026-09-09 to 09-11.
3. Email Coveo requesting **RGA + Semantic Encoder + Passage Retrieval (CPR)** enablement. State you will reply with the Org ID within 24h of the invite.
4. Calendar reminder to escalate step 1 at the 48-hour mark.

**Exit:** all three emails sent, escalation reminder set.

## Phase 1 — Repo truth and GitHub hosting (unblocked, 2–3h)

The Intermediate tier is 0% done and is pure downside risk sitting there.

| Step | Where | Verify | Status |
|---|---|---|---|
| Remove stale "no application code exists yet" claim | `CLAUDE.md` | grep returns nothing | ✅ Done |
| Remove the false axe accessibility claim (no axe dependency exists) | `PRODUCT.md` | `grep axe` → 0 hits | ✅ Done |
| Add missing `typecheck` and `test:e2e` scripts (CI calls `npx` directly today) | `package.json` | `npm run typecheck` passes | ✅ Done — CI (`ci.yml`) also switched from raw `npx` calls to the new scripts |
| Initial commit, create GitHub repo, push `main` | `gh repo create` | CI green | ⏸️ Parked — awaiting explicit go-ahead |
| Connect Vercel, deploy the unconfigured build | Vercel | Public URL loads, shows config banner | ⏸️ Parked — blocked on the commit/push step above |

**Exit:** public GitHub URL, public Vercel URL, green CI, no false statements in docs. Intermediate tier complete and unlosable. **Not yet reached** — repo still has zero commits; the two hosting steps need a go-ahead before they run.

## Phase 2 — All code changes that need no org (unblocked, 6–8h)

This is the bulk of the engineering. Doing it during the wait converts the invite delay into zero cost.

| Step | Files | Status |
|---|---|---|
| C1: add `name`, `dexNumber` to the field map | `src/coveo/fields.ts` | ✅ Done |
| C3: `toStringArray`, `types: string[]`, name fallback | `src/coveo/mapPokemonResult.ts` + 6 new unit tests | ✅ Done |
| C3: one colored chip per type | `ResultList.tsx`, `pokemon/[name]/page.tsx` | ✅ Done |
| C2: detail page uses `aq: '@pokemonname=="X"'`, drop the free-text `.find()` | `pokemon/[name]/page.tsx` | ✅ Done — `.find()` kept as a documented safety net, `aq` is now the primary filter |
| C8: searchHub/pipeline constants, analytics on, `renewAccessToken` | `engine.ts`, new `searchConfig.ts` | ✅ Done |
| C8: `buildInteractiveResult` per card, `buildInteractiveCitation` per citation | `ResultList.tsx`, `GeneratedAnswer.tsx` | ✅ Done — citation rendering added to `GeneratedAnswer.tsx` (didn't exist before) |
| C4: `/api/token` route, server/client env split | `src/app/api/token/route.ts`, `config.ts`, `.env.example` | ✅ Done — new `COVEO_API_KEY` server-only var; client engine seeds an invalid placeholder token and renews via the route on first 401 |
| C4: `/api/passages` route, rate-limited, input capped | `src/app/api/passages/route.ts` | ✅ Done — in-memory per-IP token bucket, 500-char cap; noted as single-instance-only |
| C4: ADR-0005; mark ADR-0004 superseded | `docs/adr/` | ✅ Done — ADR-0004 body untouched, one-line superseded note added |
| C7: split e2e into fixture + `unconfigured.spec.ts` + `search.spec.ts` | `tests/e2e/` | ✅ Done — `search.spec.ts` env-gated, skips until Phase 4 env vars exist |
| Render `<SearchBox />` on `/search`, delete that page's duplicate controller | `search/page.tsx`, `SearchBox.tsx` | ✅ Done — `SearchBox` gained an `initialQuery` prop |
| Update the source spec with final fields, regexes, selectors | `docs/coveo-source-spec.md` | ✅ Done |

Also draft, in parallel, both Topic 2 variants and the Passage Retrieval point of view. None of that needs the org. **Not yet started.**

**Exit:** CI green, unconfigured e2e green, configured e2e skipped. **When the invite lands you are ≤4 hours of console work from a working demo.**

**Reached, independently verified 2026-08-26:** `npm run lint`, `npm run typecheck`, `npm run test:coverage` (33/33 tests, all files ≥80%), and `npx playwright test` (5 passed / 3 skipped) all green.

## Phase 3 — Org setup (in progress; started 2026-08-26)

**First action on login: record the org's creation date and count 14 days from it, not from today.** If the org is already >7 days old, escalate to recruiting the same day.

**Org received 2026-08-25.** Org ID `venkateshpokemonchallenges0qp5rpy`. Enterprise/Demo license, RGA + Passage Retrieval extensions both listed. Presentation slot not yet booked — target by 2026-09-06 (creation date + 12 days).

1. Reply to the Phase 0.3 thread with the Org ID. — ⏸️ Not yet sent.
2. Create the **test source**: Web, start URLs `pikachu` + `garchomp` + `sprigatito`, **depth 0**. Three URLs, not one: they cover single-form, the multi-form duplicate trap, and the Gen-9 boundary. Rebuilds in seconds. — ✅ Done (source `Pokedex - Test`, project `Pokemon Search`, delay 2000ms).
3. Write the scraping config JSON: index-scoped `(//table[...])[1]`, name from `h1`. — ✅ Done, but **not** as originally planned — `№` via `contains()` and image via `og:image` both failed for reasons unrelated to selector logic (see below); real selectors are in `docs/plan101.md`'s "Live build findings" section.
4. **Trap check** via Content Browser: Garchomp shows exactly 2 types (not 5); Sprigatito shows dex 906. — ✅ Done, confirmed clean across all 3 test Pokemon.
5. Create the 5 fields (Content → Fields). `pokemontype` **must** be Multi-value facet. — ✅ Done.
6. Create mappings (`%[pokemonname]` etc.), **including the Title override**. — ✅ Done. Mappings live under a separate source "Mappings" action, not the Configuration tab. The Title override rule had to be placed *above* the default `%[title:crawler]` rule — same-field mapping rules are first-match-wins, not last-match-wins as assumed.
7. Write and attach the generation IPE, **post-conversion**. Wrap the whole body in try/except or a failure drops the item from the index entirely. — ✅ Done.
8. Rebuild the test source; verify all 5 fields on all 3 Pokemon in Content Browser. — ✅ Done — Pikachu = Generation 1, Garchomp = Generation 4, Sprigatito = Generation 9. Needed the `%[pokemongeneration]` mapping rule added, which Stage B's original pass had missed.
9. Create the **full source** (separate `resourceId`, not a reuse of the Test source), same config, start `/pokedex/national`, depth 1, inclusion `^https://pokemondb\.net/pokedex/[a-z0-9%.-]+$` (via "Include non-excluded pages that match at least one rule", not the default "include all non-excluded pages"), exclusion `^https://pokemondb\.net/pokedex/(national|all|shiny)$|^https://pokemondb\.net/(move|type|ability|item)/.*$`, `ExpandBeforeFiltering: true`, `MaxCrawlDepth: 1`. — ✅ Done. Full parity with the Test source (scraping config, all 6 mappings, the generation extension) confirmed by diffing the two sources' raw JSON via Source → More → Edit configuration with JSON.
10. Rebuild and monitor. Expect ~35–45 min. — ✅ Done — verified via Content Browser: exactly 1025 items in `Pokedex - Full`, zero results for `/move`, `/type`, `/ability`, `/item`, `/pokedex/national`, `/all`, `/shiny`; facets show exactly 18 `pokemontype` and 9 `pokemongeneration` values, no compound values. **Stage C / Phase 3's indexing work is complete.**

The inclusion regex's trailing `$` with no `/` in the character class is what excludes 5,391 `/moves/<gen>` subpages. That detail is worth 90 seconds in the Topic 1 deck.

**Exit:** ~1025 items; all 5 fields populated; facet lists show 18 types and 9 generations with **no compound values**. If the count is materially off or the crawl exceeds 90 min, swap to a Sitemap source with identical filters (~20 min, since scraping config, fields, mappings, and IPE are all source-type-independent).

**Findings from the live build, not anticipated in the original plan (full detail in `docs/plan101.md`):**
- Selectors must end in `text()`/`@attr` — an element-level selector (CSS `h1`, or an XPath stopping at the element) indexes raw HTML tags as the field value, not the visible text.
- The `№` character selector worked in the Web Scraper Helper Chrome extension but silently failed in Coveo's actual crawl/extraction repeatedly — matching on plain-ASCII `"National"` instead resolved it. Extension results are not a perfect proxy for production extraction, especially for non-ASCII characters.
- `og:image` doesn't exist on these pages; the real artwork selector uses `fetchpriority="high"` combined with a `/artwork/` path filter and a positional first-match, since some Pokemon pages carry multiple `fetchpriority="high"` images (header logo, Mega/regional-form art).
- Unmapped extracted metadata is invisible in Content Browser (Fields view and Item JSON) until a Field + mapping exist — don't mistake that for extraction failure.
- **Excluding a crawl's own start URL requires `ExpandBeforeFiltering: true`.** `/pokedex/national` needed excluding (it's the crawl entry point but not itself a Pokemon page), which triggered a console warning ("Excluded starting URL(s) detected") — without this flag the crawler may filter the page before ever expanding its links, yielding a near-empty index. This setting is JSON-only (`configuration.parameters.ExpandBeforeFiltering`), not exposed anywhere in the Inclusions/Exclusions UI. Access via source → **More → Edit configuration with JSON** ([docs.coveo.com/en/1685](https://docs.coveo.com/en/1685/)); the setting itself is documented at [docs.coveo.com/en/mc1f0219](https://docs.coveo.com/en/mc1f0219/).
- **"Include all non-excluded pages" (the default) is a weaker filter design than an explicit inclusion allowlist.** With only an exclusion blocklist, any site section the blocklist doesn't name (forums, tools pages, help pages, etc.) would be crawled if linked from the depth-1 start page. Switching to "Include non-excluded pages that match at least one rule" plus the `/pokedex/[a-z0-9%.-]+$` regex closes that gap and is also the stronger story for the Essential-tier filter-design grading criterion.
- **Mapping `id` fields are auto-generated by Coveo on save, not required input.** Confirmed via [docs.coveo.com/en/29](https://docs.coveo.com/en/29/): "A unique alphanumeric id is automatically assigned to each mapping and type." This meant the Test source's entire `mappings` array (53 entries) could be copied wholesale into the Full source's JSON with all `id` fields stripped, rather than hand-splicing 6 new entries — Coveo assigned fresh IDs scoped to the Full source's own `resourceId` on save, verified by re-reading the JSON afterward.
- **Two sources can look confusingly similar in raw JSON.** Always check `resourceId` before trusting what a JSON dump shows — an early exchange this session nearly proceeded on the assumption two pasted JSON blobs were different sources when they were briefly the same one; cross-checking `resourceId` caught it immediately when it mattered.

## Phase 4 — Connect and ML (unblocked; in progress since 2026-08-26)

1. Create a private API key: Search–Execute queries, Analytics–Push, ML–Allow content preview. — **Revised, see ADR-0006:** this org's console can no longer issue a single Custom key with all three — Execute queries/Analytics-Push are now template-locked. — ✅ Done as **two** keys instead: `COVEO_API_KEY` (Anonymous search purpose) and `COVEO_ML_API_KEY` (Custom, ML - Allow content preview only, named `Pokedex - Content Preview`).
2. Set `.env.local` and Vercel env vars; point `/api/token` at the real org. — **Revised, see ADR-0007:** `/api/token`'s minting call 403s unconditionally on this org — root-caused via Coveo's privilege-introspection endpoint to the Anonymous search key's `Impersonate` privilege being scoped to the wrong owner (`USAGE_ANALYTICS` instead of the `SEARCH_API` owner minting requires). — ✅ Done differently: `.env.local` set for a new **dual auth-mode** design (`NEXT_PUBLIC_COVEO_AUTH_MODE=direct`, using `NEXT_PUBLIC_COVEO_ACCESS_TOKEN` as a static client-side credential — what an Anonymous-search key is designed for). `/api/token`'s "server" mode is fully built and switchable via one env var, but unverified until a key with the right privilege is obtainable. Vercel env vars still pending (deploy stage).
3. Create the `Pokedex` pipeline; confirm `searchHub` alignment in the Network tab. — ✅ Done, plus an unplanned addition: a `filter cq @source==("Pokedex - Full")` rule, since `Pokedex - Test` and `Pokedex - Full` are both live sources and nothing was scoping the pipeline to just one — verified via pipeline → More → Open in Content Browser (2 results per query before the filter, 1 after).
4. **Run the configured e2e suite** — it un-skips and validates C2, C3, and C6 in one shot. — ✅ Done, 3/3 passing against live data — but only after finding and fixing two real app bugs along the way (not org-config issues):
   - `resolveCoveoConfig()`'s `environment = process.env` default parameter defeated Next.js's build-time `NEXT_PUBLIC_*` inlining for the client bundle (that indirection isn't a literal `process.env.X` expression, which is all webpack's `DefinePlugin` can see), so `isCoveoConfigured()` always returned false in production regardless of `.env.local`. Fixed in `src/coveo/config.ts` by writing the literal expression into the default value instead.
   - `src/coveo/engine.ts` never called Headless's `registerFieldsToInclude`, so every result's `raw` object only carried Coveo's default field set — every Pokemon's image, type chip, and generation rendered as missing on both `/search` and the PDP, even though the sidebar facets (a separate, server-computed aggregation) showed correct counts the whole time. This one had real user-facing impact: the Essential tier's "display each Pokemon's picture" requirement was not actually being met until this fix, despite the source/mapping/IPE work all being correct. Fixed by dispatching `loadFieldActions(engine).registerFieldsToInclude(...)` once at engine construction.
5. Create the QS model, associate to the pipeline, **enable Test Configuration Mode**. — ✅ Done, fourth session. Model `Pokedex Query Suggestions`, Test Configuration Mode enabled (the "sandbox organizations only" caveat didn't block this org), associated to `Pokedex` with no extra condition.
6. Preload it. `PUT /rest/organizations/<ORG>/machinelearning/models/<MODEL>/configs/DEFAULT_QUERIES?languageCode=en`, multipart, form field `configFile`, UTF-8 CSV with no header, `query,weight`, max 5000 rows. Use 1025 names at weight 1 plus ~40 curated intent phrases. **Screenshot the 2xx.** This file is the documented mechanism the challenge means by "preload a Query Suggest model." — ✅ Done. Uploaded via the Machine Learning API's own Swagger UI, authenticated with the admin account's own session — no API key needed. CSV built from a live Search API query (1025 unique names, not hand-typed) plus 45 curated intent phrases, 1070 rows total. `200` response, screenshot at `docs/temp/stage-d/d7-default-queries-200-response.png`, CSV committed at `docs/DEFAULT_QUERIES.csv`.
7. Wait ~30 min for the build, then verify typeahead. — ✅ Done, verified live in `npm run dev`.
8. Create the Semantic Encoder model on the same content. — ✅ Done. Model `Pokedex Semantic Encoder`, scoped to `Pokedex - Full` only, associated to the pipeline.
9. Create the RGA model and associate it to the pipeline. — ✅ Done. Model `Pokedex RGA` — the "paid product extension" licensing language did **not** block this org (card was available, model built successfully). Associated with the required `Query is not empty` condition. Verified live: "how does Eevee evolve" produced a correct, well-cited generated answer.
10. Tighten CSP `connect-src` to the real org hostnames in `next.config.ts`. — ✅ Done. Derives `https://<orgId>.org.coveo.com` and `https://<orgId>.analytics.org.coveo.com` from `NEXT_PUBLIC_COVEO_ORGANIZATION_ID`, confirmed against `@coveo/headless`'s own endpoint-resolution code; falls back to the old wildcard when unconfigured. `docs/inspiration-from-coveo-assesment.md` item 3's two extra directives (`base-uri 'self'`, `form-action 'self'`) done in the same pass, plus a drop of the unused Coveo wildcard from `img-src`. Verified via `curl -I` and the full configured e2e suite passing under the tightened policy.

**RGA reality check:** it embeds only the `body` field, chunked at 250 words, and pokemondb pages are heavily tabular. Demo it on prose questions (evolution chains, Pokedex flavor text), not stat lookups. Naming that limitation in the deck reads as expertise; getting caught by it on stage reads as the opposite.

**New findings this session, full detail in ADR-0006/0007 and `docs/plan101.md`'s Stage D table:**
- A Coveo Custom-purpose API key can no longer be granted Execute queries or Analytics-Push in this org's console — confirmed directly by inspecting the Custom wizard's Privileges step, not inferred from generic docs. Those privileges are now locked to predefined key-purpose templates (e.g. "Anonymous search"). Treat this as true for this org/console build as of 2026-08-26, not necessarily a durable platform fact.
- Minting a search token via `POST /rest/search/token` requires `Impersonate` under owner `SEARCH_API` specifically — confirmed via Coveo's own privilege-introspection endpoint (`POST /rest/organizations/<org>/privileges/token?accessToken=<key>`, docs.coveo.com/en/109) and a documented example payload. No key obtainable from this console's templates or Custom purpose carries that exact privilege, which is why the server-minted-token architecture (ADR-0005) can't currently run, and why the app now defaults to a direct, client-exposed API key instead (ADR-0007) — which is in fact what Coveo's own docs say an "Anonymous search" key is designed for.

## Phase 5 — Passage Retrieval bonus (turned out NOT blocked on Phase 0.3 enablement — see below; fourth session)

**This phase's "blocked on enablement" framing was wrong — see `docs/adr/0008-passage-retrieval-needs-execute-query-not-content-preview.md`.** Testing the live endpoint directly (not assuming from docs) found `POST /rest/search/v3/passages/retrieve` gates on the ordinary `EXECUTE_QUERY` privilege, not a separate CPR license check. The 403s that motivated this phase's "blocked" assumption were actually `/api/passages` authenticating with the wrong key (`COVEO_ML_API_KEY`, content-preview-only, per the original Phase 2 design) — fixing the route to use `COVEO_API_KEY` instead resolved it, no enablement email needed.

- CPR model — ✅ Done. `Pokedex Passage Retrieval`, "Learn from" `Pokedex - Full` (same content as the Semantic Encoder — CPR requires this), associated to the pipeline, no condition (genuinely optional here, unlike RGA's mandatory one).
- `/api/passages` pointed at the real endpoint — ✅ Done, plus a real bug fix: the route's original request body was missing the required `localization` field entirely, and used `pipeline`/possibly-wrong scoping fields that turned out not to be part of this endpoint's real schema (confirmed via docs.coveo.com/en/o86c8334 — the actual scoping field is `filter`, not `aq`/`cq`). Fully verified: both the raw endpoint and the app's route return `200` with real passage content, relevance scores, and correct source titles.
- "Ask about this Pokemon" UI — ✅ Done. `src/components/AskAboutPokemon.tsx`, mounted on the Pokemon detail page. Input + top-3 passages with relevance scores, scoped to the current Pokemon via the route's new `pokemonName` param. Passage text renders through `react-markdown` with a link-safety override (added this session, following a pattern found in a sibling project — see `docs/inspiration-from-coveo-assesment.md`).
- Point-of-view doc (where passage retrieval beats whole-document RGA) — ✅ Done, `docs/passage-retrieval-pov.md`. Built on the tested Eevee (RGA, clean synthesized answer) vs. Pikachu (CPR, raw noisy chunks) contrast, plus three enterprise cases where CPR's raw-passage output is the better fit: RAG/agent pipelines, structured/tabular content, and auditability.

## Phase 6 — Capture, decks, rehearse (2 days out, 8–10h)

**Capture before the org can die. This is not optional.**

- 5–8 minute recorded demo of the full flow, committed to the repo
- Screenshots: source config, URL filters, scraping config, fields, mappings, extension code and log, Content Browser (Pikachu + Garchomp), QS model, the DEFAULT_QUERIES 2xx, RGA model, pipeline associations, CPR model → `docs/coveo/screenshots/`
- Text exports committed: scraping config JSON, IPE Python, DEFAULT_QUERIES CSV, mapping table → `docs/coveo/`

Then finish Topic 1 (`presentation/topic1-technical-deepdive.md`) and **both** Topic 2 variants: 2A Escalation & Recovery per the PDF (the `escalation-recovery-playbook` skill has the framework; write the *actual* exec message text, not a description of one), and 2B enterprise customer and value proposition per the .txt. Open the session by asking the panel which Topic 2 they want, with both loaded.

---

## Critical path and parallelism

```text
Phase 0 invite → Phase 3 (test source → fields → mappings → IPE → full rebuild)
              → Phase 4 (QS build 30m, RGA build) → Phase 6 capture → presentation
```

Fully parallel to the wait: Phases 1 and 2, both Topic 2 decks, the Passage Retrieval POV, and the Topic 1 structure. If the invite arrives on day 8 you are still fine, but only if Phase 2 is already done. **Phase 2 is done as of 2026-08-26** — Phase 1's hosting steps, both Topic 2 decks, the Passage Retrieval POV, and Topic 1 are the remaining parallel-to-the-wait work.

## The 14-day deletion constraint

1. Read the org's creation date on first login. Escalate the same day if it is already >7 days old.
2. Book the presentation no later than creation date + 12 days.
3. Log in and run a query **every day** from Phase 3 onward. Orgs go idle without queries.
4. Phase 6 capture is what makes deletion survivable: it degrades a live demo into a recorded one rather than into nothing.

## Top risks

| Risk | Mitigation |
|---|---|
| Invite never arrives, or arrives <5 days out | Escalate at 48h. Last-resort fallback: self-signup trial at coveo.com and tell recruiting. Phase 2 makes the switch a 4-hour job. |
| RGA not enabled (paid extension; trial status unverified in docs) | `GeneratedAnswer` already fails soft. Prepare a fallback slide with the exact config and model-creation screenshots. Do not discover this on stage. |
| Passage Retrieval enablement latency | Ship route + UI + POV + 403 screenshot; that meets the stated minimum. |
| Garchomp duplicate-type trap ships unnoticed | Garchomp is in the 3-URL test source for exactly this. Assert exactly 2 types at step 3.4. |
| `pokemontype` configured as plain Facet, not Multi-value | Inspect the facet value list at Phase 3 exit. No compound values allowed. |
| QS model stays empty despite the preload | Test Configuration Mode on, plus `buildFieldSuggestions` on `pokemonname` and `buildRecentQueriesList` as a visible non-ML fallback layer. |
| `searchHub` ≠ `originLevel1` | Silent ML no-op with no error anywhere. One exported constant, enforced server-side by the search token. |

## Verification

- `npm run lint`, `npm run typecheck`, `npm run test:coverage` green (80% thresholds)
- `npx playwright test` green in both worlds: unconfigured suite runs without `.env.local`, search suite runs with it
- Facet and result field verified **separately**: facet values in the admin console, `raw.pokemontype` in the browser Network tab
- Full source doc count ≈ 1025 with no `/moves/`, `/type/`, `/all`, or `/shiny` items
- Deployed Vercel URL returns real results with both facets, typeahead, and an RGA answer

## Unverified, flagged rather than assumed

Whether a 14-day trial org ships with RGA/CPR enabled; whether `logCitationHover` and `logCopyToClipboard` work under `analyticsMode: "next"` (Event Protocol does not support custom events, so do not build UI depending on hover telemetry); and the trial org document-count cap (1025 is trivially small, treated as a non-issue).

**Resolved:** `/rest/search/token` is the real, reachable endpoint (confirmed via direct `curl` — it authenticates the anonymous identity and returns a structured `executionReport` before failing on privileges), so the v1-vs-v2 question is moot. What's newly unverified instead: whether this org's console being unable to issue a key with `SEARCH_API/IMPERSONATE` (ADR-0007) is a permanent trial-org/console-version limitation or something a different template, a different org, or Coveo support could resolve — not re-attempted this session, `direct` auth mode was adopted instead of chasing it further.
