"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CoveoConfigBanner } from "@/components/CoveoConfigBanner";
import { FacetGeneration } from "@/components/FacetGeneration";
import { FacetType } from "@/components/FacetType";
import { GeneratedAnswer } from "@/components/GeneratedAnswer";
import { Pager } from "@/components/Pager";
import { ResultList } from "@/components/ResultList";
import { SearchBox } from "@/components/SearchBox";
import { isCoveoConfigured } from "@/coveo/config";

/**
 * `/search?q=<term>` — the full results experience (facets, results grid,
 * pagination, RGA). Renders the shared `<SearchBox>` as the single source of
 * truth for the query — it's seeded from the URL's `q` param via its
 * `initialQuery` prop (one submit on mount/param-change) and then owns
 * further typing itself, rather than this page privately building its own
 * second `buildSearchBox` controller pointed at the same engine.
 * `useSearchParams()` requires a Suspense boundary, hence the wrapper below.
 */
export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const configured = isCoveoConfigured();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/" className="mb-6 inline-block text-sm text-black/60 hover:underline dark:text-white/60">
        &larr; Back to home
      </Link>
      <h1 className="mb-4 text-3xl font-bold">Pokedex Search</h1>
      <div className="mb-6">
        <SearchBox initialQuery={q} />
      </div>
      {!configured ? (
        <CoveoConfigBanner />
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
          <aside>
            <FacetType />
            <FacetGeneration />
          </aside>
          <main>
            <GeneratedAnswer />
            <ResultList />
            <Pager />
          </main>
        </div>
      )}
    </div>
  );
}
