# 0004: No server-side proxy/rate-limiting layer

Status: Superseded by ADR-0005 for token minting and Passage Retrieval; still accurate for query/analytics calls.

Status: Accepted

## Context

`docs/standards.md` (from a prior commerce project) has a security-boundary and rate-limiting layer in front of every privileged upstream call, because that project held real secrets (a private API key) that a server had to hold and a client could never see. The Coveo Headless SDK, by contrast, is designed to call the Search API directly from the browser using an API key scoped as a public search token (query + analytics privileges only, org- and pipeline-scoped, safe to ship in client-side JS) — see `src/coveo/engine.ts` and `NEXT_PUBLIC_COVEO_ACCESS_TOKEN` in `.env.example`.

## Decision

No server route proxies Coveo calls; no server-side rate limiting or secret redaction exists in this app.

## Consequences

- Simpler architecture: two lanes (Domain SDK / UI) instead of three (Server / Domain SDK / UI) — see `docs/standards-adoption.md` §9.
- No in-app rate limiting protects the Coveo org from abuse; that responsibility sits with Coveo's platform-side throttling and with scoping the search token's privileges correctly in the admin console (query only, no admin/index privileges).
- If a future requirement needed a real secret (e.g. a Search API key with broader privileges than a search token should have, or server-only Passage Retrieval calls), that call would need a Next.js Route Handler acting as a proxy, and at that point the rate-limiting/redaction patterns in `docs/standards.md` §4/§5 would become directly applicable again — this decision is scoped to the current search-token-only architecture, not a blanket rejection of that pattern.
