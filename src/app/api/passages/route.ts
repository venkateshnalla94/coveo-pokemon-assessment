import { NextResponse, type NextRequest } from "next/server";
import { resolveServerCoveoConfig } from "@/coveo/config";
import { PIPELINE, SEARCH_HUB } from "@/coveo/searchConfig";

const MAX_QUERY_LENGTH = 500;

/**
 * Groundwork for the Phase 5 (Bonus) "Ask about this Pokemon" UI — this
 * route exists so that call can happen without ever shipping the
 * ML-privileged `COVEO_ML_API_KEY` to the browser (Passage Retrieval
 * requires the "Allow content preview" privilege, which is unsafe in client
 * JS — see docs/adr/0005-server-token-and-passage-routes.md). Deliberately a
 * separate key from `COVEO_API_KEY` (used by /api/token) — see
 * src/coveo/config.ts for why one key can no longer cover both. No UI
 * consumes this route yet.
 */

interface PassagesRequestBody {
  query?: unknown;
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
  if (!config.configured || !config.organizationId || !config.mlApiKey) {
    return NextResponse.json(
      { error: "Coveo is not configured on the server (missing COVEO_ML_API_KEY or org ID)." },
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

  const query = body.query.slice(0, MAX_QUERY_LENGTH);

  const upstream = await fetch(
    `https://platform.cloud.coveo.com/rest/search/v3/passages/retrieve?organizationId=${encodeURIComponent(config.organizationId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.mlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        searchHub: SEARCH_HUB,
        pipeline: PIPELINE,
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
