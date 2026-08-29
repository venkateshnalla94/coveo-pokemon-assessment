# 0009: Client-only, session-scoped Compare state — Favorites/"Add to team" dropped

Status: Accepted

## Context

The mockups (`docs/mockup-ui-analysis.md`) show three list-building features on the search results view: Favorites, "Add to team," and Compare. All three imply some notion of a saved, cross-visit selection — the natural, and in a consumer product the expected, implementation is a user account with server-side persistence.

ADR-0004 established there is no server layer in this app beyond the two narrow, already-justified exceptions (`/api/token` for search-token minting, `/api/passages` for Passage Retrieval — see ADR-0005/0008). Neither of those is a general-purpose data store, and adding one (a database, an auth flow, a user-scoped API route) purely to back a "favorites list" would be new backend surface with no other justification in this assessment — a scope expansion PRODUCT.md Principle 3 rules out, done to support a feature (Principle 4: no fabricated capability) that would otherwise have to fake persistence it doesn't have.

A `localStorage`-backed favorites list without an account was considered and rejected: `localStorage` persists indefinitely across tabs, restarts, and days, which reads to a user as "your saved list," not as transient UI state. Building that without ever telling the user it can vanish (a cache clear, a different device, a private window) would be a small, quiet misrepresentation of what's actually being stored — the same category of problem Principle 4 flags for fabricated data, applied to fabricated durability instead of fabricated content.

Compare is a different case. It needs no account and no new data: it's a client-side selection of Pokemon *names*, each of which is re-resolved through the same live Search API this app already calls for every other view. It's also a real, demonstrable Coveo-adjacent UX pattern (comparing search results side by side) worth showing to the panel, not a marketing flourish.

## Decision

- **Favorites and "Add to team": dropped entirely.** Neither is built in any form (not even a client-only stub) — there is no honest way to present either as more than transient tab state without implying an account, and re-labeling them as "temporary" would abandon the feature's actual point (a list you can come back to).
- **Compare: built, as session-scoped, names-only, client-only state.**
  - `CompareProvider` (`src/components/compare/CompareProvider.tsx`) holds a `string[]` of Pokemon names — never stats, images, or any other resolved field — capped at 4, in a React context mounted once in `src/app/layout.tsx`.
  - The selection is mirrored to `sessionStorage` (`src/coveo/compareStorage.ts`), not `localStorage`. `sessionStorage` is tab-scoped and cleared when the tab closes; that ceiling is the honest one for a feature with no account behind it, and it visibly (if implicitly, via disappearing on a fresh tab) tells the truth about how long the selection lasts, rather than `localStorage`'s open-ended persistence implying a durability the app doesn't actually provide.
  - All `sessionStorage` reads/writes are wrapped in `try`/`catch` (`readCompareNames`/`writeCompareNames`) — a private-browsing window that throws on storage access degrades to "nothing selected," not a broken page.
  - `/compare?names=A,B,C` (`src/app/compare/page.tsx`) treats the URL's names as the only durable input and re-runs one live query (`aq: @pokemonname==("A","B","C")`, the same exact-match pattern C2 already established on the detail page) on every load. The comparison table is built entirely from that response — never from anything cached alongside the names — so a stale or since-changed indexed value can never leak into the comparison (PRODUCT.md Principle 4).

## Consequences

- Compare selections don't survive a closed tab, a different device, or a different browser — by design. This is worse UX than a real account-backed list would be, and that tradeoff is accepted deliberately rather than incidentally.
- No new backend surface, no new privileged credential, no new ADR-0004 exception. `/compare` calls the same public search token every other client-side view already uses.
- If a future requirement genuinely needs cross-session persistence (a real "come back tomorrow and see your list" feature), that requires an account and a data store, which is a new architectural decision superseding this one, not an incremental change to `CompareProvider`.
- Favorites and "Add to team" are absent from the UI entirely, not present-but-disabled or hidden behind a flag — there's nothing half-built to explain to the panel.
