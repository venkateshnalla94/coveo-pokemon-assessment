"use client";

import {
  buildBreadcrumbManager,
  buildQuerySummary,
  buildSort,
  type BreadcrumbManagerState,
  type QuerySummaryState,
  type SortState,
} from "@coveo/headless";
import { useEffect, useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { getSearchEngine } from "@/coveo/engine";
import { SORT_OPTIONS } from "@/coveo/sortOptions";

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

  const [summaryState, setSummaryState] = useState<QuerySummaryState>(querySummary.state);
  const [breadcrumbState, setBreadcrumbState] = useState<BreadcrumbManagerState>(
    breadcrumbManager.state,
  );
  // Only the setter is used — `sort.isSortedBy()` is called directly at
  // render time below, this state's sole purpose is to force a re-render
  // whenever the sort controller's state changes.
  const [, setSortState] = useState<SortState>(sort.state);

  useEffect(() => querySummary.subscribe(() => setSummaryState(querySummary.state)), [querySummary]);
  useEffect(
    () => breadcrumbManager.subscribe(() => setBreadcrumbState(breadcrumbManager.state)),
    [breadcrumbManager],
  );
  useEffect(() => sort.subscribe(() => setSortState(sort.state)), [sort]);

  if (!summaryState.hasResults && !breadcrumbState.hasBreadcrumbs) {
    return null;
  }

  const activeSortOption =
    SORT_OPTIONS.find((option) => sort.isSortedBy(option.criterion)) ?? SORT_OPTIONS[0];

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-black/60 dark:text-white/60">
        <p>
          {summaryState.hasResults
            ? `Results ${summaryState.firstResult}-${summaryState.lastResult} of ${summaryState.total}`
            : null}
        </p>
        <label className="flex items-center gap-2">
          Sort by
          <select
            value={activeSortOption.id}
            onChange={(e) => {
              const option = SORT_OPTIONS.find((o) => o.id === e.target.value);
              if (option) {
                sort.sortBy(option.criterion);
              }
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

      {breadcrumbState.hasBreadcrumbs && (
        <div className="flex flex-wrap items-center gap-1.5">
          {breadcrumbState.facetBreadcrumbs.flatMap((breadcrumb) =>
            breadcrumb.values.map((value) => (
              <span key={`${breadcrumb.field}-${value.value.value}`} className="inline-flex items-center gap-1">
                <Chip label={`${value.value.value}`} variant="neutral" />
                <button
                  type="button"
                  aria-label={`Remove filter ${value.value.value}`}
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
                key={`${breadcrumb.field}-${value.value.start}-${value.value.end}`}
                className="inline-flex items-center gap-1"
              >
                <Chip label={`${value.value.start}-${value.value.end}`} variant="neutral" />
                <button
                  type="button"
                  aria-label={`Remove filter ${value.value.start}-${value.value.end}`}
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
            onClick={() => breadcrumbManager.deselectAll()}
            className="text-xs text-black/60 hover:underline dark:text-white/60"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
