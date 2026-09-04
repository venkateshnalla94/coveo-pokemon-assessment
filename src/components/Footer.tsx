import Image from "next/image";
import { CONTENT } from "@/content/pokedex";

/**
 * Static site footer — plain document flow (not fixed/sticky), so it sits
 * at the true bottom of each page's content and never competes with
 * CompareTray's `fixed bottom-0` overlay (which only appears once the user
 * has selected something to compare). Same `border-shell-100`/`bg-surface`
 * tokens AppHeader already uses, so it reads as matching chrome rather than
 * a bolted-on addition.
 *
 * Logo: the real Coveo mark (public/brand/coveo-logo.png, sourced from
 * Wikimedia Commons — confirmed as Coveo's actual navy wordmark + 4-color
 * pinwheel, not a fabricated or unverified rendition of their trademark).
 * Fixed intrinsic 1280x350 source, rendered at a small `h-6` so it sits
 * comfortably next to the "Powered by" text without dominating the footer.
 */
export function Footer() {
  return (
    <footer className="border-t border-shell-100 bg-surface px-6 py-6 dark:border-shell-600">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-sm text-shell-500">
        <span>{CONTENT.footer.poweredByPrefix}</span>
        <a href="https://www.coveo.com" target="_blank" rel="noopener noreferrer" className="shrink-0">
          <Image
            src="/brand/coveo-logo.png"
            alt={CONTENT.footer.coveoLogoAlt}
            width={1280}
            height={350}
            className="h-6 w-auto"
          />
        </a>
      </div>
    </footer>
  );
}
