import type { PokemonStats } from "@/coveo/mapPokemonResult";

/**
 * Display metadata for the stat panel, kept out of components so the
 * ordering and labels have one home — see
 * docs/EXECUTION-PLAN-v2.3-frontend.md §2.3.
 */

/** The real in-game base-stat cap (Blissey's HP) — the bar's full width, not an invented scale. */
export const MAX_BASE_STAT = 255;

/** Labels match pokemondb.net's own, so nothing is renamed relative to the source. */
export const STAT_ORDER: { key: keyof PokemonStats; label: string }[] = [
  { key: "hp", label: "HP" },
  { key: "attack", label: "Attack" },
  { key: "defense", label: "Defense" },
  { key: "spAtk", label: "Sp. Atk" },
  { key: "spDef", label: "Sp. Def" },
  { key: "speed", label: "Speed" },
];
