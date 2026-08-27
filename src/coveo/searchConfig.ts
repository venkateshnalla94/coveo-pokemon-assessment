/**
 * Single source of truth for the search hub / query pipeline names, shared
 * by the client engine (src/coveo/engine.ts) and the server-side token route
 * (src/app/api/token/route.ts). If these ever drift apart, ML features
 * (Query Suggest, RGA) silently no-op with no visible error anywhere — see
 * docs/EXECUTION-PLAN.md's "Top risks" table, `searchHub` ≠ `originLevel1`.
 *
 * Overridable via NEXT_PUBLIC_COVEO_SEARCH_HUB / NEXT_PUBLIC_COVEO_PIPELINE
 * so the value isn't only a hardcoded string someone has to remember to keep
 * in sync with the pipeline's Search Hub condition in the admin console. The
 * literal fallback below must still match whatever hub name is actually
 * associated to the `Pokedex` pipeline there.
 */
export const SEARCH_HUB =
  process.env.NEXT_PUBLIC_COVEO_SEARCH_HUB || "PokedexSearch";
export const PIPELINE = process.env.NEXT_PUBLIC_COVEO_PIPELINE || "Pokedex";
