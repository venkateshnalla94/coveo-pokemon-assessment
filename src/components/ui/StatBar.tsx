import { MAX_BASE_STAT } from "@/coveo/pokemonStats";

/**
 * A single base-stat row — see docs/EXECUTION-PLAN-v2.3-frontend.md §3 and
 * §1.1's second concession: monochrome (ink at 85% against a hairline
 * track), anchored to the real in-game cap of 255, never a decorative
 * per-stat color ramp. The numeral is always printed as text beside the
 * bar, never implied by fill length alone.
 *
 * When `value` is undefined, this renders a muted "—" row instead of a
 * zero-width meter — a missing field is not the same fact as a real 0.
 */
export interface StatBarProps {
  label: string;
  value: number | undefined;
  max?: number;
}

export function StatBar({ label, value, max = MAX_BASE_STAT }: StatBarProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 shrink-0 text-black/70 dark:text-white/70">{label}</span>
      {value === undefined ? (
        <span className="text-black/40 dark:text-white/40">—</span>
      ) : (
        <>
          <div
            role="meter"
            aria-label={label}
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            className="h-2 flex-1 rounded-md border border-black/10 bg-transparent dark:border-white/15"
          >
            <div
              className="h-full rounded-md bg-black/85 dark:bg-white/85"
              style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right tabular-nums text-black/70 dark:text-white/70">
            {value}
          </span>
        </>
      )}
    </div>
  );
}
