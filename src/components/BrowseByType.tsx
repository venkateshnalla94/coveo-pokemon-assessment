import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { CONTENT } from "@/content/pokedex";
import { buildTypeSearchHref } from "@/coveo/browseByTypeUrl";
import { getTypeColor, POKEMON_TYPES } from "@/coveo/typeColors";

/**
 * A static grid of links into `/search` pre-filtered to each type, replacing
 * a prior live-facet version (`buildFacet`) — see
 * docs/adr/0011-automatic-facet-generation-on-search-page.md. The 18 types
 * are a fixed, real taxonomy, not fabricated Pokemon data, so hardcoding the
 * labels is safe; no live query means no counts next to each pill (a
 * deliberate, accepted tradeoff), but `/search` itself still shows real,
 * live-counted facets once landed.
 */
export function BrowseByType() {
  return (
    <div className="w-full">
      <div className="mb-3">
        <ImageSlot name="typeFacetHeader" ratio="4/1" label="Type-facet section header" />
      </div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
        {CONTENT.home.browseByTypeHeading}
      </h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {POKEMON_TYPES.map((type) => (
          <li key={type}>
            <Link
              href={buildTypeSearchHref(type)}
              className="flex items-center justify-center gap-2 rounded-md border border-black/10 px-2 py-1.5 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              <Chip label={type} color={getTypeColor(type)} variant="type" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
