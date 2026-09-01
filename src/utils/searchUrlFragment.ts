/**
 * `URLSearchParams.toString()` serializes with `+` for spaces
 * (`application/x-www-form-urlencoded`, per the WHATWG URL spec). Headless's
 * `buildUrlManager` serializes/deserializes its own fragment with
 * `encodeURIComponent`/`decodeURIComponent` (`%20` for spaces —
 * `features/search-parameters/search-parameter-serializer.js`), which never
 * un-escapes `+` back into a space. Feeding it a `+`-encoded fragment left a
 * literal `+` embedded in any restored value that contains a space — e.g.
 * `sortCriteria=@pokemonname+ascending`, which the Search API 400s on
 * (`InvalidSortValueException`) since that's not a valid criterion string.
 * This reproduced for every sort option, not just an unsortable field, and
 * for any facet value containing a space (e.g. "Generation 9"). Re-encoding
 * each value here with `encodeURIComponent` instead of calling
 * `searchParams.toString()` matches Headless's own convention exactly.
 */
export function toHeadlessFragment(searchParams: URLSearchParams): string {
  return Array.from(searchParams.entries())
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
}
