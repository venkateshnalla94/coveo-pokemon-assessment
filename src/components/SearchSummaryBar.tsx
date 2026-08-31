"use client";

import {
  buildBreadcrumbManager,
  buildQuerySummary,
  buildSort,
  loadSearchActions,
  loadSearchAnalyticsActions,
} from "@coveo/headless";
import { useEffect, useState } from "react";
import { FilterDrawer } from "@/components/FilterDrawer";
import { Chip } from "@/components/ui/Chip";
import { CONTENT } from "@/content/pokedex";
import { clearBrowseByTypeFilter } from "@/coveo/advancedSearchQuery";
import type { CoveoSearchApiError } from "@/coveo/applicationError";
import { getSearchEngine } from "@/coveo/engine";
import { parseTypeFromAq } from "@/coveo/browseByTypeUrl";
import { SORT_OPTIONS } from "@/coveo/sortOptions";
import { useControllerState } from "@/coveo/useControllerState";

/**
 * Result count (`buildQuerySummary`) + active-filter breadcrumbs
 * (`buildBreadcrumbManager`) + a sort select (`buildSort`) — three real
 * Headless controllers confirmed against the installed
 * @coveo/headless@3.55.2 types, composed in one bar per
 * docs/EXECUTION-PLAN-v2.3-frontend.md §5.
 */
export function SearchSummaryBar() {
  const [engine] = useState(() => getSearchEngine());
  const [querySummary] = useState(() => buildQuerySummary(engine));
  const [breadcrumbManager] = useState(() => buildBreadcrumbManager(engine));
  const [sort] = useState(() => buildSort(engine));
  const [sortWarning, setSortWarning] = useState<string | null>(null);

  const summaryState = useControllerState(querySummary) ?? querySummary.state;
  const breadcrumbState = useControllerState(breadcrumbManager) ?? breadcrumbManager.state;
  // Only subscribed for re-renders — `sort.isSortedBy()` is called directly
  // at render time below, this state's sole purpose is to force a
  // re-render whenever the sort controller's state changes.
  useControllerState(sort);

  // No Headless controller owns the `advancedSearchQueries` slice (`aq`,
  // used by the home page's Browse-by-type pills — see
  // src/coveo/advancedSearchQuery.ts / docs/adr/0011), so subscribe to the
  // engine directly to notice when it's set or cleared.
  const [aq, setAq] = useState(() => engine.state.advancedSearchQueries?.aq);
  useEffect(() => {
    return engine.subscribe(() => {
      setAq(engine.state.advancedSearchQueries?.aq);
    });
  }, [engine]);
  const activeTypeFilter = parseTypeFromAq(aq);

  if (!summaryState.hasResults && !breadcrumbState.hasBreadcrumbs && !activeTypeFilter) {
    return null;
  }

  const activeSortOption =
    SORT_OPTIONS.find((option) => sort.isSortedBy(option.criterion)) ?? SORT_OPTIONS[0];

  const activeFilterCount =
    breadcrumbState.facetBreadcrumbs.length +
    breadcrumbState.numericFacetBreadcrumbs.length +
    breadcrumbState.automaticFacetBreadcrumbs.length +
    (activeTypeFilter ? 1 : 0);

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-black/60 dark:text-white/60">
        <p>
          {summaryState.hasResults
            ? CONTENT.search.resultsSummary(summaryState.firstResult, summaryState.lastResult, summaryState.total)
            : null}
        </p>
        <div className="flex items-center gap-3">
          <FilterDrawer activeFilterCount={activeFilterCount} />
          <label className="flex items-center gap-2">
            {CONTENT.search.sortByLabel}
          <select
            value={activeSortOption.id}
            onChange={(e) => {
              const option = SORT_OPTIONS.find((o) => o.id === e.target.value);
              if (!option) {
                return;
              }
              setSortWarning(null);
              sort.sortBy(option.criterion);

              // Fields can lose "Sortable" in the admin console (or a new
              // option can be added here before it's enabled) without a
              // build-time signal — see docs/coveo/sortOptions.ts's header
              // comment. Detect that live: wait for this dispatch's search
              // to settle, and if it errored specifically on the sort
              // criterion, fall back to relevance instead of leaving the
              // grid on `deriveSearchRenderState`'s error path.
              const unsubscribe = engine.subscribe(() => {
                if (engine.state.search.isLoading) {
                  return;
                }
                unsubscribe();
                const error = engine.state.search.error as CoveoSearchApiError | null;
                if (error?.type === "InvalidSortValueException") {
                  sort.sortBy(SORT_OPTIONS[0].criterion);
                  setSortWarning(CONTENT.search.sortUnavailableWarning(option.label));
                }
              });
            }}
            className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15 dark:bg-transparent"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          </label>
        </div>
      </div>

      {sortWarning && (
        <p className="text-xs text-amber-700 dark:text-amber-400" role="status">
          {sortWarning}
        </p>
      )}

      {(breadcrumbState.hasBreadcrumbs || activeTypeFilter) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeTypeFilter && (
            <span className="inline-flex items-center gap-1">
              <Chip label={`Type: ${activeTypeFilter}`} variant="neutral" />
              <button
                type="button"
                aria-label={CONTENT.search.removeFilterLabel(activeTypeFilter)}
                onClick={() => {
                  clearBrowseByTypeFilter(engine);
                  const { executeSearch } = loadSearchActions(engine);
                  const { logInterfaceLoad } = loadSearchAnalyticsActions(engine);
                  engine.dispatch(executeSearch(logInterfaceLoad()));
                }}
                className="text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
              >
                &times;
              </button>
            </span>
          )}
          {breadcrumbState.facetBreadcrumbs.flatMap((breadcrumb) =>
            breadcrumb.values.map((value) => (
              <span key={`${breadcrumb.facetId}-${value.value.value}`} className="inline-flex items-center gap-1">
                <Chip label={`${value.value.value}`} variant="neutral" />
                <button
                  type="button"
                  aria-label={CONTENT.search.removeFilterLabel(`${value.value.value}`)}
                  onClick={() => value.deselect()}
                  className="text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
                >
                  &times;
                </button>
              </span>
            )),
          )}
          {breadcrumbState.numericFacetBreadcrumbs.flatMap((breadcrumb) =>
            breadcrumb.values.map((value) => (
              <span
                key={`${breadcrumb.facetId}-${value.value.start}-${value.value.end}`}
                className="inline-flex items-center gap-1"
              >
                <Chip label={`${value.value.start}-${value.value.end}`} variant="neutral" />
                <button
                  type="button"
                  aria-label={CONTENT.search.removeFilterLabel(`${value.value.start}-${value.value.end}`)}
                  onClick={() => value.deselect()}
                  className="text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
                >
                  &times;
                </button>
              </span>
            )),
          )}
          {breadcrumbState.automaticFacetBreadcrumbs.flatMap((breadcrumb) =>
            breadcrumb.values.map((value) => (
              <span key={`${breadcrumb.facetId}-${value.value.value}`} className="inline-flex items-center gap-1">
                <Chip label={`${value.value.value}`} variant="neutral" />
                <button
                  type="button"
                  aria-label={CONTENT.search.removeFilterLabel(`${value.value.value}`)}
                  onClick={() => value.deselect()}
                  className="text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
                >
                  &times;
                </button>
              </span>
            )),
          )}
          <button
            type="button"
            onClick={() => {
              // Clear `aq` first so deselectAll()'s own executeSearch picks
              // it up in the same request instead of firing a second one.
              if (activeTypeFilter) {
                clearBrowseByTypeFilter(engine);
              }
              breadcrumbManager.deselectAll();
            }}
            className="text-xs text-black/60 hover:underline dark:text-white/60"
          >
            {CONTENT.search.clearAllLabel}
          </button>
        </div>
      )}
    </div>
  );
}
