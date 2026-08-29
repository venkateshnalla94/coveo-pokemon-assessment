"use client";

import { Facet } from "@/components/Facet";
import { Chip } from "@/components/ui/Chip";
import { POKEMON_FIELDS } from "@/coveo/fields";
import { getTypeColor } from "@/coveo/typeColors";

export function FacetType() {
  return (
    <Facet
      field={POKEMON_FIELDS.type}
      label="Type"
      renderValue={(value) => <Chip label={value} color={getTypeColor(value)} variant="type" />}
    />
  );
}
