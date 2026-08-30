# Topic 1: Technical deep dive

Audience: Coveo experts. ~20 minutes of content, leaving room for Q&A. This is not a demo — it's a walkthrough of what was built, why, and what was learned building it. Structure follows `.claude/skills/technical-deepdive-doc`.

## 1. What was built

**The problem this is solving**, before the feature list: a Pokémon fan should be able to discover Pokémon without knowing exact names, filter by type/generation, progressively refine, understand why a result matched, and go deep on one Pokémon (evolution, stats, an open-ended question). Everything below is in service of that, not a checklist of Coveo features exercised for their own sake.

- **Source**: a Coveo Web Crawler source (`Pokedex - Full`, 1025 items) scoped to `https://pokemondb.net/pokedex/*`, explicitly excluding `/move/*`, `/type/*`, `/ability/*`, `/item/*`, and the `/pokedex/national` index page itself — only real per-Pokémon pages get indexed, per the challenge's own instruction to exclude Moves/Types/etc. Full field table in `docs/coveo-source-spec.md`.
- **Frontend**: Coveo Headless SDK on Next.js (App Router) — facets for Type and Generation (now Automatic Facet Generation, see below), a result grid with the Pokémon's image per result, search-as-you-type, sort, and a Pokémon Detail Page at `/pokemon/[name]`.
- **Hosting**: GitHub — pushed and current. Vercel — **not yet deployed** as of this writing; `.env.local` is configured locally but nothing has been pushed to Vercel. Stated plainly rather than glossed over, since it's a real open item, not a secret one.

## 2. Why this architecture

For each non-obvious decision: alternatives considered, why this one won, and the accepted trade-off. Full reasoning lives in the ADRs linked below — this is the compressed version for the room.

- **Headless over Atomic** (`docs/adr/0001`). Atomic ships prebuilt web components — faster, but caps customization at what the components expose. Headless is the state-management layer with no UI opinion, so every piece (search box, facets, result cards, the detail page) is hand-built against Headless controllers. Cost: more implementation work. Payoff: full control over rendering and routing, and it forces engaging with Coveo's actual controller/state model instead of a component's abstraction over it — the thing the panel is more likely to probe.
- **Web crawler over Push API** (`docs/adr/0003`). pokemondb.net is a third-party site with no existing pipeline that already has structured Pokémon data to push, so there's nothing to push *from*. Coveo's crawler plus a Web Scraping Configuration handles fetching, scheduling, and re-crawling; field extraction lives in CSS/XPath selectors in the admin console rather than in code we control end-to-end. Trade-off accepted: if pokemondb.net's HTML changes, the extraction rules need updating in the console, not in a unit-testable local scraper — reasonable given the assessment's time box, and Push is meant for content we already own.
- **Next.js over plain React/Vite** (`docs/adr/0002`). App Router gives the Detail Page a real URL (`src/app/pokemon/[name]`) for free, including direct-link and refresh support, and deploys to Vercel with near-zero config — directly serving the Intermediate tier's hosting requirement. One real integration cost surfaced by this choice: Server Components can't touch client-only exports, so `resolveCoveoConfig()` had to live in a plain module separate from the client-only engine module.
- **Automatic Facet Generation over hand-built facets, on `/search` only** (`docs/adr/0011`). Started with 5 hand-built facet components, each registering a Headless controller with no explicit `facetId` against a persistent-engine singleton — which produced a real, live bug: navigating away and back re-registered the same field under a new auto-suffixed id (`pokemontype_2`, `_3`, ...), and React threw a duplicate-key error in the breadcrumb bar built from `breadcrumb.field`. Investigating the fix (reading Headless's own installed source, not just docs) surfaced that Coveo's real `buildAutomaticFacetGenerator` structurally can't hit this bug class at all — it re-derives facet state fresh from the search response every read, with no persistent per-mount registration. Replaced 5 components with one `AutomaticFacets.tsx`; kept `FacetSpeed` (numeric field, ineligible) and `FacetAbilities` (needs facet-search, which automatic facets don't support) hand-built. Net: fewer components, and the entire bug class is now structurally impossible for the 5 migrated fields.

## 3. Advanced / Bonus status

- **RGA — built.** `Pokedex RGA` model, associated to the `Pokedex` pipeline with a mandatory `Query is not empty` condition. One thing learned: RGA's Advanced config (Items to consider, Chunk relevancy threshold) is a red herring for a content-quality problem — tuning it had zero measurable effect when the actual issue turned out to be embedding staleness, not chunk selection (see section 4).
- **Query Suggest — built.** `Pokedex Query Suggestions` model, preloaded via the Machine Learning API's own Swagger UI (not a custom key) with 1070 rows: 1025 real Pokémon names pulled live from the Search API plus 45 curated intent phrases (`"fire type"`, `"generation 1"`, `"starter pokemon"`).
- **Pokémon Detail Page — built.** Stats, training/breeding data, type defenses, and a full branching evolution chain with real per-stage sprite images extracted at crawl time (not resolved via a second query — see below).
- **Passage Retrieval (Bonus) — built.** One thing learned worth naming directly to this panel: the request schema for `POST /rest/search/v3/passages/retrieve` is genuinely different from this app's other Search API v2 calls. `pipeline` is silently ignored; `aq`/`cq` are silently ignored; the real scoping field is `filter` (e.g. `@pokemonname=="Eevee"`), and `localization` is required but undocumented as such on the console-facing model docs — found by testing the live endpoint, not by reading the model-setup guide (`docs/adr/0008`). A full point of view on RGA vs. Passage Retrieval, including where CPR is the better fit (RAG pipelines, tabular content, auditability), is written up in `docs/passage-retrieval-pov.md`.
- **A real design decision worth surfacing, not in the original scope list**: the evolution chain originally planned to resolve each evolution target's image via a second Coveo query per name. That approach can't distinguish regular Raichu from Alolan Raichu — both resolve to the same `pokemonname=="Raichu"` document with one image. Switched to extracting the sprite URL directly from the evolution-chart markup at crawl time instead, which captures both distinct sprites because they're genuinely different `<img>` elements on the same source page, even though they share a display name. A concrete example of a Coveo-native solution being wrong for a specific data shape, and a crawl-time fix being the better one.

## 4. What was learned

### The centerpiece: RGA and Passage Retrieval content quality — a real V1 → diagnosis → V2 story, still open

**V1.** Both models built and technically working, but the reported complaint was real: RGA returning "too much raw Pokémon data," Passage Retrieval returning "random text."

**Diagnosis, not guessing.** Before changing anything, opened Content Browser's Quick View on a real live item (Charizard) to see exactly what was indexed into `body`. It was the entire rendered page — including something not anticipated going in: an "Answers to Charizard questions" block of unrelated PokéBase community-forum thread titles (e.g. *"Why is non-mega Charizard in OU, while Typhlosion is in NU?"*), sitting in the same wrapper `<div>` as the Locations table. That's almost certainly the concrete source of the "random text" complaint — off-topic community discussion, not Pokémon fact content at all.

**V2.** Three `exclude` rules added to the Web Scraping Configuration JSON — a real, documented schema key (`docs.coveo.com/en/mc1f3573`), not a GUI toggle:

- a `data-table` class match, removing Moves-learned and Sprites tables
- a `type-table-pokedex` class match, removing the (already-redundant, unreadable-as-flattened-text) Type-defenses grid
- an XPath sibling-of-`dex-locations` match, removing Locations and the PokéBase block together, since they share one wrapper `<div>` and no shared CSS class distinguishes them

Deliberately **kept** in `body`: the vitals/training/breeding tables (short, readable flattened), 30+ per-game flavor-text entries (genuine content), name origin and other-languages sections.

**Validated three independent ways, not just asserted:**

1. Quick View on Charizard and (separately) Charjabug post-rebuild — targeted sections gone, kept content intact.
2. Chunk Inspector, Item unique ID mode, against `Pokedex RGA` — Charizard's 7 real chunks confirmed zero Moves/Sprites/Type-defenses/Locations/PokéBase content in any of them.
3. A live behavioral check against the actual product: asked `/search`'s generated answer "what moves does Charizard learn" — got back a correct, grounded *"Specific levels not provided"* rather than either a full move-table dump or a fabricated answer.

**A second-order finding the diagnosis didn't anticipate, still genuinely open.** Chunk Inspector on a real Search ID for the same query surfaced off-topic chunks from unrelated Pokémon (Charjabug, Shellder) ranking almost as high as Charizard's own chunks, with 2 of the 5 chunks actually sent to the LLM being off-topic. First hypothesis was a relevance-ranking problem — tried lowering RGA's *Items to consider* from 100 to 20, which had **zero** effect on chunk ranking, immediately ruling that out. The real cause, found by comparing Charjabug's *currently indexed* body (confirmed clean by the same exclusion rules) against its *RGA chunk* (still contained real move-table rows that don't exist in that clean body): the exclusion rules are correctly applied index-wide, but RGA's own embedding cache for most of the 1025-item corpus is stale — generated before the exclusion rules existed. Charizard looked clean throughout only because it was the one item repeatedly re-queried during diagnosis. Passage Retrieval is worse: it's a fully separate model with its own independent weekly rebuild schedule, and the RGA prompt-instruction save that partially nudged RGA's own rebuild never touched CPR at all — confirmed live, CPR still returns a complete untrimmed Moves table and Type-defenses grid for the one item where RGA is already clean.

**Where this stands, told straight rather than smoothed over**: both models rebuild on a fixed weekly cycle by default, and no console-only lever forces an earlier full-corpus re-embed — `docs.coveo.com/en/nb6a0085` is explicit that this requires contacting the Account Manager for a different interval. The next scheduled rebuild and the presentation-slot booking deadline land in the same window. The action item — request an off-cycle rebuild of all three models (RGA, Semantic Encoder, CPR) — is filed but not yet resolved as of this writing.

This is the strongest material in this deck precisely because it isn't finished: a real diagnose → fix → verify → *new problem surfaces* → root-cause → open production risk arc, not a staged success story.

### Prototype vs. production — this project's actual gaps, not a generic list

- **Content governance**: exclusion rules are hand-derived XPath/class selectors against today's pokemondb.net markup — a real site redesign breaks them silently until the next Quick View check, no automated drift detection exists.
- **Model freshness**: weekly-only rebuild cycle with no faster lever short of an Account Manager request — fine for a static reference dataset like this one, not acceptable for content that changes daily.
- **Evaluation**: verification here was targeted spot-checks (Quick View, Chunk Inspector, one live query) on a handful of Pokémon known to matter for the diagnosis, not a systematic scored evaluation set across many queries — real evidence, but not a repeatable evaluation framework.
- **Hosting/CI**: GitHub + CI are live (lint, typecheck, unit tests, a pre-commit coverage guard); Vercel deploy is still pending; no formal security review has been run against the deployed app yet.
- **Auth**: a single static "Anonymous search" API key in direct mode (`docs/adr/0007`) — workable for a public demo, not a production multi-tenant security posture.

### Anticipated Q&A — prep notes, not delivered live

- *"Why RGA over plain search?"* — RGA hands back a synthesized, ready-to-display answer; the trade-off is giving up control over exact phrasing and source selection. Full argument in `docs/passage-retrieval-pov.md`.
- *"When would you not use RGA?"* — when a downstream consumer (an agent, a compliance requirement, a UI that wants to show its sourcing) needs the raw retrieved evidence itself rather than someone else's summary of it — that's Passage Retrieval's case, not RGA's.
- *"What if there were 10 million documents instead of 1,000?"* — speaks directly to `docs/adr/0003`'s crawler-vs-Push trade-off: a crawler's console-configured extraction rules don't scale as an engineering-reviewable, testable artifact the way a Push-based pipeline in our own code would. At this project's scale that trade-off was fine; at 10M documents with a real content team, Push (or a hybrid) becomes more defensible.
- *"How do you reduce hallucination / know retrieval quality is good?"* — the RGA/CPR staleness saga above is the honest answer: check the actual index (Quick View), check the actual chunks (Chunk Inspector), check the actual live answer, in that order, and never trust a model's own status indicator as ground truth.
- *"Would you deploy this exactly as-is to a customer?"* — no; see the prototype-vs-production list above, which was written from this project's own real gaps, not a hypothetical.
