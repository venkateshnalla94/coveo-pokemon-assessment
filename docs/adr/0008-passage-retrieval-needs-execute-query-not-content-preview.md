# 0008: Passage Retrieval requires EXECUTE_QUERY, not ALLOW_CONTENT_PREVIEW

Status: Accepted, and the open question below is resolved — see "Update" at the end.

## Context

ADR-0005 stated that `POST /rest/search/v3/passages/retrieve` "requires the *Machine Learning – Allow content preview* privilege," and ADR-0006 built `COVEO_ML_API_KEY` (Custom purpose, `ALLOW_CONTENT_PREVIEW` only) specifically to call it. `/api/passages/route.ts` was written to authenticate with that key.

Investigating Stage E (Passage Retrieval, gated on a licensing question — see `docs/handoff/`), a direct test against the live org's Passage Retrieval endpoint found this assumption was wrong:

- Calling the endpoint with `COVEO_ML_API_KEY` (privileges: `[{"targetDomain":"ALLOW_CONTENT_PREVIEW","owner":"COVEO_ML"}]`, confirmed via the privilege-introspection endpoint) returned `403 Forbidden` immediately — rejected before the request even resolved the pipeline.
- Calling the same endpoint, same body, with `NEXT_PUBLIC_COVEO_ACCESS_TOKEN` (the "Anonymous search" key, `EXECUTE_QUERY` privilege — same value as `COVEO_API_KEY`) got past authentication and pipeline resolution, returning `422 UNPROCESSABLE_ENTITY: "This API requires a Passage Retrieval model associated to the pipeline."` — a real business-logic error, not a permission error.

So Passage Retrieval gates on `EXECUTE_QUERY` (the same privilege ordinary Search API calls need), not `ALLOW_CONTENT_PREVIEW`. This also means CPR is not blocked by the still-unsent Phase 0 licensing-enablement email — same finding as RGA in Stage D (D10) — the 403 was a key-privilege mismatch in this app's own code, not an org-level block.

## Decision

`/api/passages/route.ts` now authenticates with `COVEO_API_KEY` instead of `COVEO_ML_API_KEY`. `COVEO_API_KEY` in `.env.local` — previously left blank because "server" auth mode was never active and nothing else read it — is now populated with the same value as `NEXT_PUBLIC_COVEO_ACCESS_TOKEN` (the org's one "Anonymous search" key), matching the `.env.local` comment's original stated intent that they should match.

`COVEO_ML_API_KEY` and its config field are kept, unused for now, rather than deleted. This test only proved what's needed to *reach* the endpoint and get a non-403 response — it didn't prove a full successful retrieval (no CPR model existed yet to test against). It's possible a real retrieval with actual passage content also needs `ALLOW_CONTENT_PREVIEW` in addition to `EXECUTE_QUERY`, in which case the route would need a key carrying both — worth re-checking once the CPR model is built and associated, before removing the ML key from the config or the org.

## Consequences

- `/api/passages` now has a real chance of working once a CPR model exists, instead of always 403ing regardless of model/licensing state.
- `COVEO_API_KEY` is populated for the first time this session; the "server" auth mode path (ADR-0007) that also reads it remains dormant but is now exercisable if a compatible token-minting key is ever obtained.
- If a follow-up test after CPR model creation still 403s specifically on content retrieval (not model resolution), that confirms `ALLOW_CONTENT_PREVIEW` is additionally required, and `/api/passages` will need a key/token carrying both privileges — potentially hitting the same Custom-purpose template-lock problem ADR-0006 documents, since neither key alone currently carries both.

## Update (same session, after the CPR model finished building)

Re-tested both the raw endpoint and the app's own `/api/passages` route with `COVEO_API_KEY` alone, against the now-Active `Pokedex Passage Retrieval` model. Both returned `200` with real content: passage `text` (crawled markdown from the Eevee page), a `relevanceScore`, and `document.title`/`primaryid`. No 403, no degraded response.

This closes the open question: `EXECUTE_QUERY` is sufficient on its own. `ALLOW_CONTENT_PREVIEW` is not required for Passage Retrieval at all. `COVEO_ML_API_KEY` is confirmed unused by anything in this app — ADR-0006's original justification for creating it (a required key for `/api/passages`) no longer holds. Not deleting the key or the `mlApiKey` config field this session, since it's inert either way and removing it is a separate, non-urgent cleanup — but any future session touching `src/coveo/config.ts` or ADR-0006 should know this is now dead weight, not a live dependency.
