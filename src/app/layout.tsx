import type { Metadata, Viewport } from "next";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ServiceWorker } from "@/components/pwa/ServiceWorker";
import { AppProviders } from "@/components/site/AppProviders";
import { Footer } from "@/components/site/Footer";
import { GlobalEffects } from "@/components/site/GlobalEffects";
import { Header } from "@/components/site/Header";
import { Toaster } from "@/components/ui/Toaster";
import { SETTINGS_BOOT_SCRIPT } from "@/engine/settings";
import { GAME_FONT_VARIABLES } from "@/games/fonts";
import { PALETTE_CSS } from "@/games/palettes";
import { SITE } from "@/lib/site";
import { SITE_FONT_VARIABLES } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.fullName}: ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.fullName,
  appleWebApp: { capable: true, title: SITE.name, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: SITE.fullName,
    title: SITE.fullName,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0E0B16",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={[...SITE_FONT_VARIABLES, ...GAME_FONT_VARIABLES].join(" ")}
      // Smooth scrolling is for in-page links only; route changes jump instantly.
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* Comfort settings from localStorage, applied before the first paint. */}
        <script dangerouslySetInnerHTML={{ __html: SETTINGS_BOOT_SCRIPT }} />
        {/* Every game's palette, keyed by [data-game]. */}
        <style dangerouslySetInnerHTML={{ __html: PALETTE_CSS }} />
      </head>
      <body className="min-h-dvh overflow-x-clip">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-accent focus:px-4 focus:py-3 focus:font-bold focus:text-on-accent"
        >
          Skip to content
        </a>
        <AppProviders>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <Toaster />
          <GlobalEffects />
          <ServiceWorker />
          <InstallPrompt />
        </AppProviders>
      </body>
    </html>
  );
}
