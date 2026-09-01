import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/coveo/serverPokemonLookup", () => ({
  fetchPokemonMetadata: vi.fn(),
}));

const notFoundSentinel = new Error("NEXT_NOT_FOUND");
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw notFoundSentinel;
  }),
}));

vi.mock("@/app/pokemon/[name]/PokemonDetailPageClient", () => ({
  default: () => null,
}));

import { fetchPokemonMetadata } from "@/coveo/serverPokemonLookup";
import { notFound } from "next/navigation";
import PokemonDetailPage, { generateMetadata } from "@/app/pokemon/[name]/page";

const mockedFetch = vi.mocked(fetchPokemonMetadata);
const mockedNotFound = vi.mocked(notFound);

describe("PDP generateMetadata", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns a minimal fallback title when the lookup finds nothing", async () => {
    mockedFetch.mockResolvedValue(null);

    const metadata = await generateMetadata({ params: Promise.resolve({ name: "not-a-pokemon" }) });

    expect(metadata.title).toBeTruthy();
    expect(metadata.alternates).toBeUndefined();
  });

  it("builds a title, description, canonical, and OG/Twitter tags from the real fetched fields", async () => {
    mockedFetch.mockResolvedValue({
      name: "Pikachu",
      types: ["Electric"],
      species: "Mouse Pokémon",
      dexNumber: "025",
      imageUrl: "https://img.pokemondb.net/sprites/pikachu.png",
    });

    const metadata = await generateMetadata({ params: Promise.resolve({ name: "pikachu" }) });

    expect(metadata.title).toContain("Pikachu");
    expect(metadata.description).toContain("Electric");
    expect(metadata.description).toContain("Mouse Pokémon");
    expect(metadata.alternates).toEqual({ canonical: "/pokemon/Pikachu" });
    expect(metadata.openGraph?.images).toEqual(["https://img.pokemondb.net/sprites/pikachu.png"]);
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("uses the canonical (index) name casing, not the raw route param", async () => {
    mockedFetch.mockResolvedValue({
      name: "Mr. Mime",
      types: ["Psychic", "Fairy"],
      species: undefined,
      dexNumber: "122",
      imageUrl: undefined,
    });

    const metadata = await generateMetadata({ params: Promise.resolve({ name: "mr-mime" }) });

    expect(metadata.alternates).toEqual({ canonical: "/pokemon/Mr.%20Mime" });
    expect(metadata.openGraph?.images).toBeUndefined();
  });
});

describe("PDP default export", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("calls notFound() when the lookup returns null", async () => {
    mockedFetch.mockResolvedValue(null);

    await expect(
      PokemonDetailPage({ params: Promise.resolve({ name: "not-a-pokemon" }) }),
    ).rejects.toThrow(notFoundSentinel);
    expect(mockedNotFound).toHaveBeenCalledOnce();
  });

  it("renders the client component when the lookup finds a match", async () => {
    mockedFetch.mockResolvedValue({
      name: "Pikachu",
      types: ["Electric"],
      species: "Mouse Pokémon",
      dexNumber: "025",
      imageUrl: "https://img.pokemondb.net/sprites/pikachu.png",
    });

    const element = await PokemonDetailPage({ params: Promise.resolve({ name: "pikachu" }) });

    expect(mockedNotFound).not.toHaveBeenCalled();
    expect(element).toBeTruthy();
  });
});
