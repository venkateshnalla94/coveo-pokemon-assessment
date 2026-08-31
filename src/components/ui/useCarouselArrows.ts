import type { EmblaCarouselType } from "embla-carousel";
import { useCallback, useEffect, useState } from "react";

/**
 * `canScrollPrev`/`canScrollNext` sync + `scrollPrev`/`scrollNext` callbacks
 * shared by every `embla-carousel-react` consumer in this app. Re-synced on
 * every `select`/`reInit` embla emits, not just on mount, so button
 * disabled-state tracks the real scroll position (e.g. "next" grays out once
 * the last item is reached) — lifted out of `SimilarPokemon.tsx`, its first
 * consumer, once `BrowseByType.tsx` needed the identical logic.
 */
export function useCarouselArrows(emblaApi: EmblaCarouselType | undefined) {
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;

    const syncButtons = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    syncButtons();
    emblaApi.on("select", syncButtons);
    emblaApi.on("reInit", syncButtons);

    return () => {
      emblaApi.off("select", syncButtons);
      emblaApi.off("reInit", syncButtons);
    };
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return { canScrollPrev, canScrollNext, scrollPrev, scrollNext };
}
