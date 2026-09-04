import type { Metadata } from "next";
import { Chakra_Petch, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { CompareProvider } from "@/components/compare/CompareProvider";
import { CompareTray } from "@/components/compare/CompareTray";
import { Footer } from "@/components/Footer";
import { CONTENT } from "@/content/pokedex";
import { typeCssVariables } from "@/coveo/typeColors";
import { SITE_URL } from "@/siteUrl";
import "./globals.css";

// Display face — page/section headings, Pokemon names, tab labels. Only
// 600/700 loaded; it never carries body copy. See docs/EXECUTION-PLAN-v4's
// §3.3.
// Variable names are deliberately distinct from the Tailwind theme tokens
// they feed (--font-display/--font-sans/--font-mono in globals.css's
// `@theme inline` block) — mapping a custom property to itself
// (`--font-display: var(--font-display)`) is a circular reference and
// resolves to nothing. Same pattern the stock scaffold used for Geist
// (`--font-geist-sans` feeding Tailwind's `--font-sans`).
const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["600", "700"],
});

// Body face — all running text, facet labels, buttons, counts.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Micro/mono face — dex numbers, stat figures, scan tags, field keys. Plex
// Sans + Plex Mono are one superfamily, so this is two typefaces in
// practice, not three.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Real marketing asset (Doc 3, twentieth session), not a fabricated
// placeholder — used as the default og:image/twitter:image for any route
// that doesn't set its own (e.g. a PDP overrides this with the Pokemon's
// own sprite).
const DEFAULT_SOCIAL_IMAGES = CONTENT.art.homeBanner ? [CONTENT.art.homeBanner] : undefined;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: CONTENT.brand.name,
  description: CONTENT.brand.tagline,
  openGraph: {
    title: CONTENT.brand.name,
    description: CONTENT.brand.tagline,
    images: DEFAULT_SOCIAL_IMAGES,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: CONTENT.brand.name,
    description: CONTENT.brand.tagline,
    images: DEFAULT_SOCIAL_IMAGES,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${chakraPetch.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        {/* Type-color custom properties, generated from the single
            TYPE_COLORS source in src/coveo/typeColors.ts — not a second
            hardcoded list in CSS. Inline <style> is permitted by the CSP
            (style-src 'self' 'unsafe-inline'); a <link> to a remote
            stylesheet would not be. */}
        <style>{`:root { ${typeCssVariables()} }`}</style>
      </head>
      <body className="min-h-full flex flex-col">
        <CompareProvider>
          <AppHeader />
          {/* min-w-0: without it, this flex item (body is flex-col) keeps
              its default content-based min-width floor, so any page whose
              content includes an unwrapped-by-design horizontal row (e.g.
              BrowseByType's 18-icon carousel, meant to be clipped by its own
              overflow-hidden) forces the *whole page* wider than the
              viewport instead of just clipping that row — found via 375px
              screenshot verification of the home page,
              docs/EXECUTION-PLAN-responsive-ui.md §9.

              flex-1: the classic sticky-footer flex pattern — this item
              grows to fill any leftover vertical space so Footer lands at
              the true bottom of the viewport on a short page (e.g. a PDP
              with little content) instead of floating right below the
              content with a gap of blank space beneath it. On a page
              taller than the viewport this is a no-op; Footer just follows
              the content as it scrolls, same as before. */}
          <div className="min-w-0 flex-1">{children}</div>
          <Footer />
          <CompareTray />
        </CompareProvider>
      </body>
    </html>
  );
}
