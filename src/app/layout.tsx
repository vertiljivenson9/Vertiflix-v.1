import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VERTIFLIX - Streaming Premium",
  description: "Plataforma de streaming premium. Disfruta películas sin límites, sin anuncios y en alta calidad.",
  keywords: ["Vertiflix", "Streaming", "Películas", "Series", "Netflix", "Entretenimiento"],
  authors: [{ name: "Vertil Jivenson" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "VERTIFLIX - Streaming Premium",
    description: "Plataforma de streaming premium de películas y series",
    siteName: "VERTIFLIX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VERTIFLIX - Streaming Premium",
    description: "Plataforma de streaming premium de películas y series",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
