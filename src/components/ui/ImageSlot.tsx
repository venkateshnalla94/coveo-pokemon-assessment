import Image from "next/image";
import { CONTENT } from "@/content/pokedex";

export interface ImageSlotProps {
  /** Key into CONTENT.art — the single place an art path is configured. */
  name: keyof typeof CONTENT.art;
  /** CSS `aspect-ratio` value, e.g. "21/9", "16/5", "1/1", "4/1". */
  ratio: string;
  /** Describes the slot's purpose. Shown as the placeholder's own label
   * when no art is set; also used as the real image's alt text once one
   * is. */
  label: string;
  /** Pass for the page's LCP candidate only (e.g. the homepage banner) —
   * forwarded to next/image's `priority`, which sets `fetchpriority="high"`
   * and skips lazy-loading. */
  priority?: boolean;
}

/**
 * A named, ratio-locked image slot. If `CONTENT.art[name]` points at a file
 * under `public/art/`, renders the real image; otherwise renders a labeled
 * dashed frame at the exact final aspect ratio, so page layout is already
 * correct before any art exists. Replacing art later means dropping a file
 * in `public/art/` and setting one path in `src/content/pokedex.ts` — no
 * component edits.
 *
 * Pokemon sprites are never rendered through this component — they are real
 * indexed `imageUrl` values from img.pokemondb.net (see mapPokemonResult.ts)
 * and always render through next/image directly against that host.
 */
export function ImageSlot({ name, ratio, label, priority }: ImageSlotProps) {
  const src = CONTENT.art[name];

  if (src) {
    return (
      <div className="relative w-full overflow-hidden rounded-md" style={{ aspectRatio: ratio }}>
        <Image src={src} alt={label} fill className="object-cover" priority={priority} />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      className="flex w-full items-center justify-center rounded-md border border-dashed border-black/20 px-4 text-center text-xs uppercase tracking-wide text-shell-500 dark:border-white/20"
      style={{ aspectRatio: ratio }}
    >
      {label}
    </div>
  );
}
