# 0024: Fix regressed `dex-flavor` exclusion, add `sr-only` accessibility-boilerplate exclude (amends ADR-0020)

Status: Accepted

## Context

While checking `body` for noise ahead of the ADR-0023 work (via full-text keyword search, since Content Browser's Fields JSON and Quick View don't expose `body_text` — see ADR-0023's Findings), found that ADR-0020's alternate-form flavor-text exclusion had regressed on live `Pokedex - Test`: the heading exclude still worked (`"Cap Pikachu"` search → 0 results) but the paired table-content exclude did not (`"brimming with memories"`, a known Cap-variant phrase → still 1 result), even though the live Web Scraping Configuration JSON had both rules present and both independently verified valid against real fetched HTML via `lxml`.

## Findings

- Reordering the two ADR-0020 rules (div-exclude before h3-exclude, on the theory that `exclude` rules mutate the tree sequentially and the second rule was losing its anchor once the first ran) did not fix it — rebuilt and reverified, `"brimming with memories"` still returned 1 result.
- The fix that worked: replacing the two chained rules with a single rule anchored on a node that survives every other rule in the array — the *kept* base-species div — rather than chaining `following-sibling::` off nodes another rule in the same array also targets. This confirms the general lesson already logged in ADR-0020's own correction note: prefer a single expression anchored on a stable, un-excluded node over multi-rule chains through nodes that other rules in the same config also touch.
- Separately, while doing the same keyword-noise pass, found two more real noise sources unrelated to the flavor-text regression: `<a class="sr-only" href="#main">Skip to main content</a>` (an accessibility skip-link, first child of `<body>`, never caught by the existing `header`/`nav` excludes since it sits outside both) and a sibling `sr-only` search-label span. Confirmed via raw HTML grep: 2 occurrences, both pure boilerplate, nothing worth keeping.
- A third candidate — long dashed/piped lines in raw passage output — turned out to be expected, not noise: Coveo's HTML→text converter renders any `<table>` as ASCII borders, and the table producing them is the Pokédex-data `vitals-table` that ADR-0012 deliberately keeps (Type/Species/Height/Weight/Abilities). Not excludable without losing wanted data; left as-is.

## Decision

Replace ADR-0020's two `dex-flavor` rules with one consolidated range-based rule:

```json
{"type": "XPATH", "path": "//div[@id=\"dex-flavor\"]/following-sibling::h3[1]/following-sibling::div[1]/following-sibling::*[following-sibling::div[@id=\"dex-moves\"]]"}
```

Anchored on the kept base-species div (survives the rule array), rather than the previous two rules which chained off nodes each other targeted.

Add one new exclude rule, additive to ADR-0012's/ADR-0020's existing rules:

```json
{"type": "XPATH", "path": "//*[contains(@class,\"sr-only\")]"}
```

## Consequences

- Applied to `Pokedex - Test`'s Web Scraping Configuration (replacing the two old `dex-flavor` entries, adding the `sr-only` entry), rebuilt, reverified via search-API keyword checks: `"brimming with memories"` (cap-variant noise) → 0, `"Cap Pikachu"` (heading) → 0, `"Skip to main content"` → 0, `"roasts hard berries"` (real base-species flavor text) → 1/Pikachu, confirming both fixes and no collateral damage to content ADR-0012/0020 intended to keep.
- Ported to `Pokedex - Full` and confirmed live the same session, scoped checks via `@syssource=="Pokedex - Full"` — all passed.
- Both sources are caught up with each other as of this change; no further divergence between Test and Full on these rules.
- Requires the RGA/Semantic Encoder/CPR embeddings to pick up the corrected `body` content — bundled into the same off-cycle rebuild as ADR-0023, now confirmed complete.
