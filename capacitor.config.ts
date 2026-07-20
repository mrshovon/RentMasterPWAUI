import type { CapacitorConfig } from "@capacitor/cli";

// =============================================================================
// Capacitor config — RentMaster Android app.
//
// Thin remote-URL shell: the app loads the live production site (server.url) in a
// native WebView, so web changes ship instantly via Vercel. The APK re-releases for
// native changes (icons, permissions, plugins) and to let users pull the newest shell.
//
// ⚠️ appId is PERMANENT once published to the Play Store — confirm before first upload.
// ⚠️ Set NEXT_PUBLIC_APP_URL (or edit PROD_URL) to your real Vercel domain before building.
// =============================================================================

const PROD_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rentmaster.vercel.app";

const config: CapacitorConfig = {
  appId: "com.rentmaster.app",
  appName: "RentMaster",
  // webDir must exist for `cap sync`, but with server.url set its contents are only a
  // fallback (a tiny loader). The real UI is loaded from PROD_URL.
  webDir: "capacitor-www",
  server: {
    url: PROD_URL,
    androidScheme: "https",
    // Lets the web app detect it's inside our native shell (see lib/platform.ts).
    // Appended to the default WebView UA.
  },
  android: {
    // Distinguishes our WebView from a plain browser for lib/platform.ts UA fallback.
    appendUserAgent: "RentMasterApp",
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
