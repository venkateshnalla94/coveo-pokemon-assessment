"use client";

import { buildNumericFacet, type NumericFacetState } from "@coveo/headless";
import { useEffect, useState } from "react";
import { getSearchEngine } from "@/coveo/engine";
import { POKEMON_FIELDS } from "@/coveo/fields";
import { SPEED_RANGES } from "@/coveo/speedFacetRanges";

/**
 * Headless's real `NumericFacet` controller (confirmed against
 * `controllers/core/facets/range-facet/numeric-facet/headless-core-numeric-facet.d.ts`
 * in the installed @coveo/headless@3.55.2) — explicit ranges, not
 * `generateAutomaticRanges`, per docs/EXECUTION-PLAN-v2.3-frontend.md §5.
 * Depends on `pokemonspeed` being an Integer field with facet support
 * enabled in the org — confirmed already done per docs/HANDOFF.md.
 */
export function FacetSpeed() {
  const [facet] = useState(() =>
    buildNumericFacet(getSearchEngine(), {
      options: {
        field: POKEMON_FIELDS.speed,
        generateAutomaticRanges: false,
        currentValues: SPEED_RANGES.map((r) => r.range),
      },
    }),
  );
  const [state, setState] = useState<NumericFacetState>(facet.state);

  useEffect(() => facet.subscribe(() => setState(facet.state)), [facet]);

  if (state.values.length === 0) {
    return null;
  }

  return (
    <fieldset className="mb-6">
      <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
        Speed
      </legend>
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
                <span className="text-black/40 dark:text-white/40">{value.numberOfResults}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
