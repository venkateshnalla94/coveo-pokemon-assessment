"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SearchBox } from "@/components/SearchBox";
import { CONTENT } from "@/content/pokedex";

/**
 * Minimal persistent header — see docs/EXECUTION-PLAN-v2.3-frontend.md §7.
 * Just the wordmark (linking home) plus, on `/pokemon/[name]` specifically,
 * a compact search box. No Home/Explore/Types/Favorites/Compare nav row, no
 * avatar, no notification bell — none of those correspond to a real account
 * or feature this app has (PRODUCT.md Principle 4).
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
  const isDetailPage = pathname.startsWith("/pokemon/");

  return (
    <header className="border-b border-shell-100 bg-surface px-6 py-3 dark:border-shell-600">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="font-display shrink-0 text-sm font-semibold text-foreground">
          {CONTENT.brand.name}
        </Link>
        {isDetailPage && (
          <div className="w-full max-w-xs">
            <SearchBox onNavigate={(query) => router.push(`/search?q=${encodeURIComponent(query)}`)} />
          </div>
        )}
      </div>
    </header>
  );
}
