import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "@/utils/apiRateLimit";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    const limiter = createRateLimiter(60_000, 3);
    expect(limiter.isRateLimited("client-a")).toBe(false);
    expect(limiter.isRateLimited("client-a")).toBe(false);
    expect(limiter.isRateLimited("client-a")).toBe(false);
  });

  it("rate limits once a client exceeds the max within the window", () => {
    const limiter = createRateLimiter(60_000, 2);
    expect(limiter.isRateLimited("client-a")).toBe(false);
    expect(limiter.isRateLimited("client-a")).toBe(false);
    expect(limiter.isRateLimited("client-a")).toBe(true);
  });

  it("tracks separate buckets per client id", () => {
    const limiter = createRateLimiter(60_000, 1);
    expect(limiter.isRateLimited("client-a")).toBe(false);
    expect(limiter.isRateLimited("client-b")).toBe(false);
    expect(limiter.isRateLimited("client-a")).toBe(true);
    expect(limiter.isRateLimited("client-b")).toBe(true);
  });

  it("resets the bucket once the window elapses", () => {
    const limiter = createRateLimiter(60_000, 1);
    expect(limiter.isRateLimited("client-a")).toBe(false);
    expect(limiter.isRateLimited("client-a")).toBe(true);

    vi.advanceTimersByTime(60_001);

    expect(limiter.isRateLimited("client-a")).toBe(false);
  });

  it("gives each createRateLimiter() call its own independent bucket map", () => {
    const similarLimiter = createRateLimiter(60_000, 20);
    const passagesLimiter = createRateLimiter(60_000, 10);

    for (let i = 0; i < 10; i += 1) {
      passagesLimiter.isRateLimited("shared-ip");
    }
    expect(passagesLimiter.isRateLimited("shared-ip")).toBe(true);
    expect(similarLimiter.isRateLimited("shared-ip")).toBe(false);
  });
});
