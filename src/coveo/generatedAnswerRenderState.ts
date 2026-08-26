import type { GeneratedAnswerState } from "@coveo/headless";

/**
 * Discriminated union mirroring searchRenderState.ts's pattern. RGA is an
 * Advanced-tier, org-gated feature (see CLAUDE.md "Blocked on") — the org
 * this app currently points at doesn't have RGA enabled yet, so
 * `isEnabled`/`isVisible` stay false and no answer is ever produced. Any
 * controller error is folded into "hidden" too rather than surfaced to the
 * user: a missing generative answer should never read as a broken search,
 * it should just not be there.
 */
export type GeneratedAnswerRenderState =
  | { status: "hidden" }
  | { status: "loading" }
  | { status: "answer"; answer: string };

export function deriveGeneratedAnswerRenderState(
  state: GeneratedAnswerState | undefined,
): GeneratedAnswerRenderState {
  if (!state || !state.isEnabled || !state.isVisible || state.error) {
    return { status: "hidden" };
  }

  if (state.answer) {
    return { status: "answer", answer: state.answer };
  }

  if (state.isLoading) {
    return { status: "loading" };
  }

  return { status: "hidden" };
}
