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
import { SimilarPokemon } from "@/components/SimilarPokemon";
import { TrainingPanel } from "@/components/TrainingPanel";
import { TypeDefenses } from "@/components/TypeDefenses";
import { Tabs } from "@/components/ui/Tabs";
import { CONTENT } from "@/content/pokedex";
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
export default function PokemonDetailPageClient() {
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
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <Breadcrumb name={name} from={from} />
      {!configured && <CoveoConfigBanner />}
      {renderState?.status === "loading" && <PokemonDetailSkeleton />}
      {renderState?.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">{renderState.error.userMessage}</p>
      )}
      {/* Rewritten during the v4 content-extraction pass: previously this
          exact literal — leaking "Coveo source is indexing" ops detail —
          was duplicated verbatim across these two branches. Both now call
          the single CONTENT.pdp.notFoundBody function. */}
      {renderState?.status === "success" && !item && (
        <p className="text-sm text-shell-400">
          {CONTENT.pdp.notFoundTitle}. {CONTENT.pdp.notFoundBody(name)}
        </p>
      )}
      {renderState?.status === "empty" && (
        <p className="text-sm text-shell-400">
          {CONTENT.pdp.notFoundTitle}. {CONTENT.pdp.notFoundBody(name)}
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
            generation={item.generation}
            topAbility={item.abilities[0]}
          />
          <PokemonStatPanel stats={item.stats} total={item.statTotal} types={item.types} />
          <Tabs
            tabs={[
              {
                id: "overview",
                label: CONTENT.pdp.tabs.overview,
                panel: (
                  <div className="flex flex-col gap-4">
                    <PokemonProfilePanel
                      height={item.height}
                      weight={item.weight}
                      species={item.species}
                      generation={item.generation}
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
                label: CONTENT.pdp.tabs.abilities,
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
                label: CONTENT.pdp.tabs.evolution,
                panel: (
                  <EvolutionChain
                    from={item.evolution.from}
                    to={item.evolution.to}
                    current={item.name}
                    currentImageUrl={item.imageUrl}
                    currentTypes={item.types}
                  />
                ),
              },
            ]}
          />
          {/* Keyed by name, not just relying on the effect's own deps, so a
              Pokemon-to-Pokemon navigation remounts this component fresh —
              its internal state resets to "loading" via useState's own
              initializer rather than a synchronous setState inside the
              effect (see SimilarPokemon.tsx's comment on why). */}
          <SimilarPokemon key={item.name} pokemonName={item.name} pokemonTypes={item.types} />
          <aside>
            <AskAboutPokemon pokemonName={item.name} pokemonTypes={item.types} />
          </aside>
        </div>
      )}
    </div>
  );
}

/**
 * Mirrors PokemonHero + PokemonStatPanel + Tabs' own box shapes (region
 * spacing, wrapper classes) so the loading -> loaded swap doesn't reflow the
 * page — same intent as ResultCardSkeleton (ResultList.tsx) and
 * AnswerSkeleton (GeneratedAnswer.tsx), which this follows for visual
 * consistency (animate-pulse, not a separate shimmer treatment).
 */
function PokemonDetailSkeleton() {
  return (
    <>
      <span className="sr-only">{CONTENT.search.loadingLabel}</span>
      <div aria-hidden="true">
        <div className="mb-8 grid grid-cols-1 gap-8 px-6 sm:grid-cols-[minmax(0,360px)_1fr] sm:items-start">
          <div className="mx-auto aspect-square w-full max-w-90 animate-pulse rounded-2xl bg-shell-100 dark:bg-shell-600/40" />
          <div className="flex flex-col gap-3 sm:pt-2">
            <div className="h-3 w-16 animate-pulse rounded bg-shell-100 dark:bg-shell-600/40" />
            <div className="h-8 w-2/3 animate-pulse rounded bg-shell-100 dark:bg-shell-600/40" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-shell-100 dark:bg-shell-600/40" />
            <div className="mt-1 flex gap-1.5">
              <div className="h-6 w-16 animate-pulse rounded-full bg-shell-100 dark:bg-shell-600/40" />
              <div className="h-6 w-16 animate-pulse rounded-full bg-shell-100 dark:bg-shell-600/40" />
            </div>
            <div className="mt-3 h-10 w-1/2 animate-pulse rounded bg-shell-100 border-t border-shell-100 pt-3 dark:border-shell-600 dark:bg-shell-600/40" />
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-2 rounded-lg border border-shell-100 bg-surface p-4 dark:border-shell-600">
          <div className="mb-1 h-3 w-20 animate-pulse rounded bg-shell-100 dark:bg-shell-600/40" />
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-3 w-full animate-pulse rounded bg-shell-100 dark:bg-shell-600/40" />
          ))}
          <div className="mt-1 h-4 w-24 animate-pulse rounded bg-shell-100 border-t border-shell-100 pt-2 dark:border-shell-600 dark:bg-shell-600/40" />
        </div>

        <div>
          <div className="flex gap-1 border-b border-shell-100 pb-2 dark:border-shell-600">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-4 w-20 animate-pulse rounded bg-shell-100 dark:bg-shell-600/40" />
            ))}
          </div>
          <div className="mt-3 h-40 w-full animate-pulse rounded bg-shell-100 dark:bg-shell-600/40" />
        </div>
      </div>
    </>
  );
}
