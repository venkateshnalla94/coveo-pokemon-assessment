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
import { useEffect, useState } from "react";
import { getSearchEngine } from "@/coveo/engine";
import type { PokemonItem } from "@/coveo/mapPokemonResult";
import { deriveSearchRenderState } from "@/coveo/searchRenderState";
import { getTypeColor } from "@/coveo/typeColors";

export function ResultList() {
  const [engine] = useState(() => getSearchEngine());
  const [resultList] = useState(() => buildResultList(engine));
  const [state, setState] = useState<ResultListState>(resultList.state);

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
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {/* deriveSearchRenderState maps state.results 1:1, in order, into
              renderState.items — zipping by index here to recover the raw
              Result (needed for buildInteractiveResult) without changing the
              mapper boundary's return type. */}
          {renderState.items.map((item, index) => (
            <ResultCard key={item.id} item={item} result={state.results[index]} engine={engine} />
          ))}
        </ul>
      );
  }
}

function ResultCard({
  item,
  result,
  engine,
}: {
  item: PokemonItem;
  result: Result;
  engine: SearchEngine;
}) {
  const [interactiveResult] = useState(() =>
    buildInteractiveResult(engine, { options: { result } }),
  );

  return (
    <li className="rounded-md border border-black/10 p-3 dark:border-white/15">
      <Link
        href={`/pokemon/${encodeURIComponent(item.name)}`}
        className="block"
        onClick={() => interactiveResult.select()}
      >
        {item.imageUrl && (
          <div className="relative mb-2 aspect-square w-full">
            <Image src={item.imageUrl} alt={item.name} fill className="object-contain" />
          </div>
        )}
        <p className="text-sm font-medium">{item.name}</p>
        {item.types.length > 0 && (
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-black/50 dark:text-white/50">
            {item.types.map((type) => (
              <span key={type} className="inline-flex items-center gap-1">
                {getTypeColor(type) && (
                  <span
                    aria-hidden="true"
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: getTypeColor(type) }}
                  />
                )}
                {type}
              </span>
            ))}
          </p>
        )}
      </Link>
    </li>
  );
}
