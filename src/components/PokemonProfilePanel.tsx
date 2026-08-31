import { DataList } from "@/components/ui/DataList";
import { CONTENT } from "@/content/pokedex";

/**
 * Height/weight/species/egg groups/hatch/catch rate/base exp — see
 * docs/EXECUTION-PLAN-v2.3-frontend.md §4. Labelled "Egg cycles" (matching
 * pokemondb.net's own term), not the mockup's "Hatch Time". No "Release XP"
 * row — not a real concept.
 */
export interface PokemonProfilePanelProps {
  height: string | undefined;
  weight: string | undefined;
  species: string | undefined;
  generation: string | undefined;
  eggGroups: string[];
  eggCycles: string | undefined;
  catchRate: string | undefined;
  baseExp: number | undefined;
}

export function PokemonProfilePanel({
  height,
  weight,
  species,
  generation,
  eggGroups,
  eggCycles,
  catchRate,
  baseExp,
}: PokemonProfilePanelProps) {
  return (
    <DataList
      rows={[
        { label: CONTENT.pdp.profileLabels.species, value: species },
        { label: CONTENT.pdp.profileLabels.generation, value: generation },
        { label: CONTENT.pdp.profileLabels.height, value: height },
        { label: CONTENT.pdp.profileLabels.weight, value: weight },
        {
          label: CONTENT.pdp.profileLabels.eggGroups,
          value: eggGroups.length > 0 ? eggGroups.join(", ") : undefined,
        },
        { label: CONTENT.pdp.profileLabels.eggCycles, value: eggCycles },
        { label: CONTENT.pdp.profileLabels.catchRate, value: catchRate },
        { label: CONTENT.pdp.profileLabels.baseExp, value: baseExp },
      ]}
    />
  );
}
