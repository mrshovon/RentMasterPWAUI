// =============================================================================
// Update checking + upgrade trigger, driven by the GitHub Releases feed.
// The native app compares the INSTALLED APK version (App.getInfo(), see
// getInstalledVersion) to the latest release tag and, if newer, UpdateGate shows a
// popup with the release notes. "Upgrade" downloads the APK with progress and hands
// it to the system installer; in a browser it just opens the download.
// =============================================================================

import { APP_VERSION, LATEST_RELEASE_API, RELEASES_PAGE, LATEST_APK_URL } from "./app-config";
import { isNativeApp } from "./platform";

export interface ReleaseInfo {
  version: string;   // normalized (no leading "v")
  notes: string;     // release body / changelog
  apkUrl: string | null; // direct download URL of the .apk asset, if any
  apkSize: number | null; // bytes, for the download label + progress percentage
  htmlUrl: string;   // the release page
}

export interface UpdateStatus {
  hasUpdate: boolean;
  current: string;
  latest: ReleaseInfo | null;
}

// Strip a leading "v" and any pre-release/build suffix for numeric comparison.
function normalize(v: string): number[] {
  return String(v)
    .replace(/^v/i, "")
    .split("-")[0]
    .split(".")
    .map((n) => parseInt(n, 10) || 0);
}

// True when `latest` is a strictly higher semver than `current`.
export function isNewer(latest: string, current: string): boolean {
  const a = normalize(latest);
  const b = normalize(current);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (x !== y) return x > y;
  }
  return false;
}

// Fetch the newest published release from GitHub. Returns null on any failure
// (offline, rate-limited, no releases yet) — callers treat that as "no update".
export async function fetchLatestRelease(): Promise<ReleaseInfo | null> {
  try {
    const res = await fetch(LATEST_RELEASE_API, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const asset = (json.assets || []).find((a: any) => /\.apk$/i.test(a.name));
    return {
      version: String(json.tag_name || "").replace(/^v/i, ""),
      notes: json.body || "",
      apkUrl: asset?.browser_download_url || null,
      apkSize: typeof asset?.size === "number" ? asset.size : null,
      htmlUrl: json.html_url || RELEASES_PAGE,
    };
  } catch {
    return null;
  }
}

/**
 * The version of the APK the user actually has installed.
 *
 * ⚠️ This MUST come from the native layer, not from APP_VERSION. The Android app is a
 * remote-URL shell: it loads the live website, so APP_VERSION is whatever the *deployed
 * site* was built with — which the release script bumps in lockstep with the release tag.
 * Comparing that to the latest tag therefore always says "up to date" and the update popup
 * could never appear. App.getInfo() reports the real installed APK version.
 *
 * Falls back to APP_VERSION in the browser, or if the plugin call fails.
 */
export async function getInstalledVersion(): Promise<string> {
  if (!isNativeApp()) return APP_VERSION;
  try {
    const { App } = await import("@capacitor/app");
    const info = await App.getInfo();
    return info?.version || APP_VERSION;
  } catch (err) {
    console.warn("[updates] App.getInfo() unavailable, falling back to APP_VERSION:", err);
    return APP_VERSION;
  }
}

// Compare the INSTALLED app version against the latest release.
export async function checkForUpdate(): Promise<UpdateStatus> {
  const [latest, current] = await Promise.all([fetchLatestRelease(), getInstalledVersion()]);
  const hasUpdate = !!latest && isNewer(latest.version, current);
  return { hasUpdate, current, latest };
}

// Start the upgrade.
//  - Browser: open the APK asset (or releases page) in a new tab.
//  - Native app: download the APK reporting progress, then hand it to the system package
//    installer (needs REQUEST_INSTALL_PACKAGES). Falls back to opening the URL if that fails.
//
// NOTE: "automatic" has a hard limit on Android. A sideloaded APK can be downloaded and
// handed to the installer silently, but the OS ALWAYS shows its own confirmation screen, and
// the first time it will also send the user to "Install unknown apps" to grant permission.
// Fully unattended updates need Play or device-owner privileges. So: download automatically,
// then one system prompt.
export async function startUpgrade(
  release: ReleaseInfo | null,
  onProgress?: (percent: number) => void,
): Promise<void> {
  // The API may not have given us an asset URL (rate limit, odd release). The static
  // latest-asset URL always resolves to the newest APK, so prefer that over giving up.
  const apkUrl = release?.apkUrl || LATEST_APK_URL;

  if (!isNativeApp()) {
    if (typeof window !== "undefined") window.open(apkUrl, "_blank", "noopener,noreferrer");
    return;
  }

  let listener: { remove: () => Promise<void> } | null = null;
  try {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { FileOpener } = await import("@capacitor-community/file-opener");

    if (onProgress) {
      listener = await Filesystem.addListener("progress", (p: { bytes: number; contentLength: number }) => {
        // contentLength can be 0 when the server omits it; fall back to the asset size.
        const total = p.contentLength || release?.apkSize || 0;
        if (total > 0) onProgress(Math.min(100, Math.round((p.bytes / total) * 100)));
      });
    }

    const result = await Filesystem.downloadFile({
      url: apkUrl,
      path: `rentmaster-${release?.version || "latest"}.apk`,
      directory: Directory.Cache,
      progress: !!onProgress,
    });
    const filePath = (result as { path?: string }).path;
    if (!filePath) throw new Error("APK download returned no path");
    onProgress?.(100);

    // Opening an .apk triggers the Android package installer prompt.
    await FileOpener.open({
      filePath,
      contentType: "application/vnd.android.package-archive",
    });
  } catch (err) {
    console.error("[updates] native install failed, falling back to browser:", err);
    if (typeof window !== "undefined") window.open(apkUrl, "_blank");
    throw err; // let the caller surface it instead of failing silently
  } finally {
    await listener?.remove();
  }
}
