"use client";

import {
  buildGeneratedAnswer,
  buildInteractiveCitation,
  buildResultList,
  type GeneratedAnswerState,
  type GenerationStep,
  type GenerationStepName,
} from "@coveo/headless";
import type { SearchEngine } from "@coveo/headless";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { PokemonMarkdown } from "@/components/PokemonMarkdown";
import { CONTENT } from "@/content/pokedex";
import { getSearchEngine } from "@/coveo/engine";
import { POKEMON_FIELDS } from "@/coveo/fields";
import { deriveGeneratedAnswerRenderState } from "@/coveo/generatedAnswerRenderState";
import { toStringArray } from "@/coveo/mapPokemonResult";
import { getTypeColor } from "@/coveo/typeColors";
import { useControllerState } from "@/coveo/useControllerState";

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
 *
 * v4 design pass (plan §7): framed as an instrument readout — mono
 * uppercase label, thin rule, no rounded-card look. The reveal is driven
 * entirely by real backend state already on `GeneratedAnswerState`
 * (`generationSteps`, `isStreaming`) rather than a simulated typewriter —
 * see plan §2.2 for why a typewriter would degrade the app's most
 * latency-sensitive feature. Citations render as scanline tags, not inline
 * spans — see plan §2.1 for why inline span highlighting is not attempted
 * here (no offset data on `GeneratedAnswerCitation`, `citation.text` is a
 * paraphrase of the source, not a literal answer substring).
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
  const state = useControllerState(generatedAnswer);

  const renderState = deriveGeneratedAnswerRenderState(state);

  // Persistent-wrapper contract (docs/EXECUTION-PLAN-async-ui-states.md §2):
  // this div stays mounted across every status, including "hidden" — no
  // `return null` — so a later transition into "loading" animates an
  // expand instead of the whole page snapping open. Panel's own mb-6/
  // border-t only paint when something is actually rendered inside, so the
  // collapsed "hidden" state leaves no stray spacing behind.
  let content: React.ReactNode = null;
  switch (renderState.status) {
    case "hidden":
      content = null;
      break;
    case "loading":
      content = (
        <Panel>
          <ScanSequence generationSteps={state?.generationSteps ?? []} />
          <p className="font-mono-label text-xs text-shell-400">{CONTENT.answer.loadingLabel}</p>
          <AnswerSkeleton />
        </Panel>
      );
      break;
    case "error":
      content = (
        <Panel>
          <p className="text-sm text-red-600 dark:text-red-400">{CONTENT.answer.errorMessage}</p>
        </Panel>
      );
      break;
    case "streaming":
    case "answer": {
      const isStreaming = renderState.status === "streaming";
      content = (
        <Panel>
          <div className="mb-2 flex items-center justify-between">
            <ScanSequence generationSteps={state?.generationSteps ?? []} />
            {!isStreaming && generatedAnswer && state && (
              <FeedbackButtons generatedAnswer={generatedAnswer} state={state} />
            )}
          </div>
          <AnswerBody answer={renderState.answer} isStreaming={isStreaming} />
          {state && state.citations.length > 0 && (
            <Citations
              citations={state.citations}
              answerId={state.answerId}
              engine={engine}
            />
          )}
        </Panel>
      );
      break;
    }
  }

  return (
    <div className="async-panel" data-open={renderState.status !== "hidden" ? "true" : "false"}>
      <div>{content}</div>
    </div>
  );
}

/** 2-3 bars roughly matching a short answer's height (plan §3). */
function AnswerSkeleton() {
  return (
    <div className="mt-3 flex flex-col gap-2" aria-hidden="true">
      <div className="h-3 w-11/12 animate-pulse rounded bg-shell-100 dark:bg-shell-600/40" />
      <div className="h-3 w-3/4 animate-pulse rounded bg-shell-100 dark:bg-shell-600/40" />
      <div className="h-3 w-5/6 animate-pulse rounded bg-shell-100 dark:bg-shell-600/40" />
    </div>
  );
}

/**
 * Instrument-readout frame (v4 plan §7.1) — mono uppercase "POKEDEX ENTRY"
 * label over a thin `--shell-600` rule, deliberately not a rounded card.
 */
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 border-t border-shell-600/40 pt-4">
      <h2 className="font-mono-label mb-3 text-[10px] text-shell-400">
        {CONTENT.answer.panelLabel}
      </h2>
      {children}
    </div>
  );
}

const STEP_ORDER: GenerationStepName[] = ["searching", "thinking", "answering"];

/**
 * Real backend scan sequence, not a simulation — `generationSteps` already
 * carries `name`/`status: 'active' | 'completed'` per step (v4 plan §2.2).
 * A step this app hasn't heard from yet (not in the array) renders as
 * pending, dimmest of the three states.
 */
function ScanSequence({ generationSteps }: { generationSteps: GenerationStep[] }) {
  return (
    <ol className="font-mono-label flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
      {STEP_ORDER.map((name, index) => {
        const step = generationSteps.find((candidate) => candidate.name === name);
        const status = step?.status ?? "pending";
        return (
          <li key={name} className="flex items-center gap-2">
            {index > 0 && <span className="text-shell-200" aria-hidden="true">&rarr;</span>}
            <span
              data-status={status}
              className={
                status === "active"
                  ? "text-foreground underline decoration-shell-400 underline-offset-4"
                  : status === "completed"
                    ? "text-shell-400"
                    : "text-shell-200"
              }
            >
              {name}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Splits the streamed answer on blank lines so each completed block gets a
 * one-time fade-up (`.pokedex-line` in globals.css, ~180ms) on mount,
 * without re-triggering it on the block still growing mid-stream — a block
 * already on screen keeps its React key/position as later deltas only
 * extend the final block, so it never remounts and never replays the
 * animation. This is the reveal per plan §7.1's "per-line fade-up"; no
 * typewriter is layered on top (plan §2.2) — the text within a block is
 * exactly what `state.answer` already streamed.
 */
function AnswerBody({ answer, isStreaming }: { answer: string; isStreaming: boolean }) {
  const blocks = answer.split(/\n{2,}/).filter((block) => block.trim().length > 0);

  return (
    <div className="text-sm">
      {blocks.map((block, index) => (
        <div key={index} className="pokedex-line">
          <PokemonMarkdown text={block} />
        </div>
      ))}
      {isStreaming && (
        <span className="pokedex-cursor" aria-hidden="true" data-testid="answer-cursor" />
      )}
    </div>
  );
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
        aria-label={CONTENT.answer.feedbackUp}
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
        aria-label={CONTENT.answer.feedbackDown}
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

/**
 * Citations as mono scanline tags (v4 plan §7.2) — replaces both the old
 * numbered `[1][2]` list and the "Grounded in N sources" line. No inline
 * highlighting (plan §2.1): `GeneratedAnswerCitation` carries no
 * start/end/offset, and `citation.text` is a paraphrase of the source, not
 * a literal answer substring, so a span match would assert provenance the
 * API never claimed.
 *
 * The type color per tag is real, already-fetched data, not invented: this
 * builds its own `buildResultList` instance purely to *read* the shared
 * engine's existing result-list state (no new request — controllers of the
 * same kind share one store slice per engine), and matches each citation to
 * a currently-displayed result by `permanentid` (a standard Coveo system
 * field, present on `result.raw` independently of `fieldsToInclude`). A
 * citation whose document isn't among the currently rendered results (nor
 * enabled for citation field enrichment, which this pass deliberately does
 * not request — see plan §1's "no controller behavior changes" constraint)
 * falls back to the neutral scanline treatment rather than guessing a type.
 */
function Citations({
  citations,
  answerId,
  engine,
}: {
  citations: GeneratedAnswerState["citations"];
  answerId: string | undefined;
  engine: SearchEngine;
}) {
  const [resultList] = useState(() => buildResultList(engine));
  const resultState = useControllerState(resultList) ?? resultList.state;

  const typeByPermanentId = useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (const result of resultState.results) {
      const permanentId = result.raw.permanentid;
      if (!permanentId) continue;
      const [primaryType] = toStringArray(result.raw[POKEMON_FIELDS.type]);
      map.set(permanentId, primaryType);
    }
    return map;
  }, [resultState.results]);

  return (
    <ul className="mt-3 flex flex-col gap-1.5">
      {citations.map((citation) => (
        <CitationTag
          key={citation.id}
          citation={citation}
          answerId={answerId}
          engine={engine}
          type={typeByPermanentId.get(citation.permanentid)}
        />
      ))}
    </ul>
  );
}

function CitationTag({
  citation,
  answerId,
  engine,
  type,
}: {
  citation: GeneratedAnswerState["citations"][number];
  answerId: string | undefined;
  engine: SearchEngine;
  type: string | undefined;
}) {
  const [interactiveCitation] = useState(() =>
    buildInteractiveCitation(engine, { options: { citation, answerId } }),
  );
  const color = type ? getTypeColor(type) : undefined;
  const style = color ? ({ "--type-primary": color } as CSSProperties) : undefined;

  return (
    <li>
      <a
        href={citation.clickUri ?? citation.uri}
        target="_blank"
        rel="noreferrer"
        onClick={() => interactiveCitation.select()}
        data-has-type={Boolean(color)}
        style={style}
        className="scan-citation inline-flex items-center gap-1.5 font-mono text-[10px] text-shell-400 hover:underline"
      >
        <span aria-hidden="true">&#10230;</span>
        <span>
          {CONTENT.answer.citationPrefix} {citation.title}
        </span>
      </a>
    </li>
  );
}
