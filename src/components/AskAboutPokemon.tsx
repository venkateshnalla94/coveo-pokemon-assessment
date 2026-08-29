"use client";

import { useState } from "react";
import { PokemonMarkdown } from "@/components/PokemonMarkdown";

interface AskAboutPokemonProps {
  pokemonName: string;
}

// Scoped to what the indexed content can actually answer (Passage
// Retrieval over pokemondb.net vitals/evolution/moves text) — not the
// mockup's "Best team comps" or "How to train for PvP", which have no
// answerable content behind them. See docs/EXECUTION-PLAN-v2.3-frontend.md §4.
const SUGGESTED_QUESTIONS = [
  "How does it evolve?",
  "What are its abilities?",
  "What moves does it learn?",
] as const;

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
 */
export function AskAboutPokemon({ pokemonName }: AskAboutPokemonProps) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<AskState>({ status: "idle" });

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
    <div className="mt-8 border-t border-black/10 pt-6 dark:border-white/15">
      <h2 className="mb-2 text-lg font-semibold">Ask about {pokemonName}</h2>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {SUGGESTED_QUESTIONS.map((question) => (
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
          placeholder={`e.g. "how does ${pokemonName} evolve?"`}
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
          {state.status === "loading" ? "Asking..." : "Ask"}
        </button>
      </div>

      {state.status === "error" && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{state.message}</p>
      )}

      {state.status === "success" && state.passages.length === 0 && (
        <p className="mt-3 text-sm text-black/50 dark:text-white/50">
          No relevant passages found for that question.
        </p>
      )}

      {state.status === "success" && state.passages.length > 0 && (
        <ol aria-label="Passages" className="mt-4 flex flex-col gap-3">
          {state.passages.map((passage, index) => (
            <li
              key={index}
              className="rounded-md border border-black/10 p-3 text-sm dark:border-white/15"
            >
              <div className="mb-1 flex items-center justify-between text-xs text-black/50 dark:text-white/50">
                <span>Passage {index + 1}</span>
                <span>Relevance: {(passage.relevanceScore * 100).toFixed(1)}%</span>
              </div>
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
