import type { ReactNode } from "react";

/**
 * Sticky wrapper around the facet list — plain layout, no controller logic
 * of its own. `top-*` matches the page's own vertical padding so the rail
 * doesn't stick flush to the viewport edge. Hidden below `md`: on mobile/
 * tablet, the same facets render inside `FilterDrawer` instead (see
 * docs/EXECUTION-PLAN-responsive-ui.md §1) — this is the only call site, so
 * hiding it here rather than at the page level keeps the breakpoint rule
 * next to the sticky rule it pairs with.
 */
export function FacetRail({ children }: { children: ReactNode }) {
  return <aside className="hidden md:sticky md:top-10 md:block md:self-start">{children}</aside>;
}
