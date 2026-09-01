"use client";

import { buildNumericFacet } from "@coveo/headless";
import { useState } from "react";
import { CONTENT } from "@/content/pokedex";
import { getSearchEngine } from "@/coveo/engine";
import { POKEMON_FIELDS } from "@/coveo/fields";
import { SPEED_RANGES } from "@/coveo/speedFacetRanges";
import { useControllerState } from "@/coveo/useControllerState";

/**
 * Headless's real `NumericFacet` controller (confirmed against
 * `controllers/core/facets/range-facet/numeric-facet/headless-core-numeric-facet.d.ts`
 * in the installed @coveo/headless@3.55.2) — explicit ranges, not
 * `generateAutomaticRanges`, per docs/EXECUTION-PLAN-v2.3-frontend.md §5.
 * Depends on `pokemonspeed` being an Integer field with facet support
 * enabled in the org — confirmed already done per docs/HANDOFF.md.
 */
export function FacetSpeed({ collapsible }: { collapsible?: boolean } = {}) {
  const [facet] = useState(() =>
    buildNumericFacet(getSearchEngine(), {
      options: {
        field: POKEMON_FIELDS.speed,
        // Explicit, stable facetId — see Facet.tsx's doc comment for why:
        // without it, remounting this component after the persistent
        // engine singleton already has `pokemonspeed` registered (e.g.
        // navigating away from /search and back) accumulates a new
        // suffixed facetId (`pokemonspeed_2`, ...) every time instead of
        // reusing the existing registration.
        facetId: POKEMON_FIELDS.speed,
        generateAutomaticRanges: false,
        currentValues: SPEED_RANGES.map((r) => r.range),
      },
    }),
  );
  const state = useControllerState(facet) ?? facet.state;

  if (state.values.length === 0) {
    return null;
  }

  const valueList = (
    <ul className="space-y-1">
      {state.values.map((value) => {
          const label =
            SPEED_RANGES.find((r) => r.range.start === value.start && r.range.end === value.end)
              ?.label ?? `${value.start}-${value.end}`;
          return (
            <li key={`${value.start}-${value.end}`}>
              <label className="flex cursor-pointer items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={value.state === "selected"}
                    onChange={() => facet.toggleSelect(value)}
                  />
                  {label}
                </span>
                <span className="text-shell-500">{value.numberOfResults}</span>
              </label>
            </li>
          );
        })}
    </ul>
  );

  return (
    <fieldset className="mb-6">
      {collapsible ? (
        <details open>
          <summary className="mb-2 cursor-pointer text-sm font-semibold uppercase tracking-wide text-black/60 marker:text-black/40 dark:text-white/60 dark:marker:text-white/40">
            {CONTENT.search.facetLabels.speed}
          </summary>
          {valueList}
        </details>
      ) : (
        <>
          <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
            {CONTENT.search.facetLabels.speed}
          </legend>
          {valueList}
        </>
      )}
    </fieldset>
  );
}
