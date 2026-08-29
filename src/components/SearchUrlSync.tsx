"use client";

import {
  buildUrlManager,
  loadAdvancedSearchQueryActions,
  loadSearchActions,
  loadSearchAnalyticsActions,
} from "@coveo/headless";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getSearchEngine } from "@/coveo/engine";

/**
 * `URLSearchParams.toString()` serializes with `+` for spaces
 * (`application/x-www-form-urlencoded`, per the WHATWG URL spec). Headless's
 * `buildUrlManager` serializes/deserializes its own fragment with
 * `encodeURIComponent`/`decodeURIComponent` (`%20` for spaces —
 * `features/search-parameters/search-parameter-serializer.js`), which never
 * un-escapes `+` back into a space. Feeding it a `+`-encoded fragment left a
 * literal `+` embedded in any restored value that contains a space — e.g.
 * `sortCriteria=@pokemonname+ascending`, which the Search API 400s on
 * (`InvalidSortValueException`) since that's not a valid criterion string.
 * This reproduced for every sort option, not just an unsortable field, and
 * for any facet value containing a space (e.g. "Generation 9"). Re-encoding
 * each value here with `encodeURIComponent` instead of calling
 * `searchParams.toString()` matches Headless's own convention exactly.
 */
function toHeadlessFragment(searchParams: URLSearchParams): string {
  return Array.from(searchParams.entries())
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
}

/**
 * Owns URL <-> search-state sync on `/search` via Headless's real
 * `buildUrlManager` controller (confirmed against the installed
 * @coveo/headless@3.55.2 types — `controllers/url-manager/headless-url-manager.d.ts`
 * — this is the documented controller for exactly this purpose, not a
 * hand-rolled equivalent). `UrlManagerState.fragment` is a plain query
 * string ("q=pikachu&f[pokemontype]=Fire"), not a URL-encoding format tied
 * to a `#hash` — this app already uses `?q=` on `/search` (see
 * src/app/page.tsx's onNavigate), so the fragment is reflected into the
 * actual query string via Next's router, not `location.hash`.
 *
 * Also restores `AutomaticFacets.tsx`'s selections via `af-<field>=<value>`
 * (`SearchParameters.af`, `search-parameter-serializer.js`) — the same
 * mechanism as manual facets' `f-<facetId>=<value>`, confirmed live —
 * nothing special needed here for automatic facets specifically.
 *
 * Renders nothing; this is a controller-wiring component, not UI.
 *
 * ## Why `<SearchBox>` loses its `initialQuery` prop on this route
 * `buildUrlManager`'s constructor synchronously dispatches
 * `restoreSearchParameters` from the URL's current params (see
 * headless-url-manager.js), which sets the engine's query/facet/sort state
 * directly — before `<SearchBox>` ever builds its own `buildSearchBox`
 * controller. A `SearchBox` instance seeds its typed value from
 * `engine.state.query.q` at construction time (see
 * headless-core-search-box.js's `registerQuerySetQuery`), so as long as
 * `<SearchUrlSync>` renders (and therefore constructs its urlManager)
 * before `<SearchBox>` in the tree, `<SearchBox>` picks up the
 * URL-restored query text on its own, with no `initialQuery` prop needed.
 * Passing `initialQuery` here as well would fight this component for
 * ownership of query state (SearchBox.tsx:59-80's ref-guarded effect exists
 * for the home page's redirect-then-seed flow, not for this page) — see
 * docs/EXECUTION-PLAN-v2.3-frontend.md §5.
 */
export function SearchUrlSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [engine] = useState(() => getSearchEngine());

  // `getAq()`/`getCq()` (search-parameter-manager.js) read from
  // `state.advancedSearchQueries` and return `{}` if that slice doesn't
  // exist — so an `aq` param in the URL (e.g. the home page's Browse-by-type
  // pills, see browseByTypeUrl.ts) would silently never reach the actual
  // Search API request unless this reducer is registered first. The detail
  // and compare pages already call this loader before their own
  // `updateAdvancedSearchQueries` dispatch; `/search` needs the same
  // registration before `buildUrlManager`'s constructor (below) synchronously
  // dispatches `restoreSearchParameters`, or `aq` gets silently dropped on
  // the very first render — confirmed live: without this, an `?aq=...` URL
  // round-tripped straight back to a bare `/search` with nothing filtered.
  loadAdvancedSearchQueryActions(engine);

  // Built once; the constructor's own dispatch(restoreSearchParameters(...))
  // is what seeds query/facet/sort state from the URL this page was loaded
  // with — see the component doc comment above.
  const [urlManager] = useState(() =>
    buildUrlManager(engine, { initialState: { fragment: toHeadlessFragment(searchParams) } }),
  );

  // Tracks the last fragment this component itself reconciled (either
  // direction), so the two effects below never fight each other or loop:
  // an update we just pushed to the URL is recognized as "already in sync"
  // on the next render, and a synchronize() we just performed is likewise
  // recognized when urlManager's own subscribe listener re-checks.
  const lastFragment = useRef<string | undefined>(undefined);

  // URL -> state: fires on mount, and again on browser back/forward or any
  // other external navigation to /search with different params (e.g. a
  // future "browse by type" link). `restoreSearchParameters` alone doesn't
  // execute a request, so a real search action is dispatched right after —
  // the same pairing the detail page already uses (an `aq` dispatch
  // followed by an explicit submit), just via `loadSearchActions` directly
  // instead of a `SearchBox` controller, since there's no per-instance
  // query-set state to worry about going stale here.
  useEffect(() => {
    const fragment = toHeadlessFragment(searchParams);
    if (lastFragment.current === fragment) {
      return;
    }
    lastFragment.current = fragment;
    urlManager.synchronize(fragment);
    const { executeSearch } = loadSearchActions(engine);
    const { logInterfaceLoad } = loadSearchAnalyticsActions(engine);
    engine.dispatch(executeSearch(logInterfaceLoad()));
  }, [searchParams, urlManager, engine]);

  // state -> URL: a facet toggle, sort change, or search-box submit changes
  // the controller's fragment; reflect it into the address bar with
  // `replace` (not `push`) so every keystroke/facet click doesn't spam
  // browser history — matching how a real Coveo search page keeps facet
  // selections shareable/bookmarkable without becoming a back-button trap.
  useEffect(() => {
    return urlManager.subscribe(() => {
      const fragment = urlManager.state.fragment;
      if (fragment === lastFragment.current) {
        return;
      }
      lastFragment.current = fragment;
      router.replace(fragment ? `${pathname}?${fragment}` : pathname, { scroll: false });
    });
  }, [urlManager, router, pathname]);

  return null;
}
