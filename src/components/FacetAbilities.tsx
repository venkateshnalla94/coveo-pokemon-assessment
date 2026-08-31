"use client";

import { Facet } from "@/components/Facet";
import { CONTENT } from "@/content/pokedex";
import { POKEMON_FIELDS } from "@/coveo/fields";

/**
 * Abilities has a few hundred distinct values — a static checkbox list of
 * the top N is unusable for finding a specific one, so this uses `Facet`'s
 * `searchable` variant (facet-search, not a plain list) rather than a
 * second parallel facet component — see docs/EXECUTION-PLAN-v2.3-frontend.md §5.
 */
export function FacetAbilities({ collapsible }: { collapsible?: boolean } = {}) {
  return (
    <Facet
      field={POKEMON_FIELDS.abilities}
      label={CONTENT.search.facetLabels.abilities}
      searchable
      collapsible={collapsible}
    />
  );
}
