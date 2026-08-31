import { describe, expect, it } from "vitest";
import { resolveCoveoConfig, resolveServerCoveoConfig } from "@/coveo/config";

describe("resolveCoveoConfig", () => {
  it("is configured in direct mode when org ID and access token are both present", () => {
    const config = resolveCoveoConfig({
      environment: {
        NEXT_PUBLIC_COVEO_ORGANIZATION_ID: "myorg",
        NEXT_PUBLIC_COVEO_ACCESS_TOKEN: "xx-direct-token",
      },
    });

    expect(config).toEqual({
      configured: true,
      organizationId: "myorg",
      authMode: "direct",
      accessToken: "xx-direct-token",
    });
  });

  it("is not configured in direct mode (the default) when the access token is missing", () => {
    // authMode defaults to "direct" when NEXT_PUBLIC_COVEO_AUTH_MODE is unset — see
    // ADR-0007. A direct-mode client has no other way to authenticate, so org ID
    // alone isn't enough, unlike the pre-dual-auth-mode contract this replaces.
    const config = resolveCoveoConfig({
      environment: { NEXT_PUBLIC_COVEO_ORGANIZATION_ID: "myorg" },
    });

    expect(config.configured).toBe(false);
  });

  it("is configured in server mode with just the org ID — no client-side access token needed", () => {
    const config = resolveCoveoConfig({
      environment: {
        NEXT_PUBLIC_COVEO_ORGANIZATION_ID: "myorg",
        NEXT_PUBLIC_COVEO_AUTH_MODE: "server",
      },
    });

    expect(config).toEqual({
      configured: true,
      organizationId: "myorg",
      authMode: "server",
      accessToken: undefined,
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

  it("is configured with only the org ID — apiKey is optional here", () => {
    // configured deliberately doesn't require apiKey: COVEO_API_KEY is unset
    // entirely in "direct" client auth mode (ADR-0007). Each route checks
    // for it directly when it actually needs it.
    const config = resolveServerCoveoConfig({
      environment: { NEXT_PUBLIC_COVEO_ORGANIZATION_ID: "myorg" },
    });

    expect(config).toEqual({
      configured: true,
      organizationId: "myorg",
      apiKey: undefined,
    });
  });

  it.each([
    ["missing org ID", { COVEO_API_KEY: "xx-privileged-key" }],
    ["missing both", {}],
  ])("is not configured when %s", (_label, environment) => {
    const config = resolveServerCoveoConfig({ environment });
    expect(config.configured).toBe(false);
  });
});
