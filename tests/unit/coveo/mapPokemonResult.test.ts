import { describe, expect, it } from "vitest";
import type { Result } from "@coveo/headless";
import { asNumber, mapPokemonResult, toStringArray } from "@/coveo/mapPokemonResult";
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
      dexNumber: undefined,
      species: undefined,
      height: undefined,
      weight: undefined,
      abilities: [],
      stats: {
        hp: undefined,
        attack: undefined,
        defense: undefined,
        spAtk: undefined,
        spDef: undefined,
        speed: undefined,
      },
      statTotal: undefined,
      training: {
        evYield: undefined,
        catchRate: undefined,
        baseFriendship: undefined,
        baseExp: undefined,
        growthRate: undefined,
      },
      breeding: {
        eggGroups: [],
        genderRatio: undefined,
        eggCycles: undefined,
      },
      defenses: {
        weaknesses: [],
        resistances: [],
      },
      evolution: {
        from: undefined,
        to: [],
      },
      isBaseStage: true,
    });
  });

  it("maps the full set of v2.1 fields into their grouped sub-objects", () => {
    const result = buildRawResult({
      [POKEMON_FIELDS.name]: "Eevee",
      [POKEMON_FIELDS.dexNumber]: "0133",
      [POKEMON_FIELDS.species]: "Evolution Pokémon",
      [POKEMON_FIELDS.height]: "0.3 m (0′10″)",
      [POKEMON_FIELDS.weight]: "6.5 kg (14.3 lbs)",
      [POKEMON_FIELDS.abilities]: ["Run Away", "Adaptability"],
      [POKEMON_FIELDS.hp]: 55,
      [POKEMON_FIELDS.attack]: 55,
      [POKEMON_FIELDS.defense]: 50,
      [POKEMON_FIELDS.spAtk]: 45,
      [POKEMON_FIELDS.spDef]: 65,
      [POKEMON_FIELDS.speed]: 55,
      [POKEMON_FIELDS.statTotal]: 325,
      [POKEMON_FIELDS.evYield]: "1 Special Defense",
      [POKEMON_FIELDS.catchRate]: "45",
      [POKEMON_FIELDS.baseFriendship]: "50",
      [POKEMON_FIELDS.baseExp]: "65",
      [POKEMON_FIELDS.growthRate]: "Medium Fast",
      [POKEMON_FIELDS.eggGroups]: ["Field"],
      [POKEMON_FIELDS.genderRatio]: ["87.5% male", "12.5% female"],
      [POKEMON_FIELDS.eggCycles]: "35",
      [POKEMON_FIELDS.weaknesses]: ["Fighting"],
      [POKEMON_FIELDS.resistances]: ["Ghost"],
      [POKEMON_FIELDS.evolvesTo]: "Vaporeon",
    });

    const item = mapPokemonResult(result);

    expect(item.dexNumber).toBe("0133");
    expect(item.species).toBe("Evolution Pokémon");
    expect(item.height).toBe("0.3 m (0′10″)");
    expect(item.weight).toBe("6.5 kg (14.3 lbs)");
    expect(item.abilities).toEqual(["Run Away", "Adaptability"]);
    expect(item.stats).toEqual({
      hp: 55,
      attack: 55,
      defense: 50,
      spAtk: 45,
      spDef: 65,
      speed: 55,
    });
    expect(item.statTotal).toBe(325);
    expect(item.training).toEqual({
      evYield: "1 Special Defense",
      catchRate: "45",
      baseFriendship: "50",
      baseExp: 65, // numeric string coerced to a number, unlike the other training fields
      growthRate: "Medium Fast",
    });
    expect(item.breeding).toEqual({
      eggGroups: ["Field"],
      genderRatio: "87.5% male, 12.5% female",
      eggCycles: "35",
    });
    expect(item.defenses).toEqual({
      weaknesses: ["Fighting"],
      resistances: ["Ghost"],
    });
    expect(item.evolution).toEqual({ from: undefined, to: ["Vaporeon"] });
  });

  it("collapses a genderless species' single gender-ratio span to one string", () => {
    const result = buildRawResult({
      [POKEMON_FIELDS.genderRatio]: "Genderless",
    });

    expect(mapPokemonResult(result).breeding.genderRatio).toBe("Genderless");
  });

  it("derives isBaseStage from evolvesFrom and treats evolvesTo as a (currently single-entry) array", () => {
    const baseStage = buildRawResult({
      [POKEMON_FIELDS.evolvesTo]: "Pikachu",
    });
    expect(mapPokemonResult(baseStage).isBaseStage).toBe(true);
    expect(mapPokemonResult(baseStage).evolution).toEqual({ from: undefined, to: ["Pikachu"] });

    const midChain = buildRawResult({
      [POKEMON_FIELDS.evolvesFrom]: "Pichu",
      [POKEMON_FIELDS.evolvesTo]: "Raichu",
    });
    expect(mapPokemonResult(midChain).isBaseStage).toBe(false);
    expect(mapPokemonResult(midChain).evolution).toEqual({ from: "Pichu", to: ["Raichu"] });

    const fullyEvolved = buildRawResult({
      [POKEMON_FIELDS.evolvesFrom]: "Gabite",
    });
    expect(mapPokemonResult(fullyEvolved).isBaseStage).toBe(false);
    expect(mapPokemonResult(fullyEvolved).evolution).toEqual({ from: "Gabite", to: [] });
  });

  it("leaves scalar fields undefined and types empty when missing or the wrong shape, instead of throwing", () => {
    const result = buildRawResult({
      [POKEMON_FIELDS.type]: 42, // wrong shape — should not be cast to a string
    });

    const item = mapPokemonResult(result);

    expect(item.types).toEqual([]);
    expect(item.generation).toBeUndefined();
    expect(item.imageUrl).toBeUndefined();
    expect(item.stats.hp).toBeUndefined();
    expect(item.training.baseExp).toBeUndefined();
    expect(item.breeding.genderRatio).toBeUndefined();
  });

  it("falls back to result.title when pokemonname is absent", () => {
    const result = buildRawResult({}, "Bulbasaur Pokédex: stats, moves, evolution & locations");

    expect(mapPokemonResult(result).name).toBe(
      "Bulbasaur Pokédex: stats, moves, evolution & locations",
    );
  });
});

describe("asNumber", () => {
  it("passes a finite number through unchanged", () => {
    expect(asNumber(45)).toBe(45);
    expect(asNumber(0)).toBe(0);
  });

  it("rejects NaN and Infinity", () => {
    expect(asNumber(Number.NaN)).toBeUndefined();
    expect(asNumber(Number.POSITIVE_INFINITY)).toBeUndefined();
    expect(asNumber(Number.NEGATIVE_INFINITY)).toBeUndefined();
  });

  it("parses a numeric string", () => {
    expect(asNumber("65")).toBe(65);
    expect(asNumber("3.5")).toBe(3.5);
  });

  it("returns undefined for a non-numeric string, blank string, or unrelated type", () => {
    expect(asNumber("Medium Fast")).toBeUndefined();
    expect(asNumber("")).toBeUndefined();
    expect(asNumber("   ")).toBeUndefined();
    expect(asNumber(undefined)).toBeUndefined();
    expect(asNumber(null)).toBeUndefined();
    expect(asNumber(["45"])).toBeUndefined();
    expect(asNumber({})).toBeUndefined();
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
