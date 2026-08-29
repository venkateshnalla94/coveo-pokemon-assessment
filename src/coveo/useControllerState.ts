"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

/**
 * The subset of a Headless controller this hook needs — every controller
 * (Facet, Pager, ResultList, SearchBox, ...) shares this shape.
 */
interface SubscribableController<TState> {
  state: TState;
  subscribe(listener: () => void): () => void;
}

function getServerSnapshot() {
  return undefined;
}

/**
 * Subscribes a component to a Headless controller's state via
 * `useSyncExternalStore` — React's own mechanism for external stores that
 * can notify synchronously from outside this component's render (e.g.
 * another controller's constructor dispatching mid-render). Extracted from
 * `SearchBox.tsx`, which hit this directly: a `.subscribe()` +
 * `useEffect`-driven `setState` there caused "Cannot update a component
 * while rendering a different component" once `SearchBox` was duplicated
 * into the persistent `AppHeader` layout (see docs/adr — controller-state
 * hook). Every other controller subscription that feeds React render state
 * should go through this hook instead of re-deriving the same fix (or not
 * noticing it needs one) at each call site.
 *
 * Three non-obvious things this hook exists to get right every time:
 * 1. A bare `controller.subscribe` reference loses its `this` binding (a
 *    class method) — must be called through the instance.
 * 2. Headless's `.state` getter builds a fresh object on every read, not a
 *    memoized/selector-cached value — handing it straight to
 *    `useSyncExternalStore`'s `getSnapshot` trips React's "getSnapshot
 *    should be cached" loop detection. Fixed by caching the last snapshot
 *    in a ref, refreshed only from inside the subscribe callback (i.e. only
 *    on a real store notification).
 * 3. The `subscribe` function passed to `useSyncExternalStore` must have a
 *    stable identity across renders — Headless's `subscribe()` invokes the
 *    listener once synchronously on subscribe, so a fresh identity every
 *    render causes React to resubscribe every render, each resubscribe
 *    re-triggering a synchronous notify: an infinite loop.
 *
 * `controller` may be `undefined` (e.g. Coveo isn't configured) — the hook
 * returns `undefined` in that case rather than requiring callers to guard.
 */
export function useControllerState<TState>(
  controller: SubscribableController<TState> | undefined,
): TState | undefined {
  const snapshotRef = useRef<TState | undefined>(controller?.state);

  const subscribe = useCallback(
    (callback: () => void) => {
      if (!controller) {
        return () => {};
      }
      return controller.subscribe(() => {
        snapshotRef.current = controller.state;
        callback();
      });
    },
    [controller],
  );

  return useSyncExternalStore(subscribe, () => snapshotRef.current, getServerSnapshot);
}
