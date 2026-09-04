# 0023: Post-conversion `body_text` extension grounding weakness/resistance facts for RGA (refines ADR-0012)

Status: Accepted

## Context

Live testing found RGA returning zero citations and no answer for a query like "tell me about pikachu weakness," despite chunks being sent to the LLM. `docs.coveo.com`'s CPR documentation states a CPR model creates embeddings only for the content in an item's `body` — never metadata fields. `pokemonweaknesses`/`pokemonresistances` (and their `*raw` sources) are metadata fields, and ADR-0012 additionally excluded the Type-defenses grid from `body` outright, reasoning the fact was "already captured structurally" in those metadata fields. That reasoning holds for faceting; it does not hold for RGA/CPR, which cannot read metadata at all. The fact existed correctly on every item with nowhere for RGA to cite it from.

## Findings

- Confirmed via `docs.coveo.com` (CPR model docs): embeddings are body-only.
- Three approaches tried and rejected before the working one (kept here so they aren't retried):
  1. postConversion, writing to `body_text` after `.encode('utf-8')` — silently produced nothing. `body_text.read()`/`.write()` operate on plain `str`, not `bytes` (`docs.coveo.com/en/34`, the precise Document Object API reference — more authoritative on this point than the general `/en/2749` guide, whose own example is inconsistent with it).
  2. preConversion, re-parsing `documentdata` (raw HTML) to reconstruct the grid — `document.log()` showed `documentdata` already had zero occurrences of `type-table-pokedex` at pre-conversion, because Web Scraping Configuration `exclude` rules apply at the crawl/parse step, before either IPE stage runs. Re-parsing raw HTML is a dead end for anything an `exclude` rule already stripped.
  3. postConversion, reading the raw metadata fields but calling `.decode('utf-8', errors='ignore')` on the read — `body_text.read()` is already a `str`; `.decode()` on a `str` raises `AttributeError`, silently swallowed by a broad `except`.
- All three failures were only diagnosed via `document.log()` instrumentation — a clean run with no visible error is not evidence an extension worked; the extension's own "usage statistics" panel is also unreliable (observed 0 executions logged for an independently-confirmed-working extension).
- The only reliable verification method is a real keyword search (`POST /rest/search/v2`) for a phrase only the new sentence could produce, checked against `totalCount` — Content Browser's Fields/Metadata JSON view never includes `body`, and Quick View renders `body_html`, not `body_text`.

## Decision

New extension, `Pokemon Type Effectiveness` (Content → Extensions), **postConversion**, data access = Body text only, added as a separate extension object from the existing `Derive Pokemon Generation` / weaknesses-resistances IPE pair (kept separate deliberately, to avoid touching a known-working extension). Reads `pokemonweaknessesraw`/`pokemonresistancesraw`, splits each raw title string (e.g. `"Electric → Dragon/Ground = no effect"`) into type name + effect phrase, buckets into weak (`super-effective`) / resist (`not very effective`) / immune (`no effect`) — recovering the immune/resist distinction that `pokemonweaknesses`/`pokemonresistances` collapse (both 0.5×/0.25× resist and 0× immune land in `pokemonresistances`) — and appends one plain-string sentence to `body_text`. No `.encode()`/`.decode()` anywhere in the read/write path.

Attached to `Pokedex - Test` first, verified, then ported to `Pokedex - Full` the same session.

## Consequences

- `body_text` now carries a synthesized sentence, not verbatim crawled prose — still governed by the no-fabricated-data principle (`CLAUDE.md`/`PRODUCT.md`) because every fact in it is derived directly from the same real per-type multiplier data already extracted and faceted, not invented.
- Requires the RGA/Semantic Encoder/CPR embeddings to be rebuilt against the new `body` content to be citable — bundled into the same off-cycle rebuild request already in flight (see `docs/handoff/STATE.md`), not a separate ask.
- A live RGA answer for "what is pikachu weak against" fabricated two extra weaknesses (Bug, Ghost) beyond the grounded "Ground" fact, on top of an otherwise-correct citation. Root-caused via Chunk Inspector on the actual search ID: a retrieval miss on the stale (pre-rebuild) embedding pool, not a flaw in the grounded sentence itself — the correct chunk existed in `body` but the embedding store hadn't picked it up yet. Resolved once the off-cycle rebuild completed and the embedding pool caught up with the new `body_text`; re-verified via Chunk Inspector showing the new sentence as the cited chunk with no fabricated types in the answer.
- If a future retrieval-miss pattern recurs *after* an embedding pool is confirmed current, that's a distinct, not-yet-seen failure mode (e.g. a genuine prompt-grounding gap) and would need its own investigation — this ADR only covers the stale-embedding case actually observed.
