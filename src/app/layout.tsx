import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { CompareProvider } from "@/components/compare/CompareProvider";
import { CompareTray } from "@/components/compare/CompareTray";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pokedex Search",
  description: "Coveo-powered search over pokemondb.net",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
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
