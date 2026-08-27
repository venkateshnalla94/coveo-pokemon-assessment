"use client";

import {
  buildResultList,
  buildSearchBox,
  loadAdvancedSearchQueryActions,
  type ResultListState,
} from "@coveo/headless";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AskAboutPokemon } from "@/components/AskAboutPokemon";
import { CoveoConfigBanner } from "@/components/CoveoConfigBanner";
import { isCoveoConfigured } from "@/coveo/config";
import { getSearchEngine } from "@/coveo/engine";
import { deriveSearchRenderState } from "@/coveo/searchRenderState";
import { getTypeColor } from "@/coveo/typeColors";

const EMPTY_STATE: ResultListState = {
  results: [],
  searchResponseId: "",
  moreResultsAvailable: false,
  isLoading: false,
  firstSearchExecuted: false,
  hasError: false,
  hasResults: false,
};

/**
 * Advanced-tier stub: resolves a single Pokemon by name via a search query
 * rather than a dedicated "fetch by id" API — Headless doesn't expose one
 * outside a search context, and searching by exact name is how a user would
 * reach this page anyway (from a ResultList click).
 */
export default function PokemonDetailPage() {
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(params.name);
  const configured = isCoveoConfigured();

  const [engine] = useState(() => (configured ? getSearchEngine() : undefined));
  const [searchBox] = useState(() => (engine ? buildSearchBox(engine) : undefined));
  const [resultList] = useState(() => (engine ? buildResultList(engine) : undefined));
  const [state, setState] = useState<ResultListState>(resultList?.state ?? EMPTY_STATE);

  useEffect(() => {
    if (!engine || !searchBox || !resultList) {
      return;
    }
    // C2: an exact-match constant query on `pokemonname`, not a free-text
    // search against the crawled page title — pokemondb page titles are
    // "Bulbasaur Pokédex: stats, moves..." not "Bulbasaur", so a free-text
    // `.find()` against `result.title` would (and did) always miss. Escape
    // any literal double quotes in the route param before interpolating.
    const escapedName = name.replace(/"/g, '\\"');
    const { updateAdvancedSearchQueries } = loadAdvancedSearchQueryActions(engine);
    engine.dispatch(updateAdvancedSearchQueries({ aq: `@pokemonname=="${escapedName}"` }));
    searchBox.updateText("");
    searchBox.submit();
    return resultList.subscribe(() => setState(resultList.state));
  }, [name, engine, searchBox, resultList]);

  const renderState = engine ? deriveSearchRenderState(state, engine) : undefined;
  // The `aq` filter above is the primary correctness fix; this client-side
  // re-check is just a safety net in case the field is ever multi-valued or
  // the index has near-duplicate names.
  const item =
    renderState?.status === "success"
      ? (renderState.items.find((i) => i.name.toLowerCase() === name.toLowerCase()) ??
        renderState.items[0])
      : undefined;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/" className="mb-6 inline-block text-sm text-black/60 hover:underline dark:text-white/60">
        &larr; Back to search
      </Link>
      {!configured && <CoveoConfigBanner />}
      {renderState?.status === "loading" && <p>Loading...</p>}
      {renderState?.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">{renderState.error.userMessage}</p>
      )}
      {renderState?.status === "success" && !item && (
        <p className="text-sm text-black/50 dark:text-white/50">
          No match found for &quot;{name}&quot;. Expected until a Coveo source is indexing
          pokemondb.net.
        </p>
      )}
      {renderState?.status === "empty" && (
        <p className="text-sm text-black/50 dark:text-white/50">
          No match found for &quot;{name}&quot;. Expected until a Coveo source is indexing
          pokemondb.net.
        </p>
      )}
      {item && (
        <div>
          <h1 className="mb-4 text-3xl font-bold">{item.name}</h1>
          {item.imageUrl && (
            <div className="relative mb-4 h-64 w-64">
              <Image src={item.imageUrl} alt={item.name} fill className="object-contain" />
            </div>
          )}
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="font-semibold">Type</dt>
            <dd>
              {item.types.length > 0 ? (
                <span className="flex flex-wrap items-center gap-2">
                  {item.types.map((type) => (
                    <span key={type} className="inline-flex items-center gap-1.5">
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
                </span>
              ) : (
                "—"
              )}
            </dd>
            <dt className="font-semibold">Generation</dt>
            <dd>{item.generation ?? "—"}</dd>
          </dl>
          <AskAboutPokemon pokemonName={item.name} />
        </div>
      )}
    </div>
  );
}
