# Coveo org build status — current state

Read this first, every session, per `CLAUDE.md`'s process rules. This file
is evergreen — edited in place as facts change, not a log. For the recent
session-by-session narrative, read `docs/handoff/LATEST.md`. For older
history, look up the session number in `docs/handoff/INDEX.md`.

## Org details

- Org name: `venkatesh-pokemon-challenge`, Org ID: `venkateshpokemonchallenges0qp5rpy`
- Created **2026-08-25** — 14-day trial deletion clock runs from this date, nominally **2026-09-06**. Presentation is now booked for **2026-09-09** (later than the nominal deletion date) — per user, this has been confirmed handled with Coveo as of 2026-09-02, so the org is not expected to be deleted before then. Phase 0 email reply with the Org ID still hasn't been sent as of this writing.
- License: Enterprise, Demo type, expires 2026-11-24.
- Two sources: `Pokedex - Test` (3 items — Pikachu/Garchomp/Sprigatito, 26 fields, sandbox/prototyping only) and `Pokedex - Full` (1025 items, the real crawl — **now also on the full 26-field config as of the sixth session's Phase v2.2 work**, see that section above). Both fully verified. `Pokedex - Full` is what the running app actually queries (the pipeline's `filter cq @source==("Pokedex - Full")` rule excludes Test), so the new fields are genuinely live, not just prototyped.
- `Pokedex` query pipeline: condition `Search Hub is PokedexSearch`, filter rule `filter cq @source==("Pokedex - Full")`. Four ML models associated as of this session: `Pokedex Query Suggestions`, `Pokedex Semantic Encoder`, `Pokedex RGA`, `Pokedex Passage Retrieval` — all Active, all verified working end to end.
- Two API keys exist (see ADR-0006 for why it's two, not one — though see the note below, one of them is now dead weight):
  - `COVEO_API_KEY` — "Anonymous search" purpose. Privileges (confirmed via Coveo's own privilege-introspection endpoint): `EXECUTE_QUERY`/`SEARCH_API`, `ANALYTICS_DATA` (edit)/`USAGE_ANALYTICS`, `IMPERSONATE`/`USAGE_ANALYTICS`. Same value as `NEXT_PUBLIC_COVEO_ACCESS_TOKEN`; also now populated into `COVEO_API_KEY` in `.env.local` this session (was blank before) since `/api/passages` needs it.
  - `COVEO_ML_API_KEY` — Custom purpose, named `Pokedex - Content Preview`. `Allow content preview` only. **Confirmed unused by anything in this app as of this session** (ADR-0008) — nothing currently depends on deleting it, but don't build new code that reaches for it assuming it's load-bearing.

## What's done

**Stages A, B, C** (test source, fields/mappings/IPE, full crawl) — complete and verified, unchanged from prior sessions. See `docs/plan101.md` for full history if needed; not re-summarized here.

**Stage D1–D5 — prior (third) session, unchanged, summarized here since they're still load-bearing context.**

- **D1 (API keys).** Originally planned as one key with three privileges. Not buildable: this org's console can no longer grant Execute queries or Analytics-Push via the Custom key purpose — those are now locked to predefined templates (confirmed directly in the Custom wizard's Privileges step, not inferred). Built as two keys instead — see ADR-0006. The "Anonymous search" template's bundled `Impersonate` privilege was initially flagged as an unwanted-but-inert security overreach; that assessment was later corrected (see D2's finding below) — it's not the powerful cross-user impersonation privilege at all.
- **D2 (env wiring) — revised into a dual auth-mode design, ADR-0007.** `/api/token`'s token-minting call (`POST /rest/search/token`) 403s unconditionally, on every request including an empty body. Root-caused via Coveo's privilege-introspection endpoint: minting requires `Impersonate` under owner `SEARCH_API`, and this org's Anonymous-search key's `Impersonate` is scoped to owner `USAGE_ANALYTICS` instead — a different, unrelated privilege. No key obtainable from this console (template or Custom) carries the right one. Rather than deleting the server-minting work, added `NEXT_PUBLIC_COVEO_AUTH_MODE` (`"direct"` | `"server"`, default `"direct"`): `direct` mode uses `NEXT_PUBLIC_COVEO_ACCESS_TOKEN` as a static client-side credential (exactly what an "Anonymous search" key is documented to be for), `server` mode is ADR-0005's original minted-token design, fully intact and switchable via one env var the day a compatible key exists. Live now: `direct` mode, `NEXT_PUBLIC_COVEO_ACCESS_TOKEN` = same value as `COVEO_API_KEY`.
- **D3 (pipeline).** Done — `Pokedex` pipeline, condition `Search Hub is PokedexSearch`.
- **D3.5, unplanned.** Added a `filter cq @source==("Pokedex - Full")` rule to the pipeline. `Pokedex - Test` and `Pokedex - Full` are both live sources with nothing scoping the pipeline to one of them — without this, a query could return the same Pokemon twice (once per source). Verified via pipeline → More → Open in Content Browser: 2 results per query before the filter, 1 after.
- **D4 (searchHub alignment).** Confirmed working two ways: the pipeline screenshot, and — more conclusively — the e2e suite actually returning correctly-routed, correctly-faceted live results end to end.
- **D5 (e2e suite).** 3/3 passing against live org data. Two real app bugs found and fixed along the way, **neither of which was an org-config issue**:
  1. `src/coveo/config.ts`'s `resolveCoveoConfig()` had `environment = process.env` as a parameter default. That indirection isn't a literal `process.env.NEXT_PUBLIC_X` expression, which is the only pattern Next.js's build-time inlining (webpack's `DefinePlugin`) can see — so in every production client bundle, `NEXT_PUBLIC_COVEO_ORGANIZATION_ID` read back `undefined` regardless of `.env.local`, and the app always showed "Coveo isn't configured yet." Fixed by writing the literal expression into the default value itself. Any *new* `NEXT_PUBLIC_*` field added to this resolver must repeat that same pattern or the bug comes back.
  2. `src/coveo/engine.ts` never called Headless's `registerFieldsToInclude`. Coveo's Search API only returns a default field set (`title`, `uri`, etc.) per result unless custom fields are explicitly requested — facets still worked (a separate, server-computed aggregation), but every individual result's `pokemontype`/`pokemongeneration`/`pokemonimageurl` came back empty, so **no Pokemon images or per-result type/generation were rendering anywhere** — not on `/search`, not on the PDP — despite the source/mapping/IPE work all being correct. This is the kind of thing that would have been caught live during the panel demo. Fixed by dispatching `loadFieldActions(engine).registerFieldsToInclude(Object.values(POKEMON_FIELDS))` once at engine construction. Verified visually (screenshots) and via the e2e suite: images, type chips, and generation all render correctly now.

## What's next (in priority order)

**As of the thirty-fifth session, the urgent priority is:**

1. **BLOCKING: Coveo ML model rebuild status.**
   User sent the 2026-08-31 off-cycle rebuild request email to Coveo (RGA + Semantic Encoder + CPR), but **Coveo has not yet completed the rebuild as of this session**. CPR still contains stale/raw-table content, RGA's answer rate is only 71.5%. A follow-up call is booked with Coveo for **2026-09-09, 12:00 PM EST** — same day as the presentation. If the rebuild isn't confirmed complete by then, scope the live demo to RGA-only queries (no CPR/"Ask about this Pokemon") on the known-clean Pokemon (Charizard, Pikachu, Eevee). The `docs/Execution-plan-ML-model-check.md` file (created earlier session) is the diagnostic reference for any follow-up verification.

2. **Both presentation decks** (Advanced tier) — still not started:
   `presentation/topic1-technical-deepdive.md` and
   `presentation/topic2-escalation-recovery.md`. The stale-content/rebuild-request finding (Chunk Inspector gap, raw Moves tables on Charizard, unpredictable embedding staleness even on the RGA side) is good material for Topic 1's technical deep-dive. See item 4 in the older numbered list below, which still applies. **Presentation date is 2026-09-09** — decks need to be ready before then.

3. **Phase 0 email** with the Org ID still hasn't been sent as of this writing. Presentation slot is booked (2026-09-09); trial-deletion risk around the nominal 2026-09-06 clock has been confirmed handled with Coveo per the user.

4. **Chat agent — future goal, blocked externally, not actionable right now.**

All four nineteenth-session follow-up execution docs are now closed:
Doc 1 (ML recommendations, Branch B + ART) and Doc 2 (Similar Pokemon
carousel) in the twentieth session; Doc 3 (marketing assets, including its
§5 home hero carousel + PDP Highlights) and Doc 4 (async UI states) in this
(twenty-first) session — see "Twenty-first session" below.

The numbered list immediately below predates the nineteenth/twentieth/
twenty-first sessions and is largely historical (most of its own items are
marked done/superseded inline) — kept for the operational detail in items
0/4/5 (the ML-rebuild trail and the Phase 0 email context), not as the live
priority order.

Phase v2.3 is done as of the seventh session — the v2 roadmap (`docs/archive/EXECUTION-PLAN-v2.md`) is now fully closed. **New this session: `docs/archive/EXECUTION-PLAN-v3.md`** — a separate, independent track opened by live usage, four phases, pick any one:

- v3.1 — fix the sort break (`pokemonname` "Use for sorting" + a resilience fix so a bad sort criterion can't blank the whole grid again)
- v3.2 — PDP: RelatedPokemon tab + full branching evolution chain (the two items deferred from v2.3 §9)
- v3.3 — search page: surface `PokemonItem` data that's indexed/mapped but not shown (generation badge, abilities preview, new facets, stat-based sort)
- v3.4 — RGA/Passage Retrieval content cleanup (diagnose via Chunk Inspector first, then prompt enhancement + body content-exclusion rules — see that file for why the user's ChatGPT-drafted plan in `docs/temp_improvements.md` needed adjusting before use)

What's left from the original assessment, all pre-existing and unrelated to v2/v3:

0. **New, most urgent as of the twelfth session: contact Coveo (Account Manager/support) to request an off-cycle rebuild of all three ML models — RGA, Semantic Encoder, and Passage Retrieval (CPR).** The v3.4 content-exclusion rules are confirmed correctly indexed org-wide, but the embedding stores backing RGA (`/search`'s generated answer) and CPR (`Ask about this Pokemon` on the PDP) are both stale (pre-exclusion) for most of the 1025-item corpus, and RGA's own status shows its next scheduled rebuild 7 days out — landing in the same window as item 5's booking deadline below. CPR looks even more stale than RGA (confirmed live on Charizard, where RGA is otherwise clean but CPR still returns full Moves/Type-defenses-grid passages), since nothing this session forced even a partial CPR rebuild the way saving RGA's Prompt instruction did for RGA. Until this lands, live demos should stick to Pokemon already confirmed clean via RGA this session (Charizard, Pikachu, Eevee, Charjabug) and avoid `Ask about this Pokemon` (CPR) entirely except possibly on Charizard. Full trail in the twelfth-session section above.
1. **A manual end-to-end browser walkthrough of the new v2.3 surfaces together**, and the two e2e specs the plan's §8 flagged as ready to add "once v2.2 lands" (it now has): compare-selection-survives-navigation, and deep-linked facet URLs restoring state on a cold load. Cheap, and worth doing before treating the app as demo-ready for the panel.
2. ~~`pokemonname` needs "Use for sorting" enabled~~ — **done**, tenth session (see that section above); `name-asc` is back in `sortOptions.ts` and live-verified.
3. ~~**Vercel deploy** (Intermediate tier — "host your search app to make it accessible").~~ — **done**, same day following the eighteenth session (see that section above). Live at https://coveo-pokemon-assessment.vercel.app/, connected via GitHub import, `COVEO_API_KEY` env var issue found and fixed live.
4. **Both presentation decks** (Advanced tier). Not started — `presentation/topic1-technical-deepdive.md` and `presentation/topic2-escalation-recovery.md` are still unfilled outline checklists. Deliberately sequenced after Vercel, per user decision (predates the v2 work, may be worth revisiting given the v2 field-extraction debugging — the XPath axis bugs, the duplicate-DOM-block traps, the unmapped-metadata trap resurfacing on the Full migration — is genuinely good Topic 1 material). The twelfth session's stale-embedding/off-cycle-rebuild-request finding is also good material for either deck (real production-style operational issue, found and diagnosed live, not staged).
5. **Phase 0 email reply (Org ID) and presentation-slot booking (deadline 2026-09-06, 7 days out as of this writing).** Explicitly deferred by user decision, not forgotten. Turned out **not to be a real blocker for anything built so far** — both RGA and CPR were available and buildable in this org despite the email being unsent (see ADR-0008 for CPR). Still worth sending regardless — it's zero-dependency and the deadline is real, and now shares its window with item 0's rebuild request above. Now idle across **twelve** sessions.
6. **Lower priority, from the cross-repo inspiration pass** (`docs/inspiration-from-coveo-assesment.md`): a git-hook secret scan (item 1), and an explicit decision on whether `GeneratedAnswer.tsx` should regenerate on facet clicks (item 4) — investigated but not resolved, see that doc's Tier 2.


## Documentation findings — don't re-derive these

(Findings from early sessions, still current as of the last full review.)

Full detail in ADR-0006, ADR-0007, and `docs/plan101.md`'s Stage D table.

1. **A Coveo Custom-purpose API key can no longer be granted Execute queries or Analytics-Push in this org's console.** Confirmed directly by inspecting the Custom wizard's full Privileges list (Search domain: no "Execute queries" row at all; Analytics data domain: dropdown offers only `View`/`no access`, no `Push`) — not inferred from generic docs, which still describe these as ordinary assignable privileges. The console's own banner explains why: *"certain privileges are now limited to predefined templates."* Treat this as true for this org/console build as of 2026-08-26–27, not necessarily a durable platform fact — worth a caveat if it comes up in the Topic 1 deck.
2. **Minting a search token requires `Impersonate` under owner `SEARCH_API` specifically**, confirmed via Coveo's privilege-introspection endpoint (`POST /rest/organizations/<org>/privileges/token?accessToken=<key>`, docs.coveo.com/en/109) and a documented example payload showing that exact owner/domain pair. A same-named `Impersonate` privilege under a *different* owner (`USAGE_ANALYTICS`, what the Anonymous search template actually grants) does not satisfy this — the privilege model isn't just "does the key have X," it's "does the key have X under the right owner."
3. **Search hub restriction on an API key is populated from usage-analytics history, not free text.** The "Select a search hub" dropdown when creating a key only lists hub values that have actually appeared in real traffic (e.g. `AdminConsole`) — `PokedexSearch` won't appear until the app has sent at least one real query with that hub, which is exactly what creating the key is a prerequisite for. Chicken-and-egg; the field is optional, leave it unset. Also: whatever you pick (including unset) is locked in permanently on save — there is no "add it later" for an existing key.
4. **Next.js's `NEXT_PUBLIC_*` build-time inlining only recognizes the literal syntactic expression `process.env.NEXT_PUBLIC_X` wherever it appears verbatim in source.** A variable that merely *defaults to* `process.env` (`function f({ environment = process.env } = {})`) and is then indexed dynamically (`environment.NEXT_PUBLIC_X`) does not get inlined — in the browser, `process.env` is a stub object containing only the keys Next's static scanner found via that literal pattern, so the dynamic access silently reads `undefined` forever, independent of what's actually set in `.env.local`. This is easy to reintroduce by adding a new env-driven field to `resolveCoveoConfig` without preserving the literal-expression form in its default value — see the comment block in `src/coveo/config.ts` before touching it.
5. **Coveo's Search API does not return custom fields in a result's `raw` object by default** — only a small standard set (title, uri, etc.). Custom fields need `loadFieldActions(engine).registerFieldsToInclude([...])` dispatched once against the engine. Facet value counts are unaffected either way, since facet aggregation is computed server-side independent of what's echoed back per result — which is exactly why this bug was invisible in the facet sidebar while breaking every result card and the PDP.
6. **`ALLOW_CONTENT_PREVIEW` is not what gates Passage Retrieval — `EXECUTE_QUERY` is.** ADR-0005/0006's original design was wrong about this; see ADR-0008. Confirmed by direct testing, not docs: a key with only content-preview got a 403 before the pipeline even resolved, a key with EXECUTE_QUERY reached real business-logic errors (missing model, then success once the model existed).
7. **The Passage Retrieval request schema is not the same shape as this app's other Search API v2 calls.** `pipeline` is not a real field on `POST /rest/search/v3/passages/retrieve` (silently accepted and ignored); `aq`/`cq` are also silently ignored — the real scoping field is `filter`, using the same query-expression syntax (e.g. `@pokemonname=="Eevee"`). `localization` (`{locale, timezone}`) is required, undocumented as such in this app's original Phase 2 implementation. Source: docs.coveo.com/en/o86c8334 — a different page from the CPR model/console docs, found via web search, not doc navigation.
8. **A Coveo org admin's own browser session can authorize Machine Learning Swagger UI calls without a separate API key**, as long as the admin account carries the needed privilege (`Machine learning - Models - Edit` for D7's CSV upload). Worth remembering any time a "we need a key with privilege X" problem comes up — check whether the admin's own session already has it before reaching for a new Custom key, which may hit the same template-lock problem as D1.


## Traps carried over from prior sessions (Stage A–C, still relevant, unchanged)

Full list in `docs/plan101.md`; the short version: selectors must end in `text()`/`@attr`; the `№` character selector works in the Chrome extension but not in Coveo's actual crawler (match on `"National"` instead); the vitals table has two `№` rows needing positional truncation; `fetchpriority="high"` isn't unique to hero artwork; unmapped metadata is invisible in Content Browser until a Field + mapping both exist; mapping rules are first-match-wins, top-to-bottom.


## Reference docs

- `docs/plan101.md` — full step-by-step build plan, status per step, live-findings appendix, now current through Stage E3 (only E4 and D11 open).
- `docs/archive/EXECUTION-PLAN.md` — overall plan across Phases 0–6, Phase 4/5 sections kept in sync with plan101's Stage D/E.
- `docs/adr/0005-server-token-and-passage-routes.md` — original server-minting design and original Passage Retrieval privilege assumption (both superseded, see ADR-0007 and ADR-0008 respectively).
- `docs/adr/0006-split-api-key-for-content-preview.md` — why two keys instead of one. Now stale on one point: `COVEO_ML_API_KEY`, the key this ADR justified creating, turned out unused by anything (ADR-0008) — not rewritten, since the two-key *reasoning* (Custom purpose's template-lock) is still accurate even though the specific consumer it was built for isn't real.
- `docs/adr/0007-dual-auth-mode-direct-vs-server-token.md` — why `/api/token` can't work on this org, and the `direct`/`server` auth-mode split that replaces it.
- `docs/adr/0008-passage-retrieval-needs-execute-query-not-content-preview.md` — new this session. Why `/api/passages` was 403ing (wrong key/privilege assumption), the fix, and the now-closed question of whether content-preview is needed at all (it isn't).
- `docs/inspiration-from-coveo-assesment.md` — new this session. Prioritized recommendations mined from a sibling Coveo project, cross-checked against this repo's actual code — not a build-status doc, a to-pull-from list.
- `docs/coveo-source-spec.md` — **updated this (sixth) session**, no longer stale. Now the real, live-verified selector/field/mapping/IPE spec for all 26 `Pokedex - Test` fields (the original 5 plus all of Phase v2.1), including the extraction bugs hit and fixed while building it. Read this before touching any field extraction rule, not the summary in this file.
- `docs/final_config.json` — the Full source's complete saved JSON configuration, from the end of the fourth session — **stale as of this (sixth) session's Phase v2.2 migration**: `Pokedex - Full` now has 24 real fields, not the 5 this file describes. Not re-exported/updated this session; treat the live console as ground truth over this file until it's refreshed.
- `docs/DEFAULT_QUERIES.csv` — the D7 Query Suggest preload file, committed in the fourth session (1070 rows: 1025 live-pulled Pokemon names + 45 curated intent phrases).
- `docs/temp/` — screenshots across the first four sessions; `docs/temp/stage-d/` holds fourth-session evidence (D7's 200 response, D9/D10's RGA answer).
- `docs/archive/EXECUTION-PLAN-v2.md` — a second-phase plan (richer indexed data + a mockup-inspired frontend), separate from and building on `EXECUTION-PLAN.md` above — not a build-status doc, a forward-looking roadmap. Phase v2.1's checkboxes are now checked off (sixth session). Read alongside its two research docs: `docs/pokemon-data-inventory.md` (factual survey of real pokemondb.net data, feasibility-rated) and `docs/mockup-ui-analysis.md` (breakdown of the `mock-ups/*.png` designs against real data availability).
- `docs/archive/EXECUTION-PLAN-v2.3-frontend.md` — an untracked frontend design doc already in the repo (not yet committed as of this session). Specs a grouped-sub-object `PokemonItem` shape that diverges from what actually got built this session (flat fields) — see the sixth-session section above before starting Phase v2.3 work from this doc as if it already matches the code.
