import Image from "next/image";
import { Chip } from "@/components/ui/Chip";
import { getTypeColor } from "@/coveo/typeColors";

/**
 * Image, name, dex number, type Chips, species line — see
 * docs/EXECUTION-PLAN-v2.3-frontend.md §4. No "Rarity"/"Level" chips: those
 * have no real pokemondb.net equivalent and are dropped per the plan.
 */
export interface PokemonHeroProps {
  name: string;
  imageUrl: string | undefined;
  dexNumber: string | undefined;
  types: string[];
  species: string | undefined;
}

export function PokemonHero({ name, imageUrl, dexNumber, types, species }: PokemonHeroProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
      {imageUrl && (
        <div className="relative h-40 w-40 shrink-0">
          <Image src={imageUrl} alt={name} fill className="object-contain" />
        </div>
      )}
      <div>
        {/* `dexNumber` arrives from the source already zero-padded to four
            digits (e.g. "0025"), not a bare number — see
            docs/coveo-source-spec.md's `pokemondexnumber` row. Only the "#"
            prefix is added here, no further padStart. */}
        {dexNumber && (
          <p className="text-xs text-black/50 dark:text-white/50">#{dexNumber}</p>
        )}
        <h1 className="text-3xl font-bold">{name}</h1>
        {species && <p className="mt-1 text-sm text-black/60 dark:text-white/60">{species}</p>}
        {types.length > 0 && (
          <p className="mt-2 flex flex-wrap items-center gap-1.5">
            {types.map((type) => (
              <Chip key={type} label={type} color={getTypeColor(type)} variant="type" />
            ))}
          </p>
        )}
      </div>
    </div>
  );
}
