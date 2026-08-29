"use client";

import {
  buildInteractiveResult,
  buildResultList,
  type Result,
  type ResultListState,
  type SearchEngine,
} from "@coveo/headless";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCompare } from "@/components/compare/CompareProvider";
import { Chip } from "@/components/ui/Chip";
import { getSearchEngine } from "@/coveo/engine";
import type { PokemonItem } from "@/coveo/mapPokemonResult";
import { deriveSearchRenderState } from "@/coveo/searchRenderState";
import { getTypeColor } from "@/coveo/typeColors";

export function ResultList() {
  const [engine] = useState(() => getSearchEngine());
  const [resultList] = useState(() => buildResultList(engine));
  const [state, setState] = useState<ResultListState>(resultList.state);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The exact current search URL (path + query string, including facets/
  // sort/pagination) — this is what Breadcrumb.tsx (Step 3) reads back via
  // `?from=` and renders as its "Search results" crumb link, so a Pokemon
  // opened from a filtered/sorted/paginated view can return to that exact
  // view rather than a bare `/search`.
  const fromHref = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  useEffect(() => resultList.subscribe(() => setState(resultList.state)), [resultList]);

  const renderState = deriveSearchRenderState(state, engine);

  switch (renderState.status) {
    case "loading":
      return <p className="text-sm text-black/50 dark:text-white/50">Loading...</p>;
    case "error":
      return (
        <p className="text-sm text-red-600 dark:text-red-400">{renderState.error.userMessage}</p>
      );
    case "empty":
      return (
        <p className="text-sm text-black/50 dark:text-white/50">
          No results. This is expected until a Coveo source is indexing pokemondb.net — see the
          project README.
        </p>
      );
    case "success":
      return (
        <ul aria-label="Search results" className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {/* deriveSearchRenderState maps state.results 1:1, in order, into
              renderState.items — zipping by index here to recover the raw
              Result (needed for buildInteractiveResult) without changing the
              mapper boundary's return type. */}
          {renderState.items.map((item, index) => (
            <ResultCard
              key={item.id}
              item={item}
              result={state.results[index]}
              engine={engine}
              fromHref={fromHref}
            />
          ))}
        </ul>
      );
  }
}

function ResultCard({
  item,
  result,
  engine,
  fromHref,
}: {
  item: PokemonItem;
  result: Result;
  engine: SearchEngine;
  fromHref: string;
}) {
  const [interactiveResult] = useState(() =>
    buildInteractiveResult(engine, { options: { result } }),
  );
  const { isSelected, isFull, add, remove } = useCompare();
  const selected = isSelected(item.name);
  // Disabled once the cap is reached and this card isn't already one of the
  // 4 selected — a visible, discoverable "why" (the title attribute) rather
  // than a silent no-op, per docs/EXECUTION-PLAN-v2.3-frontend.md §6's
  // 4-name cap.
  const disabled = isFull && !selected;
  const detailHref = `/pokemon/${encodeURIComponent(item.name)}?from=${encodeURIComponent(fromHref)}`;

  return (
    <li className="rounded-md border border-black/10 p-3 dark:border-white/15">
      <Link href={detailHref} className="block" onClick={() => interactiveResult.select()}>
        {item.imageUrl && (
          <div className="relative mb-2 aspect-square w-full">
            <Image src={item.imageUrl} alt={item.name} fill className="object-contain" />
          </div>
        )}
        <p className="flex items-baseline justify-between gap-2 text-sm font-medium">
          <span>{item.name}</span>
          {item.dexNumber && (
            <span className="shrink-0 text-xs font-normal text-black/40 dark:text-white/40">
              #{item.dexNumber}
            </span>
          )}
        </p>
        {item.types.length > 0 && (
          <p className="mt-1 flex flex-wrap items-center gap-1.5">
            {item.types.map((type) => (
              <Chip key={type} label={type} color={getTypeColor(type)} variant="type" />
            ))}
          </p>
        )}
        {item.statTotal !== undefined && (
          <p className="mt-1 text-xs text-black/50 dark:text-white/50">
            Base stat total: {item.statTotal}
          </p>
        )}
      </Link>
      {/* Outside the <Link> deliberately — sitting inside it would fire
          interactiveResult.select()'s click-tracking event on every compare
          toggle, not just on navigation. */}
      <label className="mt-2 flex items-center gap-1.5 text-xs text-black/60 dark:text-white/60">
        <input
          type="checkbox"
          checked={selected}
          disabled={disabled}
          title={disabled ? "Comparison is full (max 4) — remove one to add another" : undefined}
          onChange={() => (selected ? remove(item.name) : add(item.name))}
        />
        Compare
      </label>
    </li>
  );
}
