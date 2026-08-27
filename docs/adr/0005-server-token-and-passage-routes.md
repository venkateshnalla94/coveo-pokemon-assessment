# 0005: Server-only token minting and Passage Retrieval routes

Status: Accepted; the single-`COVEO_API_KEY` design in "Consequences" is superseded by ADR-0006, which splits it into `COVEO_API_KEY` + `COVEO_ML_API_KEY`. Separately, ADR-0007 found this org's console can't issue a key `/api/token`'s minting call will accept at all, so the `/api/token` route built here is currently dormant, kept for a future "server" auth mode — see ADR-0007 for the live default.

Status: Accepted

## Context

ADR-0004 predicted its own trigger: "If a future requirement needed a real secret (e.g. a Search API key with broader privileges than a search token should have, or server-only Passage Retrieval calls), that call would need a Next.js Route Handler acting as a proxy." Two such requirements now exist:

- Passage Retrieval (`POST /rest/search/v3/passages/retrieve`, Phase 5 bonus tier) requires the *Machine Learning – Allow content preview* privilege on the API key used to call it. That privilege is broader than a public search token should ever carry, and shipping a key with it into a browser bundle would let anyone with devtools open extract and reuse it outside this app.
- Analytics is now enabled (C8) with `renewAccessToken` configured on the client engine (see `src/coveo/engine.ts`), which means the client needs a way to fetch a fresh, short-lived search token without a long-lived credential baked into `NEXT_PUBLIC_*` env vars.

Both need a privileged, server-held API key (`COVEO_API_KEY`, never `NEXT_PUBLIC_*`) that a Route Handler can hold but a browser bundle can't.

## Decision

Add exactly two server routes, both under `src/app/api/`:

- `GET /api/token` — mints a short-lived Coveo search token server-side using `COVEO_API_KEY`, and returns `{ token, organizationId }`. The client engine's `renewAccessToken` callback calls this on init (against a placeholder token) and again whenever the Search API responds with an expired-token error.
- `POST /api/passages` — proxies `POST /rest/search/v3/passages/retrieve` server-side using `COVEO_API_KEY`, with a capped/sanitized request body and a per-IP in-memory rate limit (see comments in `src/app/api/passages/route.ts` for the single-instance caveat).

Every other Coveo call — actual search queries, facets, analytics events — still goes straight from the browser to the Search API via the short-lived token these routes mint, exactly as ADR-0004 originally decided. ADR-0004's body is left unedited; only a one-line superseded-status note was added at its top, because an ADR that correctly predicted its own supersession is a more useful artifact intact than rewritten.

## Consequences

- Three lanes instead of two for these two calls specifically (Server / Domain SDK / UI), while the rest of the app stays at two lanes (Domain SDK / UI) — see `docs/standards-adoption.md` §9.
- `COVEO_API_KEY` needs Search – Execute queries, Analytics – Push, and ML – Allow content preview privileges; it must never be prefixed `NEXT_PUBLIC_` or set in any client-visible config.
- The client no longer holds any Coveo credential at rest — only a token with a short TTL, fetched on demand and renewed automatically by Headless's built-in renew-access-token middleware.
- `/api/passages`' rate limit is in-memory and per-instance; it degrades gracefully (best-effort throttle, not a hard guarantee) rather than requiring a shared store like Vercel KV before this ships, which would be over-engineering for a take-home assessment's traffic profile.
- If Passage Retrieval enablement never lands on the trial org (see docs/EXECUTION-PLAN.md's "Unverified" section), `/api/passages` will surface Coveo's 403 to the caller unchanged — sufficient to demonstrate the route was built and gated externally, per the assessment's stated floor for the bonus tier.
