import { describe, expect, it } from "vitest";
import {
  optionalString,
  requireNonEmptyString,
  requireNonEmptyStringArray,
} from "@/utils/validateRequestBody";

describe("requireNonEmptyString", () => {
  it("accepts a non-empty string", () => {
    expect(requireNonEmptyString("Eevee", "name")).toEqual({ ok: true, value: "Eevee" });
  });

  it("rejects undefined, non-strings, and blank/whitespace-only strings", () => {
    expect(requireNonEmptyString(undefined, "name")).toEqual({
      ok: false,
      message: "`name` must be a non-empty string.",
    });
    expect(requireNonEmptyString(42, "name")).toEqual({
      ok: false,
      message: "`name` must be a non-empty string.",
    });
    expect(requireNonEmptyString("   ", "name")).toEqual({
      ok: false,
      message: "`name` must be a non-empty string.",
    });
  });
});

describe("requireNonEmptyStringArray", () => {
  it("accepts a non-empty array of non-empty strings", () => {
    expect(requireNonEmptyStringArray(["Fire", "Flying"], "types")).toEqual({
      ok: true,
      value: ["Fire", "Flying"],
    });
  });

  it("rejects missing, empty, non-array, and mixed-content values", () => {
    expect(requireNonEmptyStringArray(undefined, "types").ok).toBe(false);
    expect(requireNonEmptyStringArray([], "types").ok).toBe(false);
    expect(requireNonEmptyStringArray("Fire", "types").ok).toBe(false);
    expect(requireNonEmptyStringArray([1, 2], "types").ok).toBe(false);
    expect(requireNonEmptyStringArray(["Fire", "  "], "types").ok).toBe(false);
  });

  it("names the offending field in the message", () => {
    const result = requireNonEmptyStringArray([], "types");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe("`types` must be a non-empty array of non-empty strings.");
    }
  });
});

describe("optionalString", () => {
  it("treats undefined as valid, with an undefined value", () => {
    expect(optionalString(undefined, "pokemonName")).toEqual({ ok: true, value: undefined });
  });

  it("accepts a string value", () => {
    expect(optionalString("Eevee", "pokemonName")).toEqual({ ok: true, value: "Eevee" });
  });

  it("rejects a provided non-string value", () => {
    expect(optionalString(42, "pokemonName")).toEqual({
      ok: false,
      message: "`pokemonName` must be a string when provided.",
    });
  });
});
