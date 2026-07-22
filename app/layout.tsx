import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "../components/toast";
import { ConfirmHost } from "../components/confirm";
import { UpdateGate } from "../components/update-gate";

export const metadata: Metadata = {
  title: "RentMaster — Property Management",
  description: "Next-generation multi-tenant property management ecosystem.",
  manifest: "/manifest.json",
  applicationName: "RentMaster",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RentMaster",
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
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
  // Draw under the Android status/nav bars so safe-area insets can be applied.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans selection:bg-indigo-500/30 selection:text-indigo-100">
        {children}
        <Toaster />
        <ConfirmHost />
        <UpdateGate />
      </body>
    </html>
  );
}
