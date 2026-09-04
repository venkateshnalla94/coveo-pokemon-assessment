"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SearchBox } from "@/components/SearchBox";
import { CONTENT } from "@/content/pokedex";

/**
 * Minimal persistent header — see docs/EXECUTION-PLAN-v2.3-frontend.md §7.
 * Just the wordmark (linking home) plus, on `/pokemon/[name]` and
 * `/compare`, a compact search box. No Home/Explore/Types/Favorites/Compare
 * nav row, no avatar, no notification bell — none of those correspond to a
 * real account or feature this app has (PRODUCT.md Principle 4).
 *
 * `sticky top-0 z-50`: pinned to the viewport on every route so it (and,
 * where shown, the search box) stay reachable while scrolling, not just
 * present on first paint. `bg-surface` (already set) keeps scrolled content
 * from showing through underneath it.
 *
 * Home ("/") and `/search` are deliberately excluded from the compact box
 * here even though they're routes too: each already has its own dedicated
 * `<SearchBox>` elsewhere on the page (Home's hero box, `/search`'s own
 * input, both now pinned the same way — see their page files), and a
 * Headless `buildSearchBox()` instance's displayed text is seeded once at
 * construction from `engine.state.querySet[id]`, never re-synced from a
 * different instance's typing (confirmed against
 * node_modules/@coveo/headless's core search-box controller source). A
 * second box here would silently show different text than the one already
 * on the page — not just visual clutter, an actually-diverging input.
 *
 * This replaces the ad-hoc "&larr; Back to home"/"&larr; Back to search"
 * links that used to be duplicated per-page: `/search/page.tsx`'s own
 * "Back to home" link is removed in this same change (the header's wordmark
 * covers it), and `/pokemon/[name]/page.tsx` already lost its own back-link
 * in Step 3 in favor of `Breadcrumb` — confirmed no leftover nav markup
 * remains on either page.
 */
export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const showsOwnSearchBox = pathname === "/" || pathname === "/search";
  const showCompactSearchBox = !showsOwnSearchBox;

  return (
    <header className="sticky top-0 z-50 border-b border-shell-100 bg-surface px-6 py-3 dark:border-shell-600">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="font-display shrink-0 text-sm font-semibold text-foreground">
          {CONTENT.brand.name}
        </Link>
        {showCompactSearchBox && (
          <div className="w-full max-w-xs">
            <SearchBox onNavigate={(query) => router.push(`/search?q=${encodeURIComponent(query)}`)} />
          </div>
        )}
      </div>
    </header>
  );
}
