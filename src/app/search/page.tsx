"use client";

import { Suspense } from "react";
import { CoveoConfigBanner } from "@/components/CoveoConfigBanner";
import { DidYouMean } from "@/components/DidYouMean";
import { FacetAbilities } from "@/components/FacetAbilities";
import { FacetGeneration } from "@/components/FacetGeneration";
import { FacetRail } from "@/components/FacetRail";
import { FacetSpeed } from "@/components/FacetSpeed";
import { FacetType } from "@/components/FacetType";
import { GeneratedAnswer } from "@/components/GeneratedAnswer";
import { Pager } from "@/components/Pager";
import { ResultList } from "@/components/ResultList";
import { SearchBox } from "@/components/SearchBox";
import { SearchSummaryBar } from "@/components/SearchSummaryBar";
import { SearchUrlSync } from "@/components/SearchUrlSync";
import { isCoveoConfigured } from "@/coveo/config";

/**
 * `/search` — the full results experience (facets, sort, breadcrumbs,
 * results grid, pagination, RGA). `SearchUrlSync` (`buildUrlManager`) owns
 * query/facet/sort state here, sourced from and reflected back into the URL
 * — see SearchUrlSync.tsx's doc comment for why `<SearchBox>` is rendered
 * WITHOUT `initialQuery` on this route (that prop stays reserved for the
 * home page's redirect-then-seed flow). `useSearchParams()` (used by
 * SearchUrlSync and ResultList) requires a Suspense boundary, hence the
 * wrapper below.
 */
export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const configured = isCoveoConfigured();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {configured && <SearchUrlSync />}
      <div className="mb-6">
        <SearchBox />
      </div>
      {!configured ? (
        <CoveoConfigBanner />
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
          <FacetRail>
            <FacetType />
            <FacetGeneration />
            <FacetAbilities />
            <FacetSpeed />
          </FacetRail>
          <main>
            <SearchSummaryBar />
            <DidYouMean />
            <GeneratedAnswer />
            <ResultList />
            <Pager />
          </main>
        </div>
      )}
    </div>
  );
}
