"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
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
  // Lazy init reads sessionStorage once, synchronously, on first client
  // render — avoids a flash of "empty tray" before an effect runs. Reading
  // `window.sessionStorage` directly here is safe: this component only
  // ever renders on the client ("use client" + no SSR-sensitive output).
  const [names, setNames] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readCompareNames(window.sessionStorage),
  );

  useEffect(() => {
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
