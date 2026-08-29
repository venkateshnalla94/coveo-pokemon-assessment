import { describe, expect, it } from "vitest";
import { buildTypeSearchHref } from "@/coveo/browseByTypeUrl";

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
