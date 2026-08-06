import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "../components/toast";
import { ConfirmHost } from "../components/confirm";
import { UpdateGate } from "../components/update-gate";
import { MaintenanceGate } from "../components/maintenance-gate";
import { AnalyticsGate } from "../components/analytics-gate";
import { LanguageProvider } from "../lib/i18n";

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
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-screen bg-bg text-fg antialiased font-sans selection:bg-primary/30 selection:text-heading">
        <LanguageProvider>
          {children}
          <Toaster />
          <ConfirmHost />
          <UpdateGate />
          <MaintenanceGate />
          {/* Renders nothing — loads GA/GTM if the admin has configured and enabled it. */}
          <AnalyticsGate />
        </LanguageProvider>
      </body>
    </html>
  );
}
