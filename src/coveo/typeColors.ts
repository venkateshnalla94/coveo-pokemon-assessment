/**
 * Community-standard Pokemon type color convention (used across fan
 * reference sites like Bulbapedia/pokemondb.net) — not an official
 * Nintendo/Pokemon Company brand asset, so it's safe for a publicly hosted
 * app. Colors are decorative reinforcement only: every place this is used
 * always pairs the dot with the type's text label, never color alone (see
 * DESIGN.md's Data Categories rule).
 */
const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};

/**
 * Returns undefined for unrecognized values (e.g. an unexpected raw field
 * shape) rather than a guessed color — callers must treat that as "no
 * indicator", not fall back to a wrong color.
 */
export function getTypeColor(typeName: string): string | undefined {
  return TYPE_COLORS[typeName.trim().toLowerCase()];
}

/**
 * Serializes TYPE_COLORS into `--type-<name>: <hex>;` custom-property
 * declarations, one source of truth (this file) instead of a second
 * hardcoded 18-entry list living in CSS. Emitted from a `<style>` tag in
 * `src/app/layout.tsx` (permitted by the CSP — see docs/EXECUTION-PLAN-v4's
 * §1). Per-element derived forms (glow/tint/edge) are computed downstream
 * with `color-mix()` against a `--type-primary`/`--type-secondary` pair set
 * as an inline `style`, not baked in here.
 */
export function typeCssVariables(): string {
  return Object.entries(TYPE_COLORS)
    .map(([type, hex]) => `--type-${type}: ${hex};`)
    .join(" ");
}

/**
 * Types whose solid fill clears 4.5:1 (WCAG AA, normal text) against white
 * (#FFFFFF). Computed with the standard WCAG relative-luminance formula, not
 * eyeballed — every other type falls back to the dark ink below. Note this
 * set is smaller than it might look at a glance: several mid-brightness
 * hues (water, psychic, flying, rock, bug, fairy...) read as "should be dark
 * enough for white text" but measure under 4.5:1, so they take the dark
 * fallback too.
 */
const WHITE_TEXT_TYPES = new Set(["fighting", "poison", "ghost", "dragon", "dark"]);

/**
 * Solid-fill badge text color for a given type — "#FFFFFF" or "#1A1C22",
 * whichever clears 4.5:1 contrast against that type's TYPE_COLORS hex. Every
 * one of the 18 pairs was checked against the WCAG contrast formula (not
 * eyeballed); see tests/unit/coveo/typeColors.test.ts for the full pairing.
 * Falls back to the dark ink for an unrecognized type name, matching
 * getTypeColor's "don't guess, but never actually leave text unreadable"
 * posture — this function's return type has no "unknown" arm, so a safe
 * default beats throwing.
 */
export function getTypeTextColor(typeName: string): "#FFFFFF" | "#1A1C22" {
  const normalized = typeName.trim().toLowerCase();
  return WHITE_TEXT_TYPES.has(normalized) ? "#FFFFFF" : "#1A1C22";
}

/**
 * The 18 real Pokemon types, capitalized to match the casing the indexed
 * `pokemontype` field actually returns (e.g. "Fire", not "fire"). A fixed,
 * closed, real taxonomy — not fabricated Pokemon data — so it's safe to
 * hardcode for static navigation (e.g. the home page's Browse-by-type
 * pills), unlike any actual Pokemon fact (name/stat/generation/etc.).
 */
export const POKEMON_TYPES: string[] = [
  "Normal",
  "Fire",
  "Water",
  "Electric",
  "Grass",
  "Ice",
  "Fighting",
  "Poison",
  "Ground",
  "Flying",
  "Psychic",
  "Bug",
  "Rock",
  "Ghost",
  "Dragon",
  "Dark",
  "Steel",
  "Fairy",
];
