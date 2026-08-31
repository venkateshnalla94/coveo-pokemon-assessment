import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { CarouselArrowButton } from "@/components/ui/CarouselArrowButton";
import { useCarouselArrows } from "@/components/ui/useCarouselArrows";
import { CONTENT } from "@/content/pokedex";
import { buildTypeSearchHref } from "@/coveo/browseByTypeUrl";
import { getTypeColor, POKEMON_TYPES } from "@/coveo/typeColors";

/**
 * A carousel of icon "pins" into `/search` pre-filtered to each type,
 * replacing both the prior live-facet version (`buildFacet` — see
 * docs/adr/0011-automatic-facet-generation-on-search-page.md) and the
 * text-pill grid that followed it. Click behavior is unchanged — same
 * `buildTypeSearchHref` destination per type — this is a visual swap only
 * (see docs/EXECUTION-PLAN-marketing-assets.md §2). The 18 types are a
 * fixed, real taxonomy, not fabricated Pokemon data, so hardcoding the list
 * and its icon files is safe; no live query means no counts next to each
 * pin (a deliberate, accepted tradeoff, unchanged from the prior version) —
 * `/search` itself still shows real, live-counted facets once landed.
 *
 * `embla-carousel-react` — the same mechanism `SimilarPokemon.tsx`
 * established first — replaces the native `overflow-x-auto` strip this used
 * to be: real prev/next arrows for discoverability, rather than an
 * undiscoverable drag-only gesture (the exact UX gap SimilarPokemon's own
 * manual-testing follow-up found and fixed for that carousel).
 *
 * Icons are real downloaded SVG assets (public/art/types/, MIT-licensed —
 * see public/art/types/LICENSE.txt), not next/image, since next/image's
 * optimizer refuses local SVGs without `dangerouslyAllowSVG` in
 * next.config.ts, and there's no responsive-size need for small fixed-size
 * icons. Each icon is paired with its type's real name below it (small,
 * icon-led per direction given, but never icon-alone) — same color-plus-
 * label rule already applied to the facet swatches in
 * docs/adr/0013-type-driven-design-system.md, since an icon shape alone
 * isn't a reliable way to identify a type.
 */
export function BrowseByType() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", dragFree: true });
  const { canScrollPrev, canScrollNext, scrollPrev, scrollNext } = useCarouselArrows(emblaApi);

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
          {CONTENT.home.browseByTypeHeading}
        </h2>
        <div className="flex items-center gap-2">
          <CarouselArrowButton
            direction="prev"
            label={CONTENT.home.browseByTypePrevLabel}
            disabled={!canScrollPrev}
            onClick={scrollPrev}
          />
          <CarouselArrowButton
            direction="next"
            label={CONTENT.home.browseByTypeNextLabel}
            disabled={!canScrollNext}
            onClick={scrollNext}
          />
        </div>
      </div>
      <div ref={emblaRef} className="overflow-hidden">
        <ul className="flex gap-4">
          {POKEMON_TYPES.map((type) => {
            const color = getTypeColor(type);
            return (
              <li key={type} className="shrink-0">
                <Link
                  href={buildTypeSearchHref(type)}
                  className="group flex w-16 flex-col items-center gap-1.5"
                >
                  <span
                    className="flex size-14 items-center justify-center rounded-full ring-2 ring-transparent transition-transform duration-150 ease-out group-hover:scale-110 group-hover:ring-(--type-primary) group-focus-visible:scale-110"
                    style={color ? ({ "--type-primary": color } as CSSProperties) : undefined}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- small local SVG, next/image's optimizer requires dangerouslyAllowSVG for local SVGs and buys nothing for a fixed 56px icon */}
                    <img src={`/art/types/${type.toLowerCase()}.svg`} alt="" className="size-full" />
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-shell-400">
                    {type}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
