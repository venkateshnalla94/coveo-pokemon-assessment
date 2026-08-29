"use client";

import { buildDidYouMean } from "@coveo/headless";
import { useState } from "react";
import { getSearchEngine } from "@/coveo/engine";
import { useControllerState } from "@/coveo/useControllerState";

/** Headless's real `DidYouMean` controller — query corrections, org capability permitting. */
export function DidYouMean() {
  const [didYouMean] = useState(() => buildDidYouMean(getSearchEngine()));
  const state = useControllerState(didYouMean) ?? didYouMean.state;

  if (state.wasAutomaticallyCorrected) {
    return (
      <p className="mb-4 text-sm text-black/60 dark:text-white/60">
        No results for &quot;{state.originalQuery}&quot;. Showing results for{" "}
        <strong>{state.wasCorrectedTo}</strong> instead.
      </p>
    );
  }

  if (state.hasQueryCorrection) {
    return (
      <p className="mb-4 text-sm text-black/60 dark:text-white/60">
        Did you mean{" "}
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
