// src/app/layout.tsx
import DecorativeBG from "@/components/DecorativeBG";
import type { Metadata, Viewport } from "next";
import { getI18n, getLocale } from "@/i18n/server";
import { I18nProvider } from "@/i18n/provider";
import "./globals.css";
// (Opcional) un botón de auth en el header
import AuthButtonClient from "@/components/AuthButtonClient";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const description =
    locale === "es"
      ? "Tu maratón de Halloween a tu ritmo"
      : "Your Halloween marathon at your pace";
  return {
  metadataBase: new URL("https://advent-halloween.vercel.app"),
  title: "Advent Films Halloween",
  description,
  openGraph: {
    type: "website",
    url: "/",
    title: "Advent Films Halloween 🎃",
    siteName: "Advent Films Halloween",
    description,
    images: [
      {
        url: "/og-halloween.png", // ruta pública
        width: 1254,
        height: 608,
        alt: "Advent Films Halloween - calendario de pelis",
      },
    ],
    locale: locale === "es" ? "es_ES" : "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Advent Films Halloween 🎃",
    description,
    images: ["/og-halloween.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  };
}

export const viewport: Viewport = {
  themeColor: "#1d1d1d",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const { t } = await getI18n();
  return (
    <html lang={locale}>
      <head>
        <link
          href="https://fonts.cdnfonts.com/css/happy-halloween"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh bg-[#1d1d1d] text-white">
        <I18nProvider locale={locale}>
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
            {t("footer")}
          </p>
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-white/60">
            © {new Date().getFullYear()} — Happy Haunting! 👻
          </div>
        </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
