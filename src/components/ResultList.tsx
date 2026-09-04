"use client";

import {
  buildInteractiveResult,
  buildResultList,
  buildResultsPerPage,
  type Result,
  type SearchEngine,
} from "@coveo/headless";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { useState } from "react";
import { useCompare } from "@/components/compare/CompareProvider";
import { Chip } from "@/components/ui/Chip";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { PokemonImage } from "@/components/ui/PokemonImage";
import { CONTENT } from "@/content/pokedex";
import { getSearchEngine } from "@/coveo/engine";
import type { PokemonItem } from "@/coveo/mapPokemonResult";
import { MAX_BASE_STAT } from "@/coveo/pokemonStats";
import { deriveSearchRenderState } from "@/coveo/searchRenderState";
import { getTypeColor, getTypeTextColor } from "@/coveo/typeColors";
import { useControllerState } from "@/coveo/useControllerState";

// The real in-game per-stat cap (Blissey's HP) times the 6 stats that make up
// `statTotal` — a derived absolute scale for the tile's compact stat bar, not
// an invented one (mirrors PDP's StatBar, which anchors to MAX_BASE_STAT
// directly; see docs/coveo-source-spec.md).
const MAX_STAT_TOTAL = MAX_BASE_STAT * 6;

export function ResultList() {
  const [engine] = useState(() => getSearchEngine());
  const [resultList] = useState(() => buildResultList(engine));
  // Fixed page size, no UI control for it — 18 divides evenly into full rows
  // at both the 2-col (mobile) and 3-col (sm+) grid layouts below. Must be
  // constructed during render (not an effect) so it registers its default
  // before SearchUrlSync's useLayoutEffect restores search params from the
  // URL — same ordering constraint as loadAdvancedSearchQueryActions there.
  useState(() => buildResultsPerPage(engine, { initialState: { numberOfResults: 18 } }));
  const state = useControllerState(resultList) ?? resultList.state;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The exact current search URL (path + query string, including facets/
  // sort/pagination) — this is what Breadcrumb.tsx (Step 3) reads back via
  // `?from=` and renders as its "Search results" crumb link, so a Pokemon
  // opened from a filtered/sorted/paginated view can return to that exact
  // view rather than a bare `/search`.
  const fromHref = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const renderState = deriveSearchRenderState(state, engine);

  switch (renderState.status) {
    case "loading":
      // Same grid shape as "success" (docs/EXECUTION-PLAN-async-ui-states.md
      // §3) — placeholder tiles roughly matching ResultCard's box (sprite
      // square + two text lines), so loading -> success swaps tile content
      // rather than the grid itself reflowing.
      return (
        <>
          <span className="sr-only">{CONTENT.search.loadingLabel}</span>
          <ul
            aria-hidden="true"
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:gap-8"
          >
            {Array.from({ length: 18 }).map((_, index) => (
              <ResultCardSkeleton key={index} />
            ))}
          </ul>
        </>
      );
    case "error":
      return (
        <p className="text-sm text-red-600 dark:text-red-400">{renderState.error.userMessage}</p>
      );
    case "empty":
      return (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-full max-w-xs">
            <ImageSlot name="emptySearch" ratio="1/1" label="Empty-search illustration" />
          </div>
          <p className="text-sm text-black/50 dark:text-white/50">
            {CONTENT.search.emptyTitle} {CONTENT.search.emptyBody}
          </p>
        </div>
      );
    case "success":
      return (
        <ul aria-label="Search results" className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:gap-8">
          {/* deriveSearchRenderState maps state.results 1:1, in order, into
              renderState.items — zipping by index here to recover the raw
              Result (needed for buildInteractiveResult) without changing the
              mapper boundary's return type. */}
          {renderState.items.map((item, index) => (
            <ResultCard
              key={item.id}
              item={item}
              result={state.results[index]}
              engine={engine}
              fromHref={fromHref}
              priority={index === 0}
            />
          ))}
        </ul>
      );
  }
}

function ResultCard({
  item,
  result,
  engine,
  fromHref,
  priority,
}: {
  item: PokemonItem;
  result: Result;
  engine: SearchEngine;
  fromHref: string;
  priority: boolean;
}) {
  const [interactiveResult] = useState(() =>
    buildInteractiveResult(engine, { options: { result } }),
  );
  const { isSelected, isFull, add, remove } = useCompare();
  const selected = isSelected(item.name);
  // Disabled once the cap is reached and this card isn't already one of the
  // 4 selected — a visible, discoverable "why" (the title attribute) rather
  // than a silent no-op, per docs/EXECUTION-PLAN-v2.3-frontend.md §6's
  // 4-name cap.
  const disabled = isFull && !selected;
  const detailHref = `/pokemon/${encodeURIComponent(item.name)}?from=${encodeURIComponent(fromHref)}`;

  // Type-driven lighting (v4 plan §5/§2.3). `types[0]` isn't a verified
  // "primary" type — no sort, no primary designation on the source field —
  // so it's used only for decorative lighting, never labeled "primary" in
  // the UI, and the dual-type gradient (which uses both colors, order-
  // independent) is preferred over the single-type radial whenever there
  // are two.
  const typeColors = item.types
    .map((type) => getTypeColor(type))
    .filter((color): color is string => Boolean(color));
  const [primaryColor, secondaryColor] = typeColors;
  const isDualGlow = Boolean(primaryColor && secondaryColor && primaryColor !== secondaryColor);
  const glowVars = primaryColor
    ? ({
        "--type-primary": primaryColor,
        "--type-secondary": secondaryColor ?? primaryColor,
      } as CSSProperties)
    : undefined;

  return (
    <li
      className="result-tile group bg-surface p-4"
      data-glow={primaryColor ? (isDualGlow ? "dual" : "single") : undefined}
      style={glowVars}
    >
      <Link href={detailHref} className="block" onClick={() => interactiveResult.select()}>
        {/* Oversized, overflowing the tile's top edge by ~12% (v4 plan §5)
            — a negative top margin greater than the tile's own padding, on
            a `<li>` with no `overflow: hidden`, so the sprite bleeds past
            the drawn edge instead of being clipped by it. Rendered
            unconditionally (real sprite or themed placeholder) so every
            tile keeps this treatment regardless of whether the index has
            an image for it.

            The inner `inset-[8%]` wrapper is a second box, not just padding
            on this one: next/image's `fill` mode positions the `<img>`
            against its positioned ancestor's *padding box*, so padding here
            wouldn't reserve any space for it — a genuinely smaller inner box
            is required. Needed because pokemondb's own source images aren't
            uniform: some are square canvases with an opaque white
            background that already has generous built-in padding, others
            are transparent PNGs cropped tight to the character. Without
            this inset, `object-contain` still keeps every sprite inside its
            box correctly, but a tightly-cropped one has none of the white
            canvas's natural buffer, so the same -12% bleed above visibly
            pushes its character past the card's top edge while a padded
            one stays put — inconsistent card-to-card for reasons invisible
            in this code (they trace back to which source image pokemondb
            happened to have). This inset gives every sprite the same
            buffer regardless of its source composition. */}
        <div className="relative mt-[-12%] mb-2 aspect-square w-full">
          <PokemonImage
            src={item.imageUrl}
            alt={item.name}
            fallbackLabel={CONTENT.sprite.noImageLabel}
            sizes="(min-width: 640px) 30vw, 42vw"
            containerClassName="absolute inset-[8%]"
            className="object-contain transition-transform duration-200 ease-out group-hover:scale-105 group-focus-within:scale-105"
            priority={priority}
          />
        </div>
        {/* Synchronized hover (v4 plan §5, Appendix A): sprite (scales,
            above), name and dex number (this block) highlight together as
            one path on hover/focus. Type chips below are intentionally
            excluded from this group — they stay visually independent. */}
        {/* --signal-red is reserved for exactly two uses — the Pokeball
            glyph and the global focus ring (v4 plan §3.2) — so the
            synchronized-hover highlight here is an underline, not a color
            swap, to avoid a third. */}
        <p className="font-display flex items-baseline justify-between gap-2 text-sm font-semibold text-foreground underline decoration-transparent decoration-2 underline-offset-2 transition-colors group-hover:decoration-current group-focus-within:decoration-current">
          <span>{item.name}</span>
          {item.dexNumber && (
            // Present at opacity 0 at rest so nothing reflows on reveal.
            <span className="font-mono-label shrink-0 text-xs text-shell-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
              #{item.dexNumber}
            </span>
          )}
        </p>
        {item.generation && <p className="mt-1 text-xs text-shell-500">{item.generation}</p>}
        {item.types.length > 0 && (
          <p className="mt-1 flex flex-wrap items-center gap-1.5">
            {item.types.map((type) => (
              <Chip
                key={type}
                label={type}
                color={getTypeColor(type)}
                textColor={getTypeTextColor(type)}
                variant="type-solid"
              />
            ))}
          </p>
        )}
        {item.statTotal !== undefined && (
          // Compact stat-total bar, also opacity-0 at rest (v4 plan §5).
          // Absolute-scaled against MAX_STAT_TOTAL, mirroring StatBar's own
          // absolute-cap posture rather than a relative/per-page scale.
          <div
            role="meter"
            aria-label={CONTENT.compare.rowLabels.total}
            aria-valuenow={item.statTotal}
            aria-valuemin={0}
            aria-valuemax={MAX_STAT_TOTAL}
            className="mt-2 h-1 w-full overflow-hidden rounded-full bg-shell-100 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-shell-600"
          >
            <div
              className="h-full rounded-full bg-shell-400"
              style={{ width: `${Math.min(100, (item.statTotal / MAX_STAT_TOTAL) * 100)}%` }}
            />
          </div>
        )}
        {item.abilities.length > 0 && (
          <p className="mt-1 truncate text-xs text-shell-500">{item.abilities.join(", ")}</p>
        )}
      </Link>
      {/* Outside the <Link> deliberately — sitting inside it would fire
          interactiveResult.select()'s click-tracking event on every compare
          toggle, not just on navigation. */}
      <label className="mt-2 flex items-center gap-1.5 text-xs text-black/60 dark:text-white/60">
        <input
          type="checkbox"
          checked={selected}
          disabled={disabled}
          title={disabled ? CONTENT.compare.fullMessage : undefined}
          onChange={() => (selected ? remove(item.name) : add(item.name))}
        />
        {CONTENT.compare.trayLabel}
      </label>
    </li>
  );
}

/** Sprite-square + two text lines, roughly ResultCard's box (plan §3). */
function ResultCardSkeleton() {
  return (
    <li className="bg-surface p-4" aria-hidden="true">
      <div className="aspect-square w-full animate-pulse rounded-md bg-shell-100 dark:bg-shell-600/40" />
      <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-shell-100 dark:bg-shell-600/40" />
      <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-shell-100 dark:bg-shell-600/40" />
    </li>
  );
}
