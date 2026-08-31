# Architecture docs

Written for the panel demo / executive walkthrough of this project. These describe **what is actually built**, verified by reading the code directly (not the plan docs) as of 2026-08-29. Where a plan doc (`docs/archive/EXECUTION-PLAN*.md`) and the running code disagree, the code — as read in this pass — wins, and the doc says so.

Read order:

1. [`00-system-overview.md`](00-system-overview.md) — root layout, the Headless engine singleton, config/env resolution, request lifecycle, Context API usage, how the app evolved (v2.1 → v2.3 → hardening).
2. [`01-home-page.md`](01-home-page.md) — `/`
3. [`02-search-page.md`](02-search-page.md) — `/search` (facets, sort, RGA, results grid)
4. [`03-detail-page.md`](03-detail-page.md) — `/pokemon/[name]` (PDP, Passage Retrieval "Ask about")
5. [`04-compare-page.md`](04-compare-page.md) — `/compare`
6. [`05-improvement-opportunities.md`](05-improvement-opportunities.md) — gaps against Coveo's own documented patterns and general production-readiness practice, ranked by cost/impact

Each page doc covers, in order: a component-tree diagram, every Headless controller in play and which engine it runs against, the server-vs-client component boundary and why, any Context API usage, and exactly which values are hardcoded constants vs. live Coveo data — with a file/line pointer so nothing here goes stale silently.

For org-side facts (source config, field mappings, ML model status, API key privileges) this doesn't repeat `docs/HANDOFF.md` — that file is the single source of truth for org state and is linked wherever relevant. For *why* a given architectural choice was made, the relevant ADR under `docs/adr/` is linked rather than re-argued here.
