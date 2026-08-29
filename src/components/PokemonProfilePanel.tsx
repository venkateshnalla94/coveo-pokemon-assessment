import { DataList } from "@/components/ui/DataList";

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
  eggGroups: string[];
  eggCycles: string | undefined;
  catchRate: string | undefined;
  baseExp: number | undefined;
}

export function PokemonProfilePanel({
  height,
  weight,
  species,
  eggGroups,
  eggCycles,
  catchRate,
  baseExp,
}: PokemonProfilePanelProps) {
  return (
    <DataList
      rows={[
        { label: "Species", value: species },
        { label: "Height", value: height },
        { label: "Weight", value: weight },
        { label: "Egg groups", value: eggGroups.length > 0 ? eggGroups.join(", ") : undefined },
        { label: "Egg cycles", value: eggCycles },
        { label: "Catch rate", value: catchRate },
        { label: "Base Exp.", value: baseExp },
      ]}
    />
  );
}
