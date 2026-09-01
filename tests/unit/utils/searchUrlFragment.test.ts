import { describe, expect, it } from "vitest";
import { toHeadlessFragment } from "@/utils/searchUrlFragment";

describe("toHeadlessFragment", () => {
  it("returns an empty string for empty params", () => {
    expect(toHeadlessFragment(new URLSearchParams())).toBe("");
  });

  it("joins multiple params with &", () => {
    const params = new URLSearchParams([
      ["q", "pikachu"],
      ["f-pokemontype", "Electric"],
    ]);
    expect(toHeadlessFragment(params)).toBe("q=pikachu&f-pokemontype=Electric");
  });

  it("percent-encodes a space as %20, not URLSearchParams.toString()'s '+'", () => {
    const params = new URLSearchParams([["sortCriteria", "@pokemonname ascending"]]);
    expect(toHeadlessFragment(params)).toBe("sortCriteria=%40pokemonname%20ascending");
    // Sanity check the contrast this function exists to avoid.
    expect(params.toString()).toBe("sortCriteria=%40pokemonname+ascending");
  });

  it("encodes a value with a space in a facet selection (e.g. 'Generation 9')", () => {
    const params = new URLSearchParams([["af-generation", "Generation 9"]]);
    expect(toHeadlessFragment(params)).toBe("af-generation=Generation%209");
  });
});
