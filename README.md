# Coveo Pokemon Challenge

Take-home assessment for a Coveo Forward Deployed Engineer role. Next.js + [`@coveo/headless`](https://docs.coveo.com/en/headless/latest/) search frontend over pokemondb.net. Full requirements: `docs/`.

## Status

Connected to a live Coveo org: search, Type/Generation facets, and Pokemon images all return real results end to end. Query Suggest typeahead, RGA, GitHub/Vercel hosting, and Passage Retrieval are not built yet. Current state and next steps: `docs/HANDOFF.md`.

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
cp .env.example .env.local   # fill in from the Coveo admin console
npm run dev
```

`.env.example` documents each variable, including the dual client auth mode (`NEXT_PUBLIC_COVEO_AUTH_MODE`, `NEXT_PUBLIC_COVEO_ACCESS_TOKEN`) and the two server-only keys (`COVEO_API_KEY`, `COVEO_ML_API_KEY`) — see `docs/adr/0006-split-api-key-for-content-preview.md` and `docs/adr/0007-dual-auth-mode-direct-vs-server-token.md` for why there are two of each. See `docs/coveo-source-spec.md` for the source/field configuration this frontend expects.

Without those env vars, the app builds and runs fine but shows a "Coveo isn't configured" banner instead of the search UI — required so `npm run build` / Vercel deploys succeed with no env vars set. For the detailed `src/` file map, see `AGENTS.md`.

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
