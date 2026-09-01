"use client";

import Link from "next/link";
import { useCompare } from "@/components/compare/CompareProvider";
import { Chip } from "@/components/ui/Chip";
import { CONTENT } from "@/content/pokedex";

/**
 * The one deliberately "floating" surface in the app — DESIGN.md's
 * Flat-Unless-Floating rule names the suggestion dropdown and the
 * config-required modal as the only shadowed elements; this tray is a
 * third, equally legitimate exception, since it genuinely detaches from
 * page flow (fixed to the viewport bottom, over whatever page is showing).
 * Renders nothing when the selection is empty.
 */
export function CompareTray() {
  const { names, remove, clear } = useCompare();

  if (names.length === 0) {
    return null;
  }

  const compareHref = `/compare?names=${encodeURIComponent(names.join(","))}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white p-3 shadow-lg dark:border-white/15 dark:bg-black">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
          {CONTENT.compare.trayLabel}
        </span>
        <ul className="flex flex-wrap items-center gap-1.5" aria-label="Selected for comparison">
          {names.map((name) => (
            <li key={name}>
              <span className="inline-flex items-center gap-1">
                <Chip label={name} variant="neutral" />
                <button
                  type="button"
                  aria-label={CONTENT.compare.removeFromComparisonLabel(name)}
                  onClick={() => remove(name)}
                  className="text-shell-500 hover:text-black dark:hover:text-white"
                >
                  &times;
                </button>
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={clear}
          className="text-xs text-black/60 hover:underline dark:text-white/60"
        >
          {CONTENT.compare.clearAllLabel}
        </button>
        <Link
          href={compareHref}
          className="ml-auto rounded-md border border-black/10 px-3 py-1 text-sm font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          {CONTENT.compare.trayLinkLabel(names.length)}
        </Link>
      </div>
    </div>
  );
}
