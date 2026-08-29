import type { Result } from "@coveo/headless";
import { POKEMON_FIELDS } from "@/coveo/fields";

/**
 * Local, UI-owned model. Components render this, never a raw Headless
 * `Result` — see docs/standards-adoption.md #10 (mapper boundary). If a
 * source field is renamed, only this function changes.
 */
export interface PokemonStats {
  hp?: number;
  attack?: number;
  defense?: number;
  spAtk?: number;
  spDef?: number;
  speed?: number;
}

export interface PokemonItem {
  id: string;
  name: string;
  imageUrl: string | undefined;
  types: string[];
  generation: string | undefined;
  dexNumber: string | undefined;
  species: string | undefined;
  height: string | undefined;
  weight: string | undefined;
  abilities: string[];
  stats: PokemonStats;
  statTotal: number | undefined;
  training: {
    evYield?: string;
    catchRate?: string;
    baseFriendship?: string;
    baseExp?: number;
    growthRate?: string;
  };
  breeding: {
    eggGroups: string[];
    /**
     * `pokemongenderratio` is multi-value at the source (two `<span>`s for a
     * normal species — e.g. "50% male" / "50% female" — collapsing to one
     * for a genderless species; see docs/coveo-source-spec.md). Parsed with
     * `toStringArray()` like every other multi-value field and joined into
     * one display string here, rather than read with `asString()`, which
     * would silently drop the common two-value case.
     */
    genderRatio?: string;
    eggCycles?: string;
  };
  defenses: { weaknesses: string[]; resistances: string[] };
  evolution: {
    from?: string;
    /**
     * `pokemonevolvesto` is a single-value string at the source, and a
     * branching evolution (e.g. Pikachu → Raichu / Alolan Raichu) only ever
     * captures the first branch in document order — a documented, accepted
     * simplification at the extraction layer (docs/coveo-source-spec.md),
     * not something this array typing fixes on its own. `to` is still typed
     * and parsed as an array via `toStringArray()`, matching `types` /
     * `abilities`, so this stays correct if the source selector is ever
     * upgraded to capture every branch.
     */
    to: string[];
  };
  /** True when `evolvesFrom` is absent, meaning this is a base-stage Pokemon with no pre-evolution — not an extraction failure, see docs/coveo-source-spec.md's evolution-chart section. */
  isBaseStage: boolean;
}

export function mapPokemonResult(result: Result): PokemonItem {
  const evolvesFrom = asString(result.raw[POKEMON_FIELDS.evolvesFrom]);
  const genderRatioParts = toStringArray(result.raw[POKEMON_FIELDS.genderRatio]);

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
    dexNumber: asString(result.raw[POKEMON_FIELDS.dexNumber]),
    species: asString(result.raw[POKEMON_FIELDS.species]),
    height: asString(result.raw[POKEMON_FIELDS.height]),
    weight: asString(result.raw[POKEMON_FIELDS.weight]),
    abilities: toStringArray(result.raw[POKEMON_FIELDS.abilities]),
    stats: {
      hp: asNumber(result.raw[POKEMON_FIELDS.hp]),
      attack: asNumber(result.raw[POKEMON_FIELDS.attack]),
      defense: asNumber(result.raw[POKEMON_FIELDS.defense]),
      spAtk: asNumber(result.raw[POKEMON_FIELDS.spAtk]),
      spDef: asNumber(result.raw[POKEMON_FIELDS.spDef]),
      speed: asNumber(result.raw[POKEMON_FIELDS.speed]),
    },
    statTotal: asNumber(result.raw[POKEMON_FIELDS.statTotal]),
    training: {
      evYield: asString(result.raw[POKEMON_FIELDS.evYield]),
      catchRate: asString(result.raw[POKEMON_FIELDS.catchRate]),
      baseFriendship: asString(result.raw[POKEMON_FIELDS.baseFriendship]),
      baseExp: asNumber(result.raw[POKEMON_FIELDS.baseExp]),
      growthRate: asString(result.raw[POKEMON_FIELDS.growthRate]),
    },
    breeding: {
      eggGroups: toStringArray(result.raw[POKEMON_FIELDS.eggGroups]),
      genderRatio: genderRatioParts.length > 0 ? genderRatioParts.join(", ") : undefined,
      eggCycles: asString(result.raw[POKEMON_FIELDS.eggCycles]),
    },
    defenses: {
      weaknesses: toStringArray(result.raw[POKEMON_FIELDS.weaknesses]),
      resistances: toStringArray(result.raw[POKEMON_FIELDS.resistances]),
    },
    evolution: {
      from: evolvesFrom,
      to: toStringArray(result.raw[POKEMON_FIELDS.evolvesTo]),
    },
    isBaseStage: evolvesFrom === undefined,
  };
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/**
 * Never-throw numeric coercion: a real `number` passes through unless it's
 * `NaN`/`Infinity`/`-Infinity` (Coveo's Search API should never send these
 * for an Integer field, but a broken IPE or misconfigured field could); a
 * numeric string (e.g. a stray `"45"` returned as text) is parsed; anything
 * else — missing field, non-numeric string, object, etc. — becomes
 * `undefined` rather than `NaN` leaking into a stat bar or table.
 */
export function asNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
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
