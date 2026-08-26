"use client";

import { buildPager, type PagerState } from "@coveo/headless";
import { useEffect, useState } from "react";
import { getSearchEngine } from "@/coveo/engine";

export function Pager() {
  const [pager] = useState(() => buildPager(getSearchEngine()));
  const [state, setState] = useState<PagerState>(pager.state);

  useEffect(() => pager.subscribe(() => setState(pager.state)), [pager]);

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
