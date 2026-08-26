"use client";

import { Facet } from "@/components/Facet";
import { POKEMON_FIELDS } from "@/coveo/fields";

export function FacetGeneration() {
  return <Facet field={POKEMON_FIELDS.generation} label="Generation" />;
}
