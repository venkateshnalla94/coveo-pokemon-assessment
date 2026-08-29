import { Chip } from "@/components/ui/Chip";
import { getTypeColor } from "@/coveo/typeColors";

/**
 * Weaknesses and resistances as two type-colored Chip rows, from the
 * simplified multi-value fields — not the full 18-type multiplier grid
 * (see docs/EXECUTION-PLAN-v2.3-frontend.md §4).
 */
export interface TypeDefensesProps {
  weaknesses: string[];
  resistances: string[];
}

export function TypeDefenses({ weaknesses, resistances }: TypeDefensesProps) {
  if (weaknesses.length === 0 && resistances.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {weaknesses.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
            Weaknesses
          </h3>
          <p className="flex flex-wrap items-center gap-1.5">
            {weaknesses.map((type) => (
              <Chip key={type} label={type} color={getTypeColor(type)} variant="type" />
            ))}
          </p>
        </div>
      )}
      {resistances.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
            Resistances
          </h3>
          <p className="flex flex-wrap items-center gap-1.5">
            {resistances.map((type) => (
              <Chip key={type} label={type} color={getTypeColor(type)} variant="type" />
            ))}
          </p>
        </div>
      )}
    </div>
  );
}
