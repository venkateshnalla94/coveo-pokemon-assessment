/**
 * Field names extracted by the Coveo source's Web Scraping Configuration.
 * Must stay in sync with docs/coveo-source-spec.md — the source config and
 * this frontend are two halves of the same contract.
 */
export const POKEMON_FIELDS = {
  type: "pokemontype",
  generation: "pokemongeneration",
  image: "pokemonimageurl",
  name: "pokemonname",
  dexNumber: "pokemondexnumber",
} as const;
