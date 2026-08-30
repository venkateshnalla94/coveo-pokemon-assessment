import { Chip } from "@/components/ui/Chip";
import { TypeSwatch } from "@/components/ui/TypeSwatch";
import { CONTENT } from "@/content/pokedex";
import { getTypeColor } from "@/coveo/typeColors";

/**
 * Weaknesses and resistances as two type-swatched rows, from the
 * simplified multi-value fields — not the full 18-type multiplier grid
 * (see docs/EXECUTION-PLAN-v2.3-frontend.md §4).
 *
 * Uses `TypeSwatch` — the same swatch component the type facet renders
 * (`AutomaticFacets.tsx`) — so the selection language stays continuous
 * across the app (v4 plan §9). `TypeSwatch` is decorative-only
 * (`aria-hidden`) by design, so it's always paired with a `Chip` carrying
 * the visible type name text, same as the facet row: the color-alone rule
 * in `typeColors.ts`'s header comment / `DESIGN.md`'s Data Categories
 * section requires the label every time a type color appears. `selected`
 * is always `false` here — there's no selection state on a display-only
 * list, unlike the facet's checkbox-driven one.
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
    <div className="flex flex-col gap-4">
      {weaknesses.length > 0 && (
        <div>
          <h3 className="font-mono-label mb-2 text-xs text-shell-400">
            {CONTENT.pdp.sectionHeadings.weaknesses}
          </h3>
          <p className="flex flex-wrap items-center gap-2">
            {weaknesses.map((type) => (
              <span key={type} className="flex items-center gap-1.5">
                <TypeSwatch label={type} selected={false} />
                <Chip label={type} color={getTypeColor(type)} variant="type" />
              </span>
            ))}
          </p>
        </div>
      )}
      {resistances.length > 0 && (
        <div>
          <h3 className="font-mono-label mb-2 text-xs text-shell-400">
            {CONTENT.pdp.sectionHeadings.resistances}
          </h3>
          <p className="flex flex-wrap items-center gap-2">
            {resistances.map((type) => (
              <span key={type} className="flex items-center gap-1.5">
                <TypeSwatch label={type} selected={false} />
                <Chip label={type} color={getTypeColor(type)} variant="type" />
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}
