"use client";

import {
  buildResultList,
  buildSearchBox,
  loadAdvancedSearchQueryActions,
  type ResultListState,
} from "@coveo/headless";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { PokemonImage } from "@/components/ui/PokemonImage";
import { CoveoConfigBanner } from "@/components/CoveoConfigBanner";
import { CONTENT } from "@/content/pokedex";
import { isCoveoConfigured } from "@/coveo/config";
import { getSearchEngine } from "@/coveo/engine";
import { STAT_ORDER } from "@/coveo/pokemonStats";
import { deriveSearchRenderState } from "@/coveo/searchRenderState";
import { getTypeColor } from "@/coveo/typeColors";
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
 * `/compare?names=A,B,C` — a side-by-side comparison, always re-resolved
 * against the live index. Only Pokemon *names* ever come from the Compare
 * selection (sessionStorage via CompareProvider, see ADR-0009); every stat/
 * type/ability value shown here is this render's own fresh Search API
 * response, never a stored snapshot — PRODUCT.md Principle 4.
 *
 * Reuses the exact-match `aq` pattern from
 * src/app/pokemon/[name]/page.tsx (C2), extended to an `==(...)` list
 * match rather than inventing a second way to query by name.
 */
export default function ComparePage() {
  return (
    <Suspense fallback={<p className="mx-auto w-full max-w-7xl px-6 py-10">{CONTENT.search.loadingLabel}</p>}>
      <ComparePageContent />
    </Suspense>
  );
}

/**
 * `useSearchParams()` opts a page out of static prerendering unless it's
 * wrapped in a Suspense boundary (see
 * https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout) —
 * required here since, unlike the dynamic `/pokemon/[name]` route, `/compare`
 * has no dynamic segment forcing it dynamic already.
 */
function ComparePageContent() {
  const searchParams = useSearchParams();
  const namesParam = searchParams.get("names") ?? "";
  const names = namesParam
    .split(",")
    .map((n) => decodeURIComponent(n.trim()))
    .filter((n) => n.length > 0);

  const configured = isCoveoConfigured();

  const [engine] = useState(() => (configured ? getSearchEngine() : undefined));
  const [searchBox] = useState(() => (engine ? buildSearchBox(engine) : undefined));
  const [resultList] = useState(() => (engine ? buildResultList(engine) : undefined));
  const state = useControllerState(resultList) ?? EMPTY_STATE;

  const lastSubmittedKey = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!engine || !searchBox || !resultList || names.length === 0) {
      return;
    }
    const key = names.join("|");
    if (lastSubmittedKey.current !== key) {
      lastSubmittedKey.current = key;
      // Same exact-match strategy as the detail page (C2), extended to a
      // list match: `@pokemonname==("A","B","C")`. Escape literal double
      // quotes in each name before interpolating.
      const quotedNames = names
        .map((name) => `"${name.replace(/"/g, '\\"')}"`)
        .join(",");
      const { updateAdvancedSearchQueries } = loadAdvancedSearchQueryActions(engine);
      engine.dispatch(updateAdvancedSearchQueries({ aq: `@pokemonname==(${quotedNames})` }));
      searchBox.updateText("");
      searchBox.submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namesParam, engine, searchBox, resultList]);

  const renderState = engine ? deriveSearchRenderState(state, engine) : undefined;
  const items = renderState?.status === "success" ? renderState.items : [];

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      <Link href="/" className="mb-6 inline-block text-sm text-shell-500 hover:underline hover:text-foreground">
        {CONTENT.compare.backLinkLabel}
      </Link>
      <h1 className="font-display mb-6 text-3xl font-bold text-foreground">{CONTENT.compare.pageTitle}</h1>

      {!configured && <CoveoConfigBanner />}

      {names.length === 0 && configured && (
        <p className="text-sm text-shell-500">
          {CONTENT.compare.emptySelectionMessage}
        </p>
      )}

      {renderState?.status === "loading" && <p>{CONTENT.search.loadingLabel}</p>}
      {renderState?.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">{renderState.error.userMessage}</p>
      )}
      {renderState?.status === "empty" && names.length > 0 && (
        <p className="text-sm text-shell-500">
          {CONTENT.compare.notFoundMessage}
        </p>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-22.5 border-b border-shell-100 bg-surface p-2 text-left font-semibold text-foreground dark:border-shell-600">
                  &nbsp;
                </th>
                {items.map((item) => (
                  <th
                    key={item.id}
                    className="min-w-27.5 border-b border-shell-100 p-2 text-left font-semibold text-foreground sm:min-w-35 dark:border-shell-600"
                  >
                    {item.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th className="sticky left-0 z-10 min-w-22.5 bg-surface p-2 text-left font-normal text-shell-500">
                  {CONTENT.compare.rowLabels.image}
                </th>
                {items.map((item) => (
                  <td key={item.id} className="min-w-27.5 p-2 sm:min-w-35">
                    <PokemonImage
                      src={item.imageUrl}
                      alt={item.name}
                      fallbackLabel={CONTENT.sprite.noImageLabel}
                      sizes="96px"
                      containerClassName="relative aspect-square w-20 sm:w-24"
                      className="object-contain object-left"
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <th className="sticky left-0 z-10 min-w-22.5 bg-surface p-2 text-left font-normal text-shell-500">
                  {CONTENT.compare.rowLabels.type}
                </th>
                {items.map((item) => (
                  <td key={item.id} className="p-2">
                    <span className="flex flex-wrap items-center gap-1.5">
                      {item.types.map((type) => (
                        <Chip key={type} label={type} color={getTypeColor(type)} variant="type" />
                      ))}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <th className="sticky left-0 z-10 bg-surface p-2 text-left font-normal text-shell-500">
                  {CONTENT.compare.rowLabels.height}
                </th>
                {items.map((item) => (
                  <td key={item.id} className="p-2">
                    {item.height ?? "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="sticky left-0 z-10 bg-surface p-2 text-left font-normal text-shell-500">
                  {CONTENT.compare.rowLabels.weight}
                </th>
                {items.map((item) => (
                  <td key={item.id} className="p-2">
                    {item.weight ?? "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="sticky left-0 z-10 bg-surface p-2 text-left font-normal text-shell-500">
                  {CONTENT.compare.rowLabels.abilities}
                </th>
                {items.map((item) => (
                  <td key={item.id} className="p-2">
                    {item.abilities.length > 0 ? (
                      <span className="flex flex-wrap items-center gap-1.5">
                        {item.abilities.map((ability) => (
                          <Chip key={ability} label={ability} variant="neutral" />
                        ))}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                ))}
              </tr>
              {STAT_ORDER.map(({ key, label }) => (
                <tr key={key}>
                  <th className="sticky left-0 z-10 border-t border-shell-100 bg-surface p-2 text-left font-normal text-shell-500 dark:border-shell-600">
                    {label}
                  </th>
                  {items.map((item) => (
                    <td key={item.id} className="border-t border-shell-100 p-2 tabular-nums text-foreground dark:border-shell-600">
                      {item.stats[key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <th className="sticky left-0 z-10 border-t border-shell-100 bg-surface p-2 text-left font-semibold text-foreground dark:border-shell-600">
                  {CONTENT.compare.rowLabels.total}
                </th>
                {items.map((item) => (
                  <td key={item.id} className="border-t border-shell-100 p-2 font-semibold tabular-nums text-foreground dark:border-shell-600">
                    {item.statTotal ?? "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
