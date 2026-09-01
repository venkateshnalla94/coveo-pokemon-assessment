import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/passages/route";

let ipCounter = 0;

/** Each call gets a fresh x-forwarded-for so the module-scoped rate-limit bucket doesn't leak across tests. */
function postRequest(body: unknown, ip = `1.2.3.${++ipCounter}`) {
  return new NextRequest("http://localhost/api/passages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

function configureEnv() {
  vi.stubEnv("NEXT_PUBLIC_COVEO_ORGANIZATION_ID", "myorg");
  vi.stubEnv("COVEO_API_KEY", "xx-privileged-key");
}

describe("POST /api/passages", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns 503 with a NOT_CONFIGURED error envelope when the server is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_COVEO_ORGANIZATION_ID", "");
    vi.stubEnv("COVEO_API_KEY", "");

    const response = await POST(postRequest({ query: "how does this evolve" }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: { code: "NOT_CONFIGURED", message: expect.any(String) },
    });
  });

  it("returns 400 with an INVALID_BODY error envelope on invalid JSON body", async () => {
    configureEnv();
    const request = new NextRequest("http://localhost/api/passages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `1.2.3.${++ipCounter}` },
      body: "not json",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: "INVALID_BODY", message: expect.any(String) },
    });
  });

  it("returns 400 when query is missing or empty", async () => {
    configureEnv();

    const missing = await POST(postRequest({}));
    expect(missing.status).toBe(400);
    await expect(missing.json()).resolves.toEqual({
      error: { code: "INVALID_BODY", message: expect.any(String) },
    });

    const empty = await POST(postRequest({ query: "   " }));
    expect(empty.status).toBe(400);
  });

  it("returns 400 when pokemonName is provided but not a string", async () => {
    configureEnv();

    const response = await POST(postRequest({ query: "evolve", pokemonName: 42 }));

    expect(response.status).toBe(400);
  });

  it("returns 400 when pokemonName contains structural CAQL characters", async () => {
    configureEnv();

    const response = await POST(postRequest({ query: "evolve", pokemonName: "Eevee) OR @x==(y" }));

    expect(response.status).toBe(400);
  });

  it("builds a filter from pokemonName with embedded quotes escaped", async () => {
    configureEnv();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
    vi.stubGlobal("fetch", fetchMock);

    await POST(postRequest({ query: "evolve", pokemonName: 'Mr. "Mime"' }));

    const [, init] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.filter).toBe('@pokemonname=="Mr. \\"Mime\\""');
  });

  it("omits filter when pokemonName is not provided", async () => {
    configureEnv();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
    vi.stubGlobal("fetch", fetchMock);

    await POST(postRequest({ query: "evolve" }));

    const [, init] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.filter).toBeUndefined();
  });

  it("truncates an overlong query before sending upstream", async () => {
    configureEnv();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
    vi.stubGlobal("fetch", fetchMock);

    await POST(postRequest({ query: "x".repeat(600) }));

    const [, init] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.query).toHaveLength(500);
  });

  it("passes through upstream JSON on success", async () => {
    configureEnv();
    const passages = { items: [{ text: "Eevee evolves with stones.", relevanceScore: 0.9 }] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => passages }));

    const response = await POST(postRequest({ query: "how does this evolve" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(passages);
  });

  it("passes through a 403 from upstream as-is", async () => {
    configureEnv();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));

    const response = await POST(postRequest({ query: "evolve" }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: { code: "UPSTREAM_FAILURE", message: expect.any(String) },
    });
  });

  it("returns 502 for any other upstream failure", async () => {
    configureEnv();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const response = await POST(postRequest({ query: "evolve" }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: { code: "UPSTREAM_FAILURE", message: expect.any(String) },
    });
  });

  it("rate limits after RATE_LIMIT_MAX_REQUESTS requests from the same client within the window", async () => {
    configureEnv();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) }));
    const sharedIp = "9.9.9.9";

    let lastResponse;
    for (let i = 0; i < 11; i += 1) {
      lastResponse = await POST(postRequest({ query: "evolve" }, sharedIp));
    }

    expect(lastResponse!.status).toBe(429);
    await expect(lastResponse!.json()).resolves.toEqual({
      error: { code: "RATE_LIMITED", message: expect.any(String) },
    });
  });
});
