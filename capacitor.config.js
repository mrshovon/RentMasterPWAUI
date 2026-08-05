// @ts-check
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

// The APK's own version, stamped into the user-agent below. Read from package.json, which
// scripts/release-android.mjs bumps immediately before the APK is built.
const APK_VERSION = JSON.parse(
  readFileSync(join(__dirname, "package.json"), "utf8"),
).version;

// =============================================================================
// Capacitor config — Bari360 Android app.
//
// This is CommonJS (module.exports), NOT a .ts config, on purpose: the Capacitor CLI
// loads a .ts config through a transpile-and-require path that newer Node versions
// (>=22.12, where require(ESM) changed) evaluate as an ES module, which crashes
// `cap sync` with "exports is not defined in ES module scope". A plain .js config is
// required as CommonJS directly and is version-independent.
//
// Thin remote-URL shell: the app loads the live production site (server.url) in a
// native WebView, so web changes ship instantly via Vercel. The APK re-releases for
// native changes (icons, permissions, plugins) and to let users pull the newest shell.
//
// ⚠️ appId is PERMANENT once published to the Play Store — confirm before first upload.
//    It stays com.rentmaster.app after the Bari360 rename on purpose: changing it makes every
//    installed app a different app, so nobody would receive the update.
// ⚠️ NEXT_PUBLIC_APP_URL (GitHub secret, read by the release workflow) overrides PROD_URL.
// =============================================================================

const PROD_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.bari360.space";

/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: "com.rentmaster.app",
  appName: "Bari360",
  // webDir must exist for `cap sync`, but with server.url set its contents are only a
  // fallback (a tiny loader). The real UI is loaded from PROD_URL.
  webDir: "capacitor-www",
  server: {
    url: PROD_URL,
    androidScheme: "https",
  },
  android: {
    // Distinguishes our WebView from a plain browser for lib/platform.ts, AND carries the
    // installed APK's version to the web bundle without needing the plugin bridge.
    // Deliberately still "RentMasterApp" after the Bari360 rename: every already-installed
    // shell sends this token, and lib/platform.ts + lib/updates.ts match on it. Renaming it
    // would make existing installs look like plain browsers until they updated — which is
    // exactly when they most need the update prompt to work.
    appendUserAgent: `RentMasterApp/${APK_VERSION}`,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

module.exports = config;
