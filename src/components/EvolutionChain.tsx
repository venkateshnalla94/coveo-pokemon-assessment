import Link from "next/link";

/**
 * Simplified evolves-from ← this → evolves-to pair, as links to sibling
 * detail pages — see docs/EXECUTION-PLAN-v2.3-frontend.md §4. `to` is
 * mapped over correctly even though the extraction layer only ever
 * captures one branch today (docs/coveo-source-spec.md), so this keeps
 * working unmodified if that's ever fixed upstream. No branching-chain UI
 * beyond that — full branching with conditions is a deferred stretch goal
 * (plan §9).
 */
export interface EvolutionChainProps {
  from?: string;
  to: string[];
  current: string;
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
            <Link href={`/pokemon/${encodeURIComponent(from)}`} className="hover:underline">
              {from}
            </Link>
          </li>
          <li aria-hidden="true">&rarr;</li>
        </>
      )}
      <li className="font-semibold">{current}</li>
      {to.map((name) => (
        <li key={name} className="flex items-center gap-2">
          <span aria-hidden="true">&rarr;</span>
          <Link href={`/pokemon/${encodeURIComponent(name)}`} className="hover:underline">
            {name}
          </Link>
        </li>
      ))}
    </ol>
  );
}
