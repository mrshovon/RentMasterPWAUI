# RentMaster Android — setup & release guide

The Android app is a **Capacitor** shell that loads the live site in a native WebView, with
**FCM** push and an in-app **update popup** driven by **GitHub Releases**. Builds are produced by
GitHub Actions (`.github/workflows/android-release.yml`) — no local Android SDK needed.

This is a one-time setup. After it, shipping an update is a single command.

---

## 0. Confirm the two permanent values
- **`appId`** = `com.rentmaster.app` (in `capacitor.config.ts` + `android/app/build.gradle`).
  ⚠️ Permanent once published to the Play Store. Change it now if you want something else.
- **Production web URL** the app loads: set repo/CI secret **`NEXT_PUBLIC_APP_URL`** to your real
  Vercel domain (e.g. `https://app.rentmaster.com`). Also update the fallback in
  `lib/app-config.ts` / `capacitor.config.ts` if you build locally.

## 1. Firebase (for push)
1. https://console.firebase.google.com → **Add project** (messaging only; no other services needed).
2. **Add app → Android**, package name **`com.rentmaster.app`** → download **`google-services.json`**.
   - Either commit it to `android/app/google-services.json`, **or** set its contents as the GitHub
     secret `FIREBASE_GOOGLE_SERVICES` (the CI writes it at build time).
3. **Project settings → Service accounts → Generate new private key** → download the JSON.
   Set it (as a single-line string) as the **backend** env `FIREBASE_SERVICE_ACCOUNT_JSON`
   (Vercel → the `rent-master-pwa` project → Settings → Environment Variables). This is what lets
   the backend send Android notifications.

## 2. Generate the release keystore (needs a JDK / Android Studio)
```bash
keytool -genkeypair -v \
  -keystore rentmaster-release.jks \
  -alias rentmaster \
  -keyalg RSA -keysize 2048 -validity 10000
```
- ⚠️ **Back up `rentmaster-release.jks` and the passwords somewhere safe.** If you lose them you can
  never publish an update to the same Play Store listing.
- Base64-encode the keystore for the CI secret:
  - macOS/Linux: `base64 -w0 rentmaster-release.jks > keystore.b64`
  - Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("rentmaster-release.jks")) > keystore.b64`

## 3. GitHub Secrets (repo → Settings → Secrets and variables → Actions)
| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | contents of `keystore.b64` |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore password |
| `ANDROID_KEY_ALIAS` | `rentmaster` (the `-alias` above) |
| `ANDROID_KEY_PASSWORD` | the key password (often same as keystore password) |
| `NEXT_PUBLIC_APP_URL` | your production web URL |
| `FIREBASE_GOOGLE_SERVICES` | contents of `google-services.json` (skip if you committed the file) |

Enable **Actions** on the repo if it isn't already.

## 4. Ship a release (the one command)
```bash
npm run release:android -- --version 1.1.0 --notes "What changed in this release"
# or bump automatically:
npm run release:android -- --patch --notes "Bug fixes"
```
This bumps the version everywhere, writes `RELEASE_NOTES.md`, commits, tags `v1.1.0`, and pushes.
The tag triggers GitHub Actions, which builds the **signed APK + AAB** and publishes a **GitHub
Release**. Within a couple of minutes:
- the **APK** is downloadable from the Releases page (and the in-app "Download / Upgrade" links),
- installed apps see the **update popup** (they compare their version to the latest release),
- upload the **AAB** to the Play Store.

## How it fits together
- `capacitor.config.ts` — the native shell (remote `server.url`, appId, UA tag).
- `lib/platform.ts` / `lib/app-config.ts` / `lib/updates.ts` — platform detection, version source,
  and the GitHub-Releases update check.
- `components/download-android.tsx` — browser-only "Download" links (login + sidebar).
- `components/update-gate.tsx` — native-only "Update available" popup (Upgrade → download + install).
- `lib/native-push.ts` — registers the FCM token with `/api/notifications/register`.
- Backend `lib/fcm-send.ts` + `lib/push-send.ts` — fan notifications out to browser (Web Push) and
  Android (FCM). Notification icon = the logo silhouette (`android/.../ic_stat_notify`).

Regenerate app icons after changing the logo: `npm run gen-android-icons`.
