# Improvement opportunities

Every item below was observed directly in the code or `docs/HANDOFF.md` this session — nothing here is invented or speculative. Ordered roughly by cost/impact for a panel audience, not by severity.

## 1. Rate limiter on `/api/passages` is per-instance, not shared (real, currently-shipped limitation)

`src/app/api/passages/route.ts` throttles with an in-memory `Map` (`buckets`) — 10 requests/minute per client IP. The route's own comment is explicit about the limitation: on Vercel, each serverless invocation/region can get its own memory, so this is a best-effort throttle against a single instance, not a hard guarantee across a real deployment. A production deployment protecting a paid ML feature would want a shared store (Vercel KV / Upstash Redis) instead.

**Why it matters:** this is the one piece of infrastructure standing between the public internet and metered Coveo ML calls. Worth flagging as a known gap before a wider launch, not something to present as already solved.

## 2. Resolved this session — was: `pokemonname` lacked "Sortable" in the admin console

Previously, `src/coveo/sortOptions.ts` had removed "Name A-Z" entirely after live-testing showed it 400'd the Search API (`InvalidSortValueException`). Fixed in the tenth session: `pokemonname` (plus the base-stat fields) now has "Sortable" enabled in the admin console, "Name A-Z" and a Speed sort are both back, and `deriveSearchRenderState`/`SearchSummaryBar.tsx` now degrade an unsortable-field selection to a small inline notice instead of blanking the whole page if this class of gap recurs for a future field — see [`02-search-page.md`](02-search-page.md). Left here as a record that this was a real, previously-shipped limitation, not silently forgotten.

## 3. `GeneratedAnswer` regeneration on facet change — an open design question, not yet decided on purpose

`docs/inspiration-from-coveo-assesment.md` (item 4) flags this as investigated but unresolved: `GeneratedAnswer.tsx` subscribes to Headless's native `buildGeneratedAnswer` controller directly, so its regeneration behavior is governed entirely by the engine's search-execution cycle — which a facet toggle on `/search` does trigger. Whether the RGA box regenerating every time a user clicks a facet is the *wanted* UX (vs. debouncing it, or freezing the answer once a query is answered) hasn't been decided on purpose; it's just whatever Headless's default composition produces.

**Why it matters:** RGA regenerating unexpectedly mid-facet-browsing is a real, visible-in-a-live-demo behavior worth deciding on purpose rather than leaving as an accident of composition.

## 4. Deferred features (already scoped, not silent gaps)

Per the v2.3 plan's own §9 and `docs/HANDOFF.md`: the full branching evolution chain (Eevee-style — the source extraction only captures the first branch in document order, a documented crawler-selector limitation, not a frontend gap), an Evolution Stage facet (needs a new Inline Page Extension), and a Habitat facet (no honest small-vocabulary source field exists to back one). All of these were deliberately scoped out rather than overlooked — worth naming to an audience so "why isn't X built" has a real answer on hand.

**Resolved, no longer deferred:** the "Similar Creatures"/RelatedPokemon tab this item used to list as deferred shipped in the twentieth session as `SimilarPokemon.tsx`, a carousel backed by a new `/api/similar` route rather than a second query source sharing the page's main engine — exactly the architectural workaround this item predicted would be needed. See ADR-0014 (which ML capability, if any, backs it) and ADR-0015 (why a server route).

## 5. Two auth-mode code paths maintained side by side — an org/licensing constraint, not an app design choice

`src/coveo/engine.ts` and `src/coveo/config.ts` maintain both `direct` (live today) and `server` (fully built, unused) auth modes because this org's console currently cannot issue an API key with the `Impersonate`-under-`SEARCH_API` privilege that server-minted search tokens require (confirmed via Coveo's own privilege-introspection endpoint — ADR-0007). `direct` mode ships a static, scope-limited API key to the browser; it's safe (an "Anonymous search"-purpose key is documented as designed for exactly this), but it's not the pattern Coveo's own production guidance generally leads with for a hosted, long-lived app.

**Why it matters:** worth stating plainly to executives as an org/plan-tier constraint discovered during the build, not an architectural shortcut this project chose gratuitously — and worth knowing that switching to the more conventional server-minted-token pattern the moment a compatible key exists is a one-line env var change, not a rebuild.

## 6. What's already well-aligned with Coveo's own documented patterns (worth stating, not just gaps)

- Every controller in the app (`buildFacet`, `buildSort`, `buildGeneratedAnswer`, `buildUrlManager`, etc.) is the real, installed `@coveo/headless` controller, confirmed against the package's own `.d.ts` files during the build sessions — no hand-rolled reimplementation of anything Headless already provides. This was an explicit, enforced standing rule mid-project (`docs/HANDOFF.md`'s "Standing instruction" note), not incidental.
- `useSyncExternalStore` for controller-state subscription (`src/coveo/useControllerState.ts`) is the React-recommended mechanism for exactly this class of external-store integration — adopted after a real crash surfaced the naive `subscribe()` + `useEffect` pattern's failure mode, not adopted speculatively.
- The mapper boundary (`mapPokemonResult`) means every component renders a stable local model, never a raw Headless `Result` — if a source field is ever renamed, only one function changes.
- Discriminated-union render states (`searchRenderState.ts`, `generatedAnswerRenderState.ts`) mean a component structurally cannot render "loading" and stale results simultaneously, or conflate "zero results" with "Coveo errored."
- `/search`'s facets are, as of the tenth session, a deliberate mix rather than a uniform pattern applied blindly: 5 of 7 use Coveo's real Automatic Facet Generation (`buildAutomaticFacetGenerator`) — structurally immune to the facetId-collision class described below — while Speed (numeric) and Abilities (needs facet-search) stay hand-built for concrete, sourced reasons rather than by default. See `docs/adr/0011-automatic-facet-generation-on-search-page.md`.

## 7. Test coverage gap: controller-ordering sequencing has no dedicated regression test

The `SearchUrlSync`-before-`SearchBox` render-order dependency described in [`02-search-page.md`](02-search-page.md) is currently correct only because of JSX ordering in `SearchPageContent` — there's no automated test that would fail if a future edit reordered those two components. `docs/HANDOFF.md` flags two specific e2e specs as written-but-not-yet-added: compare-selection-survives-navigation, and deep-linked-facet-URL-restores-state on a cold load. Both would exercise this ordering indirectly.

**Why it matters:** this is exactly the kind of regression that wouldn't show up in a typecheck or unit test — only a live browser e2e run or careful manual QA would catch a reordering that silently breaks deep-linked search URLs.

## 8. Resolved this session, but the pattern is worth remembering for any future controller

Every manual `buildFacet`/`buildNumericFacet` call on this persistent, page-lifetime engine singleton now pins an explicit `facetId` (`facetId: field`) — not because it's a nicer API, but because Headless's `registerFacet` reducer is a permanent no-op once an id exists (there's no deregister call, only `disable()`, which doesn't remove the registration). Without a pinned id, remounting a facet component (e.g. navigating `/search` → PDP → back) silently accumulated duplicate registrations under auto-suffixed ids and eventually crashed React with a duplicate-key error in the breadcrumb bar. Fixed this session (`docs/adr/0011-automatic-facet-generation-on-search-page.md`), and the same discipline should apply to any *new* controller built with a caller-supplied id on this architecture — it's not specific to facets, it's specific to "controller with an explicit identity, on an engine that outlives the component."

## Out of scope for this list

The two presentation decks and confirming the Phase 0 org-enablement email/off-cycle ML-rebuild request were sent are real open items (`docs/HANDOFF.md` "What's next") but are delivery/operations tasks, not architecture gaps — they're intentionally not repeated here. (Vercel deployment, previously listed here as open, has been live since the eighteenth session.)
