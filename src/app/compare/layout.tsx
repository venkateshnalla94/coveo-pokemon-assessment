import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CONTENT } from "@/content/pokedex";

/**
 * A server-component layout purely to declare route-level metadata —
 * page.tsx in this segment is "use client" and can't export `metadata`
 * itself. See docs/EXECUTION-PLAN-seo.md Phase 1 / docs/adr/0019.
 */
export const metadata: Metadata = {
  title: `${CONTENT.seo.compare.titlePrefix} | ${CONTENT.brand.name}`,
  description: CONTENT.seo.compare.description,
  alternates: { canonical: "/compare" },
};

export default function CompareLayout({ children }: { children: ReactNode }) {
  return children;
}
