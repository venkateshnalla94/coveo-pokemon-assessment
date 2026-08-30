"use client";

import { buildPager } from "@coveo/headless";
import { useState } from "react";
import { CONTENT } from "@/content/pokedex";
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
        className="rounded-md border border-shell-100 px-3 py-1 text-foreground disabled:opacity-40 dark:border-shell-600"
      >
        {CONTENT.search.pagerPreviousLabel}
      </button>
      {state.currentPages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => pager.selectPage(page)}
          aria-current={pager.isCurrentPage(page) ? "page" : undefined}
          className={`rounded-md border px-3 py-1 text-foreground ${
            pager.isCurrentPage(page) ? "border-shell-400 font-semibold" : "border-shell-100 dark:border-shell-600"
          }`}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        onClick={() => pager.nextPage()}
        disabled={!state.hasNextPage}
        className="rounded-md border border-shell-100 px-3 py-1 text-foreground disabled:opacity-40 dark:border-shell-600"
      >
        {CONTENT.search.pagerNextLabel}
      </button>
    </nav>
  );
}
