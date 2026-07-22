// =============================================================================
// App-wide constants: the single source of truth for the app version and the
// GitHub Releases feed that powers the Android "Download" link + update popup.
//
// APP_VERSION is bumped by scripts/release-android.mjs (kept in lockstep with
// android/app/build.gradle versionName and package.json). The native app compares
// its built-in version to the latest GitHub Release tag to detect updates.
// =============================================================================

export const APP_VERSION = "1.0.0";

// Frontend GitHub repo that hosts the signed APK as release assets.
export const GITHUB_OWNER = "mrshovon";
export const GITHUB_REPO = "RentMasterPWAUI";

// GitHub Releases API — public repo, no auth needed (60 req/hr/IP is plenty for a
// once-per-launch check). Returns the newest published, non-draft release.
export const LATEST_RELEASE_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

// Human-facing releases page (fallback download destination in the browser).
export const RELEASES_PAGE = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;

// Name of the APK asset the release workflow uploads (see .github/workflows/android-release.yml).
export const APK_ASSET_NAME = "app-release.apk";

// Direct download of the newest APK. GitHub redirects this to the current release's asset,
// so it needs NO API call — which matters: the releases API is 60 requests/hour PER IP for
// unauthenticated callers, and users behind carrier-grade NAT share one IP. Driving the
// download button off the API would break it for everyone on that IP once the budget is
// spent. This URL is always correct and never rate-limited.
export const LATEST_APK_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest/download/${APK_ASSET_NAME}`;

// Production web URL the Android shell loads (Capacitor server.url). Overridable at
// build time via NEXT_PUBLIC_APP_URL. ⚠️ REPLACE the fallback with your real Vercel domain.
export const PROD_WEB_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://rent-master-pwa-ui.vercel.app";
