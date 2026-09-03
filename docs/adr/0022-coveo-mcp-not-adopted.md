# 0022: Coveo MCP Server evaluated, not adopted

Status: Accepted

## Context

The user asked for a complete understanding of Coveo's Model Context Protocol
(MCP) offering and an analysis of whether it's useful (a) as a developer-tooling
aid while building this app, and (b) as something that could power an
end-consumer-facing experience. Full research is in
`docs/coveo-mcp-analysis.md` — this ADR records the resulting decision only.

Coveo's Hosted MCP Server (GA 2026-02-10) exposes four tools — Search, Fetch,
Answer, Passage Retrieval — that wrap the same Search API, RGA, and CPR
capabilities this app already integrates directly via `@coveo/headless`,
`src/coveo/engine.ts`, and `src/app/api/passages/route.ts`.

## Decision

Do not adopt Coveo MCP for either use case, for now.

- **FE-dev tooling**: not adopted. No Coveo-shipped MCP tool exposes source
  config, field mappings, or pipeline rules — the actual toil `docs/handoff/`
  documents (JS-rendered admin console drift, manual Web Scraping
  Configuration paste). The Hosted MCP Server's tools would only offer ad-hoc
  query testing against the live org, a minor convenience that doesn't
  address the documented pain points.
- **End-consumer use**: not adopted. Coveo positions MCP for consumer-adjacent
  scenarios, but always with the end user inside a third-party AI surface
  (ChatGPT Enterprise, Claude.ai, Copilot), never as a backend for a
  first-party in-app widget. This app's `GeneratedAnswer`/`AskAboutPokemon`
  already call RGA/CPR directly; MCP would be a separate access door onto the
  same capabilities, relevant only if an external agent needed to query this
  org independently of this app — not a current requirement.

## Consequences

- No application code changes. `docs/adr/0004`'s no-server-layer default and
  its narrow public-token scoping reasoning stay unchanged and un-superseded —
  MCP's documented security model (anonymous API key, or self-hosted patterns
  that default to no auth in dev) doesn't add anything beyond what ADR-0004
  already accounts for.
- Revisit if either condition in `docs/coveo-mcp-analysis.md`'s "What would
  change this conclusion" section becomes true (an admin/config-capable MCP
  tool ships, or a real requirement for third-party-agent access to this
  org's index emerges) — re-open with a superseding decision rather than
  silently adopting it.
