import Image from "next/image";
import type { CSSProperties } from "react";
import { Chip } from "@/components/ui/Chip";
import { DataList, type DataListRow } from "@/components/ui/DataList";
import { CONTENT } from "@/content/pokedex";
import { getTypeColor, getTypeTextColor } from "@/coveo/typeColors";

/**
 * Two-column commerce-PDP layout: a large sprite "packshot" panel on the
 * left, identity + type + quick facts on the right — see
 * docs/handoff/archive/sessions-017-027.md's PDP redesign entry for why. Supersedes the prior
 * single-stacked-column version, which existed to let the sprite bleed
 * (via a negative top margin) over a full-bleed photographic backdrop band
 * rendered by the page above this component; that backdrop is gone, so
 * there's nothing left to overlap and no negative-margin trick needed.
 */
export interface PokemonHeroProps {
  name: string;
  imageUrl: string | undefined;
  dexNumber: string | undefined;
  types: string[];
  species: string | undefined;
  generation: string | undefined;
  /** `abilities[0]` — source order, not a verified primary ability; see CONTENT.pdp.abilityLabel's comment. */
  topAbility: string | undefined;
}

export function PokemonHero({
  name,
  imageUrl,
  dexNumber,
  types,
  species,
  generation,
  topAbility,
}: PokemonHeroProps) {
  // Type-driven lighting (v4 plan §5/§2.3, reused here). `types[0]` is not a
  // verified "primary" type — decorative only, never labeled as such.
  const typeColors = types.map((type) => getTypeColor(type)).filter((color): color is string => Boolean(color));
  const [primaryColor, secondaryColor] = typeColors;
  const isDualGlow = Boolean(primaryColor && secondaryColor && primaryColor !== secondaryColor);
  const glowVars = primaryColor
    ? ({
        "--type-primary": primaryColor,
        "--type-secondary": secondaryColor ?? primaryColor,
      } as CSSProperties)
    : undefined;

  const quickFacts: DataListRow[] = [];
  if (generation) {
    quickFacts.push({ label: CONTENT.pdp.profileLabels.generation, value: generation });
  }
  if (topAbility) {
    quickFacts.push({ label: CONTENT.pdp.abilityLabel, value: topAbility });
  }

  return (
    <div className="mb-8 grid grid-cols-1 gap-8 px-6 sm:grid-cols-[minmax(0,360px)_1fr] sm:items-start">
      {/* Packshot panel — the dominant visual element in its own column,
          not a small card overlapping a photo. Same "trading card on a
          light surface" idea as before (rounded, bg-surface so it's
          correct in both themes, shadow + hairline ring), now the primary
          presentation rather than a workaround for a clashing background. */}
      <div
        className="hero-packshot relative mx-auto flex aspect-square w-full max-w-90 items-center justify-center overflow-hidden rounded-2xl bg-surface shadow-xl ring-1 ring-black/5 dark:ring-white/10"
        data-glow={primaryColor ? (isDualGlow ? "dual" : "single") : undefined}
        style={glowVars}
      >
        {dexNumber && (
          <span
            aria-hidden="true"
            className="font-mono pointer-events-none absolute inset-0 flex items-center justify-center text-[7rem] font-bold text-shell-500/15 select-none sm:text-[9rem]"
          >
            #{dexNumber}
          </span>
        )}
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(min-width: 640px) 360px, 320px"
            className="object-contain p-6"
          />
        )}
      </div>

      <div className="flex flex-col gap-2 text-center sm:pt-2 sm:text-left">
        {dexNumber && <p className="font-mono-label text-xs text-shell-500">#{dexNumber}</p>}
        <h1 className="font-display text-(length:--text-3xl) font-bold text-foreground">
          {name}
        </h1>
        {species && <p className="text-sm text-shell-500">{species}</p>}
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
        {quickFacts.length > 0 && (
          <div className="mt-3 flex justify-center border-t border-shell-100 pt-3 dark:border-shell-600 sm:justify-start">
            <DataList rows={quickFacts} />
          </div>
        )}
      </div>
    </div>
  );
}
