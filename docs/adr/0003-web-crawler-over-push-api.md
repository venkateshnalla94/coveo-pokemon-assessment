# 0003: Web crawler over Push API

Status: Accepted

## Context

The challenge allows indexing pokemondb.net either via Coveo's Web Crawler or by pushing content directly through a Push source. pokemondb.net is a third-party site not owned by this project — there's no existing pipeline that already has structured Pokemon data to push.

## Decision

Use a Coveo Web Crawler source with a Web Scraping Configuration, scoped to `pokemondb.net/pokedex/*`, rather than writing a custom scraper that pushes documents via the Push API.

## Consequences

- Coveo's crawler and scraping configuration handle fetching, scheduling, and re-crawling — no custom scraping/indexing code to write or maintain.
- Field extraction (Type, Generation, image URL) depends on the Web Scraping Configuration's CSS-selector rules rather than code we control end-to-end — see `docs/coveo-source-spec.md` and `.claude/skills/pokemon-source-setup`.
- If pokemondb.net's HTML structure changes, extraction rules need updating in the admin console; a Push-based approach would have put that logic in our own code instead, which is more effort up front but easier to unit test. Accepted trade-off given the assessment's time box and the Push API being intended for content we already own/generate.
