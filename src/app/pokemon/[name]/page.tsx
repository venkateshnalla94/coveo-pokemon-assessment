import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CONTENT } from "@/content/pokedex";
import { fetchPokemonMetadata } from "@/coveo/serverPokemonLookup";
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

  return <PokemonDetailPageClient />;
}
