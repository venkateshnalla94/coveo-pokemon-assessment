import { buildNumericRange, type NumericRangeRequest } from "@coveo/headless";

/**
 * Explicit Speed facet ranges, consumed by `buildNumericFacet` (Headless's
 * real numeric-facet controller — see FacetSpeed.tsx; Type/Generation/
 * Abilities use the real regular `Facet` controller instead, there's no
 * hand-rolled facet type anywhere in this app). Deliberately NOT
 * `generateAutomaticRanges: true` (see
 * docs/EXECUTION-PLAN-v2.3-frontend.md §5's FacetSpeed note): an invented
 * bucketing scheme needs real, stated numeric boundaries the user can see
 * and reason about, not an index-computed scheme that could silently shift
 * between requests. `buildNumericRange` is Headless's own range-builder
 * helper, not a custom range type. Numeric labels only ("0-49"), never a
 * qualitative label like "Slow"/"Fast" — that would be an invented
 * classification (PRODUCT.md Principle 4).
 */
export interface SpeedRange {
  label: string;
  range: NumericRangeRequest;
}

export const SPEED_RANGES: SpeedRange[] = [
  { label: "0-49", range: buildNumericRange({ start: 0, end: 50 }) },
  { label: "50-89", range: buildNumericRange({ start: 50, end: 90 }) },
  { label: "90-119", range: buildNumericRange({ start: 90, end: 120 }) },
  { label: "120+", range: buildNumericRange({ start: 120, end: 999, endInclusive: true }) },
];
