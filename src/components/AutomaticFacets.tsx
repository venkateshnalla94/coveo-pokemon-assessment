"use client";

import { buildAutomaticFacetGenerator, type AutomaticFacet } from "@coveo/headless";
import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { TypeSwatch } from "@/components/ui/TypeSwatch";
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
 * Display-order pin for whichever fields Coveo's automatic facet generator
 * happens to select this query — Type first, then Generation, everything
 * else after in whatever order the generator returned (a stable sort keeps
 * their relative order, since `desiredCount`/relevance ranking is real
 * signal worth keeping for the fields we don't have an opinion on).
 * `AutomaticFacetGeneratorOptions` has no `fields`/order option of its own
 * (confirmed against the installed `@coveo/headless` types) — this is a
 * client-side display concern only, not a request to Coveo, and doesn't
 * change which fields the generator selects or reverse ADR-0011's decision
 * to let it choose them.
 */
const FIELD_ORDER_PRIORITY: Record<string, number> = {
  [POKEMON_FIELDS.type]: 0,
  [POKEMON_FIELDS.generation]: 1,
};

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
export function AutomaticFacets({ collapsible }: { collapsible?: boolean } = {}) {
  const [generator] = useState(() =>
    buildAutomaticFacetGenerator(getSearchEngine(), {
      options: { desiredCount: 6, numberOfValues: 10 },
    }),
  );
  const state = useControllerState(generator) ?? generator.state;
  const orderedFacets = [...state.automaticFacets].sort(
    (a, b) =>
      (FIELD_ORDER_PRIORITY[a.state.field] ?? 2) - (FIELD_ORDER_PRIORITY[b.state.field] ?? 2),
  );

  return (
    <>
      {orderedFacets.map((facet) => (
        <AutomaticFacetFieldset key={facet.state.field} facet={facet} collapsible={collapsible} />
      ))}
    </>
  );
}

function AutomaticFacetFieldset({
  facet,
  collapsible,
}: {
  facet: AutomaticFacet;
  /** See Facet.tsx's `collapsible` doc comment — same contract. */
  collapsible?: boolean;
}) {
  const { field, label, values } = facet.state;
  const useChip = CHIP_FIELDS.has(field);

  if (values.length === 0) {
    return null;
  }

  const valueList = (
    <ul className="space-y-1">
        {values.map((value) => (
          <li key={value.value}>
            <label className="flex cursor-pointer items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                {useChip ? (
                  // Swatch geometry: 24px visual inside a 32px hit target
                  // (v4 plan §6). The native checkbox stays in the DOM,
                  // visually hidden under the swatch rather than replaced
                  // by it — unlabeled color swatches are a documented
                  // accessibility failure, and this is also what
                  // AutomaticFacets.test.tsx's `within(row).getByRole(
                  // "checkbox")` requires.
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                    <input
                      type="checkbox"
                      checked={value.state === "selected"}
                      onChange={() => facet.toggleSelect(value)}
                      // sr-only clips any outline drawn on the input itself,
                      // so its keyboard focus ring is painted on the
                      // visible swatch sibling instead — see
                      // `.swatch-checkbox:focus-visible + *` in globals.css.
                      className="swatch-checkbox sr-only"
                    />
                    <TypeSwatch label={value.value} selected={value.state === "selected"} />
                  </span>
                ) : (
                  <input
                    type="checkbox"
                    checked={value.state === "selected"}
                    onChange={() => facet.toggleSelect(value)}
                  />
                )}
                {useChip ? (
                  <Chip label={value.value} color={getTypeColor(value.value)} variant="type" />
                ) : (
                  value.value
                )}
              </span>
              <span className="text-shell-500">{value.numberOfResults}</span>
            </label>
          </li>
        ))}
      </ul>
  );

  return (
    <fieldset className="mb-6">
      {collapsible ? (
        <details open>
          <summary className="mb-2 cursor-pointer text-sm font-semibold uppercase tracking-wide text-black/60 marker:text-black/40 dark:text-white/60 dark:marker:text-white/40">
            {label}
          </summary>
          {valueList}
        </details>
      ) : (
        <>
          <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
            {label}
          </legend>
          {valueList}
        </>
      )}
    </fieldset>
  );
}
