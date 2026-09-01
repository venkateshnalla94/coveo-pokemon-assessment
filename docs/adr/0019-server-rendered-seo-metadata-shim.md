# 0019: Server-rendered metadata shim for SEO, not a change to the client-only rendering model

Status: Accepted

## Context

`docs/EXECUTION-PLAN-seo.md` audits this app against a general frontend-SEO checklist and finds that every route (`/`, `/search`, `/pokemon/[name]`, `/compare`) is a `"use client"` component with no `generateMetadata`, no per-page `<title>`/description, and no sitemap/robots. Content only exists in the DOM after the Headless engine resolves an async Coveo query in the browser — the highest-value SEO surface, the ~1025 individual Pokemon detail pages, is functionally invisible to anything that doesn't execute JS and wait on a network round trip, and every one of them currently shares the same static title/description from `layout.tsx`.

ADR-0004's "no server layer" default is about not proxying privileged Coveo calls from a server — it exists because a real secret (`COVEO_API_KEY`) must never reach the browser, not because server-side code is disallowed in general. Fixing the SEO gap doesn't need a new secret: it needs a server-side data fetch, at request time, purely to compute `<title>`/`<meta description>`/canonical/OG tags and the sitemap's URL list before the page is sent. That's a rendering-strategy decision, not a security-boundary one, but it's still a real departure from "every route is a client component" and gets its own ADR per this project's process rule rather than a silent code change.

**Implementation note (added during Phase 1 build, not a revision of the decision):** this ADR originally said the server fetch would reuse the same public `NEXT_PUBLIC_COVEO_ACCESS_TOKEN` the client uses. Implementation instead reuses the exact `resolveServerCoveoConfig()` + `COVEO_API_KEY` pattern already established by `src/app/api/similar/route.ts` (and `/api/token`, `/api/passages`) — same trust boundary and privilege ("Anonymous search" purpose: Execute queries + Analytics-Push, server-only, never shipped to the browser), but it works regardless of which client `authMode` ("direct" vs "server") is active, since `NEXT_PUBLIC_COVEO_ACCESS_TOKEN` is only guaranteed to be set in "direct" mode. Strictly more robust, reusing an already-audited code path — not a new privilege.

## Decision

`src/app/pokemon/[name]/page.tsx` (and the static routes, more simply) gain a server-side `generateMetadata` export. The interactive body of each page stays exactly as it is today — a client component doing its own Headless query for the actual UI. The server-side fetch for metadata is a second, independent read (`src/coveo/serverPokemonLookup.ts`, using the server-only `COVEO_API_KEY` per the implementation note above) whose only output is the `<head>` metadata Next.js injects before the client component ever mounts. `src/app/sitemap.ts` and `src/app/robots.ts` follow the same rule: they read from Coveo server-side to produce real URLs, never a hardcoded/fabricated Pokemon list, consistent with this project's no-fabricated-data principle (`PRODUCT.md` Product Principles).

Explicitly **not** decided here: whether the PDP's actual body content (not just metadata) should also be server-rendered so non-JS crawlers see real text, not just a populated `<head>`. That's `docs/EXECUTION-PLAN-seo.md`'s Phase 4, scoped separately and requiring its own go/no-go, because it's a materially bigger change (fetching once server-side and threading initial data into the client component instead of a second independent fetch) with a real cost/benefit question for a take-home assessment app versus a production catalog that needs to rank.

## Consequences

- The "every page is a client component" pattern now has one narrow, named exception: server-side `generateMetadata`/`sitemap.ts`/`robots.ts` reads. This does not add a fourth server-route lane alongside `/api/token`, `/api/passages`, `/api/similar` (ADR-0005, ADR-0015) — there's no new route, just Next.js metadata-file conventions running server-side as the framework already expects.
- No new credential is introduced. The server-side metadata fetch reuses the existing server-only `COVEO_API_KEY`, already trusted by `/api/token`, `/api/passages`, and `/api/similar` for the identical "Anonymous search" privilege set — never shipped to the browser, no elevation.
- If Phase 4 (SSR body content) is ever greenlit, this ADR's "metadata only" boundary should be revisited/superseded rather than silently expanded.
