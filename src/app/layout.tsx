// src/app/layout.tsx
import DecorativeBG from "@/components/DecorativeBG";
import type { Metadata, Viewport } from "next";
import "./globals.css";
// (Opcional) un botón de auth en el header
import AuthButtonClient from "@/components/AuthButtonClient";
import Link from "next/link";

export const metadata: Metadata = {
  metadataBase: new URL("https://advent-halloween.vercel.app"),
  title: "Advent Films Halloween",
  description: "Tu maratón de Halloween a tu ritmo",
  openGraph: {
    type: "website",
    url: "/",
    title: "Advent Films Halloween 🎃",
    siteName: "Advent Films Halloween",
    description: "Tu maratón de Halloween a tu ritmo",
    images: [
      {
        url: "/og-halloween.png", // ruta pública
        width: 1254,
        height: 608,
        alt: "Advent Films Halloween - calendario de pelis",
      },
    ],
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "Advent Films Halloween 🎃",
    description: "Tu maratón de Halloween a tu ritmo",
    images: ["/og-halloween.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d1d1d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.cdnfonts.com/css/happy-halloween"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh bg-[#1d1d1d] text-white">
        {/* Fondo y decoraciones */}
        <DecorativeBG />
        {/* Header sencillo */}
        <header className="border-b border-white/10">
          <nav
            className="
      mx-auto flex max-w-5xl flex-col items-center gap-3 p-4
      sm:flex-row sm:items-center sm:justify-between sm:gap-0
    "
          >
            <Link href="/" className="text-2xl font-semibold">
              🎃 Advent Films Halloween
            </Link>
            <AuthButtonClient />
          </nav>
        </header>
        {/* Contenido principal */}
        <main className="relative z-30 min-h-[calc(100vh-250px)] px-4">
          {children}
        </main>
        {/* Footer con una calabaza “marca de agua” extra */}
        <footer className="relative z-0 mt-16 border-t border-white/10 max-h[100px] px-4">
          {/* Nota legal / footer mini */}
          <p className="mt-3 text-center text-sm text-white/50">
            Hecho con Next.js + Supabase · No compartimos datos con terceros
          </p>
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-white/60">
            © {new Date().getFullYear()} — Happy Haunting! 👻
          </div>
        </footer>
      </body>
    </html>
  );
}
