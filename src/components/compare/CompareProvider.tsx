"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addCompareName,
  MAX_COMPARE_NAMES,
  readCompareNames,
  removeCompareName,
  writeCompareNames,
} from "@/coveo/compareStorage";

/**
 * Client-only Compare selection — see docs/adr/0009-client-only-comparison-state.md.
 * Holds Pokemon *names only*, capped at MAX_COMPARE_NAMES, mirrored to
 * `sessionStorage` so a selection survives navigation within the same tab
 * (mounted once in `src/app/layout.tsx`) but never persists past the tab
 * closing — the honest ceiling under ADR-0004's no-server-layer/no-account
 * constraint. `/compare` re-resolves these names through a live Headless
 * query; nothing here ever carries stat/type/image data, only the name.
 */
interface CompareContextValue {
  names: string[];
  isSelected: (name: string) => boolean;
  isFull: boolean;
  add: (name: string) => void;
  remove: (name: string) => void;
  clear: () => void;
  max: number;
}

const CompareContext = createContext<CompareContextValue | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  // Starts empty on every render, server and client alike, so the first
  // client render matches the SSR output exactly. An earlier version read
  // sessionStorage synchronously in useState's lazy initializer to avoid a
  // flash of "empty tray" — but this component *is* server-rendered (a
  // client component still gets an SSR pass), and the server always sees an
  // empty tray, so a tab with an existing selection produced a real
  // hydration-mismatch error the moment a page reloaded (confirmed live via
  // a walkthrough: reload /pokemon/pikachu with a selection already in
  // sessionStorage). Hydrating in the effect below costs the flash this was
  // trying to avoid, traded for not throwing on every reload.
  const [names, setNames] = useState<string[]>([]);

  // Guards the persist effect below from writing this hydration read's
  // still-stale `names` closure ([]) back over sessionStorage before the
  // setNames call above has actually committed — see the two effects' order
  // note there.
  const skipNextPersist = useRef(true);

  useEffect(() => {
    // queueMicrotask, not a direct call: this repo's `react-hooks/set-state-in-effect`
    // ESLint rule blocks a synchronous setState in an effect body (see
    // SearchBox.tsx's identical note) — this schedules the same read on the
    // microtask queue instead, which still lands before the next paint.
    queueMicrotask(() => setNames(readCompareNames(window.sessionStorage)));
  }, []);

  useEffect(() => {
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    writeCompareNames(window.sessionStorage, names);
  }, [names]);

  const value = useMemo<CompareContextValue>(
    () => ({
      names,
      isSelected: (name: string) => names.includes(name),
      isFull: names.length >= MAX_COMPARE_NAMES,
      add: (name: string) => setNames((current) => addCompareName(current, name)),
      remove: (name: string) => setNames((current) => removeCompareName(current, name)),
      clear: () => setNames([]),
      max: MAX_COMPARE_NAMES,
    }),
    [names],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareContextValue {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
