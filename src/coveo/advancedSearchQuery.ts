import { loadAdvancedSearchQueryActions, type SearchEngine } from "@coveo/headless";

/**
 * Clears the `aq` (advanced query) slice used by the home page's
 * Browse-by-type links (see browseByTypeUrl.ts / docs/adr/0011). Does not
 * execute a search itself — some call sites already trigger one right after
 * (SearchBox's own submit/selectSuggestion), so a caller-owned execute
 * avoids a duplicate request.
 */
export function clearBrowseByTypeFilter(engine: SearchEngine) {
  const { updateAdvancedSearchQueries } = loadAdvancedSearchQueryActions(engine);
  engine.dispatch(updateAdvancedSearchQueries({ aq: "" }));
}
