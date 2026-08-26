# Coveo Pokemon Challenge

Take-home assessment for a Coveo Forward Deployed Engineer role. Next.js + [`@coveo/headless`](https://docs.coveo.com/en/headless/latest/) search frontend over pokemondb.net. Full requirements: `docs/`.

## Status

Coveo Cloud org access is pending. Everything not requiring a live org (frontend scaffold, crawler spec, presentation outlines) is in place; indexing and cloud-endpoint integration start once access arrives.

## Structure

- `src/` — Next.js + Coveo Headless SDK search frontend
- `docs/` — assessment instructions, the Coveo source/field-mapping spec, engineering standards adopted (`standards-adoption.md`), and architecture decision records (`adr/`)
- `presentation/` — outlines for the two panel presentation topics
- `.claude/` — project agents/skills covering indexing, frontend, hosting, and presentation prep
- `tests/unit/` — Vitest unit tests, mirroring `src/`'s structure (`tests/unit/coveo/` for `src/coveo/`, etc.)
- `tests/e2e/` — Playwright e2e smoke tests

## Setup

```bash
npm install
cp .env.example .env.local   # fill in once org access is granted
npm run dev
```

Fill in `.env.local` from the Coveo admin console once org access is granted (Organization > API Keys for a search-only key, org ID from the org switcher). See `docs/coveo-source-spec.md` for the source/field configuration this frontend expects.

Without those env vars, the app builds and runs fine but shows a "Coveo isn't configured" banner instead of the search UI — that's expected until org access lands, and is required so `npm run build` / Vercel deploys succeed with no env vars set.

## Source structure

- `src/coveo/engine.ts` — Headless search engine singleton (client-only)
- `src/coveo/config.ts` — `resolveCoveoConfig()`, single source of Coveo env config
- `src/coveo/fields.ts` — field names shared with the Coveo source config
- `src/coveo/mapPokemonResult.ts` — mapper boundary from a Headless `Result` to the local `PokemonItem` model
- `src/coveo/applicationError.ts` — normalized error type for Coveo-side failures
- `src/coveo/searchRenderState.ts` — discriminated-union render state (`loading`/`error`/`empty`/`success`)
- `src/components/SearchBox.tsx` — search input + typeahead (a single `SearchBox` controller covers both; see `.claude/skills/headless-search-page`)
- `src/components/Facet.tsx`, `FacetType.tsx`, `FacetGeneration.tsx` — facet controllers
- `src/components/ResultList.tsx` — result grid with images
- `src/app/pokemon/[name]/page.tsx` — Advanced-tier Pokemon detail page

## Testing

```bash
npm test              # Vitest unit tests
npm run test:coverage # Vitest with coverage (src/coveo/* only — see docs/standards-adoption.md #12)
npx playwright test   # e2e smoke tests
```

## Engineering standards

This project selectively adopts a broader standards playbook (`docs/standards.md`, from a prior commerce Coveo project) rather than applying it wholesale — see `docs/standards-adoption.md` for what was adopted, adapted, or explicitly skipped and why, and `docs/adr/` for the architecture decisions behind this app's shape.

## Git hooks

`npm install` wires a pre-commit hook (lint + typecheck) via `scripts/install-hooks.mjs`. Run it once after cloning if hooks aren't active (`git config core.hooksPath` should show `.githooks`).

## CI

`.github/workflows/ci.yml` runs lint, typecheck, unit tests, and build on push/PR.

## Learn more

- [Coveo Headless SDK docs](https://docs.coveo.com/en/headless/latest/)
- [Next.js documentation](https://nextjs.org/docs)
