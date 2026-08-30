import type { Metadata } from "next";
import { Chakra_Petch, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { CompareProvider } from "@/components/compare/CompareProvider";
import { CompareTray } from "@/components/compare/CompareTray";
import { CONTENT } from "@/content/pokedex";
import { typeCssVariables } from "@/coveo/typeColors";
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

export const metadata: Metadata = {
  title: CONTENT.brand.name,
  description: CONTENT.brand.tagline,
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
          {children}
          <CompareTray />
        </CompareProvider>
      </body>
    </html>
  );
}
