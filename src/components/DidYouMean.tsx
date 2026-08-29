"use client";

import { buildDidYouMean, type DidYouMeanState } from "@coveo/headless";
import { useEffect, useState } from "react";
import { getSearchEngine } from "@/coveo/engine";

/** Headless's real `DidYouMean` controller — query corrections, org capability permitting. */
export function DidYouMean() {
  const [didYouMean] = useState(() => buildDidYouMean(getSearchEngine()));
  const [state, setState] = useState<DidYouMeanState>(didYouMean.state);

  useEffect(() => didYouMean.subscribe(() => setState(didYouMean.state)), [didYouMean]);

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
