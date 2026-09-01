import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * fetchPokemonMetadata/fetchAllPokemonNames are wrapped in React's cache(),
 * which memoizes per-request in a real RSC render but (per React's own
 * cache() docs) falls back to a plain uncached call outside a request
 * context — which is exactly what a vitest module import is. So each call
 * below hits the mocked fetch fresh, same as the SUT's non-cached
 * behavior would in a fresh request.
 */
async function importFresh() {
  vi.resetModules();
  return import("@/coveo/serverPokemonLookup");
}

function configureEnv() {
  vi.stubEnv("NEXT_PUBLIC_COVEO_ORGANIZATION_ID", "myorg");
  vi.stubEnv("COVEO_API_KEY", "xx-privileged-key");
}

describe("fetchPokemonMetadata", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns null when the server is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_COVEO_ORGANIZATION_ID", "");
    vi.stubEnv("COVEO_API_KEY", "");
    const { fetchPokemonMetadata } = await importFresh();

    await expect(fetchPokemonMetadata("Pikachu")).resolves.toBeNull();
  });

  it("returns null when the name contains structural CAQL characters", async () => {
    configureEnv();
    const { fetchPokemonMetadata } = await importFresh();

    await expect(fetchPokemonMetadata("Eevee) OR @x==(y")).resolves.toBeNull();
  });

  it("returns null when the upstream fetch throws", async () => {
    configureEnv();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );
    const { fetchPokemonMetadata } = await importFresh();

    await expect(fetchPokemonMetadata("Pikachu")).resolves.toBeNull();
  });

  it("returns null when upstream responds with a non-ok status", async () => {
    configureEnv();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const { fetchPokemonMetadata } = await importFresh();

    await expect(fetchPokemonMetadata("Pikachu")).resolves.toBeNull();
  });

  it("returns null when no result matches", async () => {
    configureEnv();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [] }) }));
    const { fetchPokemonMetadata } = await importFresh();

    await expect(fetchPokemonMetadata("NotAPokemon")).resolves.toBeNull();
  });

  it("builds an exact-match aq from the escaped name and maps the raw fields", async () => {
    configureEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            title: "Pikachu",
            raw: {
              pokemonname: "Pikachu",
              pokemontype: ["Electric"],
              pokemonspecies: "Mouse Pokémon",
              pokemondexnumber: "025",
              pokemonimageurl: "https://img.pokemondb.net/sprites/pikachu.png",
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchPokemonMetadata } = await importFresh();

    const result = await fetchPokemonMetadata('Mr. "Mime"');

    expect(result).toEqual({
      name: "Pikachu",
      types: ["Electric"],
      species: "Mouse Pokémon",
      dexNumber: "025",
      imageUrl: "https://img.pokemondb.net/sprites/pikachu.png",
    });
    const [, init] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.aq).toBe('@pokemonname=="Mr. \\"Mime\\""');
    expect(sentBody.numberOfResults).toBe(1);
  });
});

describe("fetchAllPokemonNames", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns [] when the server is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_COVEO_ORGANIZATION_ID", "");
    vi.stubEnv("COVEO_API_KEY", "");
    const { fetchAllPokemonNames } = await importFresh();

    await expect(fetchAllPokemonNames()).resolves.toEqual([]);
  });

  it("returns [] when the upstream fetch fails outright", async () => {
    configureEnv();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const { fetchAllPokemonNames } = await importFresh();

    await expect(fetchAllPokemonNames()).resolves.toEqual([]);
  });

  it("paginates across multiple pages using firstResult and totalCount", async () => {
    configureEnv();
    const pageOneNames = Array.from({ length: 1000 }, (_, i) => `Pokemon${i}`);
    const pageTwoNames = ["Pokemon1000", "Pokemon1001"];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: pageOneNames.map((name) => ({ raw: { pokemonname: name } })),
          totalCount: 1002,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: pageTwoNames.map((name) => ({ raw: { pokemonname: name } })),
          totalCount: 1002,
        }),
      });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchAllPokemonNames } = await importFresh();

    const names = await fetchAllPokemonNames();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    const secondBody = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(firstBody.firstResult).toBe(0);
    expect(secondBody.firstResult).toBe(1000);
    expect(names).toHaveLength(1002);
    expect(names[0]).toBe("Pokemon0");
    expect(names[1001]).toBe("Pokemon1001");
  });

  it("stops when a page returns fewer results than requested even without a matching totalCount", async () => {
    configureEnv();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{ raw: { pokemonname: "Bulbasaur" } }, { raw: { pokemonname: "Ivysaur" } }],
          totalCount: 2,
        }),
      }),
    );
    const { fetchAllPokemonNames } = await importFresh();

    const names = await fetchAllPokemonNames();

    expect(names).toEqual(["Bulbasaur", "Ivysaur"]);
  });
});
