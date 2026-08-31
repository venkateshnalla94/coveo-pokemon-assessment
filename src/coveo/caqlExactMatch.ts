const STRUCTURAL_CAQL_CHARS = /[@()]/;

/**
 * Escapes a value for use inside a CAQL exact-match expression
 * (`@field=="value"`). Returns null if the value contains `@`, `(`, or `)` —
 * characters that can alter the expression's structure (add a clause, open a
 * new field reference) rather than just its literal content. Coveo's query
 * language has no parameterized-query API, so this allowlist check, not just
 * quote-escaping, is what stops a crafted value from injecting a second
 * clause into a query built with a privileged server key.
 */
export function escapeCaqlExactMatchValue(value: string): string | null {
  if (STRUCTURAL_CAQL_CHARS.test(value)) {
    return null;
  }
  return value.replace(/"/g, '\\"');
}
