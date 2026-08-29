import { buildFieldSortCriterion, buildRelevanceSortCriterion, SortOrder, type SortCriterion } from "@coveo/headless";
import { POKEMON_FIELDS } from "@/coveo/fields";

/**
 * Sort options for `/search`'s SearchSummaryBar — see
 * docs/EXECUTION-PLAN-v2.3-frontend.md §5. Kept out of the component so the
 * list of real, index-backed options has one home (docs/standards-adoption.md
 * #12: this is plain data/logic, not a component, so it stays unit-test-gated
 * under src/coveo/*).
 *
 * Every field used here must have "Sortable" enabled on the field in the
 * Coveo admin console — confirmed for `pokemondexnumber`/`pokemonstattotal`
 * (Integer fields, which this org's console ties sortability to as a side
 * effect) and, as of Phase v3.1, `pokemonname` too. No invented sort option
 * exists here that isn't backed by a real indexed, sortable field
 * (PRODUCT.md Principle 4). If a field here ever loses that setting or a new
 * option is added before the setting is enabled, `src/coveo/searchRenderState.ts`
 * and `SearchSummaryBar.tsx` fall back to relevance and surface a small
 * inline notice instead of blanking the whole results grid — see
 * `docs/adr/` / `docs/EXECUTION-PLAN-v3.md` Phase v3.1 for why that
 * resilience exists.
 */
export interface SortOption {
  id: string;
  label: string;
  criterion: SortCriterion;
}

export const SORT_OPTIONS: SortOption[] = [
  { id: "relevance", label: "Relevance", criterion: buildRelevanceSortCriterion() },
  {
    id: "name-asc",
    label: "Name A-Z",
    criterion: buildFieldSortCriterion(POKEMON_FIELDS.name, SortOrder.Ascending),
  },
  {
    id: "dex-number-asc",
    label: "Dex number",
    criterion: buildFieldSortCriterion(POKEMON_FIELDS.dexNumber, SortOrder.Ascending),
  },
  {
    id: "stat-total-desc",
    label: "Base stat total",
    criterion: buildFieldSortCriterion(POKEMON_FIELDS.statTotal, SortOrder.Descending),
  },
  {
    id: "speed-desc",
    label: "Speed (fastest first)",
    criterion: buildFieldSortCriterion(POKEMON_FIELDS.speed, SortOrder.Descending),
  },
];
