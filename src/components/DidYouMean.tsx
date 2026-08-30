"use client";

import { buildDidYouMean } from "@coveo/headless";
import { useState } from "react";
import { CONTENT } from "@/content/pokedex";
import { getSearchEngine } from "@/coveo/engine";
import { useControllerState } from "@/coveo/useControllerState";

/** Headless's real `DidYouMean` controller — query corrections, org capability permitting. */
export function DidYouMean() {
  const [didYouMean] = useState(() => buildDidYouMean(getSearchEngine()));
  const state = useControllerState(didYouMean) ?? didYouMean.state;

  if (state.wasAutomaticallyCorrected) {
    return (
      <p className="mb-4 text-sm text-black/60 dark:text-white/60">
        {CONTENT.search.noResultsForPrefix} &quot;{state.originalQuery}&quot;.{" "}
        {CONTENT.search.showingResultsForPrefix}{" "}
        <strong>{state.wasCorrectedTo}</strong> {CONTENT.search.showingResultsInsteadSuffix}
      </p>
    );
  }

  if (state.hasQueryCorrection) {
    return (
      <p className="mb-4 text-sm text-black/60 dark:text-white/60">
        {CONTENT.search.didYouMeanPrompt}{" "}
        <button
          type="button"
          onClick={() => didYouMean.applyCorrection()}
          className="font-semibold underline"
        >
          {state.queryCorrection.correctedQuery}
        </button>
        ?
      </p>
    );
  }

  return null;
}
