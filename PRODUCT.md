# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: a Coveo panel of technical and business reviewers evaluating a Forward Deployed Engineer (FDE) take-home assessment during a live presentation. Design decisions should optimize for this audience's read first — the "does this person understand customer-facing search UX" judgment. Secondary: an end user searching Pokemon, since the app is also publicly hosted and must function as a real search tool, not just a demo shell.

## Product Purpose

A search experience over pokemondb.net Pokemon pages, built on the Coveo Cloud Platform via the Headless SDK, submitted as a Coveo "Pokemon Challenge" take-home assessment. Success means demonstrating correct, idiomatic use of Coveo (indexing, facets, relevance, RGA, Query Suggest) inside a polished, restrained UI, plus a technical deep-dive presentation to a Coveo panel.

## Positioning

Not a commercial product — a working proof of a Coveo-powered search integration, built to the assessment's Essential/Intermediate/Advanced tiers (see docs/Pokemon Challenge (Pre-Sales) - 2026.txt). Its differentiator is fidelity to how a real Coveo customer implementation would be structured (thin client-side Headless integration, no server layer — see docs/adr/0004-no-server-layer.md), not visual novelty for its own sake.

## Operating Context

- Presented live to a Coveo panel (25 min incl. Q&A) as part of a two-topic presentation: a technical deep dive and an "Escalation & Recovery" operational scenario (unrelated to this app's UI).
- Also publicly hosted (Vercel) so reviewers can use it outside the live session.
- Connected to a live Coveo org: search, Type/Generation facets, and Pokemon images all return real results end to end. Current state and open items: `docs/HANDOFF.md`.
- Home page (`/`) hosts only the search box + Query Suggest typeahead; the actual results (facets, results grid, pagination, RGA) render on `/search?q=<term>` after a query is submitted or a suggestion is clicked. See `src/app/page.tsx` and `src/app/search/page.tsx`.
- A Pokemon detail page exists at `/pokemon/[name]`.

## Capabilities and Constraints

- Essential: index pokemondb.net (Pokemon pages only), Type facet, Generation facet, Pokemon image in each result — all verified working end to end against the live org.
- Advanced: the Pokemon detail page is built and verified. Coveo RGA (generative answer) and Query Suggest-powered typeahead are not built yet (sequencing, not an access blocker — see `docs/HANDOFF.md`).
- No server-side proxy or rate-limiting layer exists by design — Headless calls the Coveo Search API directly from the browser with a public, privilege-scoped search token (see docs/adr/0004-no-server-layer.md).
- Images: only `img.pokemondb.net` is allow-listed in CSP/`next.config.ts` `images.remotePatterns` — any other image source needs that allow-list extended.
- `strict: true` TypeScript; a type error is a build failure.

## Brand Commitments

- Working name in the UI: "Pokedex Search."
- No official Nintendo/Pokemon Company trademarked assets (logos, official character artwork beyond what pokemondb.net itself serves as the indexed source, the Pokeball trademark, official typefaces) — confirmed constraint, since the app is publicly hosted. Any Pokemon imagery used comes from what's actually indexed/scraped from pokemondb.net, not introduced separately.

## Evidence on Hand

- `docs/Pokemon Challenge (Pre-Sales) - 2026.txt` — the assessment's actual requirements.
- pokemondb.net itself — the crawl target and the implicit visual/content reference for what's being indexed.
- Live Coveo search results, facet values, and Pokemon images exist and are verified — use real observed data (e.g. screenshots in `docs/temp/`) as the reference, never fabricate example results, Pokemon data, or generated-answer text. RGA output doesn't exist yet (not built) — don't design against invented sample answers for it either. The unconfigured/empty states remain first-class, real states to design for (a visitor without env vars set still hits them).

## Product Principles

1. Optimize first for reading as a credible, restrained Coveo customer-style search implementation to expert reviewers — not for maximal Pokemon theming.
2. Never block the page on missing Coveo configuration; degrade to a working, honest UI and surface configuration problems contextually (e.g. only when the user takes an action that needs the engine), not as a blanket error screen.
3. Stay within the assessment's stated tiers (Essential → Intermediate → Advanced → Bonus) — added polish should serve those requirements, not invent unrelated features.
4. No fabricated data: every Pokemon name, type, generation, or answer shown must come from the real Coveo index or pokemondb.net, never invented placeholder content presented as real.
5. Keep the "no server layer" architecture (docs/adr/0004) as a hard constraint on any new design idea that would otherwise assume a backend.

## Accessibility & Inclusion

No automated accessibility (axe) gate exists in CI today. No user-specific accessibility requirement has been confirmed beyond standard semantic HTML and keyboard operability.
