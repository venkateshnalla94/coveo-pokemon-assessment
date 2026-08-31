# 0015: `/api/similar` is a third server-route exception, for a different reason than the first two

Status: Accepted

## Context

ADR-0004's "no server layer" default has exactly two exceptions so far (ADR-0005, refined by ADR-0007/0008): `/api/token` and `/api/passages`. Both exist for the same reason — each needs a privileged, server-held `COVEO_API_KEY` that must never ship into a browser bundle.

`docs/archive/EXECUTION-PLAN-similar-pokemon-carousel.md` specs a third route, `/api/similar`, backing the PDP "Similar Pokemon" carousel (ADR-0014: a deterministic same-type Search API v2 query, no ML model). Unlike the first two, this call needs no privilege beyond ordinary `EXECUTE_QUERY` — the same privilege the public, client-safe `NEXT_PUBLIC_COVEO_ACCESS_TOKEN` already carries in "direct" auth mode. A plain `fetch()` straight from the browser to `platform.cloud.coveo.com/rest/search/v2`, bypassing Headless entirely, would work with no secret at all and would keep ADR-0004's original two-lane architecture intact for this feature.

The reason to route it through the server anyway is different: it's not a credential problem, it's a Headless-engine problem. The PDP page (`src/app/pokemon/[name]/page.tsx`) already runs one `buildResultList()` off the shared client engine singleton (`src/coveo/engine.ts`), driven by an effect that sets an exact-match `aq` (`@pokemonname=="<name>"`) and calls `submit()`. A second `buildResultList()`/`buildSearchBox()` pair on that same shared engine would dispatch its own `aq`/`executeSearch`, clobbering the first controller's query state — confirmed as a real constraint when the original "Similar Creatures tab" idea was scoped (see `docs/archive/EXECUTION-PLAN-similar-pokemon-carousel.md` §0). A second, independent Headless engine instance just for this one query was also considered and rejected as needless weight (a whole second engine, second field registration, second analytics config) for a single deterministic query with no facets, no paging, no suggestions.

## Decision

`/api/similar/route.ts` is added as a third server-route exception, modeled directly on `/api/passages/route.ts`'s shape (same `resolveServerCoveoConfig()` gate, same 503 response, same in-memory per-IP rate-limit bucket) for consistency with the existing pattern, even though its underlying reason is architectural (avoid a second controller/engine on the shared PDP engine) rather than credential-privilege (ADR-0005's reason). It authenticates with `COVEO_API_KEY`, the same key `/api/passages` already uses, rather than introducing a fourth credential.

## Consequences

- Four total lanes now touch a server route (`/api/token`, `/api/passages`, `/api/similar`, plus the still-client-side rest of the app) — `docs/standards-adoption.md` §9 should be read as "mostly two lanes, three narrow server exceptions," not "exactly two."
- A plain client-side `fetch()` against the public Search API v2 endpoint (no Headless, no server route) remains available as a lighter-weight alternative if the second-controller/second-engine concern above is ever revisited — noted here so a future session doesn't have to re-derive that this was a real option, just one weighed against the shared-engine constraint and the value of matching the existing `/api/passages` pattern.
- `/api/similar`'s in-memory rate limit has the same single-instance caveat as `/api/passages` (see that route's comment) — not a hard guarantee, best-effort only.
