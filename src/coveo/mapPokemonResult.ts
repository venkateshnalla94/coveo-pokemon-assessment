import type { Result } from "@coveo/headless";
import { POKEMON_FIELDS } from "@/coveo/fields";

/**
 * Local, UI-owned model. Components render this, never a raw Headless
 * `Result` — see docs/standards-adoption.md #10 (mapper boundary). If a
 * source field is renamed, only this function changes.
 */
export interface PokemonItem {
  id: string;
  name: string;
  imageUrl: string | undefined;
  types: string[];
  generation: string | undefined;
  species: string | undefined;
  height: string | undefined;
  weight: string | undefined;
  abilities: string[];
  hp: number | undefined;
  attack: number | undefined;
  defense: number | undefined;
  spAtk: number | undefined;
  spDef: number | undefined;
  speed: number | undefined;
  statTotal: number | undefined;
  evYield: string | undefined;
  catchRate: string | undefined;
  baseFriendship: string | undefined;
  baseExp: string | undefined;
  growthRate: string | undefined;
  eggGroups: string[];
  genderRatio: string[];
  eggCycles: string | undefined;
  weaknesses: string[];
  resistances: string[];
  evolvesFrom: string | undefined;
  evolvesTo: string | undefined;
  /** True when `evolvesFrom` is absent, meaning this is a base-stage Pokemon with no pre-evolution — not an extraction failure, see docs/coveo-source-spec.md's evolution-chart section. */
  isBaseStage: boolean;
}

export function mapPokemonResult(result: Result): PokemonItem {
  const evolvesFrom = asString(result.raw[POKEMON_FIELDS.evolvesFrom]);

  return {
    id: result.uniqueId,
    // `pokemonname` is the h1-extracted name (see C2). `?? result.title`
    // covers the (currently unindexed) case where the field is absent —
    // deliberate defensive fallback even though the Coveo source mapping
    // also overrides Title itself, because RGA citations and Query Suggest
    // candidates are built from a different code path that bypasses this
    // frontend mapper entirely (see docs/EXECUTION-PLAN.md C2).
    name: asString(result.raw[POKEMON_FIELDS.name]) ?? result.title,
    imageUrl: asString(result.raw[POKEMON_FIELDS.image]),
    types: toStringArray(result.raw[POKEMON_FIELDS.type]),
    generation: asString(result.raw[POKEMON_FIELDS.generation]),
    species: asString(result.raw[POKEMON_FIELDS.species]),
    height: asString(result.raw[POKEMON_FIELDS.height]),
    weight: asString(result.raw[POKEMON_FIELDS.weight]),
    abilities: toStringArray(result.raw[POKEMON_FIELDS.abilities]),
    hp: asNumber(result.raw[POKEMON_FIELDS.hp]),
    attack: asNumber(result.raw[POKEMON_FIELDS.attack]),
    defense: asNumber(result.raw[POKEMON_FIELDS.defense]),
    spAtk: asNumber(result.raw[POKEMON_FIELDS.spAtk]),
    spDef: asNumber(result.raw[POKEMON_FIELDS.spDef]),
    speed: asNumber(result.raw[POKEMON_FIELDS.speed]),
    statTotal: asNumber(result.raw[POKEMON_FIELDS.statTotal]),
    evYield: asString(result.raw[POKEMON_FIELDS.evYield]),
    catchRate: asString(result.raw[POKEMON_FIELDS.catchRate]),
    baseFriendship: asString(result.raw[POKEMON_FIELDS.baseFriendship]),
    baseExp: asString(result.raw[POKEMON_FIELDS.baseExp]),
    growthRate: asString(result.raw[POKEMON_FIELDS.growthRate]),
    eggGroups: toStringArray(result.raw[POKEMON_FIELDS.eggGroups]),
    genderRatio: toStringArray(result.raw[POKEMON_FIELDS.genderRatio]),
    eggCycles: asString(result.raw[POKEMON_FIELDS.eggCycles]),
    weaknesses: toStringArray(result.raw[POKEMON_FIELDS.weaknesses]),
    resistances: toStringArray(result.raw[POKEMON_FIELDS.resistances]),
    evolvesFrom,
    evolvesTo: asString(result.raw[POKEMON_FIELDS.evolvesTo]),
    isBaseStage: evolvesFrom === undefined,
  };
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

/**
 * `pokemontype` is a multi-value field and can arrive from the Search API in
 * more than one shape depending on how it's configured/returned:
 *  - a real array of strings (the expected multi-value-facet shape)
 *  - a single semicolon-joined string (seen when a field is misconfigured as
 *    plain "Facet" instead of "Multi-value facet" — see
 *    docs/EXECUTION-PLAN.md's "Multi-value types are silently dropped")
 *  - a single plain string (one type, e.g. Electric-only Pokemon)
 * Anything else (undefined, null, a number, ...) becomes an empty array —
 * this must never throw, since it feeds straight into rendering.
 */
export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  if (typeof value === "string") {
    return value
      .split(";")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  return [];
}
