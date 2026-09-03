# Verify all 5 Coveo ML models are healthy (RGA, Semantic Encoder, CPR, ART, Query Suggestions)

## Context

Per `docs/handoff/archive/sessions-007-016.md` (12th session, ADR-0012): after the v3.4 content-exclusion source change, RGA and CPR were confirmed **stale** live — CPR on Charizard was still returning raw Moves/Type-defenses tables the exclusion rules should have stripped. An off-cycle rebuild request (RGA + Semantic Encoder + CPR) was supposedly emailed to Coveo support/Account Manager on 2026-08-31, but `docs/handoff/LATEST.md` (34th session, today) still flags this as **"not independently verified"** — same for the Phase 0 email, both against a **2026-09-06 presentation deadline**. ART and Query Suggestions were last confirmed live around the 20th session (~14 sessions ago) and haven't been re-checked since.

Goal: a live health check across all 5 models, using Coveo's actual current documentation (not memory) — confirmed via 3 parallel doc-research passes this session against docs.coveo.com — mapped to concrete console/API steps. This project has no direct console/API access from the agent, so every console step below is handed to the user to run and paste results back, per established convention (see 12th-session pattern in `docs/handoff/archive/sessions-007-016.md`).

## Key doc findings that change or confirm prior assumptions

- **One-shot overview**: Admin Console → **AI and ML → Models** lists all 5 models with a `Status` column (Active/Build in progress/Inactive/Limited/Soon to be archived/Error/Archived) in one screen. Start here every time. (`docs.coveo.com/en/1832`)
- **No "next rebuild in N days" field exists in the console** for RGA/SE/CPR — that phrasing in `docs/handoff/archive/sessions-007-016.md`'s 12th-session notes was a paraphrase of the weekly-cadence default, not a literal UI countdown. Don't go looking for it.
- **Chunk Inspector is RGA-only** — confirmed against current docs, matches what the 12th session already found. No equivalent tool exists for Semantic Encoder or CPR; their only content-staleness signal is the model's own "Chunks"/"Items included" aggregate counts (coverage, not recency) plus live API/app testing.
- **A config save can force an off-cycle rebuild** for RGA/SE/CPR (e.g. editing the RGA Prompt Instruction — already known; newly confirmed this also applies to SE/CPR config edits, and to CPR's chunking-strategy field specifically). No self-service "rebuild now" button exists otherwise — an Account Manager/support request remains the only lever for a content-only staleness fix with no config change to make.
- **ART/Query Suggestions don't go stale the same way** — they auto-retrain on a Data period/Building frequency schedule, not a content-driven rebuild. Their real risk is **archival after 10 days unqueried** (5-day warning first), not staleness. Given the app has had regular sessions, this is low risk, but check the Status column anyway.
- **ADR-0008's CPR privilege question was already resolved empirically** (same session, after the CPR model went Active): `COVEO_API_KEY` alone (`EXECUTE_QUERY`) returns real 200 passage content. Current docs.coveo.com (`en/o86c8334`) list `ALLOW_CONTENT_PREVIEW` as a stated prerequisite — a documentation-vs-live-behavior mismatch. Trust the live-verified result already in the ADR; no action needed, just don't let the doc text cause second-guessing.
- **RGA licensing**: confirmed weekly rebuild is a plan-tier default, not a bug; no documented minimum-content-volume floor for RGA (unlike ART's ~100 events or CR's ~10,000 queries) — it's per-item embedding, not behavioral-signal-based.
- **GenAI Performance dashboard** (Knowledge Hub → GenAI Performance) is the real ongoing quality signal for RGA: answer rate, citation click-through, top-cited items, last-50-queries-without-an-answer. Both Chunk Inspector and this dashboard are gated behind Knowledge Hub beta access (CSM-enabled) — confirm the org has this before relying on it.

## Step-by-step process (hand to user as console/live-app actions)

### 1. Fast sweep — all 5 models' Status column
1. Admin Console → **AI and ML → Models**.
2. Record the `Status` value for: `Pokedex RGA`, `Pokedex Semantic Encoder`, `Pokedex Passage Retrieval`, `Pokedex ART`, `Pokedex Query Suggestions`.
3. Flag anything not `Active` immediately (`Limited`/`Error` need "See more details"; `Soon to be archived` means re-query it now via the live app to reset the clock).

### 2. RGA — confirm the staleness fix actually landed
1. Models page → `Pokedex RGA` row → **View** → Information tab → note **Chunks** section stats (items with/without chunks).
2. If Knowledge Hub access exists: **Knowledge Hub → Chunk Inspector → Item unique ID mode** → target model `Pokedex RGA` → re-run the same Charjabug check the 12th session did (that item's chunk previously still had raw move-table content post-exclusion). Confirm it's now clean.
   - Caveat: Chunk Inspector only retains chunk data for 30 days past the relevant model build — if the off-cycle rebuild happened before this window, this check may come back empty rather than "clean." Note which is the case.
3. Live app check (no Knowledge Hub needed): run a search on `/search?q=charjabug` or similar and read the generated answer — confirm no raw Moves/Sprites/Locations/PokéBase content appears.
4. If Knowledge Hub access exists: **Knowledge Hub → GenAI Performance** → check Answer rate and Top 50 cited items over the last 7 days for any regression.

### 3. CPR — confirm the worse-than-RGA staleness is fixed
1. Models page → `Pokedex Passage Retrieval` → View → Information tab → note Chunks/Items-included stats.
2. Live app: open `/pokemon/charizard` → "Ask about this Pokemon" → ask a moves/stats question → confirm the returned passage no longer contains the full raw Moves-learnt table or Type-defenses grid the 12th session found.
3. Optional direct API check (bypasses the app entirely): `POST /rest/search/v3/passages/retrieve` with `COVEO_API_KEY`, filtered to `@pokemonname=="Charizard"` — same pattern already verified working in ADR-0008's update. Confirms passage content directly.

### 4. Semantic Encoder — coverage check only (no per-item content tool exists)
1. Models page → `Pokedex Semantic Encoder` → View → Information tab → note stats.
2. SE has no direct content-preview tool; its health is implicitly validated by RGA/CPR both working (SE backs both) plus its own Status being `Active`.

### 5. ART — confirm boosts are still live
1. On the live app, run a search (e.g. `/search?q=pikachu`), open browser dev tools Network tab, grab the `searchUid` from the `/rest/search/v2` request.
2. Admin Console → **Relevance Inspector** → paste `searchUid` → Inspect → **Query pipeline rules and models → Automatic Relevance Tuning** → confirm real boosted items appear (previously verified: Pikachu 2500, Charizard 790, Eevee 480, Tadbulb 360, Greninja 360 — check these or similar are still present/plausible).

### 6. Query Suggestions — confirm real suggestions are returned
1. On the live search box, start typing a partial Pokemon name; watch Network tab for a `/rest/search/v2/querySuggest` request per keystroke returning non-empty results.
2. Models page → `Pokedex Query Suggestions` → View → Information tab → sanity-check the "Top queries" sample list looks like real Pokemon-related queries.

### 7. Close the loop on the still-unverified off-cycle rebuild request
Ask the user directly whether the 2026-08-31 email to Coveo (RGA + SE + CPR off-cycle rebuild) was actually sent and whether Coveo responded. If it wasn't sent, and steps 2–3 above show the staleness is still present, this becomes the actual blocking action ahead of the 2026-09-06 deadline — not further app-side debugging, since the fix here is entirely an org-side data-refresh problem.

## After running the steps

Per `CLAUDE.md`'s doc-logging rule, append every docs.coveo.com URL fetched this session (listed below) to `docs/handoff/LATEST.md`'s "External docs.coveo.com pages read this session" convention, with a one-line note on whether it matched or diverged from prior assumptions. Also update `docs/handoff/STATE.md`'s "What's next" item 0 with whatever the live health-check results turn out to be (still-stale vs. confirmed-fixed), and remove or update the `project-model-rebuild-email` memory once the user confirms the email's actual status.

## Verification

This is a diagnostic/console-verification task, not a code change — "done" means the user has walked steps 1–6 live and reported back per-model status, and step 7's email status is confirmed. No build/test/lint gates apply unless a real bug is found along the way (e.g. a genuine code fix like ADR-0008's), in which case standard `npm run lint`/`typecheck`/`test` verification applies to that fix.
