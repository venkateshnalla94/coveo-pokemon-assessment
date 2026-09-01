/**
 * Formalizes the manual `typeof`/type-guard checks the API routes already
 * did inline. Not a schema library (no zod dependency, per
 * docs/EXECUTION-PLAN-quick-improvements.md's decision) — just the small set
 * of field-level validators these routes actually need, each returning a
 * discriminated result a route turns into `jsonError("INVALID_BODY", ...)`.
 */
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string };

export function requireNonEmptyString(value: unknown, fieldName: string): ValidationResult<string> {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { ok: false, message: `\`${fieldName}\` must be a non-empty string.` };
  }
  return { ok: true, value };
}

export function requireNonEmptyStringArray(
  value: unknown,
  fieldName: string,
): ValidationResult<string[]> {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    !value.every((entry) => typeof entry === "string" && entry.trim().length > 0)
  ) {
    return {
      ok: false,
      message: `\`${fieldName}\` must be a non-empty array of non-empty strings.`,
    };
  }
  return { ok: true, value };
}

export function optionalString(
  value: unknown,
  fieldName: string,
): ValidationResult<string | undefined> {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }
  if (typeof value !== "string") {
    return { ok: false, message: `\`${fieldName}\` must be a string when provided.` };
  }
  return { ok: true, value };
}
