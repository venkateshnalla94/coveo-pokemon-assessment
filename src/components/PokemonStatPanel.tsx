import { StatBar } from "@/components/ui/StatBar";
import type { PokemonStats } from "@/coveo/mapPokemonResult";
import { STAT_ORDER } from "@/coveo/pokemonStats";

/**
 * Six StatBars in STAT_ORDER plus the total — see
 * docs/EXECUTION-PLAN-v2.3-frontend.md §4. Returns null when every stat is
 * undefined, so the panel simply isn't there rather than showing six empty
 * bars — kept even though the stats are live per docs/HANDOFF.md, since the
 * defensive behavior is correct regardless of today's index state.
 */
export interface PokemonStatPanelProps {
  stats: PokemonStats;
  total: number | undefined;
}

export function PokemonStatPanel({ stats, total }: PokemonStatPanelProps) {
  const hasAnyStat = STAT_ORDER.some(({ key }) => stats[key] !== undefined);
  if (!hasAnyStat) {
    return null;
  }

  return (
    <div className="mb-6 flex flex-col gap-1.5 rounded-md border border-black/10 p-3 dark:border-white/15">
      {STAT_ORDER.map(({ key, label }) => (
        <StatBar key={key} label={label} value={stats[key]} />
      ))}
      <div className="mt-1 flex items-center gap-2 border-t border-black/10 pt-1.5 text-xs font-semibold dark:border-white/15">
        <span className="w-16 shrink-0">Total</span>
        <span>{total ?? "—"}</span>
      </div>
    </div>
  );
}
