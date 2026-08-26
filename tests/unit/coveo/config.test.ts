import { describe, expect, it } from "vitest";
import { resolveCoveoConfig, resolveServerCoveoConfig } from "@/coveo/config";

describe("resolveCoveoConfig", () => {
  it("is configured when the org ID is present", () => {
    const config = resolveCoveoConfig({
      environment: {
        NEXT_PUBLIC_COVEO_ORGANIZATION_ID: "myorg",
      },
    });

    expect(config).toEqual({
      configured: true,
      organizationId: "myorg",
    });
  });

  it("is not configured when the org ID is missing", () => {
    const config = resolveCoveoConfig({ environment: {} });
    expect(config.configured).toBe(false);
  });
});

describe("resolveServerCoveoConfig", () => {
  it("is configured when both org ID and the server-only API key are present", () => {
    const config = resolveServerCoveoConfig({
      environment: {
        NEXT_PUBLIC_COVEO_ORGANIZATION_ID: "myorg",
        COVEO_API_KEY: "xx-privileged-key",
      },
    });

    expect(config).toEqual({
      configured: true,
      organizationId: "myorg",
      apiKey: "xx-privileged-key",
    });
  });

  it.each([
    ["missing org ID", { COVEO_API_KEY: "xx-privileged-key" }],
    ["missing API key", { NEXT_PUBLIC_COVEO_ORGANIZATION_ID: "myorg" }],
    ["missing both", {}],
  ])("is not configured when %s", (_label, environment) => {
    const config = resolveServerCoveoConfig({ environment });
    expect(config.configured).toBe(false);
  });
});
