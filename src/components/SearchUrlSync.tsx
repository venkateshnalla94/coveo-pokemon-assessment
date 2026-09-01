"use client";

import {
  buildUrlManager,
  loadAdvancedSearchQueryActions,
  loadSearchActions,
  loadSearchAnalyticsActions,
} from "@coveo/headless";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getSearchEngine } from "@/coveo/engine";
import { toHeadlessFragment } from "@/utils/searchUrlFragment";

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

  // Built once, but *not* via a useState lazy initializer — that would run
  // during render, and the constructor's own dispatch(restoreSearchParameters(...))
  // (still what seeds query/facet/sort state from the URL this page was
  // loaded with — see the component doc comment above) notifies every
  // subscriber on the shared engine synchronously, including any other
  // already-mounted controller of the same kind elsewhere in the tree (e.g.
  // AppHeader's own `<SearchBox>` on `/pokemon/[name]`, or a still-mounted
  // instance mid-route-transition). Notifying a different component's
  // subscriber from inside this component's render is exactly what trips
  // React's "Cannot update a component while rendering a different
  // component" warning — `useControllerState`'s `useSyncExternalStore` only
  // prevents tearing/loops, not that specific dev warning, since it still
  // schedules the other component's update on this render's call stack.
  // `useLayoutEffect` moves construction (and its dispatch) to just after
  // commit — no longer inside any component's render — while still running
  // before paint, so `SearchBox` elsewhere is corrected before the user
  // ever sees a stale value: same UX, no warning.
  const urlManagerRef = useRef<ReturnType<typeof buildUrlManager>>(undefined);
  const [urlManagerReady, setUrlManagerReady] = useState(false);

  // Tracks the last fragment this component itself reconciled (either
  // direction), so the two effects below never fight each other or loop:
  // an update we just pushed to the URL is recognized as "already in sync"
  // on the next render, and a synchronize() we just performed is likewise
  // recognized when urlManager's own subscribe listener re-checks.
  const lastFragment = useRef<string | undefined>(undefined);

  useLayoutEffect(() => {
    if (urlManagerRef.current) {
      return;
    }
    urlManagerRef.current = buildUrlManager(engine, {
      initialState: { fragment: toHeadlessFragment(searchParams) },
    });
    setUrlManagerReady(true);
    // Runs exactly once, on mount — searchParams is read only for its value
    // at construction time, matching the previous useState-initializer
    // behavior it replaces.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  // URL -> state: fires once urlManager exists, and again on browser
  // back/forward or any other external navigation to /search with different
  // params (e.g. a future "browse by type" link). `restoreSearchParameters`
  // alone doesn't execute a request, so a real search action is dispatched
  // right after — the same pairing the detail page already uses (an `aq`
  // dispatch followed by an explicit submit), just via `loadSearchActions`
  // directly instead of a `SearchBox` controller, since there's no
  // per-instance query-set state to worry about going stale here.
  useEffect(() => {
    const urlManager = urlManagerRef.current;
    if (!urlManager) {
      return;
    }
    const fragment = toHeadlessFragment(searchParams);
    if (lastFragment.current === fragment) {
      return;
    }
    lastFragment.current = fragment;
    urlManager.synchronize(fragment);
    const { executeSearch } = loadSearchActions(engine);
    const { logInterfaceLoad } = loadSearchAnalyticsActions(engine);
    engine.dispatch(executeSearch(logInterfaceLoad()));
  }, [searchParams, urlManagerReady, engine]);

  // state -> URL: a facet toggle, sort change, or search-box submit changes
  // the controller's fragment; reflect it into the address bar with
  // `replace` (not `push`) so every keystroke/facet click doesn't spam
  // browser history — matching how a real Coveo search page keeps facet
  // selections shareable/bookmarkable without becoming a back-button trap.
  useEffect(() => {
    const urlManager = urlManagerRef.current;
    if (!urlManager) {
      return;
    }
    return urlManager.subscribe(() => {
      const fragment = urlManager.state.fragment;
      if (fragment === lastFragment.current) {
        return;
      }
      lastFragment.current = fragment;
      router.replace(fragment ? `${pathname}?${fragment}` : pathname, { scroll: false });
    });
  }, [urlManagerReady, router, pathname]);

  return null;
}
