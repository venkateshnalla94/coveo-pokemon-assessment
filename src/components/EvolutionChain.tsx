import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { CONTENT } from "@/content/pokedex";
import type { EvolutionTarget } from "@/coveo/mapPokemonResult";
import { getTypeColor } from "@/coveo/typeColors";

/**
 * Evolves-from ← this → evolves-to(es), as a horizontal stage of lit sprite
 * tiles (v4 plan §9) — see docs/EXECUTION-PLAN-v2.3-frontend.md §4 for the
 * underlying data contract. `to` renders every real branch (e.g. all 8
 * Eeveelutions), each with its own sprite, since the extraction layer
 * captures full multi-value evolution data plus an index-aligned image per
 * branch (docs/coveo-source-spec.md). Pikachu's two "Raichu" branches
 * (regular vs. Alolan) render as two separate entries on purpose — see
 * `EvolutionTarget`'s doc comment in `mapPokemonResult.ts` for why they're
 * not deduped by name.
 *
 * No trigger condition (e.g. "Level 16", "Thunder Stone") is rendered
 * between stages, even though the v4 plan's prose describes one: neither
 * `EvolutionTarget` nor docs/coveo-source-spec.md's evolution-chart
 * extraction carries that field today, and inventing one would violate the
 * no-fabricated-data constraint that overrides the rest of the plan (v4
 * plan §1). The stages are separated by a plain arrow instead; adding a
 * real trigger-condition field is index/extraction work for a future pass,
 * not a presentational one.
 */
export interface EvolutionChainProps {
  from?: EvolutionTarget;
  to: EvolutionTarget[];
  current: string;
  /** The current Pokemon's own sprite/types, so its stage tile can render
   * like its siblings and pick up the `--type-edge` ring. Optional so
   * existing callers (and tests) that only pass `from`/`to`/`current`
   * still render a valid, if unlit, current-stage tile. */
  currentImageUrl?: string;
  currentTypes?: string[];
}

function EvolutionSprite({ target }: { target: EvolutionTarget }) {
  if (!target.imageUrl) return null;
  // alt="" deliberately: this sits directly next to the same name as visible
  // text, so a non-empty alt would announce the name twice to screen readers.
  return (
    <div className="relative size-14 shrink-0">
      <Image src={target.imageUrl} alt="" fill className="object-contain" />
    </div>
  );
}

export function EvolutionChain({
  from,
  to,
  current,
  currentImageUrl,
  currentTypes = [],
}: EvolutionChainProps) {
  if (!from && to.length === 0) {
    return (
      <p className="text-sm text-shell-500">{CONTENT.pdp.noEvolutionData(current)}</p>
    );
  }

  // Decorative only (v4 plan §2.3/§9) — types[0] isn't a verified "primary"
  // type, so this never gets labeled as one; it only picks the current
  // stage tile's --type-edge ring color.
  const currentColor = currentTypes.map((type) => getTypeColor(type)).find((color): color is string => Boolean(color));
  const currentVars = currentColor ? ({ "--type-primary": currentColor } as CSSProperties) : undefined;

  return (
    <ol className="flex flex-wrap items-center gap-3">
      {from && (
        <>
          <li>
            <Link
              href={`/pokemon/${encodeURIComponent(from.name)}`}
              className="evo-stage flex flex-col items-center gap-1.5 p-3 text-sm hover:opacity-80"
            >
              <EvolutionSprite target={from} />
              {from.name}
            </Link>
          </li>
          <li aria-hidden="true" className="font-mono-label text-shell-500">
            &rarr;
          </li>
        </>
      )}
      <li>
        <div
          className="evo-stage flex flex-col items-center gap-1.5 p-3 text-sm font-semibold text-foreground"
          data-current="true"
          style={currentVars}
        >
          {currentImageUrl && (
            <div className="relative size-14 shrink-0">
              <Image src={currentImageUrl} alt="" fill className="object-contain" />
            </div>
          )}
          {current}
        </div>
      </li>
      {to.map((target, index) => (
        <li key={`${target.name}-${index}`} className="flex items-center gap-3">
          <span aria-hidden="true" className="font-mono-label text-shell-500">
            &rarr;
          </span>
          <Link
            href={`/pokemon/${encodeURIComponent(target.name)}`}
            className="evo-stage flex flex-col items-center gap-1.5 p-3 text-sm hover:opacity-80"
          >
            <EvolutionSprite target={target} />
            {target.name}
          </Link>
        </li>
      ))}
    </ol>
  );
}
