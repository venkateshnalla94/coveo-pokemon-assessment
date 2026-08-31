import { getTypeColor } from "@/coveo/typeColors";

export interface TypeSwatchProps {
  /** A Pokemon type name (e.g. "Fire") — resolves both its color (for the selected-state ring) and its icon file from the same source as Chip/BrowseByType. */
  label: string;
  selected: boolean;
}

/**
 * A 24px type-icon swatch inside a 32px hit target (v4 plan §6), for facet
 * values whose color has real meaning (Pokemon type, and — since a
 * weakness/resistance value is itself a type name — the Weaknesses/
 * Resistances facets too). Used by `AutomaticFacets.tsx`.
 *
 * Renders the same real downloaded type-icon SVG `BrowseByType.tsx` uses
 * (`public/art/types/`, MIT-licensed) rather than a plain CSS-colored
 * circle — each icon file is already a self-contained colored circle badge,
 * so no separate background-color fill is drawn here; the swatch just adds
 * the selected-state ring around it. This replaced a flat color-only
 * swatch + checkmark: the checkmark is dropped now that the circle carries
 * real icon content the checkmark would otherwise sit on top of — the ring
 * alone (plus the native checkbox's own state) still makes selection
 * unambiguous.
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

  return (
    <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full"
        style={{
          boxShadow: selected
            ? `0 0 0 2px var(--surface), 0 0 0 4px ${color}`
            : "0 0 0 1px rgba(0, 0, 0, 0.12)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- same posture as BrowseByType.tsx: small local SVG, next/image's optimizer requires dangerouslyAllowSVG for local SVGs */}
        <img src={`/art/types/${label.toLowerCase()}.svg`} alt="" className="h-full w-full" />
      </span>
    </span>
  );
}
