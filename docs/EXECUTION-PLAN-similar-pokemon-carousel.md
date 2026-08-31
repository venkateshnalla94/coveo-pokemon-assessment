# Execution Plan — Similar/Recommended Pokemon Carousel

Status: **not started — data source depends on
`docs/EXECUTION-PLAN-ml-recommendations.md`'s open decision.** This doc specs
the UI and consumption contract so it can be built the moment that decision
lands, without re-deriving the design.

Scope: a PDP carousel surfacing other Pokemon related to the one being
viewed. No Coveo org config changes (that's entirely the other doc's scope).

---

## 0. Why a carousel, not a tab

The original v2.3 plan floated a "Similar Creatures" tab and deferred it,
flagging that a second live `buildResultList()` on the PDP's shared Headless
engine would clobber the exact-match query the page already depends on
(`src/app/pokemon/[name]/page.tsx`'s `aq: '@pokemonname=="<name>"'` effect).
That constraint still holds and still rules out a second Headless controller
— but it doesn't require a tab. Direction from this session is a carousel: a
horizontal row of cards, always visible rather than hidden behind a tab
click, which reads better for something meant to invite further browsing
rather than something a user has to go looking for.

## 1. Data contract (stable regardless of which ML branch wins)

Whichever server route backs this (`/api/similar` for the plain-query
fallback, `/api/recommendations` for CR — see the ML doc), it returns the
same shape so the carousel component never needs to know which one is live:

```ts
import type { PokemonStats } from "@/coveo/mapPokemonResult";

interface SimilarPokemon {
  name: string;
  imageUrl: string;
  dexNumber: string;
  types: string[];
  stats: PokemonStats; // for the card's real stat-highlight line — see §3
}
```

`GET/POST` request carries the current Pokemon's `name` and `types` (needed
either way: the plain-query fallback filters on type directly, and a CR
model still needs the current item's identity to recommend *from*).

## 2. Route (fallback branch — build regardless, since Branch B of the ML doc needs it standalone and Branch A likely still wants it as a safety net for a cold single item)

New `src/app/api/similar/route.ts`, modeled directly on
`src/app/api/passages/route.ts`:
- Same `resolveServerCoveoConfig()` gate and 503 response shape.
- Same in-memory rate-limit bucket (`RATE_LIMIT_WINDOW_MS` /
  `RATE_LIMIT_MAX_REQUESTS` pattern).
- Calls the Coveo Search API v2 (`platform.cloud.coveo.com/rest/search/v2`),
  not Passage Retrieval — `aq` built from the current Pokemon's own types via
  `POKEMON_FIELDS.type` (`src/coveo/fields.ts`):
  `@pokemontype==("<type>") AND @pokemonname<>"<name>"`, `numberOfResults: 6`,
  `searchHub: SEARCH_HUB` (`src/coveo/searchConfig.ts`).
- Maps the raw Search API response into the `SimilarPokemon[]` shape above
  (now including `stats`, added for the card's stat-highlight line — see
  §3), reusing the field-reading helpers already in
  `src/coveo/mapPokemonResult.ts` rather than re-deriving field names inline.

If Branch A of the ML doc lands, `/api/recommendations` is added alongside
this (not instead of it) per that doc's own text — `/api/similar` stays the
name-based fallback for a Pokemon CR doesn't have enough signal on yet.

## 3. Component

New `src/components/SimilarPokemon.tsx`, rendered as its own PDP section
(placement: directly below the `Tabs` block, above `AskAboutPokemon` — a
quick in-browser look decides the exact position once built).

**Direct template: Sephora's "Similar Lip Balms & Treatments" card grid**
(`docs/temp/insiprations/pdp/image copy 2.png`) — reviewed directly this
session. Its card fields translate to real data one-for-one except two,
which are dropped rather than faked:
- Product image → sprite (`next/image`, same `object-contain` treatment as
  `ResultCard`).
- Brand + product name → Pokemon name.
- Price → **dropped, no equivalent**; Pokemon aren't priced.
- Star rating + review count → **dropped, no equivalent**; no review data
  exists anywhere in this index.
- "Highly Rated By Customers For: X, Y, Z" → a real **stat-highlight line**
  instead, e.g. "Strong in: Attack, Speed" — the two highest values in
  `item.stats` by real number (`STAT_ORDER`, `src/coveo/pokemonStats.ts`),
  labeled with that file's existing display labels. Genuinely derived from
  the Pokemon's own indexed stats, not a guess or a fabricated claim.
- "See Full Details" button → "View Pokemon", linking to that card's own
  PDP.

Plus, unchanged from the original spec:
- Type chips via the existing `Chip` component (`src/components/ui/Chip.tsx`,
  `variant="type-solid"`) and `getTypeColor`/`getTypeTextColor`
  (`src/coveo/typeColors.ts`) — matching `ADR-0013`'s type-driven design
  system rather than inventing a new visual language for one surface.
- `embla-carousel-react` (new dependency, confirmed this session — first UI
  library in this repo beyond `@coveo/headless`/Next itself; add to
  `package.json` and flag it plainly in the session's `docs/HANDOFF.md`
  entry) drives the horizontal scroll/snap/drag behavior — Sephora's own
  reference is a static grid, not a carousel, but this repo already
  committed to a carousel for this surface in an earlier session; keep that
  call rather than re-opening it.
- No compare checkbox, no `buildInteractiveResult` — these aren't Headless
  `Result` objects, so none of `ResultCard`'s Headless-specific wiring
  applies. A plain `<Link href={"/pokemon/" + encodeURIComponent(name)}>`
  per card.
- Must implement the full idle/loading/success/error state contract from
  `docs/EXECUTION-PLAN-async-ui-states.md` from the start — this is exactly
  the kind of async-on-mount component that doc is about, and shipping it
  without that contract just creates another component needing the same
  follow-up fix.

## 4. Verification

- Unit test for `SimilarPokemon.tsx` covering all four states (idle if
  applicable, loading skeleton, success with real card data, error/empty),
  mirroring the shape of existing tests for `AskAboutPokemon.tsx`.
- Unit test for `/api/similar/route.ts`'s validation branches (missing name,
  missing types, upstream error), mirroring
  `tests/unit`'s existing coverage of `/api/passages`.
- Manual: load a real Pokemon's PDP, confirm the carousel shows genuinely
  same-type Pokemon (not the current one, not fabricated), confirm each card
  navigates correctly, confirm drag/scroll works on both desktop and a
  narrow viewport.
