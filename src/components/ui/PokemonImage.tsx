import Image from "next/image";

export interface PokemonImageProps {
  /** A real, possibly-missing indexed sprite URL — never a fabricated one. */
  src: string | undefined;
  /** Passed to the real `<Image>` as-is. Pass "" where the name already
   * renders as adjacent visible text (e.g. EvolutionChain) — the fallback
   * SVG then omits `fallbackLabel` too and stays `aria-hidden`. */
  alt: string;
  sizes?: string;
  /** Classes for the real `<Image>` (object-fit, hover transforms, etc.);
   * reused on the fallback SVG so both states occupy the box identically. */
  className?: string;
  /** The caller's own positioned wrapper classes (aspect ratio, size,
   * overflow tricks) — owned entirely by the call site since each of this
   * component's five callers shapes its box differently. */
  containerClassName?: string;
  /** Accessible name for the fallback state. Omit when `alt` already
   * carries the name via adjacent text, matching the real `<Image>`'s own
   * `alt=""` convention rather than doubling up. */
  fallbackLabel?: string;
  /** Pass for the page's LCP candidate only (PDP hero, first search
   * result) — forwarded to next/image's `priority`, which sets
   * `fetchpriority="high"`, skips lazy-loading, and preloads the image. */
  priority?: boolean;
}

/**
 * Renders a real indexed Pokemon sprite via next/image, or — when `src` is
 * genuinely absent from the index — a themed Pokéball placeholder at the
 * same geometry, so a missing sprite never leaves a silent gap.
 *
 * Distinct from ui/ImageSlot.tsx: that component is for decorative site art
 * configured in CONTENT.art and its own doc comment forbids rendering
 * Pokemon sprites through it. This component owns the sprite case instead.
 */
export function PokemonImage({
  src,
  alt,
  sizes,
  className,
  containerClassName,
  fallbackLabel,
  priority,
}: PokemonImageProps) {
  if (src) {
    return (
      <div className={containerClassName}>
        <Image src={src} alt={alt} fill sizes={sizes} className={className} priority={priority} />
      </div>
    );
  }

  return (
    <div
      className={containerClassName}
      {...(fallbackLabel
        ? { role: "img", "aria-label": fallbackLabel }
        : { "aria-hidden": "true" })}
    >
      <PokeballIcon className={`h-full w-full text-shell-200 dark:text-shell-600 ${className ?? ""}`} />
    </div>
  );
}

function PokeballIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h6M15 12h6" />
      <circle cx="12" cy="12" r="2.25" />
    </svg>
  );
}
