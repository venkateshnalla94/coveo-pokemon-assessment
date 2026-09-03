# Handoff index — session number → file

Look up a session ordinal here before opening any archive file. Don't scan
`archive/*.md` top to bottom looking for a session — grep this file for the
number instead.

Sessions 4 and 26 don't exist as their own headers: early sessions (1–4)
predate the one-header-per-session convention and are folded into sessions
1–6's archive entry (see `archive/sessions-001-006.md`'s own note); 26 is
skipped in the source numbering (session log jumps from 25 to 27).

| Session | Summary | File |
|---|---|---|
| 1–3 | Stages A–C (test source, fields/mappings/IPE, full crawl) — see `docs/plan101.md` | `archive/sessions-001-006.md` |
| 4 | D6/D7 (Query Suggest), D9/D10 (Semantic Encoder + RGA), Stage E (Passage Retrieval), cross-repo inspiration pass | `archive/sessions-001-006.md` |
| 5 | CI, testing, CSP hardening | `archive/sessions-001-006.md` |
| 6 | Phase v2.1 field expansion, Phase v2.2 migration to Full | `archive/sessions-001-006.md` |
| 7 | Phase v2.3 frontend, built end to end | `archive/sessions-007-016.md` |
| 8 | Component unit-test harness, real `SearchBox` bug fix, `remark-gfm` | `archive/sessions-007-016.md` |
| 9 | Shared `useControllerState` hook, `executeSearch/rejected` console error fixed | `archive/sessions-007-016.md` |
| 10 | Phase v3.1 (sort break), v3.3 (search page data), duplicate facet registration bug — 4 sub-entries | `archive/sessions-007-016.md` |
| 11 | v3.2 (branching evolution + images), v3.4 (content exclusion) — code shipped, org config partial | `archive/sessions-007-016.md` |
| 12 | Full remaining v3.2/v3.4 console sequence (Fields, mappings, Full port, Chunk Inspector, RGA prompt enhancement) | `archive/sessions-007-016.md` |
| 13 | v4 design pass, Batch 2 (chrome + Pokeball search bar) | `archive/sessions-007-016.md` |
| 14 | v4 design pass, Batch 3 (result tiles + facets) | `archive/sessions-007-016.md` |
| 15 | v4 design pass, Batch 4 (PDP) | `archive/sessions-007-016.md` |
| 16 | v4 design pass, Batch 5 (AI surfaces) | `archive/sessions-007-016.md` |
| 17 | v4 design pass, Batch 6 (motion/a11y pass + ADR + wrap-up) | `archive/sessions-017-027.md` |
| 18 | Manual walkthrough + two missing e2e specs; same-day Vercel deploy | `archive/sessions-017-027.md` |
| 19 | Scoped four follow-up execution plans (Doc 3 marketing assets executed) | `archive/sessions-017-027.md` |
| 20 | ML-recommendations decision (Branch B), `/api/similar` + `SimilarPokemon` carousel — 3 sub-entries | `archive/sessions-017-027.md` |
| 21 | Home hero carousel + PDP Highlights, async UI-states, hero/PDP redesign, facet icons/order — 3 sub-entries | `archive/sessions-017-027.md` |
| 22 | Two layout-shift/flicker bugs (no org config touched) | `archive/sessions-017-027.md` |
| 23 | Stale category-filter (`aq`) surviving a new search | `archive/sessions-017-027.md` |
| 24 | Leaking server-side engine singleton, SSR hydration mismatches | `archive/sessions-017-027.md` |
| 25 | Responsive UI plan executed (off-canvas filter drawer, accordion facets, overflow fix) | `archive/sessions-017-027.md` |
| 27 | SEO audit follow-through (metadata, crawlability, soft-404 fix) | `archive/sessions-017-027.md` |
| 28 | BreadcrumbList JSON-LD on the PDP | `archive/sessions-028-037.md` |
| 29 | SEO plan closed out, Phase 4 declined | `archive/sessions-028-037.md` |
| 30 | Automated a11y scanning added, violations found and allowlisted | `archive/sessions-028-037.md` |
| 31 | Quick-improvements Phase 1 (utils extraction + API helpers) | `archive/sessions-028-037.md` |
| 32 | a11y remediation Phase 1 (landmark structure) | `archive/sessions-028-037.md` |
| 33 | a11y remediation Phase 2 (color contrast), plan doc closed | `archive/sessions-028-037.md` |
| 34 | Fixed PDP soft-404 regressing every unconfigured build | `archive/sessions-028-037.md` |
| 35 | ML model health check: CPR still stale, Coveo rebuild not yet completed | `archive/sessions-028-037.md` |
| 36 | Scoped a second body-content exclusion (Cap Pikachu alternate-form flavor text) | `archive/sessions-028-037.md` |
| 37 | Researched Coveo MCP Server, decided not to adopt | `archive/sessions-028-037.md` |
| 38 | Compare page: added missing image row, responsive column widths | `LATEST.md` |
| 39 | Themed placeholder for Pokemon missing an indexed sprite | `LATEST.md` |
| 40 | LCP fix: `priority` on three above-the-fold images | `LATEST.md` |
| 41 | `pokemonoverview` field designed (PDP intro prose), NOT applied | `LATEST.md` |
| 42 | `pokemonoverview` applied live to both sources, PDP renders it | `LATEST.md` |

## When a new session closes

Add one row here for the new session ordinal, pointing at `LATEST.md`. When
`LATEST.md` rotates into a new `archive/sessions-NNN-NNN.md` (see
`docs/handoff/README.md`), update that batch's rows to point at the new
archive filename instead.
