import type { CSSProperties } from "react";
import { StatBar } from "@/components/ui/StatBar";
import { CONTENT } from "@/content/pokedex";
import type { PokemonStats } from "@/coveo/mapPokemonResult";
import { STAT_ORDER } from "@/coveo/pokemonStats";
import { getTypeColor } from "@/coveo/typeColors";

/**
 * Six StatBars in STAT_ORDER plus the total — see
 * docs/EXECUTION-PLAN-v4-design-system.md §9. Returns null when every stat is
 * undefined, so the panel simply isn't there rather than showing six empty
 * bars — kept even though the stats are live per docs/HANDOFF.md, since the
 * defensive behavior is correct regardless of today's index state.
 *
 * `types` sets `--type-primary` (decorative only, per §2.3 — `types[0]`
 * isn't a verified "primary" type) so every StatBar's fill picks it up via
 * `.stat-bar-fill`'s `var(--type-primary, ...)` fallback chain, without
 * each bar needing its own color prop.
 */
export interface PokemonStatPanelProps {
  stats: PokemonStats;
  total: number | undefined;
  types: string[];
}

export function PokemonStatPanel({ stats, total, types }: PokemonStatPanelProps) {
  const hasAnyStat = STAT_ORDER.some(({ key }) => stats[key] !== undefined);
  if (!hasAnyStat) {
    return null;
  }

  const primaryColor = types.map((type) => getTypeColor(type)).find((color): color is string => Boolean(color));
  const statVars = primaryColor ? ({ "--type-primary": primaryColor } as CSSProperties) : undefined;

  return (
    <div
      className="mb-6 flex flex-col gap-2 rounded-lg border border-shell-100 bg-surface p-4 dark:border-shell-600"
      style={statVars}
    >
      <h2 className="font-mono-label mb-1 text-xs text-shell-500">
        {CONTENT.pdp.sectionHeadings.stats}
      </h2>
      {STAT_ORDER.map(({ key, label }) => (
        <StatBar key={key} label={label} value={stats[key]} />
      ))}
      <div className="mt-1 flex items-center gap-2 border-t border-shell-100 pt-2 text-xs font-semibold text-foreground dark:border-shell-600">
        <span className="font-mono-label w-16 shrink-0 text-shell-500">
          {CONTENT.pdp.statsTotalLabel}
        </span>
        <span className="font-mono tabular-nums">{total ?? "—"}</span>
      </div>
    </div>
  );
}
