"use client";

import { buildGeneratedAnswer, buildInteractiveCitation, type GeneratedAnswerState } from "@coveo/headless";
import type { SearchEngine } from "@coveo/headless";
import { useEffect, useState } from "react";
import { PokemonMarkdown } from "@/components/PokemonMarkdown";
import { getSearchEngine } from "@/coveo/engine";
import { deriveGeneratedAnswerRenderState } from "@/coveo/generatedAnswerRenderState";

/**
 * Advanced-tier RGA surface. Built the same way the rest of the app treats
 * an org capability that may not exist yet: the controller is always built,
 * but its absence (or an org without RGA enabled) must never crash the page
 * — see CLAUDE.md "Blocked on" and deriveGeneratedAnswerRenderState.
 *
 * `initialState.responseFormat.contentFormat: ["text/markdown"]` is real
 * config on Headless's `GeneratedAnswerProps` (confirmed against
 * `features/generated-answer/generated-response-format.d.ts`) — without it
 * the request defaults to `text/plain`, which is why this previously
 * rendered raw, unformatted answer text via `whitespace-pre-wrap` even
 * though the RGA model has rich-text formatting enabled
 * (docs/HANDOFF.md D9/D10). Now rendered through the same
 * `PokemonMarkdown` pipeline AskAboutPokemon already uses — one markdown
 * pipeline, not two.
 */
export function GeneratedAnswer() {
  const [engine] = useState(() => getSearchEngine());
  const [generatedAnswer] = useState(() => {
    try {
      return buildGeneratedAnswer(engine, {
        initialState: { responseFormat: { contentFormat: ["text/markdown"] } },
      });
    } catch {
      return undefined;
    }
  });
  const [state, setState] = useState<GeneratedAnswerState | undefined>(generatedAnswer?.state);

  useEffect(() => {
    if (!generatedAnswer) {
      return;
    }
    return generatedAnswer.subscribe(() => setState(generatedAnswer.state));
  }, [generatedAnswer]);

  const renderState = deriveGeneratedAnswerRenderState(state);

  switch (renderState.status) {
    case "hidden":
      return null;
    case "loading":
      return (
        <div className="mb-6 rounded-md border border-black/10 p-4 text-sm text-black/50 dark:border-white/15 dark:text-white/50">
          Generating answer...
        </div>
      );
    case "answer":
      return (
        <div className="mb-6 rounded-md border border-black/10 bg-black/[0.02] p-4 dark:border-white/15 dark:bg-white/[0.03]">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
              Generated Answer
            </h2>
            {generatedAnswer && state && (
              <FeedbackButtons generatedAnswer={generatedAnswer} state={state} />
            )}
          </div>
          <div className="text-sm">
            <PokemonMarkdown text={renderState.answer} />
          </div>
          {state && state.citations.length > 0 && (
            <>
              <p className="mt-3 text-xs text-black/50 dark:text-white/50">
                Grounded in {state.citations.length} source
                {state.citations.length === 1 ? "" : "s"}
              </p>
              <Citations citations={state.citations} answerId={state.answerId} engine={engine} />
            </>
          )}
        </div>
      );
  }
}

function FeedbackButtons({
  generatedAnswer,
  state,
}: {
  generatedAnswer: NonNullable<ReturnType<typeof buildGeneratedAnswer>>;
  state: GeneratedAnswerState;
}) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        type="button"
        aria-pressed={state.liked}
        aria-label="This answer was helpful"
        onClick={() => generatedAnswer.like()}
        className={
          state.liked
            ? "rounded-md border border-black/30 px-1.5 py-0.5 dark:border-white/40"
            : "rounded-md border border-black/10 px-1.5 py-0.5 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        }
      >
        &#128077;
      </button>
      <button
        type="button"
        aria-pressed={state.disliked}
        aria-label="This answer was not helpful"
        onClick={() => generatedAnswer.dislike()}
        className={
          state.disliked
            ? "rounded-md border border-black/30 px-1.5 py-0.5 dark:border-white/40"
            : "rounded-md border border-black/10 px-1.5 py-0.5 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        }
      >
        &#128078;
      </button>
    </div>
  );
}

function Citations({
  citations,
  answerId,
  engine,
}: {
  citations: GeneratedAnswerState["citations"];
  answerId: string | undefined;
  engine: SearchEngine;
}) {
  return (
    <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-xs text-black/60 dark:text-white/60">
      {citations.map((citation, index) => (
        <CitationItem
          key={citation.id}
          citation={citation}
          index={index}
          answerId={answerId}
          engine={engine}
        />
      ))}
    </ol>
  );
}

function CitationItem({
  citation,
  index,
  answerId,
  engine,
}: {
  citation: GeneratedAnswerState["citations"][number];
  index: number;
  answerId: string | undefined;
  engine: SearchEngine;
}) {
  const [interactiveCitation] = useState(() =>
    buildInteractiveCitation(engine, { options: { citation, answerId } }),
  );

  return (
    <li>
      <a
        href={citation.clickUri ?? citation.uri}
        target="_blank"
        rel="noreferrer"
        className="hover:underline"
        onClick={() => interactiveCitation.select()}
      >
        [{index + 1}] {citation.title}
      </a>
    </li>
  );
}
