"use client";

import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { CarouselArrowButton } from "@/components/ui/CarouselArrowButton";
import { Chip } from "@/components/ui/Chip";
import { useCarouselArrows } from "@/components/ui/useCarouselArrows";
import { CONTENT } from "@/content/pokedex";
import type { PokemonStats } from "@/coveo/mapPokemonResult";
import { STAT_ORDER } from "@/coveo/pokemonStats";
import { getTypeColor, getTypeTextColor } from "@/coveo/typeColors";

interface SimilarPokemonProps {
  pokemonName: string;
  pokemonTypes: string[];
}

interface SimilarPokemonItem {
  name: string;
  imageUrl: string;
  dexNumber: string;
  types: string[];
  stats: PokemonStats;
}

type SimilarState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; items: SimilarPokemonItem[] };

/**
 * PDP "Similar Pokemon" carousel — calls /api/similar (ADR-0014, ADR-0015): a
 * deterministic same-type Search API v2 query, not a Content Recommendation
 * model. Plain fetch + local state, same posture as AskAboutPokemon.tsx: this
 * hits our own Next.js route, not a Headless controller, so there's no engine
 * state to subscribe to.
 *
 * Built against the idle/loading/success/error contract from
 * docs/EXECUTION-PLAN-async-ui-states.md from the start. There's no real
 * "idle" state here the way AskAboutPokemon's question form has one — the
 * request fires unconditionally on mount, with no user gesture gating it —
 * so this starts directly in "loading" (same posture ResultList.tsx already
 * takes for its own auto-fetch-on-mount case). `.async-panel` stays "open"
 * for the entire loading/error/success lifetime; its 0fr collapsed state is
 * unused here since nothing ever hides this section once it's mounted, but
 * the class is still applied for the swap-content-without-unmount behavior
 * (skeleton -> cards, never `return null` at any point) and so a later pass
 * doesn't have to introduce it fresh.
 */
export function SimilarPokemon({ pokemonName, pokemonTypes }: SimilarPokemonProps) {
  const [state, setState] = useState<SimilarState>({ status: "loading" });
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", dragFree: true });
  // Arrow buttons alongside embla's own drag/swipe (kept — a touch/trackpad
  // user still expects to drag a carousel; the arrows are for anyone who
  // wouldn't otherwise discover that, mouse-wheel or keyboard users
  // included).
  const { canScrollPrev, canScrollNext, scrollPrev, scrollNext } = useCarouselArrows(emblaApi);

  useEffect(() => {
    const controller = new AbortController();

    // A Pokemon with no indexed types (shouldn't happen for a real entry,
    // but not guaranteed) is left to the route's own validation rather than
    // special-cased here: /api/similar 400s on an empty `types` array, which
    // the catch/error-status branches below already turn into the same
    // real error message a request failure would.
    //
    // No synchronous `setState({ status: "loading" })` here on purpose —
    // eslint-plugin-react-hooks's set-state-in-effect rule flags that
    // pattern (a same-tick setState with no external subscription behind
    // it). Since `useState`'s initializer already starts every fresh mount
    // at "loading", the caller (src/app/pokemon/[name]/page.tsx) keys this
    // component by the Pokemon's name so a name change remounts it — a
    // clean reset to "loading" via React's own mount semantics rather than
    // an effect-driven one.
    (async () => {
      try {
        const response = await fetch("/api/similar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: pokemonName, types: pokemonTypes }),
          signal: controller.signal,
        });
        if (!response.ok) {
          setState({ status: "error", message: CONTENT.pdp.similarErrorMessage });
          return;
        }
        const data = (await response.json()) as { items?: SimilarPokemonItem[] };
        setState({ status: "success", items: data.items ?? [] });
      } catch {
        if (controller.signal.aborted) {
          return;
        }
        setState({ status: "error", message: CONTENT.pdp.similarErrorMessage });
      }
    })();

    return () => controller.abort();
    // `pokemonTypes` is joined into a stable string rather than depended on
    // directly: mapPokemonResult builds a fresh array on every call, so the
    // reference changes on every parent re-render even when the underlying
    // types haven't — depending on the array itself would refetch on every
    // unrelated PDP re-render, not just a real name/types change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pokemonName, pokemonTypes.join(",")]);

  const showArrows = state.status === "success" && state.items.length > 1;

  return (
    <div className="mt-8 border-t border-shell-600/40 pt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {CONTENT.pdp.similarHeading(pokemonName)}
        </h2>
        {showArrows && (
          <div className="flex items-center gap-2">
            <CarouselArrowButton
              direction="prev"
              label={CONTENT.pdp.similarPrevLabel}
              disabled={!canScrollPrev}
              onClick={scrollPrev}
            />
            <CarouselArrowButton
              direction="next"
              label={CONTENT.pdp.similarNextLabel}
              disabled={!canScrollNext}
              onClick={scrollNext}
            />
          </div>
        )}
      </div>
      <div className="async-panel mt-4" data-open="true">
        <div>
          {state.status === "loading" && <SimilarSkeleton />}
          {state.status === "error" && (
            <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
          )}
          {state.status === "success" && state.items.length === 0 && (
            <p className="text-sm text-black/50 dark:text-white/50">
              {CONTENT.pdp.similarEmptyMessage(pokemonName)}
            </p>
          )}
          {state.status === "success" && state.items.length > 0 && (
            <div ref={emblaRef} className="overflow-hidden">
              <ul aria-label={CONTENT.pdp.similarHeading(pokemonName)} className="flex gap-4">
                {state.items.map((item) => (
                  <SimilarPokemonCard key={item.name} item={item} />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SimilarSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="w-40 shrink-0 animate-pulse rounded-lg bg-shell-100 p-3 dark:bg-shell-600/40"
        >
          <div className="aspect-square w-full rounded-md bg-shell-100/80 dark:bg-shell-600/60" />
          <div className="mt-3 h-3 w-3/4 rounded bg-shell-100/80 dark:bg-shell-600/60" />
          <div className="mt-2 h-3 w-1/2 rounded bg-shell-100/80 dark:bg-shell-600/60" />
        </div>
      ))}
    </div>
  );
}

/**
 * The two highest real stats for this Pokemon, in `STAT_ORDER`'s order among
 * ties — never a guess or an invented "strong in" claim, just the top 2 of
 * the six actual indexed base stats.
 */
function topStats(stats: PokemonStats): string[] {
  return STAT_ORDER.filter((entry) => typeof stats[entry.key] === "number")
    .slice()
    .sort((a, b) => (stats[b.key] as number) - (stats[a.key] as number))
    .slice(0, 2)
    .map((entry) => entry.label);
}

function SimilarPokemonCard({ item }: { item: SimilarPokemonItem }) {
  const highlights = topStats(item.stats);
  const detailHref = `/pokemon/${encodeURIComponent(item.name)}`;

  // Same type-driven glow treatment as ResultList.tsx's ResultCard
  // (ADR-0013) — `types[0]` isn't a verified "primary" type, used only for
  // decorative lighting, same caveat as that component.
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
      className="result-tile group w-40 shrink-0 bg-surface p-3"
      data-glow={primaryColor ? (isDualGlow ? "dual" : "single") : undefined}
      style={glowVars}
    >
      {/* Whole card is one click target, same as ResultList.tsx's
          ResultCard — "View Pokemon" below is a visual label inside this
          link, not a second nested anchor. */}
      <Link href={detailHref} className="block">
        <div className="relative aspect-square w-full">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="160px"
            className="object-contain transition-transform duration-200 ease-out group-hover:scale-105 group-focus-within:scale-105"
          />
        </div>
        <p className="font-display mt-2 flex items-baseline justify-between gap-2 text-sm font-semibold text-foreground underline decoration-transparent decoration-2 underline-offset-2 transition-colors group-hover:decoration-current group-focus-within:decoration-current">
          <span>{item.name}</span>
          {item.dexNumber && (
            <span className="font-mono-label shrink-0 text-xs text-shell-500">
              #{item.dexNumber}
            </span>
          )}
        </p>
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
        {highlights.length > 0 && (
          <p className="mt-1 truncate text-xs text-shell-500">
            {CONTENT.pdp.similarStrongInPrefix} {highlights.join(", ")}
          </p>
        )}
        <span className="mt-2 inline-block text-xs font-medium text-foreground underline decoration-transparent decoration-2 underline-offset-2 transition-colors group-hover:decoration-current group-focus-within:decoration-current">
          {CONTENT.pdp.similarViewLabel}
        </span>
      </Link>
    </li>
  );
}
