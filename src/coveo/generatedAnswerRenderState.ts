import type { GeneratedAnswerState } from "@coveo/headless";

/**
 * Discriminated union mirroring searchRenderState.ts's pattern. RGA is an
 * Advanced-tier, org-gated feature (see CLAUDE.md "Blocked on") — the org
 * this app currently points at doesn't have RGA enabled yet, so
 * `isEnabled`/`isVisible` stay false and no answer is ever produced. Any
 * controller error is folded into "hidden" too rather than surfaced to the
 * user: a missing generative answer should never read as a broken search,
 * it should just not be there.
 *
 * `streaming` (v4 plan §7.1) sits between `loading` and `answer`: the
 * backend has started emitting `textDelta`s (`state.answer` is non-empty)
 * but `state.isStreaming` hasn't flipped false yet, so the answer is still
 * growing. Before this arm existed, a partially-streamed answer and a
 * finished one produced the identical `{ status: "answer" }` shape — the
 * component had no way to tell them apart to drive the scan-cursor/reveal
 * treatment. This is one new arm added to the existing union, not a second
 * state machine (v4 plan §1).
 */
export type GeneratedAnswerRenderState =
  | { status: "hidden" }
  | { status: "loading" }
  | { status: "streaming"; answer: string }
  | { status: "answer"; answer: string };

export function deriveGeneratedAnswerRenderState(
  state: GeneratedAnswerState | undefined,
): GeneratedAnswerRenderState {
  if (!state || !state.isEnabled || !state.isVisible || state.error) {
    return { status: "hidden" };
  }

  if (state.answer) {
    return state.isStreaming
      ? { status: "streaming", answer: state.answer }
      : { status: "answer", answer: state.answer };
  }

  if (state.isLoading) {
    return { status: "loading" };
  }

  return { status: "hidden" };
}
