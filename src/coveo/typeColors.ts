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
