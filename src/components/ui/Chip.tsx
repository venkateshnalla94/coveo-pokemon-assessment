/**
 * Shared chip primitive — see docs/EXECUTION-PLAN-v2.3-frontend.md §3.
 *
 * Extracted from the dot+label markup that used to be duplicated in
 * ResultList.tsx, FacetType.tsx, and pokemon/[name]/page.tsx. Three variants:
 *
 * - "type": a Pokemon type color, rendered per DESIGN.md §1.1's concession —
 *   the color at ~12% alpha background, the same hue at full strength for
 *   the border, ink for the text. The type name is always rendered as text
 *   alongside the color; color alone never conveys the value (DESIGN.md's
 *   Data Categories rule).
 * - "type-solid": a solid-fill badge — full-strength background, text color
 *   from `getTypeTextColor()` so every one of the 18 types clears 4.5:1
 *   (v4 plan §3.1/§5). Used on result tiles and the PDP where the badge is
 *   the type indicator itself, not a secondary tag.
 * - "neutral": no color, just a bordered pill — abilities, egg groups,
 *   weaknesses, resistances, and any other label that has no color mapping.
 */
export interface ChipProps {
  label: string;
  /** Hex color, typically from getTypeColor(). Ignored for variant="neutral". */
  color?: string;
  /** Solid-fill text color, typically from getTypeTextColor(). Only used for variant="type-solid". */
  textColor?: string;
  variant?: "type" | "type-solid" | "neutral";
}

export function Chip({ label, color, textColor, variant = "neutral" }: ChipProps) {
  const useColor = variant === "type" && color;
  const useSolid = variant === "type-solid" && color;

  return (
    <span
      className={
        useColor
          ? "inline-flex items-center rounded-md border px-2 py-0.5 text-xs leading-tight text-black dark:text-white"
          : useSolid
            ? "inline-flex items-center rounded-md border-0 px-2 py-0.5 text-xs font-medium leading-tight"
            : "inline-flex items-center rounded-md border border-black/10 px-2 py-0.5 text-xs leading-tight text-black/70 dark:border-white/15 dark:text-white/70"
      }
      style={
        useColor
          ? {
              backgroundColor: `${color}1f`, // ~12% alpha
              borderColor: color,
            }
          : useSolid
            ? {
                backgroundColor: color,
                color: textColor ?? "#1A1C22",
              }
            : undefined
      }
      data-variant={variant}
    >
      {label}
    </span>
  );
}
