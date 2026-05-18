/**
 * Root layout for every route in the App Router. Pure server component
 * (no `"use client"`) so the HTML shell, font preconnects, and metadata
 * tags ship as static markup; the interactive shell lives inside the
 * client `AppShell` mounted below.
 */
import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import "./globals.css";

/** Static metadata used by Next.js for the document title and OpenGraph. */
export const metadata: Metadata = {
  title: "MedWatch — Faskes 1 Drug Safety",
  description:
    "Sistem monitoring keamanan obat dan manajemen klinik faskes 1 untuk tenaga kesehatan, masyarakat, dan administrator.",
};

/**
 * Top-level HTML wrapper. Sets the `id` lang attribute and the Google
 * Fonts preconnect chain, then defers all interactive UI to `AppShell`.
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
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300;1,9..144,400&family=Inter+Tight:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
