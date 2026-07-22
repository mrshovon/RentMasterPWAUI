// =============================================================================
// Update checking + upgrade trigger, driven by the GitHub Releases feed.
// The native app compares the INSTALLED APK version (App.getInfo(), see
// getInstalledVersion) to the latest release tag and, if newer, UpdateGate shows a
// popup with the release notes. "Upgrade" downloads the APK with progress and hands
// it to the system installer; in a browser it just opens the download.
// =============================================================================

import { APP_VERSION, LATEST_RELEASE_API, RELEASES_PAGE, LATEST_APK_URL } from "./app-config";
import { BACKEND_API_BASE } from "./api-service";
import { isNativeApp } from "./platform";

export interface ReleaseInfo {
  version: string;   // normalized (no leading "v")
  notes: string;     // release body / changelog
  apkUrl: string | null; // direct download URL of the .apk asset, if any
  apkSize: number | null; // bytes, for the download label + progress percentage
  htmlUrl: string;   // the release page
}

/** Where the installed version came from — surfaced by the diagnostic button. */
export type VersionSource = "native-plugin" | "user-agent" | "web-bundle";

export interface UpdateStatus {
  hasUpdate: boolean;
  current: string;
  latest: ReleaseInfo | null;
  /** Why there is (or isn't) an update — so a silent "nothing happened" is impossible. */
  reason: "update" | "up-to-date" | "check-failed";
  versionSource: VersionSource;
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

/**
 * Fetch the newest published release.
 *
 * Prefers our own backend, which caches the GitHub response server-side. Calling
 * api.github.com directly from every device runs into its 60-requests/hour-PER-IP limit for
 * unauthenticated callers — and users behind carrier-grade NAT share one address, so the
 * check would 403 for everyone on that IP and silently report "no update". GitHub stays as
 * the fallback for when the backend is unreachable.
 *
 * Returns null on total failure; callers must treat that as "check failed", not "no update".
 */
export async function fetchLatestRelease(): Promise<ReleaseInfo | null> {
  // 1. Our cached proxy (public route — no session token needed).
  try {
    const res = await fetch(`${BACKEND_API_BASE}/api/app/latest-release`, { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      if (j?.success && j.version) {
        return {
          version: String(j.version).replace(/^v/i, ""),
          notes: j.notes || "",
          apkUrl: j.apkUrl || null,
          apkSize: typeof j.apkSize === "number" ? j.apkSize : null,
          htmlUrl: j.htmlUrl || RELEASES_PAGE,
        };
      }
    }
  } catch {
    /* fall through to GitHub */
  }

  // 2. Straight from GitHub.
  try {
    const res = await fetch(LATEST_RELEASE_API, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("[updates] GitHub releases API returned", res.status,
        res.status === 403 ? "(rate limited — 60/hr per IP for anonymous callers)" : "");
      return null;
    }
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
export async function getInstalledVersion(): Promise<{ version: string; source: VersionSource }> {
  if (!isNativeApp()) return { version: APP_VERSION, source: "web-bundle" };

  // 1. The plugin bridge — authoritative when it works.
  try {
    const { App } = await import("@capacitor/app");
    const info = await App.getInfo();
    if (info?.version) return { version: info.version, source: "native-plugin" };
  } catch (err) {
    console.warn("[updates] App.getInfo() unavailable:", err);
  }

  // 2. The user-agent token, stamped at build time by capacitor.config.ts
  //    ("RentMasterApp/1.0.1"). Needs no bridge, so it survives whatever broke step 1.
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const m = ua.match(/RentMasterApp\/(\d+\.\d+\.\d+)/i);
  if (m) return { version: m[1], source: "user-agent" };

  // 3. Last resort. On native this is nearly useless: APP_VERSION comes from the DEPLOYED
  //    SITE, which the release script bumps in lockstep with the release tag — so it will
  //    almost always equal the latest release and report "up to date" forever. Logged loudly
  //    because reaching here means the two better sources both failed.
  console.error("[updates] no native version source; falling back to the web bundle's " +
    "APP_VERSION, which cannot detect updates on a remote-URL shell.");
  return { version: APP_VERSION, source: "web-bundle" };
}

// Compare the INSTALLED app version against the latest release.
export async function checkForUpdate(): Promise<UpdateStatus> {
  const [latest, installed] = await Promise.all([fetchLatestRelease(), getInstalledVersion()]);
  const base = { current: installed.version, versionSource: installed.source, latest };
  if (!latest) return { ...base, hasUpdate: false, reason: "check-failed" };
  const hasUpdate = isNewer(latest.version, installed.version);
  return { ...base, hasUpdate, reason: hasUpdate ? "update" : "up-to-date" };
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
