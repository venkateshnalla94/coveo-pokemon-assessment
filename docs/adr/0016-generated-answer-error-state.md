# 0016: `GeneratedAnswer` gets a real "couldn't retrieve" state, distinct from "RGA not enabled"

Status: Accepted

## Context

`deriveGeneratedAnswerRenderState` originally folded every `state.error` case into `{ status: "hidden" }`, on the reasoning documented in its own header comment: RGA is an org-gated Advanced-tier feature, this org doesn't have it enabled yet, and a missing generative answer should never read as a broken search — it should just not be there. `tests/unit/coveo/generatedAnswerRenderState.test.ts` pinned this with a test literally titled "is hidden — not surfaced as an error — when the controller reports an error."

`docs/archive/EXECUTION-PLAN-async-ui-states.md` §3 requires every Coveo-or-own-API-backed component to have a distinct, real "couldn't retrieve" state for a genuine failure, and calls out `GeneratedAnswer.tsx` by name as needing this arm if the mapper doesn't already model it.

These two are compatible once "RGA isn't enabled/visible on this org" and "RGA was enabled and visible but a request genuinely failed" are treated as different situations, which they are: `state.isEnabled`/`state.isVisible` already capture the first (an org-capability check, unrelated to any single request), while `state.error` on an enabled+visible controller is a second, independent signal — a real runtime failure the previous version had no way to surface.

## Decision

Split the two: `isEnabled`/`isVisible` false still folds to `hidden` exactly as before (unchanged behavior, unchanged reasoning). `state.error` truthy *while enabled and visible* now maps to a new `{ status: "error" }` arm instead of `hidden`, and `GeneratedAnswer.tsx` renders it as a real "couldn't retrieve" message inside the same `.async-panel` wrapper used for every other state, rather than nothing.

This is a refinement of the original decision's scope, not a reversal of its reasoning — "an absent feature shouldn't look like a broken search" still holds for the not-enabled/not-visible case; it just no longer also covers "the feature was live and failed," which is a different, real failure worth telling the user about.

## Consequences

- `tests/unit/coveo/generatedAnswerRenderState.test.ts`'s error case now asserts `{ status: "error" }` instead of `{ status: "hidden" }` — updated in the same change, with its description rewritten to state the new behavior rather than describing behavior that no longer exists.
- `GeneratedAnswer.tsx` no longer `return null`s for its hidden state either — see `docs/archive/EXECUTION-PLAN-async-ui-states.md` §2's persistent-wrapper mechanism, applied here for the same reason it was applied to `SimilarPokemon.tsx` first.
