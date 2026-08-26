"use client";

import { useRouter } from "next/navigation";
import { SearchBox } from "@/components/SearchBox";

/**
 * Minimal home page: hero copy + the search box (with Query Suggest
 * typeahead). The actual search executes on `/search`, not here — see
 * SearchBox's `onNavigate` prop and src/app/search/page.tsx.
 *
 * Always renders the search UI, even when Coveo isn't configured — SearchBox
 * itself falls back to local state and only surfaces a config-error popup
 * if the user actually tries to search, instead of the whole page being
 * replaced by a banner on load.
 */
export default function Home() {
  const router = useRouter();

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
      <h1 className="mb-2 text-3xl font-bold">Pokedex Search</h1>
      <p className="mb-8 text-black/60 dark:text-white/60">
        Search every Pokemon indexed from pokemondb.net, powered by Coveo.
      </p>
      <SearchBox onNavigate={(query) => router.push(`/search?q=${encodeURIComponent(query)}`)} />
    </div>
  );
}
