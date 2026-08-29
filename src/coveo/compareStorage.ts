/**
 * Pure helpers for the Compare feature's `sessionStorage`-backed selection
 * state — see docs/adr/0009-client-only-comparison-state.md and
 * docs/EXECUTION-PLAN-v2.3-frontend.md §6. Kept out of
 * `CompareProvider.tsx` so the add/remove/cap logic is unit-testable
 * without a DOM (docs/standards-adoption.md #12: components are e2e-only,
 * plain logic like this belongs under src/coveo/*).
 *
 * `sessionStorage`, not `localStorage`, is the deliberate choice (ADR-0009):
 * tab-scoped and cleared on tab close, which honestly reads as transient UI
 * state rather than a saved user collection ADR-0004's no-account
 * constraint can't actually support.
 */

export const COMPARE_STORAGE_KEY = "pokedex-compare-names";
export const MAX_COMPARE_NAMES = 4;

/**
 * Never throws: a private-browsing window (or a storage quota error) can
 * make `sessionStorage.getItem`/`setItem` throw synchronously, and that
 * must never break the page — the compare tray degrading to "nothing
 * selected" is an acceptable fallback, a broken page is not.
 */
export function readCompareNames(storage: Pick<Storage, "getItem">): string[] {
  try {
    const raw = storage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
}

export function writeCompareNames(storage: Pick<Storage, "setItem">, names: string[]): void {
  try {
    storage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(names));
  } catch {
    // Private window or quota error — the in-memory React state (this
    // session's source of truth while the tab is open) still works;
    // only cross-reload persistence is lost, which is an acceptable
    // degradation, not a broken page.
  }
}

/** Adding a name already selected, or once the cap is reached, is a no-op — never a duplicate, never a 5th entry. */
export function addCompareName(names: string[], name: string): string[] {
  if (names.includes(name) || names.length >= MAX_COMPARE_NAMES) {
    return names;
  }
  return [...names, name];
}

export function removeCompareName(names: string[], name: string): string[] {
  return names.filter((existing) => existing !== name);
}
