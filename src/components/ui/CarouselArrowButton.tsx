/**
 * Plain hand-drawn chevrons, not an icon library (matches `PokeballGlyph.tsx`'s
 * posture — no new icon dependency for a couple of small glyphs). Shared by
 * every `embla-carousel-react` consumer in this app (`SimilarPokemon.tsx`,
 * `BrowseByType.tsx`) — extracted once a second real call site needed the
 * identical button.
 */
export function CarouselArrowButton({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-shell-100 text-foreground transition-opacity disabled:opacity-30 dark:border-shell-600"
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {direction === "prev" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  );
}
