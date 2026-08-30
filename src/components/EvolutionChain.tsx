import Image from "next/image";
import Link from "next/link";
import type { EvolutionTarget } from "@/coveo/mapPokemonResult";

/**
 * Evolves-from ← this → evolves-to(es), as links to sibling detail pages —
 * see docs/EXECUTION-PLAN-v2.3-frontend.md §4. `to` renders every real
 * branch (e.g. all 8 Eeveelutions), each with its own sprite, since the
 * extraction layer captures full multi-value evolution data plus an
 * index-aligned image per branch (docs/coveo-source-spec.md). Pikachu's two
 * "Raichu" branches (regular vs. Alolan) render as two separate entries on
 * purpose — see `EvolutionTarget`'s doc comment in `mapPokemonResult.ts` for
 * why they're not deduped by name.
 */
export interface EvolutionChainProps {
  from?: EvolutionTarget;
  to: EvolutionTarget[];
  current: string;
}

function EvolutionSprite({ target }: { target: EvolutionTarget }) {
  if (!target.imageUrl) return null;
  // alt="" deliberately: this sits directly next to the same name as visible
  // text, so a non-empty alt would announce the name twice to screen readers.
  return (
    <div className="relative size-8 shrink-0">
      <Image src={target.imageUrl} alt="" fill className="object-contain" />
    </div>
  );
}

export function EvolutionChain({ from, to, current }: EvolutionChainProps) {
  if (!from && to.length === 0) {
    return (
      <p className="text-sm text-black/50 dark:text-white/50">
        No evolution data available for {current}.
      </p>
    );
  }

  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {from && (
        <>
          <li>
            <Link
              href={`/pokemon/${encodeURIComponent(from.name)}`}
              className="flex items-center gap-1.5 hover:underline"
            >
              <EvolutionSprite target={from} />
              {from.name}
            </Link>
          </li>
          <li aria-hidden="true">&rarr;</li>
        </>
      )}
      <li className="font-semibold">{current}</li>
      {to.map((target, index) => (
        <li key={`${target.name}-${index}`} className="flex items-center gap-2">
          <span aria-hidden="true">&rarr;</span>
          <Link
            href={`/pokemon/${encodeURIComponent(target.name)}`}
            className="flex items-center gap-1.5 hover:underline"
          >
            <EvolutionSprite target={target} />
            {target.name}
          </Link>
        </li>
      ))}
    </ol>
  );
}
