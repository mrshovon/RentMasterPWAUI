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
  icons: {
    icon: "/icon-192.png",
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
