"use client";

import {
  buildResultList,
  buildSearchBox,
  loadAdvancedSearchQueryActions,
  type ResultListState,
} from "@coveo/headless";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AbilityList } from "@/components/AbilityList";
import { AskAboutPokemon } from "@/components/AskAboutPokemon";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CoveoConfigBanner } from "@/components/CoveoConfigBanner";
import { EvolutionChain } from "@/components/EvolutionChain";
import { PokemonHero } from "@/components/PokemonHero";
import { PokemonProfilePanel } from "@/components/PokemonProfilePanel";
import { PokemonStatPanel } from "@/components/PokemonStatPanel";
import { TrainingPanel } from "@/components/TrainingPanel";
import { TypeDefenses } from "@/components/TypeDefenses";
import { Tabs } from "@/components/ui/Tabs";
import { isCoveoConfigured } from "@/coveo/config";
import { getSearchEngine } from "@/coveo/engine";
import { deriveSearchRenderState } from "@/coveo/searchRenderState";
import { useControllerState } from "@/coveo/useControllerState";

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
 *
 * This is orchestration + render states only — see
 * docs/EXECUTION-PLAN-v2.3-frontend.md §4. Presentation lives in the
 * PokemonHero/PokemonStatPanel/Tabs/panel components it composes below.
 */
export default function PokemonDetailPage() {
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(params.name);
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? undefined;
  const configured = isCoveoConfigured();

  const [engine] = useState(() => (configured ? getSearchEngine() : undefined));
  const [searchBox] = useState(() => (engine ? buildSearchBox(engine) : undefined));
  const [resultList] = useState(() => (engine ? buildResultList(engine) : undefined));
  const state = useControllerState(resultList) ?? EMPTY_STATE;

  const lastSubmittedName = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!engine || !searchBox || !resultList) {
      return;
    }
    // C2: an exact-match constant query on `pokemonname`, not a free-text
    // search against the crawled page title — pokemondb page titles are
    // "Bulbasaur Pokédex: stats, moves..." not "Bulbasaur", so a free-text
    // `.find()` against `result.title` would (and did) always miss. Escape
    // any literal double quotes in the route param before interpolating.
    //
    // The empty `searchBox.updateText("")` here is deliberate and NOT to be
    // changed to send `name` as query text: doing so would fire RGA's
    // "Query is not empty" condition on this page, but at the cost of the
    // exact-match fix this effect exists to provide. This page's AI surface
    // is Passage Retrieval (AskAboutPokemon), not RGA — see plan §1.3.
    if (lastSubmittedName.current !== name) {
      lastSubmittedName.current = name;
      const escapedName = name.replace(/"/g, '\\"');
      const { updateAdvancedSearchQueries } = loadAdvancedSearchQueryActions(engine);
      engine.dispatch(updateAdvancedSearchQueries({ aq: `@pokemonname=="${escapedName}"` }));
      searchBox.updateText("");
      searchBox.submit();
      // Dev-mode Strict Mode double-invokes this effect on mount with the
      // same name; without this guard that fires two submit()s back to
      // back, and Headless cancels the first (correct — a newer query
      // supersedes a stale one), which its own logger reports as an
      // "Action dispatch error ... rejected" even though nothing is broken.
    }
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
      <Breadcrumb name={name} from={from} />
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
          <PokemonHero
            name={item.name}
            imageUrl={item.imageUrl}
            dexNumber={item.dexNumber}
            types={item.types}
            species={item.species}
          />
          <PokemonStatPanel stats={item.stats} total={item.statTotal} />
          <Tabs
            tabs={[
              {
                id: "overview",
                label: "Overview",
                panel: (
                  <div className="flex flex-col gap-4">
                    <PokemonProfilePanel
                      height={item.height}
                      weight={item.weight}
                      species={item.species}
                      eggGroups={item.breeding.eggGroups}
                      eggCycles={item.breeding.eggCycles}
                      catchRate={item.training.catchRate}
                      baseExp={item.training.baseExp}
                    />
                    <TrainingPanel
                      evYield={item.training.evYield}
                      baseFriendship={item.training.baseFriendship}
                      growthRate={item.training.growthRate}
                    />
                  </div>
                ),
              },
              {
                id: "abilities",
                label: "Abilities",
                panel: (
                  <div className="flex flex-col gap-4">
                    <AbilityList abilities={item.abilities} />
                    <TypeDefenses
                      weaknesses={item.defenses.weaknesses}
                      resistances={item.defenses.resistances}
                    />
                  </div>
                ),
              },
              {
                id: "evolution",
                label: "Evolution",
                panel: (
                  <EvolutionChain
                    from={item.evolution.from}
                    to={item.evolution.to}
                    current={item.name}
                  />
                ),
              },
            ]}
          />
          <aside>
            <AskAboutPokemon pokemonName={item.name} />
          </aside>
        </div>
      )}
    </div>
  );
}
