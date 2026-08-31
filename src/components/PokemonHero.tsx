import Image from "next/image";
import type { CSSProperties } from "react";
import { Chip } from "@/components/ui/Chip";
import { getTypeColor, getTypeTextColor } from "@/coveo/typeColors";

/**
 * Sprite, name, dex number, type Chips, species line — see
 * docs/EXECUTION-PLAN-v4-design-system.md §9. No "Rarity"/"Level" chips:
 * those have no real pokemondb.net equivalent and stay dropped per the plan.
 *
 * The sprite renders at ~360px and overlaps the full-bleed hero band above
 * it (via a negative top margin) and the content below it (its own
 * container has no bottom clearance beyond normal flow) — see the page's
 * `mb-[-...]` breakout wrapper in pokemon/[name]/page.tsx. The dex number
 * doubles as an oversized, low-opacity mono watermark sitting behind the
 * sprite, in addition to its small printed form next to the name.
 */
export interface PokemonHeroProps {
  name: string;
  imageUrl: string | undefined;
  dexNumber: string | undefined;
  types: string[];
  species: string | undefined;
}

export function PokemonHero({ name, imageUrl, dexNumber, types, species }: PokemonHeroProps) {
  // Type-driven lighting (v4 plan §5/§2.3, reused here). `types[0]` is not a
  // verified "primary" type — decorative only, never labeled as such.
  const typeColors = types.map((type) => getTypeColor(type)).filter((color): color is string => Boolean(color));
  const [primaryColor, secondaryColor] = typeColors;
  const heroVars = primaryColor
    ? ({
        "--type-primary": primaryColor,
        "--type-secondary": secondaryColor ?? primaryColor,
      } as CSSProperties)
    : undefined;

  return (
    <div
      className="relative mb-8 flex flex-col items-center gap-4 px-6 text-center sm:flex-row sm:items-end sm:gap-8 sm:text-left"
      style={heroVars}
    >
      <div className="relative -mt-32 flex size-55 shrink-0 items-center justify-center sm:-mt-48 sm:size-90">
        {/* Oversized low-opacity mono watermark behind the sprite.
            `dexNumber` arrives from the source already zero-padded to four
            digits (e.g. "0025") — only the "#" prefix is added here, never
            a further padStart; see mapPokemonResult's dexNumber field and
            docs/coveo-source-spec.md's `pokemondexnumber` row. */}
        {dexNumber && (
          <span
            aria-hidden="true"
            className="font-mono pointer-events-none absolute inset-0 flex items-center justify-center text-[7rem] font-bold text-shell-400/15 select-none sm:text-[10rem]"
          >
            #{dexNumber}
          </span>
        )}
        {imageUrl && (
          // The real indexed sprite (img.pokemondb.net) is an opaque
          // white-background image, not a transparent cutout — against the
          // hero band's own art (docs/EXECUTION-PLAN-marketing-assets.md)
          // that white background read as a stray rectangle rather than a
          // sprite. Framing it as a deliberate card (rounded, `bg-surface`
          // so it's correct in both themes, shadow + hairline ring) turns
          // it into an intentional "trading card" floating on the band
          // instead of fighting the sprite's own opaque background — no
          // attempt to hide/cut out the real image data itself.
          <div className="absolute inset-[6%] overflow-hidden rounded-2xl bg-surface shadow-xl ring-1 ring-black/5 dark:ring-white/10">
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(min-width: 640px) 360px, 220px"
              className="object-contain p-2"
            />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col items-center gap-2 pb-1 sm:items-start">
        {dexNumber && <p className="font-mono-label text-xs text-shell-400">#{dexNumber}</p>}
        <h1 className="font-display text-(length:--text-3xl) font-bold text-foreground">
          {name}
        </h1>
        {species && <p className="text-sm text-shell-400">{species}</p>}
        {types.length > 0 && (
          <p className="mt-1 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
            {types.map((type) => (
              <Chip
                key={type}
                label={type}
                color={getTypeColor(type)}
                textColor={getTypeTextColor(type)}
                variant="type-solid"
              />
            ))}
          </p>
        )}
      </div>
    </div>
  );
}
