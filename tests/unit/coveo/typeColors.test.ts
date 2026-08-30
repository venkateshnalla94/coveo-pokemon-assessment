import { describe, expect, it } from "vitest";
import { getTypeColor, getTypeTextColor, typeCssVariables } from "@/coveo/typeColors";

const ALL_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting",
  "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
  "dragon", "dark", "steel", "fairy",
];

// WCAG relative-luminance contrast, computed independently of the
// implementation under test so this can't just echo back whatever
// getTypeTextColor already decided.
function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

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
    for (const type of ALL_TYPES) {
      expect(getTypeColor(type)).toBeDefined();
    }
  });
});

describe("typeCssVariables", () => {
  it("serializes every type into a --type-<name> custom property", () => {
    const css = typeCssVariables();
    for (const type of ALL_TYPES) {
      const color = getTypeColor(type);
      expect(css).toContain(`--type-${type}: ${color};`);
    }
  });

  it("returns a single semicolon-joined declaration string, not an array", () => {
    expect(typeof typeCssVariables()).toBe("string");
    // 18 types -> 18 declarations, each ending in a semicolon.
    expect(typeCssVariables().match(/;/g)?.length).toBe(ALL_TYPES.length);
  });
});

describe("getTypeTextColor", () => {
  it("only ever returns one of the two literal text colors", () => {
    for (const type of ALL_TYPES) {
      expect(["#FFFFFF", "#1A1C22"]).toContain(getTypeTextColor(type));
    }
  });

  it("is case-insensitive and trims whitespace, matching getTypeColor's normalization", () => {
    expect(getTypeTextColor("Fire")).toBe(getTypeTextColor("fire"));
    expect(getTypeTextColor("  WATER  ")).toBe(getTypeTextColor("water"));
  });

  it("falls back to the dark text color for an unrecognized type", () => {
    expect(getTypeTextColor("not-a-type")).toBe("#1A1C22");
  });

  it("clears 4.5:1 (WCAG AA) contrast against every one of the 18 type colors", () => {
    for (const type of ALL_TYPES) {
      const backgroundHex = getTypeColor(type);
      expect(backgroundHex).toBeDefined();
      const textHex = getTypeTextColor(type);
      const ratio = contrastRatio(backgroundHex as string, textHex);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("picks white only for the types independently verified to clear 4.5:1 with white text", () => {
    // fighting/poison/ghost/dragon/dark measure >= 4.5:1 against #FFFFFF;
    // every other type falls under that threshold with white and must use
    // the dark fallback instead. Asserted explicitly (not just via the
    // >=4.5 loop above) so a future TYPE_COLORS edit that quietly breaks
    // this set fails loudly here.
    const expectedWhiteTypes = new Set(["fighting", "poison", "ghost", "dragon", "dark"]);
    for (const type of ALL_TYPES) {
      const expected = expectedWhiteTypes.has(type) ? "#FFFFFF" : "#1A1C22";
      expect(getTypeTextColor(type)).toBe(expected);
    }
  });
});
