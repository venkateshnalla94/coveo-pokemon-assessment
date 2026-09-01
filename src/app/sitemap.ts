import type { MetadataRoute } from "next";
import { fetchAllPokemonNames } from "@/coveo/serverPokemonLookup";
import { SITE_URL } from "@/siteUrl";

// Re-fetch the Pokemon list from Coveo at most once an hour rather than on
// every crawler request — see docs/EXECUTION-PLAN-seo.md Phase 1.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const names = await fetchAllPokemonNames();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/search`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/compare`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const pokemonRoutes: MetadataRoute.Sitemap = names.map((name) => ({
    url: `${SITE_URL}/pokemon/${encodeURIComponent(name)}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...pokemonRoutes];
}
