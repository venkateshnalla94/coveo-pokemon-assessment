"use client";

import { buildAutomaticFacetGenerator, type AutomaticFacet } from "@coveo/headless";
import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { getSearchEngine } from "@/coveo/engine";
import { POKEMON_FIELDS } from "@/coveo/fields";
import { getTypeColor } from "@/coveo/typeColors";
import { useControllerState } from "@/coveo/useControllerState";

/**
 * Fields that get color-coded Chip rendering (matching what the removed
 * FacetType/FacetWeaknesses/FacetResistances used to do) rather than plain
 * text — preserves the curated look for the fields where color actually
 * means something.
 */
const CHIP_FIELDS = new Set<string>([
  POKEMON_FIELDS.type,
  POKEMON_FIELDS.weaknesses,
  POKEMON_FIELDS.resistances,
]);

/**
 * Coveo's real Automatic Facet Generation (`buildAutomaticFacetGenerator`),
 * replacing 5 hand-built Facet components (Type/Generation/EggGroups/
 * Weaknesses/Resistances) — see
 * docs/adr/0011-automatic-facet-generation-on-search-page.md for the full
 * reasoning, including why Speed (numeric) and Abilities (needs
 * facet-search) stay as separate manual facets.
 *
 * `generator.state.automaticFacets` builds a brand-new `AutomaticFacet`
 * object on every read (confirmed in Headless's own
 * `headless-automatic-facet-generator.js`), so each one is treated as a
 * plain snapshot here — only the top-level generator is subscribed via
 * `useControllerState`. Subscribing per-item too would resubscribe every
 * render against a never-stable identity, the exact infinite-loop class
 * `useControllerState`'s own doc comment warns about.
 */
export function AutomaticFacets() {
  const [generator] = useState(() =>
    buildAutomaticFacetGenerator(getSearchEngine(), {
      options: { desiredCount: 6, numberOfValues: 10 },
    }),
  );
  const state = useControllerState(generator) ?? generator.state;

  return (
    <>
      {state.automaticFacets.map((facet) => (
        <AutomaticFacetFieldset key={facet.state.field} facet={facet} />
      ))}
    </>
  );
}

function AutomaticFacetFieldset({ facet }: { facet: AutomaticFacet }) {
  const { field, label, values } = facet.state;
  const useChip = CHIP_FIELDS.has(field);

  if (values.length === 0) {
    return null;
  }

  return (
    <fieldset className="mb-6">
      <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
        {label}
      </legend>
      <ul className="space-y-1">
        {values.map((value) => (
          <li key={value.value}>
            <label className="flex cursor-pointer items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value.state === "selected"}
                  onChange={() => facet.toggleSelect(value)}
                />
                {useChip ? (
                  <Chip label={value.value} color={getTypeColor(value.value)} variant="type" />
                ) : (
                  value.value
                )}
              </span>
              <span className="text-black/40 dark:text-white/40">{value.numberOfResults}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
