import { describe, expect, it } from "vitest";
import { buildTypeSearchHref } from "@/coveo/browseByTypeUrl";

describe("buildTypeSearchHref", () => {
  it("uses Headless's real f-<facetId>=<value> fragment shape, keyed on the pokemontype field", () => {
    expect(buildTypeSearchHref("Fire")).toBe("/search?f-pokemontype=Fire");
  });

  it("URL-encodes a type value that needs it", () => {
    expect(buildTypeSearchHref("Fire Type")).toBe("/search?f-pokemontype=Fire%20Type");
  });

  it("round-trips through the same regex Headless's deserializer uses to parse facet params", () => {
    const href = buildTypeSearchHref("Fire");
    const query = href.split("?")[1];
    const [key] = query.split("=");
    // Mirrors facetSearchParamRegex from
    // features/search-parameters/search-parameter-serializer.js.
    expect(/^(f|fExcluded|cf|nf|df|sf|af|mnf)-(.+)$/.test(key)).toBe(true);
  });
});
