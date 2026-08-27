# Session handoff — Coveo org build status

Written 2026-08-27, end of the third org-configuration session (Stage D: API keys, pipeline, auth wiring, and the first real end-to-end verification against live data). Read this first in a new chat before touching the Coveo admin console or the app's auth code — it has state and gotchas that aren't obvious from the plan docs alone. The prior sessions' handoff content is now folded into this one; treat this file as the current snapshot, not an addendum.

## Org details

- Org name: `venkatesh-pokemon-challenge`, Org ID: `venkateshpokemonchallenges0qp5rpy`
- Created **2026-08-25** — 14-day trial deletion clock runs from this date. Book the presentation by **2026-09-06** (creation + 12 days). **Still not booked, and the Phase 0 email reply with the Org ID still hasn't been sent — both zero-dependency, now idle across three sessions.**
- License: Enterprise, Demo type, expires 2026-11-24.
- Two sources: `Pokedex - Test` (3 items, sandbox, untouched) and `Pokedex - Full` (1025 items, the real crawl). Both fully verified in prior sessions.
- `Pokedex` query pipeline: condition `Search Hub is PokedexSearch`, plus a filter rule `filter cq @source==("Pokedex - Full")` added this session (see below).
- Two API keys now exist (see ADR-0006 for why it's two, not one):
  - `COVEO_API_KEY` — "Anonymous search" purpose. Privileges (confirmed via Coveo's own privilege-introspection endpoint): `EXECUTE_QUERY`/`SEARCH_API`, `ANALYTICS_DATA` (edit)/`USAGE_ANALYTICS`, `IMPERSONATE`/`USAGE_ANALYTICS`.
  - `COVEO_ML_API_KEY` — Custom purpose, named `Pokedex - Content Preview`. `Allow content preview` only.

## What's done

**Stages A, B, C** (test source, fields/mappings/IPE, full crawl) — complete and verified, unchanged from prior sessions. See `docs/plan101.md` for full history if needed; not re-summarized here.

**Stage D — this session.**

- **D1 (API keys).** Originally planned as one key with three privileges. Not buildable: this org's console can no longer grant Execute queries or Analytics-Push via the Custom key purpose — those are now locked to predefined templates (confirmed directly in the Custom wizard's Privileges step, not inferred). Built as two keys instead — see ADR-0006. The "Anonymous search" template's bundled `Impersonate` privilege was initially flagged as an unwanted-but-inert security overreach; that assessment was later corrected (see D2's finding below) — it's not the powerful cross-user impersonation privilege at all.
- **D2 (env wiring) — revised into a dual auth-mode design, ADR-0007.** `/api/token`'s token-minting call (`POST /rest/search/token`) 403s unconditionally, on every request including an empty body. Root-caused via Coveo's privilege-introspection endpoint: minting requires `Impersonate` under owner `SEARCH_API`, and this org's Anonymous-search key's `Impersonate` is scoped to owner `USAGE_ANALYTICS` instead — a different, unrelated privilege. No key obtainable from this console (template or Custom) carries the right one. Rather than deleting the server-minting work, added `NEXT_PUBLIC_COVEO_AUTH_MODE` (`"direct"` | `"server"`, default `"direct"`): `direct` mode uses `NEXT_PUBLIC_COVEO_ACCESS_TOKEN` as a static client-side credential (exactly what an "Anonymous search" key is documented to be for), `server` mode is ADR-0005's original minted-token design, fully intact and switchable via one env var the day a compatible key exists. Live now: `direct` mode, `NEXT_PUBLIC_COVEO_ACCESS_TOKEN` = same value as `COVEO_API_KEY`.
- **D3 (pipeline).** Done — `Pokedex` pipeline, condition `Search Hub is PokedexSearch`.
- **D3.5, unplanned.** Added a `filter cq @source==("Pokedex - Full")` rule to the pipeline. `Pokedex - Test` and `Pokedex - Full` are both live sources with nothing scoping the pipeline to one of them — without this, a query could return the same Pokemon twice (once per source). Verified via pipeline → More → Open in Content Browser: 2 results per query before the filter, 1 after.
- **D4 (searchHub alignment).** Confirmed working two ways: the pipeline screenshot, and — more conclusively — the e2e suite actually returning correctly-routed, correctly-faceted live results end to end.
- **D5 (e2e suite).** 3/3 passing against live org data. Two real app bugs found and fixed along the way, **neither of which was an org-config issue**:
  1. `src/coveo/config.ts`'s `resolveCoveoConfig()` had `environment = process.env` as a parameter default. That indirection isn't a literal `process.env.NEXT_PUBLIC_X` expression, which is the only pattern Next.js's build-time inlining (webpack's `DefinePlugin`) can see — so in every production client bundle, `NEXT_PUBLIC_COVEO_ORGANIZATION_ID` read back `undefined` regardless of `.env.local`, and the app always showed "Coveo isn't configured yet." Fixed by writing the literal expression into the default value itself. Any *new* `NEXT_PUBLIC_*` field added to this resolver must repeat that same pattern or the bug comes back.
  2. `src/coveo/engine.ts` never called Headless's `registerFieldsToInclude`. Coveo's Search API only returns a default field set (`title`, `uri`, etc.) per result unless custom fields are explicitly requested — facets still worked (a separate, server-computed aggregation), but every individual result's `pokemontype`/`pokemongeneration`/`pokemonimageurl` came back empty, so **no Pokemon images or per-result type/generation were rendering anywhere** — not on `/search`, not on the PDP — despite the source/mapping/IPE work all being correct. This is the kind of thing that would have been caught live during the panel demo. Fixed by dispatching `loadFieldActions(engine).registerFieldsToInclude(Object.values(POKEMON_FIELDS))` once at engine construction. Verified visually (screenshots) and via the e2e suite: images, type chips, and generation all render correctly now.

## What's next (in priority order)

1. **Send the two zero-dependency items that have now sat idle across three sessions:** the Phase 0 email reply with the Org ID, and booking the presentation slot (deadline 2026-09-06 — a handful of days out from this handoff's date).
2. **D6/D7 — Query Suggest model.** Not started. This is why there's no typeahead yet in the running app — `SearchBox`'s suggestion-rendering code is already complete and correct (verified by reading it), it simply has no model to draw from. Create the model, associate to `Pokedex`, enable Test Configuration Mode, then preload via the `DEFAULT_QUERIES` CSV endpoint (1025 names + ~40 intent phrases). Screenshot the 2xx.
3. **D9/D10 — Semantic Encoder + RGA model,** associated to `Pokedex`. Not started.
4. **Vercel env vars** for deploy (Intermediate tier) — `.env.local` is set locally; nothing pushed to Vercel yet.
5. Once ready to deploy: tighten `next.config.ts`'s CSP `connect-src` to the real org hostname (currently a wildcard).

## Documentation findings from this session — don't re-derive these

Full detail in ADR-0006, ADR-0007, and `docs/plan101.md`'s Stage D table.

1. **A Coveo Custom-purpose API key can no longer be granted Execute queries or Analytics-Push in this org's console.** Confirmed directly by inspecting the Custom wizard's full Privileges list (Search domain: no "Execute queries" row at all; Analytics data domain: dropdown offers only `View`/`no access`, no `Push`) — not inferred from generic docs, which still describe these as ordinary assignable privileges. The console's own banner explains why: *"certain privileges are now limited to predefined templates."* Treat this as true for this org/console build as of 2026-08-26–27, not necessarily a durable platform fact — worth a caveat if it comes up in the Topic 1 deck.
2. **Minting a search token requires `Impersonate` under owner `SEARCH_API` specifically**, confirmed via Coveo's privilege-introspection endpoint (`POST /rest/organizations/<org>/privileges/token?accessToken=<key>`, docs.coveo.com/en/109) and a documented example payload showing that exact owner/domain pair. A same-named `Impersonate` privilege under a *different* owner (`USAGE_ANALYTICS`, what the Anonymous search template actually grants) does not satisfy this — the privilege model isn't just "does the key have X," it's "does the key have X under the right owner."
3. **Search hub restriction on an API key is populated from usage-analytics history, not free text.** The "Select a search hub" dropdown when creating a key only lists hub values that have actually appeared in real traffic (e.g. `AdminConsole`) — `PokedexSearch` won't appear until the app has sent at least one real query with that hub, which is exactly what creating the key is a prerequisite for. Chicken-and-egg; the field is optional, leave it unset. Also: whatever you pick (including unset) is locked in permanently on save — there is no "add it later" for an existing key.
4. **Next.js's `NEXT_PUBLIC_*` build-time inlining only recognizes the literal syntactic expression `process.env.NEXT_PUBLIC_X` wherever it appears verbatim in source.** A variable that merely *defaults to* `process.env` (`function f({ environment = process.env } = {})`) and is then indexed dynamically (`environment.NEXT_PUBLIC_X`) does not get inlined — in the browser, `process.env` is a stub object containing only the keys Next's static scanner found via that literal pattern, so the dynamic access silently reads `undefined` forever, independent of what's actually set in `.env.local`. This is easy to reintroduce by adding a new env-driven field to `resolveCoveoConfig` without preserving the literal-expression form in its default value — see the comment block in `src/coveo/config.ts` before touching it.
5. **Coveo's Search API does not return custom fields in a result's `raw` object by default** — only a small standard set (title, uri, etc.). Custom fields need `loadFieldActions(engine).registerFieldsToInclude([...])` dispatched once against the engine. Facet value counts are unaffected either way, since facet aggregation is computed server-side independent of what's echoed back per result — which is exactly why this bug was invisible in the facet sidebar while breaking every result card and the PDP.

## Traps carried over from prior sessions (Stage A–C, still relevant, unchanged)

Full list in `docs/plan101.md`; the short version: selectors must end in `text()`/`@attr`; the `№` character selector works in the Chrome extension but not in Coveo's actual crawler (match on `"National"` instead); the vitals table has two `№` rows needing positional truncation; `fetchpriority="high"` isn't unique to hero artwork; unmapped metadata is invisible in Content Browser until a Field + mapping both exist; mapping rules are first-match-wins, top-to-bottom.

## External docs.coveo.com pages read this session (log, so the next session doesn't re-derive them)

Grouped by what they were read to resolve. Where a page's actual rendered content didn't match what the search snippet promised (docs.coveo.com is JS-rendered and the fetch tool available in this session got inconsistent results), that's noted — don't assume a page is useless just because it's listed as "unhelpful," it just means the same URL might render differently in a real browser and could be re-checked manually.

**Query pipeline filters (for the D3.5 source-scoping fix):**
- [docs.coveo.com/en/3410](https://docs.coveo.com/en/3410/) — Manage filter rules. Gave the actual navigation path and `filter cq @source==(...)` syntax used.
- [docs.coveo.com/en/1449](https://docs.coveo.com/en/1449/) — Query pipeline language (QPL) reference.
- [docs.coveo.com/en/1440](https://docs.coveo.com/en/1440/), [docs.coveo.com/en/1959](https://docs.coveo.com/en/1959/) — Filter feature overview, and managing query pipeline conditions. Background reading, not directly quoted.

**Testing a pipeline without a Search Page (for verifying the D3.5 filter):**
- [docs.coveo.com/en/1791](https://docs.coveo.com/en/1791/) — Manage query pipelines. Gave the "pipeline → More → Open in Content Browser" method actually used to verify the filter.
- [docs.coveo.com/en/2088](https://docs.coveo.com/en/2088/), [docs.coveo.com/en/mc2g0358](https://docs.coveo.com/en/mc2g0358/) — Troubleshoot/inspect query pipeline rules (`executionReport`). Background reading, not directly used.
- [docs.coveo.com/en/89](https://docs.coveo.com/en/89/), [docs.coveo.com/en/las95231](https://docs.coveo.com/en/las95231/) — Determine which pipeline a search page uses; enforcing searchHub in auth. Background reading.

**API keys and privileges (for D1, and diagnosing why Custom couldn't grant Execute queries/Push):**
- [docs.coveo.com/en/1718](https://docs.coveo.com/en/1718/) — Manage API keys. Gave the Add-key wizard's step names (Key Purpose → Identification → Configuration → Access → Review → Confirmation) and the list of Key Purpose templates (Anonymous search, Authenticated search, Usage analytics, Search pages, Anonymous Case Assist, Push API, Crawling Module administration, View all content, Custom).
- [docs.coveo.com/en/60](https://docs.coveo.com/en/60/) — Get the privileges you can assign to an API key.
- [docs.coveo.com/en/1707](https://docs.coveo.com/en/1707/) — Privilege reference. Confirmed domain/access-level names (Execute queries, Analytics data → Push, Allow content preview) — useful for what *should* exist generically, though the live Custom wizard (verified by screenshot, not docs) turned out not to expose all of them.
- [docs.coveo.com/en/82](https://docs.coveo.com/en/82/) — Manage API keys programmatically. Background reading, confirmed the owner/targetDomain privilege model shape.
- [docs.coveo.com/en/105](https://docs.coveo.com/en/105/build-a-search-ui/api-key-authentication) — Use API key authentication with the Search API. Fetch attempts returned mostly nav-shell content, not much usable detail extracted.

**Search token minting and the SEARCH_API/IMPERSONATE finding (ADR-0007, the session's most consequential investigation):**
- [docs.coveo.com/en/56](https://docs.coveo.com/56) — Use search token authentication. Confirmed the "Authenticated Search" template pattern; didn't directly state the Impersonate/owner requirement.
- [docs.coveo.com/en/109](https://docs.coveo.com/en/109) — Get the privileges of an access token. **This is the key one** — gave the exact `POST /rest/organizations/<org>/privileges/token?accessToken=<key>` introspection call used to directly see what privileges a key actually carries (owner + targetDomain pairs), which is what surfaced that the Anonymous-search key's `Impersonate` was scoped to `USAGE_ANALYTICS` instead of `SEARCH_API`. Re-run this call on any new key before assuming its privileges match what the console UI implies.
- A general web search (not a specific docs.coveo.com page) surfaced the documented example payload showing `SEARCH_API`/`IMPERSONATE` is what token minting actually requires — worth trying to find the specific source page directly next time rather than relying on a search-engine summary of it.

## What the next session should read first, by task

- **D6/D7 (Query Suggest model + preload) — not started, do this first:**
  - [docs.coveo.com/en/3398](https://docs.coveo.com/en/3398/) — Create and manage a Query Suggestions (QS) model.
  - [docs.coveo.com/en/l1mf0321](https://docs.coveo.com/en/l1mf0321/) — Associate a QS model with a query pipeline.
  - [docs.coveo.com/en/1902](https://docs.coveo.com/en/1902/) — Enable query suggestions in a Coveo search box (relevant since `SearchBox` in this app already implements the Headless side — worth confirming nothing else is needed app-side).
  - [docs.coveo.com/en/l3od9093](https://docs.coveo.com/en/l3od9093/) — Advanced Model Configurations API. Has the actual `DEFAULT_QUERIES` CSV format (`query,weight`, UTF-8, no header) that plan101 D7 references.
- **D9 (Semantic Encoder):**
  - [docs.coveo.com/en/nb890247](https://docs.coveo.com/en/nb890247/) — Create and manage Semantic Encoder (SE) models.
  - [docs.coveo.com/en/nb8b0088](https://docs.coveo.com/en/nb8b0088/) — Associate an SE model with a query pipeline.
- **D10 (RGA):**
  - [docs.coveo.com/en/nb6a0085](https://docs.coveo.com/en/nb6a0085/) — Create and manage RGA models.
  - [docs.coveo.com/en/nb6a0104](https://docs.coveo.com/en/nb6a0104/) — Associate an RGA model with a query pipeline.
  - [docs.coveo.com/en/nb6a0008](https://docs.coveo.com/en/nb6a0008/) — RGA content requirements and best practices — relevant given plan101's already-noted concern that RGA embeds only `body` in 250-word chunks and pokemondb is heavily tabular.
- **Stage E, conditional on Passage Retrieval enablement landing:**
  - [docs.coveo.com/en/oaoe7068](https://docs.coveo.com/en/oaoe7068/) — Passage Retrieval (CPR) implementation overview.
- **General caveat for all of the above:** this session found that docs.coveo.com's generic documentation and this org's actual live console behavior disagreed twice (Custom key privileges; search-hub-key dropdown behavior). Treat every doc page above as a starting hypothesis to verify against the real console/API, not as ground truth — the privilege-introspection endpoint (`docs.coveo.com/en/109`) is the reliable way to verify what a key can actually do, and Content Browser (`docs.coveo.com/en/1791`) is the reliable way to verify what a pipeline actually returns, independent of what any docs page claims either should do.

## Reference docs

- `docs/plan101.md` — full step-by-step build plan, status per step, live-findings appendix, now current through Stage D5.
- `docs/EXECUTION-PLAN.md` — overall plan across Phases 0–6, Phase 4 section kept in sync with plan101's Stage D.
- `docs/adr/0005-server-token-and-passage-routes.md` — original server-minting design (now partially superseded, see below).
- `docs/adr/0006-split-api-key-for-content-preview.md` — why two keys instead of one.
- `docs/adr/0007-dual-auth-mode-direct-vs-server-token.md` — why `/api/token` can't work on this org, and the `direct`/`server` auth-mode split that replaces it.
- `docs/coveo-source-spec.md` — original field/mapping spec (predates the org; field *names* still correct).
- `docs/final_config.json` — the Full source's complete saved JSON configuration, from the end of the previous session.
- `docs/temp/` — screenshots across all three sessions.
