# docs/ index

What's in this folder and why. `HANDOFF.md` is still the single source of truth for current build state — read it first. This file is a map for finding the right doc without re-reading everything cold, useful especially while pulling material for the two panel presentations (`presentation/topic1-technical-deepdive.md`, `presentation/topic2-escalation-recovery.md`).

## Requirements source

- `Pokemon Challenge (Pre-Sales) - 2026.txt` — the four requirement tiers (Essential/Intermediate/Advanced/Bonus).
- `Technical_Challenge_-_FDE.pdf` — panel logistics and the two presentation topics.

## Live reference — current state, keep in sync as the app changes

- `HANDOFF.md` — session-by-session build log and current-state snapshot. Read first, every session.
- `plan101.md` — the org-setup build plan, status current through Stage E3.
- `coveo-source-spec.md` — live selector/field/mapping/IPE spec for both Coveo sources; the contract between the source config and `src/coveo/fields.ts`.
- `passage-retrieval-pov.md` — the Bonus-tier "point of view on Passage Retrieval vs. RGA" deliverable. Direct source material for Topic 1's GenAI Q&A prep.
- `standards.md` — a generalized engineering playbook pulled from a prior project.
- `standards-adoption.md` — what of `standards.md` was adopted/adapted/skipped here, and why. Backing material for Topic 1's "why this architecture" questions.
- `adr/0001`–`0018` — the decision log. Primary source material for Topic 1: every "why did you choose X" panel question maps to one of these. `0017`/`0018` are new (this cleanup pass): they document two rounds of live-review UI corrections (home hero/PDP hero, search facet UX) that had shipped without an ADR.
- `architecture/` — system overview + one doc per page (home/search/detail/compare) + an improvement-opportunities doc. Useful for Topic 1's architecture walkthrough and for anticipating "what would you change" questions.
- `DEFAULT_QUERIES.csv` — the Query Suggest preload file (1070 rows), committed as a build asset.
- `temp/stage-d/*.png` — screenshots of D7/D9/D10 verification evidence (Query Suggest 200 response, RGA answer), referenced from `HANDOFF.md`.

## Completed execution plans — historical, not required reading

**If you're evaluating this repo, you don't need to open any of these to judge the app.** They're moved to `archive/` precisely so a first pass through `docs/` isn't 9 plan documents deep before reaching the current-state docs above. They're kept because they're the raw "problem → hypothesis → build → failure → diagnosis → iteration → validation" evidence that `presentation_guidence.md` identifies as the strongest Topic 1 material — better than presenting a finished feature list — but that's a deliberate choice to preserve build history, not a signal you're expected to read all of it. Each entry below is what it's good evidence for, if you do.

- `archive/EXECUTION-PLAN.md` — the original assessment build (Essential through Bonus tiers). Read for the overall project arc.
- `archive/EXECUTION-PLAN-v2.md` — phase 2: richer indexed fields + mockup-inspired frontend redesign. Backed by two research docs (below).
- `archive/EXECUTION-PLAN-v2.3-frontend.md` — component-level spec for the v2 redesign. Has a known self-correction (wrong mockup-to-screen mapping) — a small, honest example of catching your own mistake, worth keeping for that reason alone.
- `archive/EXECUTION-PLAN-v3.md` — branching evolution, evolution images, Automatic Facet Generation, and the RGA/CPR content-exclusion diagnosis. **Best single doc for the "V1 answer quality was poor, here's the diagnosis and fix" story** `presentation_guidence.md` calls out as one of the strongest parts of a Topic 1 presentation.
- `archive/EXECUTION-PLAN-v4-design-system.md` — the full visual/UX redesign pass (6 batches). Good evidence of iteration driven by direct product review, not just spec-following.
- `archive/EXECUTION-PLAN-async-ui-states.md` — a cross-component consistency pass (idle/loading/success/error states). Good "found a real inconsistency, fixed it systematically" example.
- `archive/EXECUTION-PLAN-marketing-assets.md` — real marketing assets + icon-based Browse-by-type, replacing placeholder content. Direct evidence for `PRODUCT.md`'s no-fabricated-data principle.
- `archive/EXECUTION-PLAN-ml-recommendations.md` — the ART/Coveo-ML decision process (Branch A vs. B, resolved as Branch B). Good "evaluated an option, decided against it with reasoning" example — the kind of trade-off reasoning panels probe for.
- `archive/EXECUTION-PLAN-similar-pokemon-carousel.md` — the PDP carousel that consumed the ml-recommendations decision. Read together with that doc for a complete decision → build pair.
- `inspiration-from-coveo-assesment.md` — patterns mined from a sibling project, each checked against what this repo actually needed (not blindly copied). Good "knew when *not* to reuse a pattern" example.
- `mockup-ui-analysis.md` — breaks down which mockup elements had real pokemondb.net data behind them and which didn't (rejected fabricated ones like "Rarity"/"Synergy Score"). Direct evidence for the no-fabricated-data principle and for disciplined scope decisions.
- `pokemon-data-inventory.md` — factual survey of real pokemondb.net data, feasibility-rated. The research that grounded every v2 field decision.

## Data snapshots — known stale, treat the live console/app as ground truth

- `final_config.json` — a full source config export from the fourth session. Stale since the Phase v2.2 migration (Full source has 24+ fields now, this file describes 5). Kept as a point-in-time snapshot, not a current reference.

## Presentation prep

- `presentation_guidence.md` — **gitignored, not part of the public repo.** Private rule set for building the two decks (what the panel evaluates, narrative structure, anticipated Q&A). Read this before drafting either deck.
- `../presentation/topic1-technical-deepdive.md`, `../presentation/topic2-escalation-recovery.md` — the deck drafts themselves. **Known stale as of this cleanup**: Topic 1's draft says "Vercel deploy is still pending," but `HANDOFF.md` records the deploy as live since the eighteenth session — needs a content refresh pass before use, not just a docs/ reorganization.

## Cleanup notes (this pass)

Removed as pure junk, no content lost: `.DS_Store` files (macOS artifacts, untracked), `temp/insiprations/` (two empty, untracked subdirectories), `input.md` (an unreferenced raw-pasted license/admin snippet). Corrected two stale status headers (`archive/EXECUTION-PLAN-ml-recommendations.md`, `archive/EXECUTION-PLAN-similar-pokemon-carousel.md`) that said "blocked"/"not started" when `HANDOFF.md` already recorded both as resolved/shipped in the twentieth session.

A later pass moved all nine `EXECUTION-PLAN*.md` files into `archive/` — the content and every cross-reference are unchanged, only the location, so a first-time reviewer's `ls docs/` isn't 9 plan files deep before reaching `HANDOFF.md`/`adr/`/`architecture/`. `presentation/build/`, `presentation/output/`, and `docs/temp/deck-assets/` (build toolchain, generated `.pptx` output, and deck-prep screenshots, all previously untracked working-tree content) were added to `.gitignore` for the same reason — none of it is part of the app or its evidence trail.

A follow-up pass audited `adr/` and `architecture/` against `HANDOFF.md`'s eighteenth-through-twenty-third-session entries and found the architecture docs had drifted from the live app, and two shipped UI decisions (home hero reversion, search facet UX fixes) had no ADR at all. Wrote `adr/0017` and `adr/0018` to close those gaps, and updated `architecture/00-system-overview.md`, `01-home-page.md`, `02-search-page.md`, `03-detail-page.md`, and `05-improvement-opportunities.md` to match current behavior (facet order/icons, the `aq` breadcrumb chip, the PDP's `SimilarPokemon` carousel and two-column hero, `/api/similar` as a third no-server-layer exception, and the resolved "Similar Creatures" and Vercel-deployment items). `architecture/04-compare-page.md` was checked and left untouched — no session since the eighteenth touches Compare.
