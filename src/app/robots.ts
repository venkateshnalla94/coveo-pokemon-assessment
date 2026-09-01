import type { MetadataRoute } from "next";
import { SITE_URL } from "@/siteUrl";

/**
 * `/search?` and `/compare?` (the query-string prefix, not the bare path)
 * are disallowed so the unbounded facet/sort URL-param space
 * (SearchUrlSync.tsx's router.replace) doesn't burn crawl budget on
 * near-duplicate content, while the two nav entry points themselves stay
 * crawlable. `/api/` is never a page, so it's excluded outright. See
 * docs/EXECUTION-PLAN-seo.md Phase 1.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/search?", "/compare?", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
