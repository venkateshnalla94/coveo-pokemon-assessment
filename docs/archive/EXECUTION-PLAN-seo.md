# Coveo Pokemon Challenge — Execution Plan: SEO

**Status: complete.** Phases 1–3 shipped (twenty-seventh session); Phase 2 shipped (twenty-eighth session); Phase 4 declined with reasoning, not built (twenty-ninth session). Archived here since all scope is now resolved — see `docs/HANDOFF.md`'s "Twenty-ninth session" entry for the close-out.

## Context

Requested as a standalone audit-and-plan session, not tied to an open assessment tier requirement. The brief: build an SEO specialist's checklist of what a frontend needs for great SEO, rate this repo against it, gap-analyze, then plan the fix — all before writing any code. The checklist and full gap analysis (30 items, 12 met / 13 missing / 3 partial-unverified / 1 N/A) live in the planning transcript for this session; this file carries only what's needed to execute.

**Headline finding driving this whole plan:** every route (`/`, `/search`, `/pokemon/[name]`, `/compare`) is a `"use client"` component. There is no `generateMetadata`, no `sitemap.ts`/`robots.ts`, no structured data, and no per-page `<title>`/`<meta description>` anywhere except the single static pair in `src/app/layout.tsx` — shared, unchanged, across all ~1025 Pokemon detail pages. Content only exists in the DOM after the Headless engine finishes an async Coveo query client-side. Everything else on the checklist (fonts, images, security headers, clean URLs, internal linking) was already solid going in — this plan doesn't touch those.

See `docs/adr/0019-server-rendered-seo-metadata-shim.md` for why a server-side metadata fetch is not a violation of ADR-0004's no-server-layer default, and where the line is drawn (metadata only, not a change to the client-rendered body — that's Phase 4 below, explicitly gated).

## Phase 1 — Metadata & crawlability foundation — DONE (this session)

- [x] `src/app/robots.ts` — allow all by default, reference the sitemap. Disallows `/search?`/`/compare?` (query-string prefix, not the bare path) and `/api/`.
- [x] `src/app/sitemap.ts` — enumerates `/`, `/search`, `/compare`, plus one entry per real `/pokemon/[name]` URL, sourced live from Coveo (`src/coveo/serverPokemonLookup.ts`'s `fetchAllPokemonNames`, paginated). `revalidate = 3600`. Verified live: 1028 URLs (3 static + 1025 real Pokemon).
- [x] `generateMetadata` on `src/app/pokemon/[name]/page.tsx` — implemented as planned, **with one deviation from this doc's original text**: uses the same `resolveServerCoveoConfig()` + `COVEO_API_KEY` server pattern as `/api/similar/route.ts`, not `NEXT_PUBLIC_COVEO_ACCESS_TOKEN` — see the Context note added to `docs/adr/0019-server-rendered-seo-metadata-shim.md`. Verified live against Pikachu: real title/description/canonical/OG/Twitter tags built from actual indexed fields.
- [x] Static `metadata` on `/search` and `/compare` — via new `layout.tsx` files in each route segment (not a restructure of the existing `"use client"` `page.tsx` files — Next allows a segment's layout to declare metadata independently). `/` keeps inheriting `layout.tsx`'s root metadata, which is itself now the real per-route default (see below), so no separate `/` override was needed.
- [x] `layout.tsx` metadata gains `metadataBase` (`src/siteUrl.ts`) plus default OG/Twitter tags using the real `home-banner.webp` asset (`CONTENT.art.homeBanner`), not a fabricated placeholder.

## Phase 2 — Structured data — DONE (twenty-eighth session)

- [x] `BreadcrumbList` JSON-LD on the PDP (`src/app/pokemon/[name]/page.tsx`'s `buildBreadcrumbJsonLd`), built server-side from the same `pokemon.name` `generateMetadata` already fetches via `fetchPokemonMetadata` — no second source of truth, no client-side Headless query needed.
- **Fixed "Home / `<Name>`" shape always**, regardless of `Breadcrumb.tsx`'s `from` prop: `from` reflects one visit's navigation history (arrived via a search-result click), while structured data describes the page's permanent site position, which doesn't include a transient "Search results" crumb. `Breadcrumb.tsx`'s own visible UI is unchanged and still shows the three-crumb trail when `from` is present — this is a JSON-LD-only decision.
- `item` URLs are absolute (`SITE_URL` + path), `name` uses `pokemon.name`'s canonical casing (matches `generateMetadata`'s canonical link), not the raw route param.
- Explicitly **not** building a "Pokemon" schema.org type: no such type exists, and the honest alternatives (`Product`, or a mismatched generic type) would fail this project's no-fabricated/no-mismatched-data principle and give crawlers nothing useful anyway.
- Verified live: `curl http://localhost:3101/pokemon/pikachu` shows a `<script type="application/ld+json">` with `{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://coveo-pokemon-assessment.vercel.app"},{"@type":"ListItem","position":2,"name":"Pikachu","item":"https://coveo-pokemon-assessment.vercel.app/pokemon/Pikachu"}]}`; `/pokemon/not-a-real-pokemon` still returns `404` (Phase 3 unaffected).

## Phase 3 — Soft-404 fix — DONE (this session)

- [x] `src/app/pokemon/[name]/page.tsx`'s server wrapper calls Next's `notFound()` when the server-side Coveo lookup used for `generateMetadata` finds nothing. Verified live: `curl -o /dev/null -w "%{http_code}"` on `/pokemon/not-a-real-pokemon` returns `404`, not `200`.

## Phase 4 — SSR body content — DECLINED (twenty-ninth session)

Not built. The gap this phase would have closed is real and was confirmed live (curling the built PDP for pikachu, twenty-seventh session): the server-rendered `<body>` briefly shows the client component's own "Pokemon not found" text before client-side hydration runs the actual Headless query — the `<head>` metadata is correct and complete, but a non-JS client would see that not-found text as the page's only real content. This is the exact, expected boundary of Phases 1–3 (metadata + status code only, per ADR-0019), not a regression.

**Decision: declined, not deferred.** Reasoning given to the user and accepted:
- The practical SEO gain is close to zero. Google's crawler executes JS and already gets full content via Phases 1–3's `<head>` metadata plus the client's own post-hydration render; a body that fills in a few hundred ms later doesn't move ranking.
- The cost is real: fetching the Pokemon server-side once and threading it into `PokemonDetailPageClient` as initial data, without duplicating or breaking the client's own Headless query (which also drives the Similar Pokemon carousel, Ask About Pokemon, and the exact-match safety-net re-check) is a bigger, more invasive change than Phases 1–3 combined.
- This is a take-home assessment app evaluated by people, not a production catalog competing for organic search ranking — the audience Phase 4 would serve (non-JS clients, search crawlers) isn't the actual audience of this project.

No code changes as a result of this decision.

## Verification — run this session, against the real production build with real org data

- [x] `npm run build && npm run start`, then verified with `curl`, not just a browser (the entire point is what a client without JS execution receives):
  - `curl -s http://localhost:3100/pokemon/pikachu | grep -i "<title>"` → `Pikachu Pokédex: stats, types, abilities | Pokedex Search` — Pikachu-specific, not the site-wide default. Description, canonical, OG/Twitter tags all also real and Pikachu-specific.
  - `curl -s http://localhost:3100/pokemon/not-a-real-pokemon -o /dev/null -w "%{http_code}\n"` → `404`
  - `curl -s http://localhost:3100/sitemap.xml` → 1028 real `<url>` entries (3 static + 1025 live-indexed Pokemon)
  - `curl -s http://localhost:3100/robots.txt` → `Sitemap:` line present, `Disallow: /search?` / `/compare?` / `/api/` present
  - `/search` and `/compare` titles also verified distinct and real (`Search Pokemon | Pokedex Search`, `Compare Pokemon | Pokedex Search`)
- [x] `npm test` (247 passed, incl. 15 new tests for `serverPokemonLookup.ts` and the PDP's `generateMetadata`/`notFound` wiring), `npm run test:coverage` (98.55%/92.94%/96.77%/98.53%, gate is 80% — well clear), `npm run lint`, `npm run typecheck` all clean.
- [ ] Manual click-through in a real browser (search, facets, compare) — **not done this session**: port 3000 was occupied by the user's own running `next dev` session, and re-using it for Playwright e2e or a manual check risked interfering with in-progress work. Verification instead relied on: the interactive client component code being a byte-for-byte move (`page.tsx` → `PokemonDetailPageClient.tsx`, only the function name changed) plus the curl-verified production build. Recommend a quick manual pass next session before considering this fully closed.

## Follow-up documentation

- [x] `docs/adr/0019-server-rendered-seo-metadata-shim.md` — wording correction applied twenty-seventh session (`COVEO_API_KEY` server pattern, not `NEXT_PUBLIC_COVEO_ACCESS_TOKEN` — see that file's Context section).
- [x] `docs/HANDOFF.md` — updated twenty-seventh and twenty-eighth sessions.

## Twenty-eighth session gates

`npm run lint`, `npm run typecheck`, `npm test` (247 passed, no new — `src/app/pokemon/[name]/page.tsx` isn't coverage-gated per `docs/standards-adoption.md` #12, and the file already had no test suite before this change), `npm run build` all clean.
