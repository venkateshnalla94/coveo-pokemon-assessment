import { describe, expect, it } from "vitest";
import type { GeneratedAnswerState } from "@coveo/headless";
import { deriveGeneratedAnswerRenderState } from "@/coveo/generatedAnswerRenderState";

function buildState(overrides: Partial<GeneratedAnswerState> = {}): GeneratedAnswerState {
  return {
    id: "1",
    isVisible: true,
    isEnabled: true,
    isLoading: false,
    isStreaming: false,
    citations: [],
    cannotAnswer: false,
    liked: false,
    disliked: false,
    feedbackSubmitted: false,
    generationSteps: [],
    responseFormat: {},
    feedbackModalOpen: false,
    fieldsToIncludeInCitations: [],
    expanded: false,
    answerGenerationMode: "automatic",
    isAnswerGenerated: false,
    ...overrides,
  } as unknown as GeneratedAnswerState;
}

describe("deriveGeneratedAnswerRenderState", () => {
  it("is hidden when there is no state yet (controller build failed)", () => {
    expect(deriveGeneratedAnswerRenderState(undefined)).toEqual({ status: "hidden" });
  });

  it("is hidden when RGA isn't enabled on the org", () => {
    expect(deriveGeneratedAnswerRenderState(buildState({ isEnabled: false }))).toEqual({
      status: "hidden",
    });
  });

  it("is hidden when the controller marks the answer as not visible", () => {
    expect(deriveGeneratedAnswerRenderState(buildState({ isVisible: false }))).toEqual({
      status: "hidden",
    });
  });

  it("is hidden — not surfaced as an error — when the controller reports an error", () => {
    const result = deriveGeneratedAnswerRenderState(
      buildState({ error: { message: "boom" } }),
    );
    expect(result).toEqual({ status: "hidden" });
  });

  it("is loading while an answer is being generated", () => {
    expect(deriveGeneratedAnswerRenderState(buildState({ isLoading: true }))).toEqual({
      status: "loading",
    });
  });

  it("returns the answer text once one has been generated and streaming has finished", () => {
    const result = deriveGeneratedAnswerRenderState(
      buildState({ answer: "Pikachu is an Electric-type Pokemon.", isStreaming: false }),
    );
    expect(result).toEqual({ status: "answer", answer: "Pikachu is an Electric-type Pokemon." });
  });

  it("is streaming while the answer is still growing", () => {
    const result = deriveGeneratedAnswerRenderState(
      buildState({ answer: "Pikachu is an Electric", isStreaming: true }),
    );
    expect(result).toEqual({ status: "streaming", answer: "Pikachu is an Electric" });
  });
});
