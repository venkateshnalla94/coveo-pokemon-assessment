# 0014: Similar/Recommended/Popular Pokemon — same-type query, not Content Recommendation

Status: Accepted.

## Context

`docs/archive/EXECUTION-PLAN-ml-recommendations.md` scoped which Coveo ML capability, if
any, should back three requested PDP/home surfaces — "Similar," "Recommended,"
and "Popular" Pokemon — against Coveo's own guidance that a Content
Recommendation (CR) model needs a usage-analytics dataset of roughly 10,000+
queries to produce reliably relevant output (confirmed by direct fetch of
`docs.coveo.com/en/3399`, not just a search snippet).

Checked the live org's Analytics → Reports → Summary dashboard (Activity tab)
this session: **1,200 search events, all-time** (since org creation, not a
30-day window). Two orders of magnitude below CR's stated threshold.

## Decision

**Branch B**, per the execution-plan doc's own framing:

- Ship "Similar" only, as a deterministic same-type Search API query
  (`docs/archive/EXECUTION-PLAN-similar-pokemon-carousel.md`, `/api/similar` route) —
  no ML model, no cold-start risk, always returns real data.
- Do not build "Recommended" or "Popular" as their own surfaces. A CR model
  fed 1,200 events would still return *something*, but it would be
  effectively guessing rather than reflecting real learned behavior — which
  fails this project's no-fabricated-data posture in spirit even though the
  mechanism itself is real Coveo ML.
- Enable Automatic Relevance Tuning (ART) independently of this decision —
  its own prerequisite (~100 search/click events, ~55 visits/day per
  `docs.coveo.com/en/3397`) is far lower than CR's and is very likely already
  cleared by this org's 1,200 events. ART improves ranking for every search
  query already flowing through the `Pokedex` pipeline, regardless of the
  recommendation-surface decision above.

## Consequences

- No new `/api/recommendations` route, no CR model, no second CR-dedicated
  query pipeline (`docs.coveo.com/en/1886` warns CR must not share the
  `Default`/existing pipeline — avoided entirely by not building it).
- `docs/archive/EXECUTION-PLAN-similar-pokemon-carousel.md` proceeds on its
  `/api/similar` route as the only data source, not a fallback alongside a
  CR-backed one.
- Revisit if usage analytics ever crosses roughly 10,000 queries — re-check
  the live Summary dashboard rather than assuming growth, and re-open this
  ADR with a superseding decision rather than silently swapping the data
  source.
