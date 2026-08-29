"use client";

import { buildFacet } from "@coveo/headless";
import Link from "next/link";
import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { buildTypeSearchHref } from "@/coveo/browseByTypeUrl";
import { getSearchEngine } from "@/coveo/engine";
import { POKEMON_FIELDS } from "@/coveo/fields";
import { getTypeColor } from "@/coveo/typeColors";
import { useControllerState } from "@/coveo/useControllerState";

/**
 * The Type facet's real values and counts (an empty-query `buildFacet`, not
 * a static list) rendered as a grid of links into `/search` pre-filtered to
 * that type — the mockup's "Browse by Element" with nothing invented, see
 * docs/EXECUTION-PLAN-v2.3-frontend.md §7.
 *
 * Given an explicit, distinct `facetId` (`"browse-by-type"`) rather than
 * the default (which would be the field name, `pokemontype`) — this app
 * shares one Headless engine singleton across every route including
 * `/search`, whose own `FacetType` also builds a facet on the same field
 * with no explicit ID of its own. If this component's facet registered
 * under the default ID first, `/search`'s `FacetType` would find
 * `"pokemontype"` already claimed and fall back to a generated,
 * non-`pokemontype` ID (see `buildTypeSearchHref`'s doc comment) — silently
 * breaking every link this component produces. An explicit distinct ID
 * here sidesteps the collision entirely.
 */
export function BrowseByType() {
  const [facet] = useState(() =>
    buildFacet(getSearchEngine(), { options: { field: POKEMON_FIELDS.type, facetId: "browse-by-type" } }),
  );
  const state = useControllerState(facet) ?? facet.state;

  if (state.values.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
        Browse by type
      </h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {state.values.map((value) => (
          <li key={value.value}>
            <Link
              href={buildTypeSearchHref(value.value)}
              className="flex items-center justify-between gap-2 rounded-md border border-black/10 px-2 py-1.5 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              <Chip label={value.value} color={getTypeColor(value.value)} variant="type" />
              <span className="text-xs text-black/40 dark:text-white/40">
                {value.numberOfResults}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
