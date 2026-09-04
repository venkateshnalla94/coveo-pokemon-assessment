import type { ReactNode } from "react";

/**
 * Sticky wrapper around the facet list — plain layout, no controller logic
 * of its own. `top-28` (112px) is the real, measured combined height of the
 * now-pinned header (45px) + /search's own sticky search bar (67px) — see
 * search/page.tsx — so the rail docks flush directly underneath that stack
 * with no gap or overlap, not an approximate/arbitrary offset. Hidden below
 * `md`: on mobile/tablet, the same facets render inside `FilterDrawer`
 * instead (see docs/EXECUTION-PLAN-responsive-ui.md §1) — this is the only
 * call site, so hiding it here rather than at the page level keeps the
 * breakpoint rule next to the sticky rule it pairs with.
 */
export function FacetRail({ children }: { children: ReactNode }) {
  return <aside className="hidden md:sticky md:top-28 md:block md:self-start">{children}</aside>;
}
