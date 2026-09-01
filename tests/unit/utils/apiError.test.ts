import { describe, expect, it } from "vitest";
import { jsonError } from "@/utils/apiError";

describe("jsonError", () => {
  it("builds a { error: { code, message } } envelope with the given status", async () => {
    const response = jsonError("INVALID_BODY", "`name` must be a non-empty string.", 400);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: "INVALID_BODY", message: "`name` must be a non-empty string." },
    });
  });

  it.each([
    ["RATE_LIMITED", 429],
    ["NOT_CONFIGURED", 503],
    ["UPSTREAM_FAILURE", 502],
  ] as const)("carries the %s code through with status %d", async (code, status) => {
    const response = jsonError(code, "message", status);
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({
      error: { code, message: "message" },
    });
  });
});
