import { NextResponse } from "next/server";
import { resolveServerCoveoConfig } from "@/coveo/config";
import { PIPELINE, SEARCH_HUB } from "@/coveo/searchConfig";

/**
 * Mints a short-lived Coveo search token server-side, using the privileged
 * `COVEO_API_KEY` (never sent to the client — see .env.example and
 * docs/adr/0005-server-token-and-passage-routes.md). The client engine
 * (src/coveo/engine.ts) calls this route via `renewAccessToken`, so the
 * browser never sees a long-lived credential, only a token scoped and
 * time-boxed by the Search API itself.
 *
 * Endpoint: the plan flags `/rest/search/token` vs `/rest/search/v2/token`
 * as unverified in Coveo's docs (docs/EXECUTION-PLAN.md "Unverified"). This
 * implements the documented default, `/rest/search/token`; if the org
 * rejects it, try `/rest/search/v2/token` instead (same request/response
 * shape as of writing).
 */
export async function GET() {
  const config = resolveServerCoveoConfig();

  if (!config.configured || !config.organizationId || !config.apiKey) {
    return NextResponse.json(
      { error: "Coveo is not configured on the server (missing COVEO_API_KEY or org ID)." },
      { status: 503 },
    );
  }

  const upstream = await fetch("https://platform.cloud.coveo.com/rest/search/token", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      organizationId: config.organizationId,
      searchHub: SEARCH_HUB,
      pipeline: PIPELINE,
    }),
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Coveo token endpoint returned ${upstream.status}` },
      { status: 502 },
    );
  }

  const body = (await upstream.json()) as { token: string };

  return NextResponse.json({
    token: body.token,
    organizationId: config.organizationId,
  });
}
