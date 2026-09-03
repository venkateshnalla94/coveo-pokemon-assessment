# Coveo MCP Server — analysis for FE-dev tooling and end-consumer use

Research pass run 2026-09-02 (thirty-seventh session), via three parallel Explore
agents against docs.coveo.com, coveo.com, GitHub, npm, and Coveo's investor-relations
press release. Decision recorded in `docs/adr/0022-coveo-mcp-not-adopted.md`; this doc
is the supporting research, kept separate so the ADR stays short.

## What Coveo actually ships under "MCP"

Three distinct things exist, all under the Model Context Protocol name, none of them
an admin/config API:

### 1. Coveo Hosted MCP Server (the real product)

GA since 2026-02-10, per Coveo's [IR press release](https://ir.coveo.com/en/news-events/press-releases/detail/474/coveo-announces-hosted-mcp-server-to-expand-enterprise-ai).
Configured per-org in the Admin Console (regional endpoints: US, Canada, EU,
Australia), tied to a query pipeline. Exposes exactly four tools:

- **Search** — wraps the Search API for full-text search over indexed content.
- **Fetch** — retrieves a specific item by unique identifier.
- **Answer** — wraps the Answer API / Relevance Generative Answering (RGA).
- **Passage Retrieval** — wraps Passage Retrieval (CPR), the same capability
  behind this app's `/api/passages` route.

These are the same four API surfaces already integrated directly via
`@coveo/headless` and this app's own routes — MCP doesn't add a new capability,
it adds a new *transport* for LLM clients to call the same ones.

Auth: **anonymous API key** ("recommended for public sources that don't require
user authentication") or **OAuth** ("recommended for private sources"). Creating
the MCP configuration itself requires an admin-scoped "MCP Server configuration"
privilege in the Machine Learning domain — separate from the runtime key a
client uses to call the four tools.

Documented/tested clients (from the client setup page): Agentforce, ChatGPT
Enterprise, Claude Desktop, Microsoft Copilot Studio, Microsoft 365 Copilot,
Amazon Bedrock AgentCore, Amazon Quick Suite, Claude.ai, Cursor, Figma Make,
Gemini Enterprise, Visual Studio Code, Workato. **Claude Code is not named
anywhere in Coveo's docs.** A generic remote MCP endpoint (URL + API key or
OAuth) is architecturally compatible with Claude Code's own `claude mcp add
--transport http` mechanism, but that's an inference from how MCP works
generically, not a Coveo-tested or Coveo-documented path — Coveo's own docs
state the client list "is continuously evolving."

No page fetched states the transport protocol (stdio/HTTP/SSE) explicitly.
Given it's a multi-tenant hosted endpoint reached over the internet by
ChatGPT/Claude.ai/etc., Streamable HTTP is near-certain, but that's inference,
not a quoted fact — logged here as an open gap, not stated as verified.

Pricing: no separate SKU. Usage "counts toward existing consumption-based
licensing" of the Coveo AI-Relevance Platform. No admin-console tool exposes
source config, field mappings, or pipeline rules through MCP.

### 2. `coveo-labs/coveo-mcp-server` (GitHub, self-hosted reference)

Python project, three tools (`search_coveo`, `passage_retrieval`,
`answer_question`) — same three capabilities as Search/Answer/Passage above,
minus Fetch. README states explicitly: *"provided as-is, intended purely for
educational and exploratory purposes... not a production-ready product."*
**Archived 2026-06-16, now read-only.** Not something to build on.

### 3. `@coveo/gnosis` (npm)

A different kind of tool entirely: an MCP server that searches **Coveo's own
product documentation** (Headless/Atomic usage patterns), not an org's indexed
content. Five tools: `search_docs`, `get_component_example`,
`troubleshoot_issue`, `get_best_practices`, `discover_components`. Ships with
hardcoded demo credentials pointed at Coveo's public docs search index by
default; can optionally be repointed at a different org via env vars, but its
tool set (docs search, component examples) doesn't change — it stays a
documentation-search tool, not an admin/data tool. Single release ever
(`0.0.1`, 2025-06-05), unmaintained since; its linked source repo
(`github.com/coveo/yolo-mcp`) 404s. Not something to rely on.

## FE-dev tooling analysis

**Question asked**: could a coding agent (this one) connect to a Coveo MCP
server to introspect this org — fields, sources, pipelines, ML models — or
run test queries during development, instead of hand-navigating the admin
console or docs?

**Finding**: no. None of the three offerings above exposes source
configuration, field mappings, or pipeline rules as an MCP tool. The Hosted
MCP Server's four tools (Search/Fetch/Answer/Passage Retrieval) are query-time
only — they'd let a coding agent run ad-hoc searches against the live index
during development (e.g. confirming a query returns the fields/facets the
Next.js UI expects), which is a real but narrow convenience over hand-written
`curl` calls.

**Verdict against this project's actual documented pain points**: `docs/handoff/`
repeatedly records two specific toils — hand-verifying docs.coveo.com pages
against a JS-rendered admin console that has already diverged from generic
docs at least once, and manually pasting Web Scraping Configuration JSON into
the console UI to trigger a source rebuild. **Nothing in any Coveo-shipped MCP
tool touches source config or the admin console at all**, so neither pain
point is addressed. `@coveo/gnosis` (documentation search) is the closest
conceptual match to "help with docs toil," but it's unmaintained, points at
Coveo's own product docs rather than the admin console, and doesn't resolve
the JS-rendering/console-drift problem `docs/handoff/` describes.

## End-consumer analysis

**Question asked**: could Coveo's MCP offering power an end-consumer-facing
(site visitor) experience on top of this org, e.g. as the backend for a
conversational/agentic feature?

**Finding**: Coveo does market MCP for consumer-adjacent scenarios — its
[MCP marketing page](https://www.coveo.com/en/developers/mcp-server) lists
"Customer Support Agents" and "Shopper Assistant" among four target use cases,
and the [Commerce self-hosted MCP guide](https://docs.coveo.com/en/q3b90112/)
describes shoppers asking natural-language product questions. But in every
case, **the end user is inside a third-party AI surface** — ChatGPT
Enterprise, Claude.ai/Claude Desktop, Microsoft Copilot — that Coveo grounds
via tool-calling. No Coveo doc describes MCP as the backend for a first-party,
in-app widget on the site owner's own pages. The one closest example (the
Commerce ChatGPT-App guide) still puts the shopper inside ChatGPT, not inside
the commerce site itself.

**Architectural relationship to what this app already has**: this app's
`GeneratedAnswer` (RGA) and `AskAboutPokemon` (CPR, via `/api/passages`)
components already call the same underlying Answer API and Passage Retrieval
capability directly, via `@coveo/headless` and a scoped server route
(`docs/adr/0008`). MCP is not a replacement path for that integration — it's
a separate access door onto the same capabilities, useful only if some
*external* AI agent (not this app's own frontend) needs to query this org
independently, which isn't a current requirement.

**Security/scoping caveat**: no fetched doc describes rate limiting or
fine-grained content scoping for anonymous MCP consumers beyond "use an
anonymous API key" (Hosted MCP Server) or, for the self-hosted Commerce
pattern, an explicit warning that dev-mode servers can run with **no
authentication at all**, and that production hardening (OAuth 2.1, PKCE, an
external identity provider) is entirely the integrator's responsibility — none
of it provided by Coveo out of the box. This means `docs/adr/0004`'s reasoning
(scope the public token narrowly to query+analytics only, treat rate limiting
as Coveo's platform-side responsibility) remains fully applicable and is not
superseded by anything MCP adds; if anything, the self-hosted pattern's
looser defaults argue for even more care, not less, if this were ever adopted.

## Sources

**docs.coveo.com pages, fetch-verified this session** (content actually
rendered and read, not just a search snippet):

- [en/pboe0358](https://docs.coveo.com/en/pboe0358/) — "Get started with the
  Hosted Model Context Protocol (MCP) Server." Gave the 4-tool list and the
  four marketed use cases (research assistant, internal knowledge bot,
  autonomous support agent, legal assistant). Transport protocol not stated
  on this page — noted as a gap, not verified either way.
- [en/pbog0163](https://docs.coveo.com/en/pbog0163/) — "Set up Model Context
  Protocol (MCP) clients." Gave the full supported-client table and
  per-client auth method (API key vs. OAuth), including that Claude Desktop
  and Cursor support API-key auth only.
- [en/q1mb0212](https://docs.coveo.com/en/q1mb0212/) — "Manage Hosted Model
  Context Protocol (MCP) Server configurations." Gave the admin-console
  workflow, the two auth modes (anonymous API key / OAuth), and the
  "MCP Server configuration" privilege requirement.
- [en/q3cb0086](https://docs.coveo.com/en/q3cb0086/) — "Build a ChatGPT App
  with a self-hosted MCP server (TypeScript)," Coveo for Commerce docs.
- [en/q3b90112](https://docs.coveo.com/en/q3b90112/) — same tutorial, Python
  variant. Gave the "shoppers find products through natural-language
  conversations" framing, the no-auth-by-default dev-mode warning, and the
  production OAuth 2.1 hardening requirement.

**Non-docs.coveo.com sources, fetch-verified**:

- [Coveo IR press release](https://ir.coveo.com/en/news-events/press-releases/detail/474/coveo-announces-hosted-mcp-server-to-expand-enterprise-ai) —
  GA date (2026-02-10), "10 customers already leveraging" stat, CEO quote,
  consumption-based licensing statement.
- [coveo.com/en/developers/mcp-server](https://www.coveo.com/en/developers/mcp-server) —
  marketing page, four target-use-case list including "Shopper Assistant" and
  "Customer Support Agents," "secure by default" claim (no rate-limiting
  specifics given).
- [github.com/coveo-labs/coveo-mcp-server](https://github.com/coveo-labs/coveo-mcp-server) —
  README fetched via raw markdown; confirmed archived, "not production-ready"
  disclaimer, tool names, env vars.
- [npmjs.com/package/@coveo/gnosis](https://www.npmjs.com/package/@coveo/gnosis) —
  README, tool/resource list, version history (single 0.0.1 release).

## What would change this conclusion

- Coveo ships an MCP tool that reads/writes source configuration, field
  mappings, or pipeline rules — would directly address the documented
  admin-console toil and be worth re-evaluating for FE-dev use.
- A real requirement emerges for a third-party AI surface (ChatGPT, Claude.ai,
  an external agent) to query this org's Pokemon index independently of this
  app's own frontend — would make the Hosted MCP Server's end-consumer
  positioning directly relevant.
- Coveo documents Claude Code specifically as a tested MCP client, removing
  the current architectural-inference gap.

Re-open this analysis (and supersede `docs/adr/0022`) rather than silently
adopting MCP if any of the above becomes true.
