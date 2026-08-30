import { Chip } from "@/components/ui/Chip";
import { CONTENT } from "@/content/pokedex";

/** Abilities as neutral Chips — no color mapping exists for abilities. */
export interface AbilityListProps {
  abilities: string[];
}

export function AbilityList({ abilities }: AbilityListProps) {
  if (abilities.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
        {CONTENT.pdp.sectionHeadings.abilities}
      </h3>
      <p className="flex flex-wrap items-center gap-1.5">
        {abilities.map((ability) => (
          <Chip key={ability} label={ability} variant="neutral" />
        ))}
      </p>
    </div>
  );
}
