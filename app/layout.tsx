import type { Metadata, Viewport } from "next";
import { Baloo_Da_2 } from "next/font/google";
import "./globals.css";
import { Toaster } from "../components/toast";
import { ConfirmHost } from "../components/confirm";
import { UpdateGate } from "../components/update-gate";
import { MaintenanceGate } from "../components/maintenance-gate";
import { AnalyticsGate } from "../components/analytics-gate";
import { AnnouncementGate } from "../components/announcement-gate";
import { NotificationSoundGate } from "../components/notification-sound-gate";
import { DeepLinkGate } from "../components/deep-link-gate";
import { LanguageProvider } from "../lib/i18n";

// The display face — banner titles, metric values and hub-tile labels. Body copy deliberately
// stays on the system stack (font-sans); this is opt-in per element.
//
// Chosen for its BENGALI coverage as much as its Latin. The app ships a full bn.ts, and most
// rounded display faces carry no Bengali glyphs — a Bangla heading would silently fall back to
// the system Bengali font and stop matching its English twin, which is exactly the class of
// silent-degradation bug lib/i18n.tsx exists to avoid.
//
// No `weight`: the family has a variable wght axis (400-800), so one file covers every weight
// we use instead of three static cuts.
const display = Baloo_Da_2({
  subsets: ["latin", "bengali"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bari360 — Property Management",
  description: "Next-generation multi-tenant property management ecosystem.",
  manifest: "/manifest.json",
  applicationName: "Bari360",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bari360",
  },
  // All generated from the brand logo by `npm run gen-icons`.
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  // The app defaults to the light theme; the toggle updates this meta live at runtime.
  themeColor: "#f6f8fb",
  width: "device-width",
  initialScale: 1,
  // Draw under the Android status/nav bars so safe-area insets can be applied.
  viewportFit: "cover",
};

// Runs before paint so the saved theme is applied with no flash of the wrong palette.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('rentmaster-theme');document.documentElement.dataset.theme=(t==='dark')?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={display.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-screen bg-bg text-fg antialiased font-sans selection:bg-primary/30 selection:text-heading">
        <LanguageProvider>
          {children}
          <Toaster />
          <ConfirmHost />
          {/* First: it only routes, and a deep link should land before anything else
              decides what to show on the page it lands on. */}
          <DeepLinkGate />
          <UpdateGate />
          {/* Before MaintenanceGate on purpose: if both ever fire at once, the maintenance
              portal mounts second and lands on top, which is the one that must be read. */}
          <AnnouncementGate />
          <MaintenanceGate />
          {/* Renders nothing — loads GA/GTM if the admin has configured and enabled it. */}
          <AnalyticsGate />
          {/* Renders nothing — plays the Bari360 tone for pushes that land while a page is open. */}
          <NotificationSoundGate />
        </LanguageProvider>
      </body>
    </html>
  );
}
