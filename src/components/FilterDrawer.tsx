"use client";

import { useEffect, useState } from "react";
import { AutomaticFacets } from "@/components/AutomaticFacets";
import { FacetAbilities } from "@/components/FacetAbilities";
import { FacetSpeed } from "@/components/FacetSpeed";
import { CONTENT } from "@/content/pokedex";

interface FilterDrawerProps {
  /**
   * Active facet/type-filter count for the trigger's badge — passed in from
   * `SearchSummaryBar`, which already computes this from its own
   * `buildBreadcrumbManager` state. Deliberately not re-derived here (a
   * second `buildBreadcrumbManager` call would register a second
   * subscription for the same data) — see
   * docs/EXECUTION-PLAN-responsive-ui.md §1.
   */
  activeFilterCount: number;
}

/**
 * Off-canvas mobile/tablet filter panel, `md:hidden` — desktop keeps
 * `FacetRail`'s always-visible sidebar untouched. Renders the same
 * `AutomaticFacets`/`FacetSpeed`/`FacetAbilities` `FacetRail` renders on
 * desktop (no duplicate facet logic), just collapsed to an accordion via
 * each one's `collapsible` prop. Modal pattern follows
 * `ConfigRequiredDialog.tsx`: backdrop `onClick` to close, `stopPropagation`
 * on the panel, `role="dialog" aria-modal="true"`. `z-50` — above
 * `CompareTray`'s `z-40` and `ConfigRequiredDialog`'s `z-20`, since an open
 * filter drawer should be the topmost interaction.
 */
export function FilterDrawer({ activeFilterCount }: FilterDrawerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-shell-100 px-3 py-1.5 text-sm text-foreground md:hidden dark:border-shell-600"
      >
        {CONTENT.search.filtersLabel}
        {activeFilterCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-shell-400 px-1 text-[10px] font-semibold text-white">
            {activeFilterCount}
          </span>
        )}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={CONTENT.search.filtersLabel}
            className="flex h-full w-full max-w-xs flex-col overflow-y-auto bg-surface p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
                {CONTENT.search.filtersLabel}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={CONTENT.search.filtersCloseLabel}
                className="text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
              >
                &times;
              </button>
            </div>
            <AutomaticFacets collapsible />
            <FacetSpeed collapsible />
            <FacetAbilities collapsible />
          </div>
        </div>
      )}
    </>
  );
}
