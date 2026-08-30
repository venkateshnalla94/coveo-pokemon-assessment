"use client";

import { buildSearchBox } from "@coveo/headless";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { ConfigRequiredDialog } from "@/components/ConfigRequiredDialog";
import { PokeballGlyph, type PokeballGlyphState } from "@/components/ui/PokeballGlyph";
import { CONTENT } from "@/content/pokedex";
import { isCoveoConfigured } from "@/coveo/config";
import { getSearchEngine } from "@/coveo/engine";
import { useControllerState } from "@/coveo/useControllerState";

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
 *
 * Settle-timeout duration must stay in sync with globals.css's
 * `pokeball-settle`/`pokeball-button-pulse` animation lengths (260ms) — it's
 * how long the glyph holds the one-shot "settle" data-state before falling
 * back to idle/focus.
 */
const SETTLE_DURATION_MS = 280;

export function SearchBox({ onNavigate, initialQuery }: SearchBoxProps) {
  const [configured] = useState(() => isCoveoConfigured());
  const [searchBox] = useState(() => (configured ? buildSearchBox(getSearchEngine()) : undefined));
  // useControllerState (useSyncExternalStore under the hood), not
  // subscribe()+setState in a useEffect: Headless controllers can dispatch
  // synchronously from another component's render (e.g. SearchUrlSync's
  // buildUrlManager constructor dispatches restoreSearchParameters while it
  // renders), which would otherwise notify this already-mounted,
  // already-subscribed SearchBox instance (the one in the persistent
  // AppHeader) mid-render and trigger React's "Cannot update a component
  // while rendering a different component" error. See
  // src/coveo/useControllerState.ts for the full mechanics.
  const state = useControllerState(searchBox);
  const [localValue, setLocalValue] = useState("");
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  // "settling" is a one-shot flag, not a mirror of `isLoading` — it turns on
  // the instant a loading→not-loading transition is *observed during
  // render* (see the isLoading/prevIsLoading comparison below, React's
  // documented "adjust state during rendering" pattern —
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  // — deliberately not a useEffect, since a synchronous setState call in an
  // effect body is exactly what react-hooks/set-state-in-effect flags) and
  // turns back off via the one legitimate effect below, whose setState call
  // happens inside an async setTimeout callback rather than synchronously
  // in the effect body.
  const [isSettling, setIsSettling] = useState(false);
  const [prevIsLoading, setPrevIsLoading] = useState(false);

  const instanceId = useId();
  const listboxId = `${instanceId}-suggestions`;
  const optionId = (index: number) => `${instanceId}-suggestion-${index}`;

  const lastSubmittedQuery = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!searchBox || !initialQuery) {
      return;
    }
    // React's dev-mode Strict Mode double-invokes this effect on mount with
    // the same initialQuery; without this guard that fires two submit()s
    // back to back, and Headless cancels the first (correct behavior — a
    // newer query supersedes a stale one), which its own logger reports as
    // an "Action dispatch error ... rejected" even though nothing is
    // actually broken. Only resubmit when initialQuery has genuinely
    // changed since the last real submission.
    if (lastSubmittedQuery.current === initialQuery) {
      return;
    }
    lastSubmittedQuery.current = initialQuery;
    searchBox.updateText(initialQuery);
    searchBox.submit();
    // Only re-run when initialQuery itself changes (e.g. the URL's `q` param
    // changes via navigation) — not on every searchBox identity change,
    // since searchBox is a stable useState value for the component's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const value = searchBox ? (state?.value ?? "") : localValue;
  const suggestions = searchBox ? (state?.suggestions ?? []) : [];
  const isLoading = Boolean(state?.isLoading || state?.isLoadingSuggestions);

  // Detected and handled during render, not in an effect (see isSettling's
  // doc comment above): the instant a loading→not-loading transition is
  // observed, flip isSettling on. React re-renders immediately with the
  // updated state before committing to the DOM, so this never paints a
  // stale frame.
  if (isLoading !== prevIsLoading) {
    setPrevIsLoading(isLoading);
    if (!isLoading) {
      setIsSettling(true);
    }
  }

  // The one legitimate effect in this state machine: expiring the one-shot
  // "settle" flag after SETTLE_DURATION_MS. Its setState call runs inside
  // the async setTimeout callback, not synchronously in the effect body, so
  // it doesn't trip react-hooks/set-state-in-effect.
  useEffect(() => {
    if (!isSettling) {
      return;
    }
    const timeout = setTimeout(() => setIsSettling(false), SETTLE_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [isSettling]);

  // Pokeball state machine (v4 plan §4): loading always wins (shells snap
  // shut then spin); a just-finished load holds the one-shot "settle" state
  // (spin eases to rest, button pulses) before falling back to focus/idle.
  const glyphState: PokeballGlyphState = isLoading
    ? "loading"
    : isSettling
      ? "settle"
      : isFocused
        ? "focus"
        : "idle";

  function updateText(text: string) {
    if (searchBox) {
      searchBox.updateText(text);
    } else {
      setLocalValue(text);
    }
    setOpen(true);
    setHighlightedIndex(null);
  }

  function selectSuggestion(suggestionValue: string) {
    setOpen(false);
    setHighlightedIndex(null);
    if (onNavigate) {
      onNavigate(suggestionValue);
      return;
    }
    searchBox?.selectSuggestion(suggestionValue);
  }

  function submit() {
    setOpen(false);
    setHighlightedIndex(null);
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

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        if (suggestions.length === 0) {
          return;
        }
        e.preventDefault();
        setOpen(true);
        setHighlightedIndex((prev) => (prev === null ? 0 : Math.min(prev + 1, suggestions.length - 1)));
        break;
      case "ArrowUp":
        if (suggestions.length === 0) {
          return;
        }
        e.preventDefault();
        setOpen(true);
        setHighlightedIndex((prev) =>
          prev === null ? suggestions.length - 1 : Math.max(prev - 1, 0),
        );
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
          setHighlightedIndex(null);
        }
        break;
      case "Enter":
        e.preventDefault();
        if (open && highlightedIndex !== null && suggestions[highlightedIndex]) {
          selectSuggestion(suggestions[highlightedIndex].rawValue);
        } else {
          submit();
        }
        break;
      default:
        break;
    }
  }

  const expanded = open && suggestions.length > 0;

  return (
    <div className="relative w-full max-w-xl">
      <div
        className={`flex items-center gap-2 rounded-md border bg-surface px-3 py-2 transition-colors ${
          isFocused
            ? "border-signal-red ring-2 ring-signal-red/40"
            : "border-shell-100 dark:border-shell-600"
        }`}
      >
        <PokeballGlyph state={glyphState} className="shrink-0" />
        <input
          type="text"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            highlightedIndex !== null && expanded ? optionId(highlightedIndex) : undefined
          }
          value={value}
          placeholder={CONTENT.search.placeholder}
          className="search-box-input w-full bg-transparent text-foreground outline-none placeholder:text-shell-400"
          onChange={(e) => updateText(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            setOpen(true);
            searchBox?.showSuggestions();
          }}
          onBlur={() => {
            setIsFocused(false);
            setOpen(false);
            setHighlightedIndex(null);
          }}
          onKeyDown={handleKeyDown}
        />
      </div>
      {expanded && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded-md border border-shell-100 bg-surface shadow-md dark:border-shell-600"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.rawValue}
              id={optionId(index)}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              <button
                type="button"
                // Not a Tab stop: this is a combobox popup (aria-
                // activedescendant pattern), where DOM focus stays on the
                // input the whole time and "focus" on an option is only
                // ever virtual. Without tabIndex={-1} here, Tab would drop
                // through the input onto these buttons in document order,
                // which both breaks that pattern and (via onBlur on the
                // input) would immediately close the very listbox the user
                // just tabbed into. Found during the step-10 keyboard walk.
                tabIndex={-1}
                className={`block w-full px-4 py-2 text-left text-foreground ${
                  index === highlightedIndex ? "bg-shell-050 dark:bg-shell-600" : "hover:bg-shell-050 dark:hover:bg-shell-800"
                }`}
                // Prevents the button from stealing focus (and firing the
                // input's onBlur, which would close+unmount this list
                // before the click event below has a chance to fire) —
                // the standard combobox-popup fix for the mousedown/blur
                // race. Keyboard selection goes through handleKeyDown's
                // Enter case instead, never through this button at all.
                onMouseDown={(e) => e.preventDefault()}
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
