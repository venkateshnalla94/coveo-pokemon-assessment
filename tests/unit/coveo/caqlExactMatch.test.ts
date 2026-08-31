import { describe, expect, it } from "vitest";
import { escapeCaqlExactMatchValue } from "@/coveo/caqlExactMatch";

describe("escapeCaqlExactMatchValue", () => {
  it("escapes embedded double quotes", () => {
    expect(escapeCaqlExactMatchValue('Mr. "Mime"')).toBe('Mr. \\"Mime\\"');
  });

  it("passes through a value with no special characters unchanged", () => {
    expect(escapeCaqlExactMatchValue("Eevee")).toBe("Eevee");
  });

  it.each(["@field==value", "Eevee)", "(Eevee", "OR @x==(y)"])(
    "returns null for a value containing a structural CAQL character: %s",
    (value) => {
      expect(escapeCaqlExactMatchValue(value)).toBeNull();
    },
  );
});
