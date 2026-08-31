import { NextResponse, type NextRequest } from "next/server";
import { escapeCaqlExactMatchValue } from "@/coveo/caqlExactMatch";
import { resolveServerCoveoConfig } from "@/coveo/config";
import { SEARCH_HUB } from "@/coveo/searchConfig";

const MAX_QUERY_LENGTH = 500;
const MAX_PASSAGES = 3;

/**
 * Backs the Phase 5 (Bonus) "Ask about this Pokemon" UI (AskAboutPokemon.tsx)
 * — this route exists so the call can happen without shipping a privileged
 * key to the browser. Uses `COVEO_API_KEY`, not `COVEO_ML_API_KEY`: direct
 * testing against the live org found `POST /rest/search/v3/passages/retrieve`
 * needs `EXECUTE_QUERY` (the same privilege ordinary search uses), not
 * `ALLOW_CONTENT_PREVIEW` — a key with only content-preview got a 403 before
 * the request even resolved the pipeline, while a key with EXECUTE_QUERY got
 * past auth to a real "no CPR model" business error. This reverses ADR-0005's
 * original assumption; see docs/adr/0008-passage-retrieval-needs-execute-query-not-content-preview.md.
 *
 * The request body's real schema (confirmed by testing — `pipeline` isn't a
 * real field despite the rest of this app's search calls taking one;
 * scoping to a source/document uses `filter`, not `aq`/`cq`, both of which
 * are silently ignored) came from docs.coveo.com/en/o86c8334, not from
 * guessing against the Search API v2 shape used elsewhere in this repo.
 */

interface PassagesRequestBody {
  query?: unknown;
  pokemonName?: unknown;
}

/**
 * In-memory token bucket, per client IP. This only works for a single
 * running instance — on Vercel, each serverless invocation/region can get
 * its own memory, so this is a best-effort throttle, not a hard guarantee.
 * A real deployment protecting a paid ML feature would want a shared store
 * (e.g. Vercel KV / Upstash) instead; noted here rather than silently
 * pretending this scales.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
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

  let body: PassagesRequestBody;
  try {
    body = (await request.json()) as PassagesRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.query !== "string" || body.query.trim().length === 0) {
    return NextResponse.json({ error: "`query` must be a non-empty string." }, { status: 400 });
  }
  if (body.pokemonName !== undefined && typeof body.pokemonName !== "string") {
    return NextResponse.json({ error: "`pokemonName` must be a string when provided." }, { status: 400 });
  }

  const query = body.query.slice(0, MAX_QUERY_LENGTH);

  let filter: string | undefined;
  if (body.pokemonName) {
    const escapedName = escapeCaqlExactMatchValue(body.pokemonName);
    if (escapedName === null) {
      return NextResponse.json(
        { error: "`pokemonName` contains unsupported characters." },
        { status: 400 },
      );
    }
    filter = `@pokemonname=="${escapedName}"`;
  }

  const upstream = await fetch(
    `https://platform.cloud.coveo.com/rest/search/v3/passages/retrieve?organizationId=${encodeURIComponent(config.organizationId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        searchHub: SEARCH_HUB,
        maxPassages: MAX_PASSAGES,
        localization: { locale: "en-US", timezone: "America/New_York" },
        ...(filter ? { filter } : {}),
      }),
    },
  );

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Coveo Passage Retrieval returned ${upstream.status}` },
      { status: upstream.status === 403 ? 403 : 502 },
    );
  }

  const passages: unknown = await upstream.json();
  return NextResponse.json(passages);
}
