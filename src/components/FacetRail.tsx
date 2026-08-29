import type { ReactNode } from "react";

/**
 * Sticky wrapper around the facet list — plain layout, no controller logic
 * of its own. `top-*` matches the page's own vertical padding so the rail
 * doesn't stick flush to the viewport edge.
 */
export function FacetRail({ children }: { children: ReactNode }) {
  return <aside className="md:sticky md:top-10 md:self-start">{children}</aside>;
}
