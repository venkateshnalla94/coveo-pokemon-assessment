import { describe, expect, it } from "vitest";
import { buildTypeSearchHref, parseTypeFromAq } from "@/coveo/browseByTypeUrl";

describe("buildTypeSearchHref", () => {
  it("uses an aq exact-match expression, not a facet-scoped f-<id> param", () => {
    expect(buildTypeSearchHref("Fire")).toBe('/search?aq=%40pokemontype%3D%3D%22Fire%22');
  });

  it("escapes a double quote inside the type value so the query expression stays well-formed", () => {
    const href = buildTypeSearchHref('Fire"Type');
    const decoded = decodeURIComponent(href.split("aq=")[1]);
    expect(decoded).toBe('@pokemontype=="Fire\\"Type"');
  });

  it("round-trips through SearchUrlSync's aq param, which is a real restorable basic key", () => {
    const href = buildTypeSearchHref("Fire");
    const query = href.split("?")[1];
    const [key] = query.split("=");
    expect(key).toBe("aq");
  });
});

describe("parseTypeFromAq", () => {
  it("recovers the type value from an aq expression built by buildTypeSearchHref", () => {
    expect(parseTypeFromAq('@pokemontype=="Fire"')).toBe("Fire");
  });

  it("unescapes a double quote inside the type value", () => {
    expect(parseTypeFromAq('@pokemontype=="Fire\\"Type"')).toBe('Fire"Type');
  });

  it("returns null for an empty or undefined aq", () => {
    expect(parseTypeFromAq(undefined)).toBeNull();
    expect(parseTypeFromAq("")).toBeNull();
  });

  it("returns null for an aq expression on a different field", () => {
    expect(parseTypeFromAq('@pokemonname=="Pikachu"')).toBeNull();
  });
});
