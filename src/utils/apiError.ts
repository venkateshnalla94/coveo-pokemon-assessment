import { NextResponse } from "next/server";

/**
 * Closed-set response envelope for API routes — the HTTP-layer counterpart
 * to `src/coveo/applicationError.ts`'s normalized error typing
 * (`docs/standards-adoption.md` #8), so route handlers return a consistent
 * `{ error: { code, message } }` body instead of an ad-hoc `{ error: string }`.
 */
export type ApiErrorCode =
  | "INVALID_BODY"
  | "RATE_LIMITED"
  | "NOT_CONFIGURED"
  | "UPSTREAM_FAILURE";

export function jsonError(code: ApiErrorCode, message: string, status: number): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}
