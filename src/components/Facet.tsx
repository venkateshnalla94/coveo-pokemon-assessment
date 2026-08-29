"use client";

import { buildFacet } from "@coveo/headless";
import type { ReactNode } from "react";
import { useState } from "react";
import { getSearchEngine } from "@/coveo/engine";
import { useControllerState } from "@/coveo/useControllerState";

interface FacetProps {
  field: string;
  label: string;
  /**
   * Optional override for how a value's label renders (e.g. a type Chip
   * instead of plain text). Defaults to the raw value string so checkbox/
   * click behavior is unaffected by whether a caller supplies this.
   */
  renderValue?: (value: string) => ReactNode;
  /**
   * Adds a facet-search text input above the value list, backed by
   * Headless's real `facet.facetSearch` API (`updateText()` + `search()`,
   * confirmed against `controllers/core/facets/facet/headless-core-facet.d.ts`
   * — this is the documented mechanism for a facet with hundreds of
   * distinct values, e.g. Abilities; see FacetAbilities.tsx). When the
   * search box has text, the value list is replaced by
   * `facet.facetSearch.state.values` (search results); clearing it reverts
   * to the normal top-N `state.values` list. This is one component with a
   * variant, not a second parallel facet component, since the selection/
   * checkbox rendering below is shared either way.
   */
  searchable?: boolean;
}

export function Facet({ field, label, renderValue, searchable }: FacetProps) {
  // Explicit `id: field` (matching what Headless would default to anyway)
  // instead of leaving `id` unset. The shared `engine` singleton persists
  // for the whole SPA session, so a Facet component unmounting (e.g.
  // navigating /search -> a Pokemon detail page -> back) never
  // deregisters its facet from the engine's facetSet — remounting later
  // with no explicit id makes Headless generate a fresh suffixed one
  // (`pokemontype_2`, `_3`, ...) every time, since it can't tell this is
  // "the same" facet, not a new one, and warns "already exists" each time.
  // `registerFacet`'s own reducer is a no-op when the id already exists
  // (`facet-set-slice.js`: `if (facetId in state) return;`), so pinning the
  // id here makes a remount silently reuse the existing registration
  // instead of accumulating duplicates.
  const [facet] = useState(() => buildFacet(getSearchEngine(), { options: { field, facetId: field } }));
  const state = useControllerState(facet) ?? facet.state;

  const isSearching = searchable && state.facetSearch.query.trim().length > 0;

  if (state.values.length === 0 && !isSearching) {
    return null;
  }

  return (
    <fieldset className="mb-6">
      <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
        {label}
      </legend>
      {searchable && (
        <input
          type="text"
          value={state.facetSearch.query}
          placeholder={`Search ${label.toLowerCase()}...`}
          className="mb-2 w-full rounded-md border border-black/10 px-2 py-1 text-sm outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30"
          onChange={(e) => {
            facet.facetSearch.updateText(e.target.value);
            facet.facetSearch.search();
          }}
        />
      )}
      {isSearching ? (
        <ul className="space-y-1">
          {state.facetSearch.values.length === 0 && (
            <li className="text-sm text-black/40 dark:text-white/40">No matches.</li>
          )}
          {state.facetSearch.values.map((result) => (
            <li key={result.rawValue}>
              <button
                type="button"
                onClick={() => facet.facetSearch.select(result)}
                className="flex w-full cursor-pointer items-center justify-between gap-2 text-left text-sm hover:underline"
              >
                <span>{renderValue ? renderValue(result.rawValue) : result.displayValue}</span>
                <span className="text-black/40 dark:text-white/40">{result.count}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-1">
          {state.values.map((value) => (
            <li key={value.value}>
              <label className="flex cursor-pointer items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={value.state === "selected"}
                    onChange={() => facet.toggleSelect(value)}
                  />
                  {renderValue ? renderValue(value.value) : value.value}
                </span>
                <span className="text-black/40 dark:text-white/40">{value.numberOfResults}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
