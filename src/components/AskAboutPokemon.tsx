"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { PokemonMarkdown } from "@/components/PokemonMarkdown";
import { CONTENT } from "@/content/pokedex";
import { getTypeColor } from "@/coveo/typeColors";

interface AskAboutPokemonProps {
  pokemonName: string;
  /** Decorative only (v4 plan §2.3) — see ResultList.tsx's identical note on `types[0]`. */
  pokemonTypes: string[];
}

interface Passage {
  text: string;
  relevanceScore: number;
  document: { title: string; primaryid: string };
}

interface PassagesResponse {
  items: Passage[];
}

type AskState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; passages: Passage[] };

/**
 * Bonus-tier "Ask about this Pokemon" — calls /api/passages (Coveo Passage
 * Retrieval, ADR-0008) scoped to this page's Pokemon via `filter`, not a
 * free-text search. Deliberately not a Headless controller: this hits our
 * own Next.js route, not the Coveo Search API, so there's no engine state to
 * subscribe to — plain fetch + local state is the right amount of machinery.
 *
 * RGA (elsewhere on a search results view, not this page) synthesizes one
 * answer across many items; this surfaces raw top-3 passages with scores
 * from a single item — the "build a POV on the API" half of Stage E is that
 * contrast, not just having both features running.
 *
 * v4 design pass (plan §8): this is where the brief's inline-highlight idea
 * actually works, unlike RGA's citations (plan §2.1/§7.2) — `/api/passages`
 * returns verbatim crawled markdown untouched, so a passage *is* the unit;
 * there is no offset to infer. `docs/passage-retrieval-pov.md`'s position is
 * kept: chunk boundaries and relevance scores stay visible per passage,
 * never merged into one answer block. The response is complete (not
 * streamed), so the reveal is a one-time staged fade-in per passage, not a
 * native-stream reveal like RGA's.
 */
export function AskAboutPokemon({ pokemonName, pokemonTypes }: AskAboutPokemonProps) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<AskState>({ status: "idle" });

  const typeColor = pokemonTypes.map((type) => getTypeColor(type)).find(Boolean);
  const typeVars = typeColor ? ({ "--type-primary": typeColor } as CSSProperties) : undefined;

  async function ask() {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/passages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, pokemonName }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setState({
          status: "error",
          message: body?.error ?? `Request failed (${response.status}).`,
        });
        return;
      }
      const data = (await response.json()) as PassagesResponse;
      setState({ status: "success", passages: data.items ?? [] });
    } catch {
      setState({ status: "error", message: "Network error — could not reach the server." });
    }
  }

  return (
    <div className="mt-8 border-t border-shell-600/40 pt-6">
      <h2 className="font-display text-lg font-semibold text-foreground">
        {CONTENT.pdp.askHeading(pokemonName)}
      </h2>
      <div className="mb-2 mt-2 flex flex-wrap gap-1.5">
        {CONTENT.pdp.suggestedQuestions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => setQuery(question)}
            className="rounded-md border border-black/10 px-2 py-0.5 text-xs text-black/70 hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
          >
            {question}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          placeholder={CONTENT.pdp.askPlaceholder(pokemonName)}
          className="w-full rounded-md border border-black/10 px-4 py-2 outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              ask();
            }
          }}
        />
        <button
          type="button"
          onClick={ask}
          disabled={state.status === "loading" || !query.trim()}
          className="shrink-0 rounded-md border border-black/10 px-4 py-2 hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10"
        >
          {state.status === "loading" ? CONTENT.pdp.askButtonLoadingLabel : CONTENT.pdp.askButtonLabel}
        </button>
      </div>

      {state.status === "error" && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{state.message}</p>
      )}

      {state.status === "success" && state.passages.length === 0 && (
        <p className="mt-3 text-sm text-black/50 dark:text-white/50">
          {CONTENT.pdp.noPassagesFound}
        </p>
      )}

      {state.status === "success" && state.passages.length > 0 && (
        // Direct-child `<li>`s under this exact aria-label — pinned by
        // tests/e2e/ask-about-pokemon.spec.ts's `[aria-label="Passages"] >
        // li` selector. No wrapper element goes between them (v4 plan §8).
        <ol aria-label="Passages" className="mt-4 flex flex-col gap-3">
          {state.passages.map((passage, index) => (
            <li
              // `filter: '@pokemonname=="..."'` scopes every request to one
              // document, so passage.document.primaryid is identical across
              // all returned passages (they're chunks of that one page) —
              // keying on it alone produced React's real duplicate-key
              // warning, confirmed live via a walkthrough of Charizard's
              // "Ask about this Pokemon". The index makes each chunk's key
              // unique; safe here since the list is replaced wholesale on
              // every new ask, never patched in place.
              key={`${passage.document.primaryid}-${index}`}
              className="passage-card p-3 text-sm"
              data-has-type={Boolean(typeColor)}
              style={{ ...typeVars, animationDelay: `${index * 90}ms` }}
            >
              <div className="mb-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-mono text-[10px] text-shell-400">
                <span>{CONTENT.pdp.passageLabel(index + 1)}</span>
                <span>{CONTENT.pdp.relevanceLabel((passage.relevanceScore * 100).toFixed(1))}</span>
              </div>
              {/* document.title/primaryid come back from /api/passages but
                  weren't rendered anywhere before this pass (v4 plan §8).
                  No `uri` field on the payload, so this is attribution text,
                  not a link — same "⟶ retrieved from:" scan-tag motif as
                  RGA's citations (GeneratedAnswer.tsx), for one consistent
                  attribution language across both AI surfaces. */}
              <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] text-shell-400">
                <span aria-hidden="true">&#10230;</span>
                <span>
                  {CONTENT.answer.citationPrefix} {passage.document.title}
                </span>
              </p>
              <div className="max-h-48 overflow-y-auto">
                <PokemonMarkdown text={passage.text} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
