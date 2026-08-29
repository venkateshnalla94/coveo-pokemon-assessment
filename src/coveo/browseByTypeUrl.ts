import { POKEMON_FIELDS } from "@/coveo/fields";

/**
 * Builds a `/search` URL pre-filtered to one Pokemon type, in the exact
 * fragment shape Headless's `buildUrlManager`/`buildSearchParameterSerializer`
 * itself produces and parses — confirmed by reading
 * `features/search-parameters/search-parameter-serializer.js`:
 * `serializeFacets()` emits `f-<facetId>=<comma-separated-encoded-values>`,
 * and `deserialize()`'s `facetSearchParamRegex` (`/^(f|fExcluded|cf|nf|df|sf|af|mnf)-(.+)$/`)
 * parses that same shape back. This is not an invented query-param scheme;
 * it's the one real format `SearchUrlSync` (Step 5) already reads.
 *
 * The facet ID is the field name itself (`pokemontype`), not a made-up
 * facet ID — `buildFacet` defaults a controller's facet ID to its `field`
 * unless another facet already claimed that exact ID in the shared engine
 * (see `controllers/core/facets/_common/facet-id-generator.js`). `/search`'s
 * `FacetType` never passes an explicit `facetId`, so as long as nothing
 * else registers a facet under the literal ID `"pokemontype"` first, this
 * always resolves to plain `pokemontype` — which is exactly why
 * `BrowseByType.tsx`'s own `buildFacet` call (used only to read live
 * type/count pairs, not to filter anything itself) is given a distinct,
 * explicit `facetId` rather than defaulting to `pokemontype` too; two
 * controllers racing for the same default ID would leave `/search`'s real
 * Type facet running under a generated, non-`pokemontype` ID instead,
 * silently breaking every link this function produces.
 */
export function buildTypeSearchHref(type: string): string {
  return `/search?f-${POKEMON_FIELDS.type}=${encodeURIComponent(type)}`;
}
