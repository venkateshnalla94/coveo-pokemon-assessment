/**
 * Single source of truth for the search hub / query pipeline names, shared
 * by the client engine (src/coveo/engine.ts) and the server-side token route
 * (src/app/api/token/route.ts). If these ever drift apart, ML features
 * (Query Suggest, RGA) silently no-op with no visible error anywhere — see
 * docs/EXECUTION-PLAN.md's "Top risks" table, `searchHub` ≠ `originLevel1`.
 */
export const SEARCH_HUB = "PokedexSearch";
export const PIPELINE = "Pokedex";
