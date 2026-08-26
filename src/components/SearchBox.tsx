"use client";

import { buildSearchBox, type SearchBoxState } from "@coveo/headless";
import { useEffect, useState } from "react";
import { ConfigRequiredDialog } from "@/components/ConfigRequiredDialog";
import { isCoveoConfigured } from "@/coveo/config";
import { getSearchEngine } from "@/coveo/engine";

interface SearchBoxProps {
  /**
   * When provided, selecting a suggestion or pressing Enter calls this
   * instead of executing the search in place against the shared engine —
   * used by the home page, which only hosts the search box + Query Suggest
   * typeahead and hands the actual query off to `/search?q=...`. When
   * omitted, the component behaves as before (in-place `submit()`).
   */
  onNavigate?: (query: string) => void;
  /**
   * Seeds the search box's text and executes one submit on mount (and again
   * if this value changes) — used by /search to reconcile "the URL's `q`
   * param is the source of truth on load/navigation" with "this rendered
   * `<SearchBox>` is the single source of truth for further typing." This is
   * the simplest option that keeps one controller instance instead of two:
   * an alternative (a `controller` prop letting the page inject its own
   * pre-built SearchBox controller) would avoid the "value prop that only
   * applies once" oddity but adds an extra construction path for one call
   * site — not worth it here.
   */
  initialQuery?: string;
}

/**
 * A single `SearchBox` controller covers both the typeahead surface
 * (state.suggestions, populated as updateText() is called) and the actual
 * search execution surface (submit()). There is no separate query-suggest
 * controller in @coveo/headless — see .claude/skills/headless-search-page.
 *
 * When Coveo isn't configured, the input still renders (backed by local
 * state instead of a controller) so the page never looks broken on load —
 * the config error only surfaces as a popup when the user actually tries to
 * search.
 */
export function SearchBox({ onNavigate, initialQuery }: SearchBoxProps) {
  const [configured] = useState(() => isCoveoConfigured());
  const [searchBox] = useState(() => (configured ? buildSearchBox(getSearchEngine()) : undefined));
  const [state, setState] = useState<SearchBoxState | undefined>(searchBox?.state);
  const [localValue, setLocalValue] = useState("");
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  useEffect(() => {
    if (!searchBox) {
      return;
    }
    return searchBox.subscribe(() => setState(searchBox.state));
  }, [searchBox]);

  useEffect(() => {
    if (!searchBox || !initialQuery) {
      return;
    }
    searchBox.updateText(initialQuery);
    searchBox.submit();
    // Only re-run when initialQuery itself changes (e.g. the URL's `q` param
    // changes via navigation) — not on every searchBox identity change,
    // since searchBox is a stable useState value for the component's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const value = searchBox ? (state?.value ?? "") : localValue;
  const suggestions = searchBox ? (state?.suggestions ?? []) : [];

  function updateText(text: string) {
    if (searchBox) {
      searchBox.updateText(text);
    } else {
      setLocalValue(text);
    }
  }

  function selectSuggestion(suggestionValue: string) {
    if (onNavigate) {
      onNavigate(suggestionValue);
      return;
    }
    searchBox?.selectSuggestion(suggestionValue);
  }

  function submit() {
    if (!searchBox) {
      setShowConfigDialog(true);
      return;
    }
    if (onNavigate) {
      const query = state?.value.trim() ?? "";
      if (query) {
        onNavigate(query);
      }
      return;
    }
    searchBox.submit();
  }

  return (
    <div className="relative w-full max-w-xl">
      <input
        type="text"
        value={value}
        placeholder="Search for a Pokemon..."
        className="w-full rounded-md border border-black/10 px-4 py-2 outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30"
        onChange={(e) => updateText(e.target.value)}
        onFocus={() => searchBox?.showSuggestions()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            submit();
          }
        }}
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border border-black/10 bg-white shadow-md dark:border-white/15 dark:bg-neutral-900">
          {suggestions.map((suggestion) => (
            <li key={suggestion.rawValue}>
              <button
                type="button"
                className="block w-full px-4 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => selectSuggestion(suggestion.rawValue)}
                dangerouslySetInnerHTML={{ __html: suggestion.highlightedValue }}
              />
            </li>
          ))}
        </ul>
      )}
      {showConfigDialog && <ConfigRequiredDialog onClose={() => setShowConfigDialog(false)} />}
    </div>
  );
}
