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
  species: "pokemonspecies",
  height: "pokemonheight",
  weight: "pokemonweight",
  abilities: "pokemonabilities",
  hp: "pokemonhp",
  attack: "pokemonattack",
  defense: "pokemondefense",
  spAtk: "pokemonspatk",
  spDef: "pokemonspdef",
  speed: "pokemonspeed",
  statTotal: "pokemonstattotal",
  evYield: "pokemonevyield",
  catchRate: "pokemoncatchrate",
  baseFriendship: "pokemonbasefriendship",
  baseExp: "pokemonbaseexp",
  growthRate: "pokemongrowthrate",
  eggGroups: "pokemonegggroups",
  genderRatio: "pokemongenderratio",
  eggCycles: "pokemoneggcycles",
  weaknesses: "pokemonweaknesses",
  resistances: "pokemonresistances",
  evolvesFrom: "pokemonevolvesfrom",
  evolvesTo: "pokemonevolvesto",
  evolvesFromImage: "pokemonevolvesfromimageurl",
  evolvesToImage: "pokemonevolvestoimageurl",
} as const;
