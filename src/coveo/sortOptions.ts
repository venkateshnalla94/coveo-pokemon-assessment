import { buildFieldSortCriterion, buildRelevanceSortCriterion, SortOrder, type SortCriterion } from "@coveo/headless";
import { POKEMON_FIELDS } from "@/coveo/fields";

/**
 * Sort options for `/search`'s SearchSummaryBar — see
 * docs/EXECUTION-PLAN-v2.3-frontend.md §5. Kept out of the component so the
 * list of real, index-backed options has one home (docs/standards-adoption.md
 * #12: this is plain data/logic, not a component, so it stays unit-test-gated
 * under src/coveo/*).
 *
 * Every field used here must have "Use for sorting" enabled in the Coveo
 * admin console — confirmed for `pokemondexnumber` and `pokemonstattotal` in
 * docs/HANDOFF.md (both are typed Integer, which this org's console ties
 * sortability to as a side effect — see docs/coveo-source-spec.md). No
 * invented sort option exists here that isn't backed by a real indexed,
 * sortable field (PRODUCT.md Principle 4).
 *
 * "Name A-Z" (`pokemonname`) was tried and dropped this session: live
 * against the org, selecting it 400s the Search API with
 * `InvalidSortValueException: Invalid sort criteria: "@pokemonname+ascending"`
 * — `pokemonname` doesn't have "Use for sorting" enabled (unlike
 * `pokemondexnumber`/`pokemonstattotal`, confirmed already done). That 400
 * flows straight into `deriveSearchRenderState`'s error branch and replaces
 * the entire results grid with "Search is temporarily unavailable" —
 * a real, user-facing break, not a cosmetic one. Re-add it once "Use for
 * sorting" is enabled on `pokemonname` in the admin console; until then,
 * shipping it would be offering a sort option PRODUCT.md Principle 4 would
 * call broken, not just "not yet real".
 */
export interface SortOption {
  id: string;
  label: string;
  criterion: SortCriterion;
}

export const SORT_OPTIONS: SortOption[] = [
  { id: "relevance", label: "Relevance", criterion: buildRelevanceSortCriterion() },
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
];
