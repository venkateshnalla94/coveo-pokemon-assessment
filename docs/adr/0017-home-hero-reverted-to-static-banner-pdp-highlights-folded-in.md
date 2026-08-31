# 0017: Home hero reverted to a static banner; `PdpHighlights` folded into the Overview tab/Hero

Status: Accepted

## Context

The nineteenth/twentieth sessions (`docs/archive/EXECUTION-PLAN-marketing-assets.md`) shipped a static home hero banner (`ImageSlot`) and icon-based `BrowseByType`. The twenty-first session then built two new pieces on top of that: a carousel version of the home hero (multiple rotating banner images), and a standalone `PdpHighlights` component on the Pokemon detail page surfacing fields (generation among them) that weren't already shown elsewhere. Both were built to close out `docs/archive/EXECUTION-PLAN-async-ui-states.md`/Doc 4's remaining scope.

A live product review with the user immediately after, in the same session, found both additions weren't earning their complexity:

- The home hero carousel competed with `BrowseByType` for the same "carousel" affordance on one page, and the rotating-banner treatment didn't have enough real content behind it to justify a second carousel component.
- `PdpHighlights` introduced a new PDP section for exactly one genuinely new fact (`generation`) — everything else in it duplicated data already visible in `PokemonHero` or the Overview tab's `PokemonProfilePanel`.
- Separately, the PDP's full-bleed photographic backdrop band (behind `PokemonHero`, requiring the sprite to overlap it via a negative top margin) read as a stylistic flourish rather than a functional layout, and looked inconsistent once the hero carousel above it was reconsidered.

## Decision

Reverted rather than iterated on in place, in the same session:

- **Home hero**: back to the single static `ImageSlot` banner (`src/app/page.tsx`). The carousel treatment moved to where it has real content to rotate through — `BrowseByType` became the carousel (`src/components/BrowseByType.tsx`, `embla-carousel-react`), not the hero.
- **PDP**: `PdpHighlights` deleted outright. Its one real new field, `generation`, folded into two existing surfaces instead of getting its own section — `PokemonHero`'s quick-facts row (`src/components/PokemonHero.tsx`) and the Overview tab's `PokemonProfilePanel`. The full-bleed backdrop band was dropped; `PokemonHero` became a two-column "commerce packshot" layout (large sprite panel left, identity/types/quick-facts right) instead of a single stacked column overlapping a background photo.
- **Layout width**: `max-w-6xl` widened to `max-w-7xl` across Home, `/search`, `/compare`, and the PDP, matching `AppHeader`'s and `CompareTray`'s existing container width — a small consistency fix noticed during the same review, not a separate decision.

## Consequences

- `BrowseByType` is now the only carousel on the home page — one carousel affordance, not two competing ones.
- The PDP has one fewer top-level section; `generation` is discoverable in two places a user is already looking (the hero's quick facts, the Overview tab) rather than a third dedicated block.
- `docs/architecture/01-home-page.md` and `docs/architecture/03-detail-page.md` describe the pre-this-ADR shape and need updating to match (tracked in the same cleanup pass this ADR was written for).
- No Coveo org/index/query change — this is presentation-layer only, same data as before.
