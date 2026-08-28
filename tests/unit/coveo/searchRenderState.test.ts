import { describe, expect, it } from "vitest";
import type { ResultListState, SearchEngine } from "@coveo/headless";
import { deriveSearchRenderState } from "@/coveo/searchRenderState";
import { POKEMON_FIELDS } from "@/coveo/fields";

function buildState(overrides: Partial<ResultListState>): ResultListState {
  return {
    results: [],
    searchResponseId: "",
    moreResultsAvailable: false,
    isLoading: false,
    firstSearchExecuted: true,
    hasError: false,
    hasResults: false,
    ...overrides,
  };
}

function buildEngine(searchError: unknown = null): SearchEngine {
  return { state: { search: { error: searchError } } } as unknown as SearchEngine;
}

describe("deriveSearchRenderState", () => {
  it("returns loading while a search is in progress, regardless of other flags", () => {
    const state = buildState({ isLoading: true, hasError: true });
    expect(deriveSearchRenderState(state, buildEngine())).toEqual({ status: "loading" });
  });

  it("returns error with the normalized Coveo error when hasError is set", () => {
    const state = buildState({ hasError: true });
    const engine = buildEngine({ statusCode: 503, message: "down", type: "ServiceUnavailable" });

    const result = deriveSearchRenderState(state, engine);

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error.code).toBe("PROVIDER");
    }
  });

  it("falls back to an UNKNOWN error when hasError is set but no error detail exists", () => {
    const state = buildState({ hasError: true });
    const result = deriveSearchRenderState(state, buildEngine(null));

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error.code).toBe("UNKNOWN");
    }
  });

  it("returns empty when the search succeeded with zero results", () => {
    const state = buildState({ results: [] });
    expect(deriveSearchRenderState(state, buildEngine())).toEqual({ status: "empty" });
  });

  it("returns success with mapped items when results exist", () => {
    const state = buildState({
      results: [
        {
          uniqueId: "1",
          title: "Pikachu",
          raw: { [POKEMON_FIELDS.type]: "Electric" },
        } as unknown as ResultListState["results"][number],
      ],
    });

    const result = deriveSearchRenderState(state, buildEngine());

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.items).toEqual([
        {
          id: "1",
          name: "Pikachu",
          imageUrl: undefined,
          types: ["Electric"],
          generation: undefined,
          species: undefined,
          height: undefined,
          weight: undefined,
          abilities: [],
          hp: undefined,
          attack: undefined,
          defense: undefined,
          spAtk: undefined,
          spDef: undefined,
          speed: undefined,
          statTotal: undefined,
          evYield: undefined,
          catchRate: undefined,
          baseFriendship: undefined,
          baseExp: undefined,
          growthRate: undefined,
          eggGroups: [],
          genderRatio: [],
          eggCycles: undefined,
          weaknesses: [],
          resistances: [],
          evolvesFrom: undefined,
          evolvesTo: undefined,
          isBaseStage: true,
        },
      ]);
    }
  });
});
