import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CONTENT } from "@/content/pokedex";

/**
 * A server-component layout purely to declare route-level metadata —
 * page.tsx in this segment is "use client" and can't export `metadata`
 * itself. See docs/EXECUTION-PLAN-seo.md Phase 1 / docs/adr/0019.
 */
export const metadata: Metadata = {
  title: `${CONTENT.seo.search.titlePrefix} | ${CONTENT.brand.name}`,
  description: CONTENT.seo.search.description,
  alternates: { canonical: "/search" },
};

export default function SearchLayout({ children }: { children: ReactNode }) {
  return children;
}
