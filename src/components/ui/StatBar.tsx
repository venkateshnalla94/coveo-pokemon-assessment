import { MAX_BASE_STAT } from "@/coveo/pokemonStats";

/**
 * A single base-stat row — see docs/EXECUTION-PLAN-v4-design-system.md §9.
 * Anchored to the real in-game cap of 255 (`MAX_BASE_STAT`), an absolute
 * scale kept even after the restyle — never relative to the six stats on
 * this page alone. The numeral is always printed as text beside the bar,
 * never implied by fill length alone.
 *
 * The fill is type-colored (`--type-primary`, set by the caller as an
 * inline style on an ancestor — see `PokemonStatPanel`) and animates in on
 * mount via a `transform: scaleX()` transition on the `.stat-bar-fill` CSS
 * rule in `globals.css` (not `width`, which would animate a layout
 * property and cause reflow), using `@starting-style` rather than a
 * JS-driven transition: the
 * `prefers-reduced-motion: reduce` override lives in exactly one place
 * (that CSS rule), the same posture already taken for the Pokeball glyph's
 * motion (see globals.css's `.pokeball-*` comment on why a JS `matchMedia`
 * check would duplicate that logic instead of gating it once).
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
      <span className="font-mono-label w-16 shrink-0 text-shell-400">{label}</span>
      {value === undefined ? (
        <span className="text-shell-400">—</span>
      ) : (
        <>
          <div
            role="meter"
            aria-label={label}
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            className="h-2 flex-1 overflow-hidden rounded-full border border-shell-100 bg-transparent dark:border-shell-600"
          >
            <div
              className="stat-bar-fill"
              style={{ transform: `scaleX(${Math.min(100, (value / max) * 100) / 100})` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right font-mono tabular-nums text-foreground">
            {value}
          </span>
        </>
      )}
    </div>
  );
}
