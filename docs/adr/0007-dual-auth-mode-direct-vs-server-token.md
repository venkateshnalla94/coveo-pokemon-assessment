# 0007: Dual client auth mode — "direct" key vs "server"-minted token

Status: Accepted

## Context

ADR-0005 built server-side search-token minting (`GET /api/token`, using `COVEO_API_KEY`) so the browser never holds a long-lived Coveo credential — only a short-lived token, renewed on demand via Headless's `renewAccessToken` middleware.

Wiring up real Stage D credentials (`docs/plan101.md` D1–D4) showed this can't work with any key obtainable from this org's console. Direct evidence:

1. `POST /rest/search/token` (what `/api/token` calls) returned `403 Access Denied` for every request, including one with an empty body — failing before hub/pipeline are even evaluated.
2. Calling Coveo's own privilege-introspection endpoint (`POST /rest/organizations/<org>/privileges/token?accessToken=<key>`, per docs.coveo.com/en/109) against the "Anonymous search"-purpose key returned:
   ```json
   [{"targetDomain":"EXECUTE_QUERY","owner":"SEARCH_API"},
    {"type":"EDIT","targetDomain":"ANALYTICS_DATA","owner":"USAGE_ANALYTICS"},
    {"targetDomain":"IMPERSONATE","owner":"USAGE_ANALYTICS"}]
   ```
3. Per Coveo's documented example of a platform-token privilege set, minting a search token requires `IMPERSONATE` under owner **`SEARCH_API`**. The key's `IMPERSONATE` privilege is scoped to owner `USAGE_ANALYTICS` instead — a different privilege (analytics-reporting impersonation) that doesn't grant token-minting rights at all.
4. Custom-purpose keys can't fill this gap either (see ADR-0006): Execute queries and Analytics-Push are template-locked, and no template on this org bundles `SEARCH_API/IMPERSONATE` without also being "Authenticated search" (which assumes a real user identity, not applicable here).

So: `/api/token`'s minting call cannot succeed with any key this console will currently issue. This may be a limitation specific to this trial org/console build rather than a durable platform fact — flag it as unverified-elsewhere if it comes up in the Topic 1 deck.

Separately, this also **revises** something asserted in the D1 conversation: the `IMPERSONATE` privilege sitting on the Anonymous search key was flagged as an unwanted-but-inert security overreach (a key that could impersonate arbitrary users, just never exercised by app code). That assessment was wrong in a specific way — it isn't the powerful cross-user impersonation privilege at all; it's a narrower, analytics-scoped one, and it happens to be exactly why token-minting fails. The residual-risk framing doesn't apply; the real story is "wrong-flavor privilege, harmless either way."

## Decision

Support two client auth strategies, selected by `NEXT_PUBLIC_COVEO_AUTH_MODE`, rather than deleting ADR-0005's server-minting code or forcing a single answer before it's clear which one this org can actually run:

- **`direct`** (current default): `src/coveo/engine.ts` configures Headless with `accessToken: NEXT_PUBLIC_COVEO_ACCESS_TOKEN` directly — a static credential, no minting round-trip. This is what Coveo's own docs describe an "Anonymous search"-purpose key as being *for*: query + analytics privileges only, explicitly safe to expose in client JS (see ADR-0004's original reasoning, which this reinstates for the reason ADR-0004 predicted its own supersession under different conditions than actually occurred). `NEXT_PUBLIC_COVEO_ACCESS_TOKEN` holds the same value as `COVEO_API_KEY` — same key, two roles, not a rotation-tracking concern at this stage.
- **`server`**: unchanged from ADR-0005 — placeholder token + `renewAccessToken` hitting `/api/token`. Kept fully in place, untouched, so flipping one env var is the entire migration path the day a token-minting-capable key exists (e.g. a different template, a different org, or Coveo support provisioning one).

`resolveCoveoConfig()` in `src/coveo/config.ts` resolves `authMode` (default `"direct"` for any unrecognized/unset value) and `accessToken`, using the same literal `process.env.NEXT_PUBLIC_X` pattern established for `organizationId` — necessary for Next.js's build-time inlining to actually embed these values in the client bundle (see that file's comments for the failure mode this avoids).

`resolveServerCoveoConfig()`'s `configured` flag was also narrowed to require only `organizationId`, not `apiKey` — it previously would have made `/api/passages` incorrectly report "not configured" whenever `COVEO_API_KEY` is unset, which is now the normal case in `direct` mode. `apiKey` and `mlApiKey` are each checked individually by the routes that actually need them.

## Consequences

- `/api/passages` (Passage Retrieval) is unaffected by this choice — it already authenticates directly with `COVEO_ML_API_KEY` as a bearer credential, no minting step involved either way.
- RGA is likewise unaffected — RGA answers ride on the normal search response via the pipeline association, so whichever key the client authenticates with (direct or minted) is sufficient once Execute queries works.
- `direct` mode means a real, working Coveo credential sits in the client bundle, visible via devtools. This is by design and matches the privilege tier Coveo scoped the key to, not an oversight — worth stating explicitly in the Topic 1 deck alongside the introspection evidence above, since "there's an API key in the browser" reads as alarming without that context.
- `server` mode is unverified end-to-end on this specific org (it was fully built under ADR-0005 but never successfully exercised against real credentials, since no compatible key exists yet) — don't claim it as demonstrated/working without testing it against a key that actually has `SEARCH_API/IMPERSONATE`.
- Two credentials now needed in `.env.local` for `direct` mode's happy path (`NEXT_PUBLIC_COVEO_ACCESS_TOKEN` and `COVEO_ML_API_KEY`), plus an unused `COVEO_API_KEY` kept around only for a future `server`-mode flip.
