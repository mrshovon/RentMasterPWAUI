// =============================================================================
// Update checking + upgrade trigger, driven by the GitHub Releases feed.
// The native app compares its built-in APP_VERSION to the latest release tag and,
// if newer, the UpdateGate shows a popup with the release notes. "Upgrade" then
// downloads + installs the new APK (native install path is added in Phase D; the
// browser path just opens the download).
// =============================================================================

import { APP_VERSION, LATEST_RELEASE_API, RELEASES_PAGE } from "./app-config";
import { isNativeApp } from "./platform";

export interface ReleaseInfo {
  version: string;   // normalized (no leading "v")
  notes: string;     // release body / changelog
  apkUrl: string | null; // direct download URL of the .apk asset, if any
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
      htmlUrl: json.html_url || RELEASES_PAGE,
    };
  } catch {
    return null;
  }
}

// Compare the running app version against the latest release.
export async function checkForUpdate(): Promise<UpdateStatus> {
  const latest = await fetchLatestRelease();
  const hasUpdate = !!latest && isNewer(latest.version, APP_VERSION);
  return { hasUpdate, current: APP_VERSION, latest };
}

// Start the upgrade. Browser: open the APK (or releases page). The native install
// path (download + system installer) is layered in during Phase D.
export async function startUpgrade(release: ReleaseInfo | null): Promise<void> {
  const url = release?.apkUrl || release?.htmlUrl || RELEASES_PAGE;
  if (!isNativeApp()) {
    if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  // Native install flow is implemented in Phase D (Filesystem + FileOpener). Until
  // then, open the APK URL so the system browser downloads it.
  if (typeof window !== "undefined") window.open(url, "_blank");
}
