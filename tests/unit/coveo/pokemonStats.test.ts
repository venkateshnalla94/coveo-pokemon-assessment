import { describe, expect, it } from "vitest";
import { MAX_BASE_STAT, STAT_ORDER } from "@/coveo/pokemonStats";
import type { PokemonStats } from "@/coveo/mapPokemonResult";

describe("pokemonStats", () => {
  it("uses the real in-game base-stat cap, not an invented scale", () => {
    expect(MAX_BASE_STAT).toBe(255);
  });

  it("orders the six stats HP/Attack/Defense/Sp.Atk/Sp.Def/Speed, matching pokemondb.net's own labels", () => {
    expect(STAT_ORDER).toEqual([
      { key: "hp", label: "HP" },
      { key: "attack", label: "Attack" },
      { key: "defense", label: "Defense" },
      { key: "spAtk", label: "Sp. Atk" },
      { key: "spDef", label: "Sp. Def" },
      { key: "speed", label: "Speed" },
    ]);
  });

  it("every entry's key is a real PokemonStats key", () => {
    const stats: PokemonStats = { hp: 1, attack: 1, defense: 1, spAtk: 1, spDef: 1, speed: 1 };
    for (const { key } of STAT_ORDER) {
      expect(Object.prototype.hasOwnProperty.call(stats, key)).toBe(true);
    }
  });
});
