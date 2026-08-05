// =============================================================================
// App-wide constants: the single source of truth for the GitHub Releases feed that
// powers the Android "Download" link + update popup.
//
// APP_VERSION is a WEB-ONLY label. The APK's real version is set by CI at build time
// (.github/workflows/android-release.yml computes MAJOR.MINOR from package.json plus the run
// number) and is read back at runtime from App.getInfo() / the user-agent token — see
// lib/updates.ts getInstalledVersion(). Nothing here ever decides whether an update exists.
// =============================================================================

export const APP_VERSION = "1.1.0";

// Frontend GitHub repo that hosts the signed APK as release assets.
export const GITHUB_OWNER = "mrshovon";
export const GITHUB_REPO = "RentMasterPWAUI";

// GitHub Releases API — public repo, no auth needed (60 req/hr/IP is plenty for a
// once-per-launch check). Returns the newest published, non-draft release.
export const LATEST_RELEASE_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

// Human-facing releases page (fallback download destination in the browser).
export const RELEASES_PAGE = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;

// Name of the APK asset the release workflow uploads (see .github/workflows/android-release.yml).
// Changing this REQUIRES the workflow to upload an asset with the same name in the same push —
// the download URL below is built from it verbatim.
export const APK_ASSET_NAME = "Bari360.apk";

// Direct download of the newest APK. GitHub redirects this to the current release's asset,
// so it needs NO API call — which matters: the releases API is 60 requests/hour PER IP for
// unauthenticated callers, and users behind carrier-grade NAT share one IP. Driving the
// download button off the API would break it for everyone on that IP once the budget is
// spent. This URL is always correct and never rate-limited.
export const LATEST_APK_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest/download/${APK_ASSET_NAME}`;

// Production web URL the Android shell loads (Capacitor server.url). Overridable at
// build time via NEXT_PUBLIC_APP_URL. Keep this in sync with capacitor.config.js's PROD_URL.
export const PROD_WEB_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://www.bari360.space";
