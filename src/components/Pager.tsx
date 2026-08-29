"use client";

import { buildPager } from "@coveo/headless";
import { useState } from "react";
import { getSearchEngine } from "@/coveo/engine";
import { useControllerState } from "@/coveo/useControllerState";

export function Pager() {
  const [pager] = useState(() => buildPager(getSearchEngine()));
  const state = useControllerState(pager) ?? pager.state;

  if (state.maxPage <= 1) {
    return null;
  }

  return (
    <nav className="mt-6 flex items-center justify-center gap-2 text-sm" aria-label="Pagination">
      <button
        type="button"
        onClick={() => pager.previousPage()}
        disabled={!state.hasPreviousPage}
        className="rounded-md border border-black/10 px-3 py-1 disabled:opacity-40 dark:border-white/15"
      >
        Previous
      </button>
      {state.currentPages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => pager.selectPage(page)}
          aria-current={pager.isCurrentPage(page) ? "page" : undefined}
          className={`rounded-md border px-3 py-1 ${
            pager.isCurrentPage(page)
              ? "border-black/30 font-semibold dark:border-white/40"
              : "border-black/10 dark:border-white/15"
          }`}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        onClick={() => pager.nextPage()}
        disabled={!state.hasNextPage}
        className="rounded-md border border-black/10 px-3 py-1 disabled:opacity-40 dark:border-white/15"
      >
        Next
      </button>
    </nav>
  );
}
