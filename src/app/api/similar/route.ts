import { NextResponse, type NextRequest } from "next/server";
import { escapeCaqlExactMatchValue } from "@/coveo/caqlExactMatch";
import { resolveServerCoveoConfig } from "@/coveo/config";
import { POKEMON_FIELDS } from "@/coveo/fields";
import { asNumber, asString, toStringArray, type PokemonStats } from "@/coveo/mapPokemonResult";
import { SEARCH_HUB } from "@/coveo/searchConfig";

const NUMBER_OF_RESULTS = 6;
const MAX_TYPES = 10;

/**
 * Backs the PDP "Similar Pokemon" carousel (SimilarPokemon.tsx) — ADR-0014
 * (Branch B): a deterministic same-type Search API v2 query, not a Content
 * Recommendation model (this org's ~1,200 all-time queries are far below
 * CR's ~10,000-query reliability threshold). See
 * docs/adr/0015-similar-pokemon-server-route.md for why this route exists at
 * all despite needing no privileged credential the way /api/token and
 * /api/passages do — in short, it avoids a second Headless controller on the
 * PDP's shared engine, not a secret it can't ship to the client.
 *
 * Calls the Search API v2 directly (not through Headless), so `raw` fields
 * beyond Coveo's default set (title, uri, ...) have to be requested
 * explicitly via `fieldsToInclude` — the client engine gets this for free
 * from `registerFieldsToInclude` (src/coveo/engine.ts), which this route has
 * no access to.
 */

interface SimilarPokemon {
  name: string;
  imageUrl: string;
  dexNumber: string;
  types: string[];
  stats: PokemonStats;
}

interface SimilarRequestBody {
  name?: unknown;
  types?: unknown;
}

/**
 * In-memory token bucket, per client IP — same pattern and single-instance
 * caveat as /api/passages/route.ts.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const buckets = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(clientId);

  if (!bucket || now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
    buckets.set(clientId, { count: 1, windowStart: now });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((entry) => typeof entry === "string" && entry.trim().length > 0)
  );
}

export async function POST(request: NextRequest) {
  const clientId = request.headers.get("x-forwarded-for") ?? "unknown";

  if (isRateLimited(clientId)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const config = resolveServerCoveoConfig();
  if (!config.configured || !config.organizationId || !config.apiKey) {
    return NextResponse.json(
      { error: "Coveo is not configured on the server (missing COVEO_API_KEY or org ID)." },
      { status: 503 },
    );
  }

  let body: SimilarRequestBody;
  try {
    body = (await request.json()) as SimilarRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.name !== "string" || body.name.trim().length === 0) {
    return NextResponse.json({ error: "`name` must be a non-empty string." }, { status: 400 });
  }
  if (!isNonEmptyStringArray(body.types)) {
    return NextResponse.json(
      { error: "`types` must be a non-empty array of non-empty strings." },
      { status: 400 },
    );
  }

  const escapedName = escapeCaqlExactMatchValue(body.name);
  if (escapedName === null) {
    return NextResponse.json({ error: "`name` contains unsupported characters." }, { status: 400 });
  }

  const escapedTypes: string[] = [];
  for (const type of body.types.slice(0, MAX_TYPES)) {
    const escaped = escapeCaqlExactMatchValue(type);
    if (escaped === null) {
      return NextResponse.json({ error: "`types` contains unsupported characters." }, { status: 400 });
    }
    escapedTypes.push(`"${escaped}"`);
  }
  const typeValues = escapedTypes.join(",");
  const aq = `@${POKEMON_FIELDS.type}==(${typeValues}) AND @${POKEMON_FIELDS.name}<>"${escapedName}"`;

  const upstream = await fetch(
    `https://platform.cloud.coveo.com/rest/search/v2?organizationId=${encodeURIComponent(config.organizationId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: "",
        aq,
        numberOfResults: NUMBER_OF_RESULTS,
        searchHub: SEARCH_HUB,
        fieldsToInclude: Object.values(POKEMON_FIELDS),
      }),
    },
  );

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Coveo Search API returned ${upstream.status}` },
      { status: upstream.status === 403 ? 403 : 502 },
    );
  }

  const payload = (await upstream.json()) as {
    results?: Array<{ raw?: Record<string, unknown>; title?: unknown }>;
  };

  const items: SimilarPokemon[] = (payload.results ?? [])
    .map((result): SimilarPokemon | undefined => {
      const raw = result.raw ?? {};
      const name = asString(raw[POKEMON_FIELDS.name]) ?? asString(result.title);
      const imageUrl = asString(raw[POKEMON_FIELDS.image]);
      const dexNumber = asString(raw[POKEMON_FIELDS.dexNumber]);

      // Every one of these should always be present on a real indexed
      // Pokemon document; a result missing one is dropped rather than
      // rendered with a fabricated placeholder value.
      if (!name || !imageUrl || !dexNumber) {
        return undefined;
      }

      return {
        name,
        imageUrl,
        dexNumber,
        types: toStringArray(raw[POKEMON_FIELDS.type]),
        stats: {
          hp: asNumber(raw[POKEMON_FIELDS.hp]),
          attack: asNumber(raw[POKEMON_FIELDS.attack]),
          defense: asNumber(raw[POKEMON_FIELDS.defense]),
          spAtk: asNumber(raw[POKEMON_FIELDS.spAtk]),
          spDef: asNumber(raw[POKEMON_FIELDS.spDef]),
          speed: asNumber(raw[POKEMON_FIELDS.speed]),
        },
      };
    })
    .filter((item): item is SimilarPokemon => item !== undefined);

  return NextResponse.json({ items });
}
