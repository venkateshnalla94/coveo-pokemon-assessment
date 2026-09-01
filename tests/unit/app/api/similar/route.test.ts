import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/similar/route";

let ipCounter = 0;

/** Each call gets a fresh x-forwarded-for so the module-scoped rate-limit bucket doesn't leak across tests. */
function postRequest(body: unknown, ip = `1.2.3.${++ipCounter}`) {
  return new NextRequest("http://localhost/api/similar", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

function configureEnv() {
  vi.stubEnv("NEXT_PUBLIC_COVEO_ORGANIZATION_ID", "myorg");
  vi.stubEnv("COVEO_API_KEY", "xx-privileged-key");
}

describe("POST /api/similar", () => {
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

    const response = await POST(postRequest({ name: "Eevee", types: ["Normal"] }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: { code: "NOT_CONFIGURED", message: expect.any(String) },
    });
  });

  it("returns 400 with an INVALID_BODY error envelope on invalid JSON body", async () => {
    configureEnv();
    const request = new NextRequest("http://localhost/api/similar", {
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

  it("returns 400 when name is missing or empty", async () => {
    configureEnv();

    const missing = await POST(postRequest({ types: ["Normal"] }));
    expect(missing.status).toBe(400);
    await expect(missing.json()).resolves.toEqual({
      error: { code: "INVALID_BODY", message: expect.any(String) },
    });

    const empty = await POST(postRequest({ name: "   ", types: ["Normal"] }));
    expect(empty.status).toBe(400);
  });

  it("returns 400 when types is missing, empty, or not an array of non-empty strings", async () => {
    configureEnv();

    const missing = await POST(postRequest({ name: "Eevee" }));
    expect(missing.status).toBe(400);

    const empty = await POST(postRequest({ name: "Eevee", types: [] }));
    expect(empty.status).toBe(400);

    const notStrings = await POST(postRequest({ name: "Eevee", types: [1, 2] }));
    expect(notStrings.status).toBe(400);

    const blankEntry = await POST(postRequest({ name: "Eevee", types: ["Normal", "  "] }));
    expect(blankEntry.status).toBe(400);
  });

  it("returns 400 when name or types contains structural CAQL characters", async () => {
    configureEnv();

    const badName = await POST(postRequest({ name: "Eevee) OR @x==(y", types: ["Normal"] }));
    expect(badName.status).toBe(400);

    const badType = await POST(postRequest({ name: "Eevee", types: ["Normal", "@injected"] }));
    expect(badType.status).toBe(400);
  });

  it("builds an aq filter from types and name with embedded quotes escaped", async () => {
    configureEnv();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
    vi.stubGlobal("fetch", fetchMock);

    await POST(postRequest({ name: 'Mr. "Mime"', types: ["Psychic", 'Weird"Type'] }));

    const [, init] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.aq).toBe(
      '@pokemontype==("Psychic","Weird\\"Type") AND @pokemonname<>"Mr. \\"Mime\\""',
    );
    expect(sentBody.numberOfResults).toBe(6);
  });

  it("maps upstream results into the SimilarPokemon shape, dropping entries missing required fields", async () => {
    configureEnv();
    const results = [
      {
        title: "Flareon",
        raw: {
          pokemonname: "Flareon",
          pokemonimageurl: "https://img.pokemondb.net/sprites/flareon.png",
          pokemondexnumber: "136",
          pokemontype: ["Fire"],
          pokemonhp: 65,
          pokemonattack: 130,
          pokemonspeed: 65,
        },
      },
      {
        title: "Missing image",
        raw: {
          pokemonname: "NoImage",
          pokemondexnumber: "999",
        },
      },
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results }) }));

    const response = await POST(postRequest({ name: "Eevee", types: ["Fire"] }));
    const body = (await response.json()) as { items: Array<{ name: string; stats: { attack?: number } }> };

    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].name).toBe("Flareon");
    expect(body.items[0].stats.attack).toBe(130);
  });

  it("passes through a 403 from upstream as-is", async () => {
    configureEnv();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));

    const response = await POST(postRequest({ name: "Eevee", types: ["Normal"] }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: { code: "UPSTREAM_FAILURE", message: expect.any(String) },
    });
  });

  it("returns 502 for any other upstream failure", async () => {
    configureEnv();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const response = await POST(postRequest({ name: "Eevee", types: ["Normal"] }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: { code: "UPSTREAM_FAILURE", message: expect.any(String) },
    });
  });

  it("rate limits after RATE_LIMIT_MAX_REQUESTS requests from the same client within the window", async () => {
    configureEnv();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [] }) }));
    const sharedIp = "9.9.9.9";

    let lastResponse;
    for (let i = 0; i < 21; i += 1) {
      lastResponse = await POST(postRequest({ name: "Eevee", types: ["Normal"] }, sharedIp));
    }

    expect(lastResponse!.status).toBe(429);
    await expect(lastResponse!.json()).resolves.toEqual({
      error: { code: "RATE_LIMITED", message: expect.any(String) },
    });
  });
});
