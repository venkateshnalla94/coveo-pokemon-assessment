"use client";

import { buildGeneratedAnswer, buildInteractiveCitation, type GeneratedAnswerState } from "@coveo/headless";
import type { SearchEngine } from "@coveo/headless";
import { useEffect, useState } from "react";
import { getSearchEngine } from "@/coveo/engine";
import { deriveGeneratedAnswerRenderState } from "@/coveo/generatedAnswerRenderState";

/**
 * Advanced-tier RGA surface. Built the same way the rest of the app treats
 * an org capability that may not exist yet: the controller is always built,
 * but its absence (or an org without RGA enabled) must never crash the page
 * — see CLAUDE.md "Blocked on" and deriveGeneratedAnswerRenderState.
 */
export function GeneratedAnswer() {
  const [engine] = useState(() => getSearchEngine());
  const [generatedAnswer] = useState(() => {
    try {
      return buildGeneratedAnswer(engine);
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
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
            Generated Answer
          </h2>
          <p className="whitespace-pre-wrap text-sm">{renderState.answer}</p>
          {state && state.citations.length > 0 && (
            <Citations citations={state.citations} answerId={state.answerId} engine={engine} />
          )}
        </div>
      );
  }
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
    <ol className="mt-3 flex list-decimal flex-col gap-1 pl-5 text-xs text-black/60 dark:text-white/60">
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
