# Execution Plan — Real Marketing Assets + Icon-Based Browse-by-Type

Status: **complete.** Executed in the nineteenth session's follow-up work;
see `docs/HANDOFF.md`'s "Doc 3 executed" entry for what was actually shipped,
including one unplanned fix this doc didn't anticipate.

Original scope: no open decisions blocking this one; it doesn't touch Coveo
org config or query behavior.

Scope: replace the four dashed-placeholder `ImageSlot`s with real downloaded
images, and redesign `BrowseByType.tsx` from a text-pill grid into a
horizontal strip of circular type icons. These are the only hardcoded assets
this pass introduces — everything else (which types exist, what happens on
click, every Pokemon shown anywhere) stays fully dynamic against the live
Coveo index.

---

## 0. Why real downloaded assets, not generated ones

An earlier draft of this work proposed building all four placeholder slots
out of already-fetched Pokemon sprite data or in-house components
(`PokeballGlyph`, type-color strips) specifically to avoid sourcing any new
art. Direction from this session overrides that: these four slots are
explicitly the one place static marketing-style imagery belongs, licensing
is accepted as a non-issue for a demo, and real images should be used.

**Hosting decision (confirmed this session): download into `public/art/`,
don't hotlink.** Serving from this app's own origin means `next/image`'s
default local optimization keeps working, there's no `next.config.ts`
`images.remotePatterns` surface to maintain per external host, and the app
doesn't depend on a third-party site staying up or continuing to allow
hotlinking.

## 1. The four `CONTENT.art` slots

`src/content/pokedex.ts:144-149` — all four currently `undefined`.
`ImageSlot.tsx` already renders real art the instant `CONTENT.art[name]`
points at a file; no component change is needed for these three:

- **`homeBanner`** (`ratio="16/5"`, used in `src/app/page.tsx`) — home page
  hero banner.
- **`heroBackdrop`** (`ratio="21/9"`, used in
  `src/app/pokemon/[name]/page.tsx`) — PDP full-bleed band above the hero
  sprite.
- **`emptySearch`** (`ratio="1/1"`, used in `src/components/ResultList.tsx`)
  — empty-results illustration.
- **`typeFacetHeader`** (`ratio="4/1"`, used in `BrowseByType.tsx`) —
  decide once the icon strip (below) is built whether this still earns its
  place above it, or reads as redundant once that strip is visually strong.

**Action**: source one real image per slot (Pokemon-themed, appropriately
licensed-for-demo-use per direction given), download each into `public/art/`
at a reasonable resolution for its aspect ratio, and set the corresponding
`CONTENT.art` key to its local path (e.g. `"/art/home-banner.jpg"`).

## 2. Browse-by-type: pill grid → circular icon strip

Current state (`src/components/BrowseByType.tsx`): a static grid of 18
hardcoded type names as text pills, each linking via `buildTypeSearchHref`
(`src/coveo/browseByTypeUrl.ts`) to `/search?...` filtered by that type —
described this session as reading like "a small table."

**Target**: a horizontal row (icon strip, not a grid) of circular icon
buttons, one per type, using real type-icon artwork rather than text labels.
Candidates found this session, either usable directly:
- `github.com/partywhale/pokemon-type-icons` — SVG set.
- The 128px PNG set by Lugia-sea on DeviantArt.

Download the chosen set into `public/art/types/` (one file per type, named to
match the type's lowercase name for a simple lookup). Each circular button:
- Renders the type's icon image inside a circular frame, ringed/tinted with
  `getTypeColor(type)` (`src/coveo/typeColors.ts`) — keeps the existing
  type-driven design system's color language even though the icon itself is
  now an image rather than a color swatch.
- Keeps the **exact current click behavior** — same `buildTypeSearchHref`
  call, same `/search?...` destination. This is a visual swap only; nothing
  about what happens on click changes.
- Accessible label via `alt`/`aria-label` carrying the type's real name,
  since the icon alone shouldn't be the only way to identify the type (a
  color-alone/icon-alone problem `ADR-0013` already addressed once for the
  facet swatches — same rule applies here).

## 3. Files touched

- `src/content/pokedex.ts` (four `CONTENT.art` values)
- `public/art/` (new image files — banner, backdrop, empty-search
  illustration)
- `public/art/types/` (new — 18 type icon files)
- `src/components/BrowseByType.tsx` (icon-strip rewrite)
- Possibly drop the `typeFacetHeader` `ImageSlot` call if judged redundant
  post-rewrite (§1)

## 4. Verification

- `npm run lint`, `npm run typecheck`, `npm test` (update
  `BrowseByType`'s existing tests, if any, for the new markup — same click
  behavior/href assertions should still pass unchanged if the rewrite only
  touches presentation).
- Manual: load `/` and confirm the home banner renders a real image, not a
  dashed box; load `/pokemon/<name>` and confirm the hero backdrop does the
  same; trigger an empty search and confirm the illustration renders; on the
  browse-by-type strip, click a few icons and confirm each still lands on the
  correct `/search?...` filtered view.
- Check page weight/Lighthouse impact of the new images (`next/image` should
  handle responsive sizing/lazy-loading automatically, but confirm the
  banner/backdrop images aren't unreasonably large source files before
  committing them).

## 5. Home hero carousel + PDP Highlights (Sephora / Sleep Country references)

**Not started.** New scope added after Doc 3's initial execution (§0-4 above),
based on six reference screenshots the user dropped into
`docs/temp/insiprations/{Home,pdp}/` — re-open those directly in a future
session rather than relying only on the prose below, which is a lossy
summary of real screenshots, not the source of truth.

**References, reviewed directly:**
- Home (Sleep Country): a full-bleed hero **carousel** (visible prev/next
  arrows) with text overlay + CTA over a lifestyle photo, not a single
  static banner; a "Shop by Category" grid of image-forward square tiles
  with a badge overlay and label; a second promo carousel further down.
- PDP (Sephora): a "Highlights" section — a grid of small icon-circle +
  label callouts (Hydrating, Vegan, Cruelty-Free, "Good for: Dryness", an
  award badge) sitting right below the hero, scannable at a glance. The
  thumbnail rail and variant swatches in the same reference don't apply here
  (no multi-angle imagery, no variants per Pokemon) — noted and dropped, not
  silently ignored. The "Similar Lip Balms & Treatments" card grid at the
  bottom is the direct template for Similar Pokemon — captured in
  `docs/EXECUTION-PLAN-similar-pokemon-carousel.md` instead of here.

**Pokemon has no price, no reviews, no star ratings, no user tags** —
copying those fields directly would mean fabricating data (`CLAUDE.md`
Product Principles). Every item below is re-grounded in real `PokemonItem`
fields (`src/coveo/mapPokemonResult.ts`) or real, already-shipped app
features, not a literal port of the reference's field list.

### 5.1 Home hero → carousel, supersedes the single static `homeBanner`

`home-banner.webp` (already shipped, §0-4) becomes one slide's background
rather than the whole hero. `embla-carousel-react` — already approved as a
dependency for the similar-Pokemon carousel
(`docs/EXECUTION-PLAN-similar-pokemon-carousel.md`) — should back this too,
so the app doesn't end up with two different carousel mechanisms. Proposed
2-3 slides, each promoting a real, already-shipped feature rather than a
sale/promo (this app has no commerce to promote):
1. "Search the full Pokedex" → focuses/scrolls to the search box.
2. "Compare up to 4 Pokemon" → links to `/compare`.
3. "Ask about any Pokemon" → links to a PDP's "Ask about this Pokemon"
   surface, or names the feature generically if no single Pokemon is a
   natural target from the home page.

Each slide's background art should be a real crop of the same
`img.pokemondb.net`-sourced artwork technique already used for
`home-banner.webp` (§0-4's compositing script), not new unrelated stock
imagery.

### 5.2 PDP "Highlights" section — new surface, not a restyle

A row of icon-circle + label callouts placed directly below `PokemonHero`,
built entirely from real, already-fetched `PokemonItem` fields — no new
Coveo query:
- Primary type — reuse `TypeSwatch` (`src/components/ui/TypeSwatch.tsx`),
  the same component the type facet already uses, rather than a new icon.
- Top ability (`item.abilities[0]`).
- Egg group (`item.breeding.eggGroups[0]`).
- Generation (`item.generation`).
- A catch-rate-derived tier label (e.g. "Rare"/"Common" bucketed from
  `item.training.catchRate`'s real numeric value — bucket boundaries need
  picking deliberately, not guessed, since a wrong boundary misrepresents
  real data) — or drop this one if no clean, defensible bucketing exists.

Icons: type callout uses `TypeSwatch`; the rest use simple glyphs consistent
with the existing design system (no icon library — this project has none;
either hand-drawn SVG in the `PokeballGlyph.tsx` style, or reuse the
`pokemon-type-icons` MIT-licensed set's visual language for a matching feel)
rather than introducing a new icon dependency for four small callouts.

### 5.3 Home "Shop by Category" tiles — considered, not proposed yet

Sleep Country's bigger image-tile grid is a genuinely different visual
weight than the circular icon-pin strip already shipped this session (which
was built small and text-light per explicit prior direction — "more of
Icons rather than text"). Logged here so the idea isn't lost (e.g. a
"Browse by Generation" tile row using a real generation-representative
sprite per tile), but **not queued as committed work** — it would replace or
sit alongside an already-shipped, working piece of UI, which deserves the
user seeing both styles side by side before committing either way, not a
unilateral swap.

## 6. Files touched (§5, once executed)

- `src/app/page.tsx` (hero → carousel)
- New: a `HeroCarousel` (or similarly named) component wrapping
  `embla-carousel-react`
- New: `src/components/PdpHighlights.tsx` (or similarly named), wired into
  `src/app/pokemon/[name]/page.tsx` below `PokemonHero`
- `package.json` (`embla-carousel-react`, unless already added by the
  similar-Pokemon carousel work first — check before re-adding)
