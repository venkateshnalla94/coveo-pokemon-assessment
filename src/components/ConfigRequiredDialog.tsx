"use client";

import { ConfigRequiredMessage } from "@/components/ConfigRequiredMessage";
import { CONTENT } from "@/content/pokedex";

interface ConfigRequiredDialogProps {
  onClose: () => void;
}

/**
 * Popup shown only when the user actually tries to search while Coveo isn't
 * configured — the home page itself always renders the normal search UI
 * rather than swapping in a blocking banner on load.
 */
export function ConfigRequiredDialog({ onClose }: ConfigRequiredDialogProps) {
  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-6"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-md border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 shadow-lg dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <ConfigRequiredMessage />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-amber-300 px-3 py-1 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900"
        >
          {CONTENT.brand.gotItLabel}
        </button>
      </div>
    </div>
  );
}
