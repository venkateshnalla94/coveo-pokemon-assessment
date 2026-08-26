# Coveo Pokemon Challenge — Execution Plan

## Context

This repo is a take-home assessment for a Coveo Forward Deployed Engineer role. The requirements come from two documents in `docs/`, both read via markitdown for this plan:

- `Pokemon Challenge (Pre-Sales) - 2026.txt` — the four requirement tiers (Essential, Intermediate, Advanced, Bonus)
- `Technical_Challenge_-_FDE.pdf` — panel logistics and the two presentation topics

**The two documents disagree on Topic 2.** The .txt says "identify an enterprise customer who could benefit from a similar Coveo solution." The PDF says "Escalation & Recovery: a large customer's search platform is intermittently failing under peak traffic." Per your decision, both get prepared.

Current state: a substantial Next.js 16 + React 19 + `@coveo/headless` v3 frontend already exists (facets, result grid, detail page, generated-answer scaffold) but has **never been committed** — zero commits, no remote. Nothing exists on the Coveo cloud side because the trial org invite has not arrived. Three research agents audited the code, the Coveo docs, and pokemondb.net; a fourth adjudicated their conflicts.

**Confirmed decisions:** scope is everything including Bonus; target ~2 weeks from 2026-08-26; wait for the invite with a 48-hour escalation; email Coveo for RGA/Passage Retrieval enablement today and send the Org ID later.

Written 2026-08-26. This file is the working checklist for the whole assessment.

**Status as of 2026-08-26:** Phase 1's doc/CI fixes and all of Phase 2 are done (see the phase sections below). Phase 1's hosting steps (initial commit, GitHub repo, Vercel deploy) are deliberately parked — not started, pending explicit go-ahead. Phase 0 and Phases 3–6 are unstarted, still blocked on the org invite.

---

## Findings that change the build

Four defects and one architectural conflict were found. Each is fixed in Phase 2.

**Generation is not on the Pokemon page.** It appears only on `/pokedex/national` as `<h2 id="gen-N">` headers. The moves-tab proxy was tested and disproved: Sprigatito (Gen 9) has zero generation tabs. Generation must be derived from the national dex number by an Indexing Pipeline Extension. Boundaries: 151, 251, 386, 493, 649, 721, 809, 905, 1025.

**Multi-value types are silently dropped.** `asString()` in [mapPokemonResult.ts:27-29](src/coveo/mapPokemonResult.ts#L27-L29) returns `undefined` for anything that is not a string. A multi-value `pokemontype` arrives as an array or a semicolon-joined string, so the type line vanishes from every card and the detail page. The facet can look perfect while the result field is broken, and the reverse is also possible: a field configured as plain "Facet" instead of "Multi-value facet" produces compound sidebar entries like `Fire;Flying`, which still renders and survives a casual demo until a panelist clicks "Fire".

**Crawled titles are not Pokemon names.** Pages title as `Bulbasaur Pokédex: stats, moves, evolution & locations`. [ResultList.tsx](src/components/ResultList.tsx) uses `result.title` as the display name, and [pokemon/[name]/page.tsx](src/app/pokemon/[name]/page.tsx) requires an exact case-insensitive match against it, so the detail page would always miss.

**Analytics is disabled.** `analytics: {enabled: false}` at [engine.ts:34-36](src/coveo/engine.ts#L34-L36) is the single line that makes the entire Advanced tier impossible. Query Suggest only promotes a query to a candidate if it was performed *and clicked at least once*.

**ADR-0004 (no server layer) is superseded.** It predicted its own trigger: "server-only Passage Retrieval calls would require a Route Handler." Passage Retrieval requires the *Machine Learning – Allow content preview* privilege, which is unsafe in a browser bundle.

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

## Phase 3 — Org setup (blocked on invite; 4h active + ~45 min crawl)

**First action on login: record the org's creation date and count 14 days from it, not from today.** If the org is already >7 days old, escalate to recruiting the same day.

1. Reply to the Phase 0.3 thread with the Org ID.
2. Create the **test source**: Web, start URLs `bulbasaur` + `garchomp` + `sprigatito`, **depth 0**. Three URLs, not one: they cover single-form, the multi-form duplicate trap, and the Gen-9 boundary. Rebuilds in seconds.
3. Write the scraping config JSON: index-scoped `(//table[...])[1]`, `№` via `contains()`, image from `og:image`, name from `h1`.
4. **Trap check** via Source → More → View and map metadata: Garchomp shows exactly 2 types (not 5); Sprigatito shows dex 906.
5. Create the 5 fields (Content → Fields). `pokemontype` **must** be Multi-value facet.
6. Create mappings (`%[pokemonname]` etc.), **including the Title override**.
7. Write and attach the generation IPE, **post-conversion**. Wrap the whole body in try/except or a failure drops the item from the index entirely.
8. Rebuild the test source; verify all 5 fields on all 3 Pokemon in Content Browser.
9. Create the **full source**: same config, start `/pokedex/national`, depth 1, delay 2000ms (robots.txt says `Crawl-delay: 2`), inclusion `^https://pokemondb\.net/pokedex/[a-z0-9%.-]+$`, exclusion `^https://pokemondb\.net/pokedex/(all|national|shiny)$`.
10. Rebuild and monitor. Expect ~35–45 min.

The inclusion regex's trailing `$` with no `/` in the character class is what excludes 5,391 `/moves/<gen>` subpages. That detail is worth 90 seconds in the Topic 1 deck.

**Exit:** ~1025 items; all 5 fields populated; facet lists show 18 types and 9 generations with **no compound values**. If the count is materially off or the crawl exceeds 90 min, swap to a Sitemap source with identical filters (~20 min, since scraping config, fields, mappings, and IPE are all source-type-independent).

## Phase 4 — Connect and ML (blocked on Phase 3; 4–5h + model build waits)

1. Create a private API key: Search–Execute queries, Analytics–Push, ML–Allow content preview.
2. Set `.env.local` and Vercel env vars; point `/api/token` at the real org.
3. Create the `Pokedex` pipeline; confirm `searchHub` alignment in the Network tab.
4. **Run the configured e2e suite** — it un-skips and validates C2, C3, and C6 in one shot.
5. Create the QS model, associate to the pipeline, **enable Test Configuration Mode**.
6. Preload it. `PUT /rest/organizations/<ORG>/machinelearning/models/<MODEL>/configs/DEFAULT_QUERIES?languageCode=en`, multipart, form field `configFile`, UTF-8 CSV with no header, `query,weight`, max 5000 rows. Use 1025 names at weight 1 plus ~40 curated intent phrases. **Screenshot the 2xx.** This file is the documented mechanism the challenge means by "preload a Query Suggest model."
7. Wait ~30 min for the build, then verify typeahead.
8. Create the Semantic Encoder model on the same content.
9. Create the RGA model and associate it to the pipeline.
10. Tighten CSP `connect-src` to the real org hostnames in `next.config.ts`.

**RGA reality check:** it embeds only the `body` field, chunked at 250 words, and pokemondb pages are heavily tabular. Demo it on prose questions (evolution chains, Pokedex flavor text), not stat lookups. Naming that limitation in the deck reads as expertise; getting caught by it on stage reads as the opposite.

## Phase 5 — Passage Retrieval bonus (blocked on Phase 0.3 enablement; 3–4h)

Create the CPR model alongside the Semantic Encoder on the same pipeline, point `/api/passages` at `POST /rest/search/v3/passages/retrieve`, build an "Ask about this Pokemon" UI showing the top 3 passages with relevance scores, and write the point of view on where passage retrieval beats whole-document RGA in enterprise settings.

**If enablement never lands:** the assessment's stated floor is "at a minimum, understand the API and have a point of view." Ship the route, the UI, and the POV, and screenshot the 403 as evidence you built it and were gated externally. Do not let this block anything else.

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

Whether a 14-day trial org ships with RGA/CPR enabled; whether `logCitationHover` and `logCopyToClipboard` work under `analyticsMode: "next"` (Event Protocol does not support custom events, so do not build UI depending on hover telemetry); whether `/rest/search/token` or `/rest/search/v2/token` is canonical (both appear in Coveo docs, test both); and the trial org document-count cap (1025 is trivially small, treated as a non-issue).
