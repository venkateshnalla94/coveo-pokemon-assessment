import { describe, expect, it } from "vitest";
import type { Result } from "@coveo/headless";
import { mapPokemonResult, toStringArray } from "@/coveo/mapPokemonResult";
import { POKEMON_FIELDS } from "@/coveo/fields";

function buildRawResult(raw: Record<string, unknown>, title = "Pikachu"): Result {
  return {
    uniqueId: "test-id",
    title,
    raw,
  } as Result;
}

describe("mapPokemonResult", () => {
  it("maps known fields into a PokemonItem", () => {
    const result = buildRawResult({
      [POKEMON_FIELDS.name]: "Pikachu",
      [POKEMON_FIELDS.type]: ["Electric"],
      [POKEMON_FIELDS.generation]: "Generation 1",
      [POKEMON_FIELDS.image]: "https://img.pokemondb.net/pikachu.png",
    });

    expect(mapPokemonResult(result)).toEqual({
      id: "test-id",
      name: "Pikachu",
      imageUrl: "https://img.pokemondb.net/pikachu.png",
      types: ["Electric"],
      generation: "Generation 1",
    });
  });

  it("leaves scalar fields undefined and types empty when missing or the wrong shape, instead of throwing", () => {
    const result = buildRawResult({
      [POKEMON_FIELDS.type]: 42, // wrong shape — should not be cast to a string
    });

    const item = mapPokemonResult(result);

    expect(item.types).toEqual([]);
    expect(item.generation).toBeUndefined();
    expect(item.imageUrl).toBeUndefined();
  });

  it("falls back to result.title when pokemonname is absent", () => {
    const result = buildRawResult({}, "Bulbasaur Pokédex: stats, moves, evolution & locations");

    expect(mapPokemonResult(result).name).toBe(
      "Bulbasaur Pokédex: stats, moves, evolution & locations",
    );
  });
});

describe("toStringArray", () => {
  it("passes through a real array of strings", () => {
    expect(toStringArray(["Fire", "Flying"])).toEqual(["Fire", "Flying"]);
  });

  it("splits a semicolon-joined string and trims each entry", () => {
    expect(toStringArray("Fire; Flying ;Dragon")).toEqual(["Fire", "Flying", "Dragon"]);
  });

  it("wraps a single plain string in a one-element array", () => {
    expect(toStringArray("Electric")).toEqual(["Electric"]);
  });

  it("returns an empty array for undefined, null, or garbage values", () => {
    expect(toStringArray(undefined)).toEqual([]);
    expect(toStringArray(null)).toEqual([]);
    expect(toStringArray(42)).toEqual([]);
  });

  it("returns an empty array when the input is already an empty array", () => {
    expect(toStringArray([])).toEqual([]);
  });

  it("drops empty segments produced by a trailing/leading semicolon", () => {
    expect(toStringArray(";Fire;;Flying;")).toEqual(["Fire", "Flying"]);
  });
});
