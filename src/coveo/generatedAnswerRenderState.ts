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
 *
 * `error` (ADR-0016) is a genuine controller-reported failure on a
 * controller that IS enabled and visible — distinct from `isEnabled`/
 * `isVisible` being false, which stays `hidden` exactly as before (an org
 * without RGA enabled should never look like a broken search). A request
 * that started and failed is a different, real situation worth telling the
 * user about.
 */
export type GeneratedAnswerRenderState =
  | { status: "hidden" }
  | { status: "loading" }
  | { status: "streaming"; answer: string }
  | { status: "answer"; answer: string }
  | { status: "error" };

export function deriveGeneratedAnswerRenderState(
  state: GeneratedAnswerState | undefined,
): GeneratedAnswerRenderState {
  if (!state || !state.isEnabled || !state.isVisible) {
    return { status: "hidden" };
  }

  if (state.error) {
    return { status: "error" };
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
