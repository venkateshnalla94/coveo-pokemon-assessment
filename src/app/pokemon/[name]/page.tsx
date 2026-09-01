import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CONTENT } from "@/content/pokedex";
import { fetchPokemonMetadata } from "@/coveo/serverPokemonLookup";
import { SITE_URL } from "@/siteUrl";
import PokemonDetailPageClient from "./PokemonDetailPageClient";

interface PageProps {
  params: Promise<{ name: string }>;
}

// Re-check Coveo for a given name at most once an hour rather than on every
// request — see docs/EXECUTION-PLAN-seo.md Phase 1.
export const revalidate = 3600;

/**
 * Server-side metadata shim — see docs/adr/0019-server-rendered-seo-metadata-shim.md.
 * This is a second, independent read from `fetchPokemonMetadata` (itself
 * request-deduped via React's cache()), purely to compute <head> tags and
 * the 404 check below; the interactive body (PokemonDetailPageClient) keeps
 * doing its own Headless query for the actual UI, unchanged.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { name } = await params;
  const pokemon = await fetchPokemonMetadata(decodeURIComponent(name));

  if (!pokemon) {
    return { title: CONTENT.pdp.notFoundTitle };
  }

  const title = `${pokemon.name} Pokédex: stats, types, abilities | ${CONTENT.brand.name}`;
  const description = `${pokemon.name} is a ${pokemon.types.join("/")}-type Pokemon${
    pokemon.species ? ` (${pokemon.species})` : ""
  }. View base stats, abilities, and evolution details.`;
  // Canonical (index) casing, not the raw route param — collapses any
  // case-variant URL to the one real canonical page.
  const canonical = `/pokemon/${encodeURIComponent(pokemon.name)}`;
  const images = pokemon.imageUrl ? [pokemon.imageUrl] : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, images, type: "website" },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

/**
 * The 404 fix (docs/EXECUTION-PLAN-seo.md Phase 3): an unknown name now
 * returns a real HTTP 404 via notFound() instead of a 200 with
 * CONTENT.pdp.notFoundTitle text in the body. The client component's own
 * "not found" render branch stays as a safety net for the rarer case where
 * this lookup succeeds but the client's own exact-match re-check doesn't
 * (see that component's own comment on why the re-check exists).
 */
export default async function PokemonDetailPage({ params }: PageProps) {
  const { name } = await params;
  const pokemon = await fetchPokemonMetadata(decodeURIComponent(name));

  if (!pokemon) {
    notFound();
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(pokemon.name)) }}
      />
      <PokemonDetailPageClient />
    </>
  );
}

/**
 * BreadcrumbList structured data (docs/EXECUTION-PLAN-seo.md Phase 2),
 * generated from the same "Home / <Name>" trail Breadcrumb.tsx renders by
 * default. Deliberately fixed-shape regardless of Breadcrumb.tsx's `from`
 * prop: that prop reflects this particular visit's navigation history (did
 * the user arrive via a search-result click), while structured data
 * describes the page's permanent position in the site, which never
 * includes a transient "Search results" crumb.
 */
function buildBreadcrumbJsonLd(pokemonName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: CONTENT.pdp.breadcrumbHome,
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: pokemonName,
        item: `${SITE_URL}/pokemon/${encodeURIComponent(pokemonName)}`,
      },
    ],
  };
}
