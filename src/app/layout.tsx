import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { ClientShell } from "@/components/layout/ClientShell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MedWatch - Drug Safety Monitor",
  description: "MedWatch Premium - Drug Safety Monitoring & Midwife Clinic Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased h-screen overflow-hidden`}
      >
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
