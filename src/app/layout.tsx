/**
 * Root layout for every route in the App Router. Pure server component
 * (no `"use client"`) so the HTML shell, self-hosted font faces, and
 * metadata tags ship as static markup; the interactive shell lives inside
 * the client `AppShell` mounted below.
 *
 * Fonts are loaded with `next/font/google`, which downloads the font
 * files at build time and serves them from the static export. No runtime
 * request to fonts.googleapis.com or fonts.gstatic.com is made, so the
 * desktop offline build renders the correct typefaces without network
 * access. The CSS variables below mirror the family names the stylesheet
 * referenced before, so `globals.css` keeps working unchanged.
 */
import type { Metadata } from "next";
import { Fraunces, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import "./globals.css";

/** Editorial serif used for headings and the `.serif` utility. */
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-fraunces",
});

/** Primary UI sans used for body text. */
const interTight = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter-tight",
});

/** Monospace used for labels, codes, and severity chips. */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

/** Static metadata used by Next.js for the document title and OpenGraph. */
export const metadata: Metadata = {
  title: "MedWatch: Faskes 1 Drug Safety",
  description:
    "Sistem monitoring keamanan obat dan manajemen klinik faskes 1 untuk tenaga kesehatan, masyarakat, dan administrator.",
};

/**
 * Top-level HTML wrapper. Sets the lang attribute and exposes the
 * self-hosted font CSS variables on `<html>`, then defers all interactive
 * UI to `AppShell`.
 *
 * @param props - Standard layout props.
 * @param props.children - The rendered route content.
 * @returns The full document shell.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${fraunces.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
