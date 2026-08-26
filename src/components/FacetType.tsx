"use client";

import { Facet } from "@/components/Facet";
import { POKEMON_FIELDS } from "@/coveo/fields";
import { getTypeColor } from "@/coveo/typeColors";

export function FacetType() {
  return (
    <Facet
      field={POKEMON_FIELDS.type}
      label="Type"
      renderIndicator={(value) => {
        const color = getTypeColor(value);
        return color ? (
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
        ) : null;
      }}
    />
  );
}
