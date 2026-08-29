import type { ResultListState, SearchEngine } from "@coveo/headless";
import type { ApplicationError } from "./applicationError";
import { toApplicationError, type CoveoSearchApiError } from "./applicationError";
import { mapPokemonResult, type PokemonItem } from "./mapPokemonResult";

/**
 * Discriminated union so a component can't render "loading" and stale
 * results at once, or fail to distinguish "zero results" from "Coveo
 * errored" — see docs/standards-adoption.md #11.
 */
export type SearchRenderState =
  | { status: "loading" }
  | { status: "error"; error: ApplicationError }
  | { status: "empty" }
  | { status: "success"; items: PokemonItem[] };

/**
 * @param engine - read to get the detailed Coveo error (statusCode/message);
 * ResultListState/SearchStatusState only expose a `hasError` boolean.
 */
export function deriveSearchRenderState(
  state: ResultListState,
  engine: SearchEngine,
): SearchRenderState {
  if (state.isLoading) {
    return { status: "loading" };
  }

  if (state.hasError) {
    const rawError = engine.state.search.error as CoveoSearchApiError | null;
    const error = rawError
      ? toApplicationError(rawError)
      : { code: "UNKNOWN" as const, message: "Unknown Coveo error", userMessage: "Search is temporarily unavailable.", recoverable: true };

    // An invalid sort criterion clears state.results to [] (Headless's
    // handleRejectedSearch), so there's nothing to fall back to render here.
    // SearchSummaryBar.tsx owns the actual recovery: it detects this same
    // error and re-dispatches a relevance sort. Reporting "loading" instead
    // of "error" avoids flashing the whole grid to a red error message for
    // what's a self-correcting, sub-second condition.
    if (error.code === "INVALID_SORT") {
      return { status: "loading" };
    }

    return { status: "error", error };
  }

  if (state.results.length === 0) {
    return { status: "empty" };
  }

  return {
    status: "success",
    items: state.results.map(mapPokemonResult),
  };
}
