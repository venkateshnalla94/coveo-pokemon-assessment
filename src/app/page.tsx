"use client";

import { buildQuerySummary, loadSearchActions, loadSearchAnalyticsActions, type QuerySummaryState } from "@coveo/headless";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowseByType } from "@/components/BrowseByType";
import { SearchBox } from "@/components/SearchBox";
import { isCoveoConfigured } from "@/coveo/config";
import { getSearchEngine } from "@/coveo/engine";

/**
 * Minimal home page: subhead + the search box (with Query Suggest
 * typeahead), a live indexed count, and a Browse-by-type grid. The actual
 * search executes on `/search`, not here — see SearchBox's `onNavigate`
 * prop and src/app/search/page.tsx. The page's own "Pokedex Search" h1 was
 * dropped in this change: AppHeader now carries that wordmark persistently
 * across every route, so repeating the identical text as a second heading
 * directly beneath it was pure duplication, not a second real heading.
 *
 * Always renders the search UI, even when Coveo isn't configured — SearchBox
 * itself falls back to local state and only surfaces a config-error popup
 * if the user actually tries to search, instead of the whole page being
 * replaced by a banner on load.
 *
 * The live count and Browse-by-type grid both need one empty-query search
 * on mount to have real data (docs/EXECUTION-PLAN-v2.3-frontend.md §7) —
 * dispatched directly via `loadSearchActions`, the same pattern
 * SearchUrlSync (Step 5) uses, rather than the engine's own
 * `executeFirstSearch()` guard, since that method only ever fires once for
 * the lifetime of the shared engine singleton and would silently no-op (and
 * leave a stale count) on a second visit to `/` later in the same session.
 * An empty query means RGA's "Query is not empty" condition never fires, so
 * nothing here renders half-built waiting on it (plan §1.3/§7).
 */
export default function Home() {
  const router = useRouter();
  const configured = isCoveoConfigured();

  const [engine] = useState(() => (configured ? getSearchEngine() : undefined));
  const [querySummary] = useState(() => (engine ? buildQuerySummary(engine) : undefined));
  const [summaryState, setSummaryState] = useState<QuerySummaryState | undefined>(
    querySummary?.state,
  );
  const hasSearched = useRef(false);

  useEffect(() => {
    if (!engine || !querySummary || hasSearched.current) {
      return;
    }
    hasSearched.current = true;
    const { executeSearch } = loadSearchActions(engine);
    const { logInterfaceLoad } = loadSearchAnalyticsActions(engine);
    engine.dispatch(executeSearch(logInterfaceLoad()));
    return querySummary.subscribe(() => setSummaryState(querySummary.state));
  }, [engine, querySummary]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
      <p className="mb-8 text-black/60 dark:text-white/60">
        Search every Pokemon indexed from pokemondb.net, powered by Coveo.
        {summaryState && summaryState.hasResults && (
          <>
            {" "}
            {summaryState.total.toLocaleString()} Pokemon indexed.
          </>
        )}
      </p>
      <SearchBox onNavigate={(query) => router.push(`/search?q=${encodeURIComponent(query)}`)} />
      {configured && (
        <div className="mt-12 w-full">
          <BrowseByType />
        </div>
      )}
    </div>
  );
}
