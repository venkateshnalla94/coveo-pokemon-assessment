# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

The Next.js + Coveo Headless search app lives under `src/`. See `docs/EXECUTION-PLAN.md` for the phased build checklist. Coveo Cloud org access (trial invite) is still pending, which blocks indexing/crawling and cloud-endpoint integration; code-level work does not depend on it.

## What this is

This is a take-home technical assessment for a Coveo Forward Deployed Engineer (FDE) role, known as the "Pokemon Challenge." Full instructions live in `docs/`:
- `docs/Technical_Challenge_-_FDE.pdf` — overall process (submission, panel presentation logistics, two presentation topics)
- `docs/Pokemon Challenge (Pre-Sales) - 2026.txt` — the hands-on technical requirements

The mission: build a search experience over pokemondb.net using the Coveo Cloud Platform (a Coveo trial org) and either the **Atomic** (HTML markup UI) or **Headless** (state-management library for React/Angular/etc.) framework.

## Requirement tiers (from the challenge doc)

**Essential**
- Accept the Coveo Cloud Organization invite
- Install Atomic or Headless locally
- Index/crawl pokemondb.net — Pokemon pages only, excluding Moves/Types/other non-Pokemon pages
- Connect the local search page to the Coveo cloud endpoint
- Facet: filter by Pokemon Type
- Facet: filter by Pokemon Generation
- Display each Pokemon's picture in its search result

**Intermediate**
- Host code on GitHub (shareable link)
- Host the search app so it's publicly accessible

**Advanced** (optional but encouraged)
- Deploy Coveo RGA (Relative Generative Answering) for a generative experience
- Preload a Query Suggest model for type-ahead
- Add a Pokemon Detail Page for a single Pokemon
- Prepare the panel presentation (two topics, see below)

**Bonus**
- Build something on top of the Coveo Passage Retrieval API; understand it and have a point of view on future use cases
- Email Coveo with the Org ID to get Passage Retrieval enabled

If any optional section is skipped, be ready to justify why in the presentation.

## Panel presentation (25 min each, incl. Q&A)

1. **Technical deep dive** — not a demo. Walk a Coveo-expert audience through the configuration built, the architecture decisions, and the reasoning behind them.
2. **Escalation & Recovery** (operational leadership scenario) — a large customer's search platform is intermittently failing under peak traffic. Cover: root-cause analysis approach, short-term remediation plan, executive communications, and a recurrence-prevention plan.

## Key constraints / tips from the docs

- Crawler scope must be restricted to actual Pokemon pages on pokemondb.net (exclude Moves, Types, etc.) — use a web scraping configuration to extract fields and strip irrelevant page content.
- Coveo auto-extracts metadata into fields by default; specific data (e.g. type, generation, image) may need explicit field mapping/extraction rules.
- For fast iteration, create a separate source that indexes only a single Pokemon page, to avoid waiting on a full site crawl during development.
- The Coveo Cloud Platform has a built-in search page editor for quick testing — transfer the final code to the local install before submitting.
- docs.coveo.com is the primary reference and has GenAI-assisted search enabled.

## Blocked on

Coveo Cloud Organization access (trial org invite) is pending. Code-level setup (repo scaffolding, framework choice, local dev environment) can proceed without it; indexing/crawling and cloud-endpoint integration cannot start until org access is granted.

## Working style

When the user proposes an approach, don't just implement it. Say whether it's a good idea and why, or name the tradeoff/risk if it isn't, before making the change. Then implement — this isn't a request for more confirmation round-trips, just for the reasoning to be on the table before code changes.
