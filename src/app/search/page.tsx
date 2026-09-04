"use client";

import { Suspense } from "react";
import { AutomaticFacets } from "@/components/AutomaticFacets";
import { CoveoConfigBanner } from "@/components/CoveoConfigBanner";
import { DidYouMean } from "@/components/DidYouMean";
import { FacetAbilities } from "@/components/FacetAbilities";
import { FacetRail } from "@/components/FacetRail";
import { FacetSpeed } from "@/components/FacetSpeed";
import { GeneratedAnswer } from "@/components/GeneratedAnswer";
import { Pager } from "@/components/Pager";
import { ResultList } from "@/components/ResultList";
import { SearchBox } from "@/components/SearchBox";
import { SearchSummaryBar } from "@/components/SearchSummaryBar";
import { SearchUrlSync } from "@/components/SearchUrlSync";
import { CONTENT } from "@/content/pokedex";
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
    <>
      <h1 className="sr-only">{CONTENT.seo.search.titlePrefix}</h1>
      {/* Must render (and therefore construct its urlManager) before
          <SearchBox> below — see SearchUrlSync.tsx's own doc comment.
          Kept as a top-level sibling, not nested inside <main>, so pulling
          the search bar out to its own full-bleed sticky wrapper (below)
          doesn't invert that ordering. */}
      {configured && <SearchUrlSync />}
      {/* Full-bleed sticky bar mirroring AppHeader's own structure (border +
          bg-surface + inner mx-auto max-w-7xl content), pinned directly
          under the sticky header (45px, measured live — AppHeader is
          wordmark-only on this route) so the query stays editable and
          visible while the results grid scrolls underneath. z-40, one below
          the header's z-50, matching CompareTray's existing z-40 for
          page-chrome-over-content layering. */}
      <div className="sticky top-11.25 z-40 border-b border-shell-100 bg-surface px-6 py-3 dark:border-shell-600">
        <div className="mx-auto max-w-7xl">
          <SearchBox />
        </div>
      </div>
      <main className="mx-auto w-full max-w-7xl px-6 py-10">
        {!configured ? (
          <CoveoConfigBanner />
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
            <FacetRail>
              {/* AutomaticFacets leads the rail (Type, then Generation — see
                  its own field-order-priority comment — then whichever other
                  fields Coveo's generator selected), with the two manual
                  facets after: neither is eligible for automatic generation
                  (FacetSpeed is numeric; FacetAbilities needs facet-search),
                  so they can't be folded into that same ordering. */}
              <AutomaticFacets />
              <FacetSpeed />
              <FacetAbilities />
            </FacetRail>
            <div>
              <SearchSummaryBar />
              <DidYouMean />
              <GeneratedAnswer />
              <ResultList />
              <Pager />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
