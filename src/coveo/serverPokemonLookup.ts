import { cache } from "react";
import { escapeCaqlExactMatchValue } from "@/coveo/caqlExactMatch";
import { resolveServerCoveoConfig } from "@/coveo/config";
import { POKEMON_FIELDS } from "@/coveo/fields";
import { asString, toStringArray } from "@/coveo/mapPokemonResult";
import { SEARCH_HUB } from "@/coveo/searchConfig";

/**
 * Server-only Coveo Search API v2 reads backing SEO metadata generation
 * (src/app/pokemon/[name]/page.tsx's generateMetadata/notFound) and the
 * sitemap (src/app/sitemap.ts). Same fetch-to-platform.cloud.coveo.com
 * pattern, same COVEO_API_KEY trust boundary, as
 * src/app/api/similar/route.ts — see docs/adr/0019-server-rendered-seo-metadata-shim.md.
 *
 * Both exports are wrapped in React's cache() so a single request's
 * generateMetadata call and page-component render dedupe to one upstream
 * fetch rather than two.
 */

const SEARCH_API_URL = "https://platform.cloud.coveo.com/rest/search/v2";
const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

export interface PokemonMetadataSummary {
  name: string;
  types: string[];
  species: string | undefined;
  dexNumber: string | undefined;
  imageUrl: string | undefined;
}

/**
 * Resolves one Pokemon by exact name for metadata generation and the
 * server-side 404 check. Returns null — never throws — for every "not
 * found" reason (unconfigured server, a name containing structural CAQL
 * characters, an upstream error, or a genuine no-match), so callers can
 * treat null uniformly as "call notFound()".
 */
export const fetchPokemonMetadata = cache(
  async (name: string): Promise<PokemonMetadataSummary | null> => {
    const config = resolveServerCoveoConfig();
    if (!config.configured || !config.organizationId || !config.apiKey) {
      return null;
    }

    const escapedName = escapeCaqlExactMatchValue(name);
    if (escapedName === null) {
      return null;
    }

    let upstream: Response;
    try {
      upstream = await fetch(
        `${SEARCH_API_URL}?organizationId=${encodeURIComponent(config.organizationId)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: "",
            aq: `@${POKEMON_FIELDS.name}=="${escapedName}"`,
            numberOfResults: 1,
            searchHub: SEARCH_HUB,
            fieldsToInclude: [
              POKEMON_FIELDS.name,
              POKEMON_FIELDS.type,
              POKEMON_FIELDS.species,
              POKEMON_FIELDS.dexNumber,
              POKEMON_FIELDS.image,
            ],
          }),
        },
      );
    } catch {
      return null;
    }

    if (!upstream.ok) {
      return null;
    }

    const payload = (await upstream.json()) as {
      results?: Array<{ raw?: Record<string, unknown>; title?: unknown }>;
    };
    const result = payload.results?.[0];
    if (!result) {
      return null;
    }

    const raw = result.raw ?? {};
    const resultName = asString(raw[POKEMON_FIELDS.name]) ?? asString(result.title);
    if (!resultName) {
      return null;
    }

    return {
      name: resultName,
      types: toStringArray(raw[POKEMON_FIELDS.type]),
      species: asString(raw[POKEMON_FIELDS.species]),
      dexNumber: asString(raw[POKEMON_FIELDS.dexNumber]),
      imageUrl: asString(raw[POKEMON_FIELDS.image]),
    };
  },
);

/**
 * Lists every indexed Pokemon name for sitemap.ts. Paginated via
 * firstResult since the index (~1025 items) exceeds the Search API's
 * single-request page size; sorted by name so pagination is stable across
 * requests rather than relying on relevance ranking of an empty query.
 * Returns [] — never throws — when unconfigured, so an env-less build
 * (e.g. CI) doesn't fail generating the sitemap.
 */
export const fetchAllPokemonNames = cache(async (): Promise<string[]> => {
  const config = resolveServerCoveoConfig();
  if (!config.configured || !config.organizationId || !config.apiKey) {
    return [];
  }

  const names: string[] = [];
  let firstResult = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    let upstream: Response;
    try {
      upstream = await fetch(
        `${SEARCH_API_URL}?organizationId=${encodeURIComponent(config.organizationId)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: "",
            firstResult,
            numberOfResults: PAGE_SIZE,
            sortCriteria: `@${POKEMON_FIELDS.name} ascending`,
            searchHub: SEARCH_HUB,
            fieldsToInclude: [POKEMON_FIELDS.name],
          }),
        },
      );
    } catch {
      return names;
    }

    if (!upstream.ok) {
      return names;
    }

    const payload = (await upstream.json()) as {
      results?: Array<{ raw?: Record<string, unknown>; title?: unknown }>;
      totalCount?: number;
    };
    const results = payload.results ?? [];

    for (const result of results) {
      const name = asString(result.raw?.[POKEMON_FIELDS.name]) ?? asString(result.title);
      if (name) {
        names.push(name);
      }
    }

    firstResult += results.length;
    const totalCount = typeof payload.totalCount === "number" ? payload.totalCount : firstResult;
    if (results.length === 0 || firstResult >= totalCount) {
      break;
    }
  }

  return names;
});
