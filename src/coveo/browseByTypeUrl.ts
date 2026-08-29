import { POKEMON_FIELDS } from "@/coveo/fields";

/**
 * Builds a `/search` URL pre-filtered to one Pokemon type, via `aq` (an
 * advanced query expression), not the facet-scoped `f-<facetId>=<value>`
 * shape used elsewhere. `/search`'s Type facet is now Coveo's Automatic
 * Facet Generation (see docs/adr/0011-automatic-facet-generation-on-search-page.md),
 * which has no facetId and no URL-param support at all — a `f-pokemontype=`
 * link would silently filter nothing. `aq` doesn't depend on any facet
 * being registered; it's the same exact-match pattern already used by the
 * Pokemon detail page and compare page (`@pokemonname=="X"` /
 * `@pokemonname==(...)"`), and `aq` is a real, restorable `SearchUrlSync`
 * parameter (`isValidBasicKey` in `search-parameter-serializer.js`).
 */
export function buildTypeSearchHref(type: string): string {
  const escapedType = type.replace(/"/g, '\\"');
  return `/search?aq=${encodeURIComponent(`@${POKEMON_FIELDS.type}=="${escapedType}"`)}`;
}
