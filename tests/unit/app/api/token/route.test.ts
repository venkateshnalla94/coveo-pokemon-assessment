import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/token/route";

describe("GET /api/token", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns 503 when the server is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_COVEO_ORGANIZATION_ID", "");
    vi.stubEnv("COVEO_API_KEY", "");

    const response = await GET();

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toMatch(/COVEO_API_KEY|org ID/);
  });

  it("mints a token and echoes the org ID on a successful upstream response", async () => {
    vi.stubEnv("NEXT_PUBLIC_COVEO_ORGANIZATION_ID", "myorg");
    vi.stubEnv("COVEO_API_KEY", "xx-privileged-key");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: "minted-token" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ token: "minted-token", organizationId: "myorg" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://platform.cloud.coveo.com/rest/search/token",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer xx-privileged-key" }),
      }),
    );
  });

  it("returns 502 when the upstream token endpoint fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_COVEO_ORGANIZATION_ID", "myorg");
    vi.stubEnv("COVEO_API_KEY", "xx-privileged-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const response = await GET();

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toMatch(/500/);
  });
});
