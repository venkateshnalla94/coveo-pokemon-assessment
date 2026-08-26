# 0001: Coveo Headless SDK over Atomic

Status: Accepted

## Context

The challenge allows either Atomic (prebuilt HTML web components, limited customization) or Headless (state-management engine, full control over UI/state, connects to the same Coveo APIs). This is an assessment for a Forward Deployed Engineer role, evaluated partly on a technical deep-dive to a Coveo-expert panel.

## Decision

Use Headless with a custom Next.js/React frontend rather than Atomic.

## Consequences

- More implementation work: every UI piece (search box, facets, result list) is hand-built against Headless controllers instead of dropped in as a web component.
- Full control over rendering, routing (the Pokemon Detail Page), and styling — not constrained to what Atomic's components expose.
- Demonstrates deeper platform understanding for the panel: Headless requires understanding the controller/state model directly (see `.claude/skills/headless-search-page`), where Atomic would abstract that away.
- Trade-off accepted deliberately: less customization would have shipped faster with Atomic, but the assessment explicitly rewards showing "how hands-on you can be."
