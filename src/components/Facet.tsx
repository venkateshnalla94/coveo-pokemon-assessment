"use client";

import { buildFacet, type FacetState } from "@coveo/headless";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getSearchEngine } from "@/coveo/engine";

interface FacetProps {
  field: string;
  label: string;
  /** Optional visual indicator rendered before each value's label (e.g. a type-color dot). */
  renderIndicator?: (value: string) => ReactNode;
}

export function Facet({ field, label, renderIndicator }: FacetProps) {
  const [facet] = useState(() => buildFacet(getSearchEngine(), { options: { field } }));
  const [state, setState] = useState<FacetState>(facet.state);

  useEffect(() => facet.subscribe(() => setState(facet.state)), [facet]);

  if (state.values.length === 0) {
    return null;
  }

  return (
    <fieldset className="mb-6">
      <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
        {label}
      </legend>
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
                {renderIndicator?.(value.value)}
                {value.value}
              </span>
              <span className="text-black/40 dark:text-white/40">{value.numberOfResults}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
