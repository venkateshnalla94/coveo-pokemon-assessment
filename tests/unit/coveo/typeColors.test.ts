import { describe, expect, it } from "vitest";
import { getTypeColor } from "@/coveo/typeColors";

describe("getTypeColor", () => {
  it("returns a color for a known type, case-insensitively", () => {
    expect(getTypeColor("fire")).toBe("#F08030");
    expect(getTypeColor("Fire")).toBe("#F08030");
    expect(getTypeColor("FIRE")).toBe("#F08030");
  });

  it("trims surrounding whitespace before matching", () => {
    expect(getTypeColor("  water  ")).toBe("#6890F0");
  });

  it("returns undefined for an unrecognized value rather than guessing", () => {
    expect(getTypeColor("not-a-type")).toBeUndefined();
    expect(getTypeColor("")).toBeUndefined();
  });

  it("has an entry for all 18 canonical Pokemon types", () => {
    const types = [
      "normal", "fire", "water", "electric", "grass", "ice", "fighting",
      "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
      "dragon", "dark", "steel", "fairy",
    ];
    for (const type of types) {
      expect(getTypeColor(type)).toBeDefined();
    }
  });
});
