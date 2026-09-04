/**
 * Structural match for Headless's internal `SearchAPIErrorWithStatusCode`
 * (features/search/search-state.ts `SearchState.error`) — not exported from
 * the package's public entry point, so mirrored here rather than imported.
 */
export interface CoveoSearchApiError {
  statusCode: number;
  message: string;
  type: string;
}

/**
 * Normalized error shape so the UI can branch on a closed set of codes
 * instead of inspecting a raw Coveo error. See docs/standards-adoption.md #8.
 */
export type ApplicationErrorCode =
  | "AUTHENTICATION"
  | "CONFIGURATION"
  | "INVALID_SORT"
  | "PROVIDER"
  | "UNKNOWN";

export interface ApplicationError {
  code: ApplicationErrorCode;
  message: string;
  userMessage: string;
  recoverable: boolean;
}

/**
 * @param error - the `search.error` slice of Headless engine state
 * (`engine.state.search?.error`). `ResultListState`/`SearchStatusState` only
 * expose a `hasError` boolean, not the error detail, so callers that want a
 * specific code/message must read this from the engine state directly.
 */
export function toApplicationError(error: CoveoSearchApiError): ApplicationError {
  if (error.type === "InvalidSortValueException") {
    return {
      code: "INVALID_SORT",
      message: `Coveo returned ${error.statusCode} (${error.type}): ${error.message}`,
      userMessage: "That sort option isn't available. Showing relevance instead.",
      recoverable: true,
    };
  }

  if (error.statusCode === 401 || error.statusCode === 403) {
    return {
      code: "AUTHENTICATION",
      message: `Coveo returned ${error.statusCode}: ${error.message}`,
      userMessage: "Search is temporarily unavailable. Please try again shortly.",
      recoverable: false,
    };
  }

  return {
    code: "PROVIDER",
    message: `Coveo returned ${error.statusCode} (${error.type}): ${error.message}`,
    userMessage: "Search is temporarily unavailable. Please try again.",
    recoverable: true,
  };
}

export function configurationError(message: string): ApplicationError {
  return {
    code: "CONFIGURATION",
    message,
    userMessage: "Search isn't configured yet.",
    recoverable: false,
  };
}
