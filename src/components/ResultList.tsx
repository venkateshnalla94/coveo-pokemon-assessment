"use client";

import { buildInteractiveResult, buildResultList, type Result, type SearchEngine } from "@coveo/headless";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { useState } from "react";
import { useCompare } from "@/components/compare/CompareProvider";
import { Chip } from "@/components/ui/Chip";
import { ImageSlot } from "@/components/ui/ImageSlot";
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
      return <p className="text-sm text-black/50 dark:text-white/50">{CONTENT.search.loadingLabel}</p>;
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
        <ul aria-label="Search results" className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
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
}: {
  item: PokemonItem;
  result: Result;
  engine: SearchEngine;
  fromHref: string;
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
      className="result-tile group bg-surface p-3"
      data-glow={primaryColor ? (isDualGlow ? "dual" : "single") : undefined}
      style={glowVars}
    >
      <Link href={detailHref} className="block" onClick={() => interactiveResult.select()}>
        {item.imageUrl && (
          // Oversized, overflowing the tile's top edge by ~12% (v4 plan
          // §5) — a negative top margin greater than the tile's own
          // padding, on a `<li>` with no `overflow: hidden`, so the sprite
          // bleeds past the drawn edge instead of being clipped by it.
          <div className="relative mt-[-12%] mb-2 aspect-square w-full">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="(min-width: 768px) 22vw, (min-width: 640px) 28vw, 42vw"
              className="object-contain transition-transform duration-200 ease-out group-hover:scale-105 group-focus-within:scale-105"
            />
          </div>
        )}
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
            <span className="font-mono-label shrink-0 text-xs text-shell-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
              #{item.dexNumber}
            </span>
          )}
        </p>
        {item.generation && <p className="mt-1 text-xs text-shell-400">{item.generation}</p>}
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
          <p className="mt-1 truncate text-xs text-shell-400">{item.abilities.join(", ")}</p>
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
