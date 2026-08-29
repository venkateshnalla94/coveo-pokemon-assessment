import { describe, expect, it } from "vitest";
import { configurationError, toApplicationError } from "@/coveo/applicationError";

describe("toApplicationError", () => {
  it("maps 401/403 to a non-recoverable AUTHENTICATION error", () => {
    for (const statusCode of [401, 403]) {
      const error = toApplicationError({ statusCode, message: "Invalid token", type: "InvalidTokenError" });
      expect(error.code).toBe("AUTHENTICATION");
      expect(error.recoverable).toBe(false);
      expect(error.message).toContain(String(statusCode));
    }
  });

  it("maps other status codes to a recoverable PROVIDER error", () => {
    const error = toApplicationError({ statusCode: 503, message: "Service unavailable", type: "ServiceUnavailable" });
    expect(error.code).toBe("PROVIDER");
    expect(error.recoverable).toBe(true);
    expect(error.message).toContain("503");
    expect(error.message).toContain("ServiceUnavailable");
  });

  it("maps an InvalidSortValueException to a recoverable INVALID_SORT error, not the generic PROVIDER catch-all", () => {
    const error = toApplicationError({
      statusCode: 400,
      message: 'Invalid sort criteria: "@pokemonname+ascending"',
      type: "InvalidSortValueException",
    });
    expect(error.code).toBe("INVALID_SORT");
    expect(error.recoverable).toBe(true);
    expect(error.userMessage).toBe("That sort option isn't available. Showing relevance instead.");
  });
});

describe("configurationError", () => {
  it("produces a non-recoverable CONFIGURATION error carrying the given message", () => {
    const error = configurationError("Missing organization ID");
    expect(error).toEqual({
      code: "CONFIGURATION",
      message: "Missing organization ID",
      userMessage: "Search isn't configured yet.",
      recoverable: false,
    });
  });
});
