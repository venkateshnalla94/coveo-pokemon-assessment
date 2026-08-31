# CLAUDE.md

@AGENTS.md

This file adds Claude-specific process rules on top of `AGENTS.md`'s cross-tool facts (commands, repo map, conventions). Don't restate anything from `AGENTS.md`, `docs/HANDOFF.md`, `docs/plan101.md`, `docs/archive/EXECUTION-PLAN.md`, or `docs/archive/EXECUTION-PLAN-v2.md` here — link to them. Those files are the source of truth for current state; this file goes stale the moment it duplicates a fact that changes.

## What this is

A take-home technical assessment for a Coveo Forward Deployed Engineer (FDE) role (the "Pokemon Challenge"): a search experience over pokemondb.net built on the Coveo Cloud Platform via Headless. Full requirements: `docs/Pokemon Challenge (Pre-Sales) - 2026.txt`. Current build status and next steps: `docs/HANDOFF.md` — read it first each session, before touching the Coveo admin console or auth code.

## Process rules

- Before ending a session that changed org config, auth, or app-visible behavior, update `docs/HANDOFF.md` so the next session doesn't re-derive already-known facts.
- A new architectural decision, or a reversal of a previous one, gets a new file under `docs/adr/` — not a silent code change with just a comment.
- No fabricated data: every Pokemon name, type, generation, or answer shown in the UI must come from the real Coveo index or pokemondb.net, never invented placeholder content presented as real (see `PRODUCT.md` Product Principles).
- Keep the "no server layer" default (`docs/adr/0004-no-server-layer.md`, refined by ADR-0005/0007) as a constraint on any new design idea that would otherwise assume a backend — the two exceptions that exist (`/api/token`, `/api/passages`) are each backed by an ADR explaining why.
- Before suggesting or walking through any Coveo admin console action (source config, field mappings, IPEs, pipelines, ML model configuration), read the current docs.coveo.com documentation for that specific feature first — do not answer from training-data memory of the console, since it drifts (this org's console has already diverged from generic docs at least once, per `docs/HANDOFF.md`'s "Documentation findings" section). Give the actual steps as an explicit numbered sequence (menu path → field/option → value), not prose description, so it can be followed in the console directly. Log every doc page read that session under `docs/HANDOFF.md`'s "External docs.coveo.com pages read this session" section (page, why it was read, whether it matched or diverged from what was found live) — continuing the convention already established there, so the next session doesn't re-derive the same lookups.

## Working style

When the user proposes an approach, don't just implement it. Say whether it's a good idea and why, or name the tradeoff/risk if it isn't, before making the change. Then implement — this isn't a request for more confirmation round-trips, just for the reasoning to be on the table before code changes.
