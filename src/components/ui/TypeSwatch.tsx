import { getTypeColor, getTypeTextColor } from "@/coveo/typeColors";

export interface TypeSwatchProps {
  /** A Pokemon type name (e.g. "Fire") — resolves its own color via getTypeColor(), same source as Chip. */
  label: string;
  selected: boolean;
}

/**
 * A 24px color swatch inside a 32px hit target (v4 plan §6), for facet
 * values whose color has real meaning (Pokemon type). Selected state is a
 * 2px ring in the type color plus a check mark inside the swatch.
 *
 * Decorative only (`aria-hidden`) — always paired by the caller with a
 * native `<input type="checkbox">` (visually hidden, not replaced) and the
 * type name rendered as text (via `Chip`). Two independent reasons this
 * component never stands alone: unlabeled color swatches are a documented
 * accessibility failure (Sephora's own filters), and the color-alone rule
 * in `typeColors.ts`'s header comment / `DESIGN.md`'s Data Categories
 * section requires the text label every time a type color appears.
 *
 * Renders nothing for an unrecognized type name (no color to show) —
 * the caller's checkbox and text label still render regardless.
 */
export function TypeSwatch({ label, selected }: TypeSwatchProps) {
  const color = getTypeColor(label);

  if (!color) {
    return null;
  }

  const checkColor = getTypeTextColor(label);

  return (
    <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center">
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: selected
            ? `0 0 0 2px var(--surface), 0 0 0 4px ${color}`
            : "0 0 0 1px rgba(0, 0, 0, 0.12)",
        }}
      >
        {selected && (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
            <path
              d="M3.5 8.5l3 3 6-7"
              stroke={checkColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </span>
  );
}
