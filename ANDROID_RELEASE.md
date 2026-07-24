# RentMaster Android — setup & release guide

The Android app is a **Capacitor** shell that loads the live site in a native WebView, with
**FCM** push and an in-app **update popup** driven by **GitHub Releases**. Builds are produced by
GitHub Actions (`.github/workflows/android-release.yml`) — no local Android SDK needed.

**Shipping an update is just: push to `main`.** Sections 0–3 are one-time setup.

---

## 0. Confirm the two permanent values
- **`appId`** = `com.rentmaster.app` (in `capacitor.config.js` + `android/app/build.gradle`).
  ⚠️ Permanent once published to the Play Store. Change it now if you want something else.
- **Production web URL** the app loads: set repo/CI secret **`NEXT_PUBLIC_APP_URL`** to your real
  Vercel domain (e.g. `https://app.rentmaster.com`). Also update the fallback in
  `lib/app-config.ts` / `capacitor.config.js` if you build locally.

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
| `NEXT_PUBLIC_APP_URL` | your production web URL — *optional*, see below |
| `FIREBASE_GOOGLE_SERVICES` | contents of `google-services.json` (skip if you committed the file) |

The four `ANDROID_*` secrets are **required** — without them the APK cannot be signed, and the
workflow's pre-flight step says exactly which one is missing within ten seconds instead of dying
five minutes into a Gradle build.

`NEXT_PUBLIC_APP_URL` is **optional**: `capacitor.config.js` falls back to
`https://rent-master-pwa-ui.vercel.app`. Set the secret only if your production domain differs —
the pre-flight logs which URL is being baked into the shell either way.

Enable **Actions** on the repo if it isn't already.

---

## Shipping a release

```bash
git push origin main
```

That's it. Every push to `main`:
1. builds a **signed APK**,
2. and only then creates the tag `v<version>` and a **GitHub Release** with auto-generated notes
   from the commits since the last release.

Within a couple of minutes the APK is downloadable from the Releases page (and from the in-app
"Download / Upgrade" links), and installed apps see the **update popup** on their next launch or
foreground.

**Versioning is automatic.** `MAJOR.MINOR` comes from `package.json`; the patch number is the CI
run number — so `1.1.23`, `1.1.24`, … with nothing to bump by hand. To start a new series, edit
`version` in `package.json` to e.g. `1.2.0` and push; releases become `1.2.<run>`.

**Skip a release** for a commit that can't affect the app (docs, CI tweaks) by putting
`[skip apk]` on the **first line** of the commit message. Only the subject is checked, so a commit
that merely mentions the marker in its body still gets released.

**Play Store bundle (.aab):** not built by default. Actions tab → *Android Release* → **Run
workflow** → tick *Also build the Play Store bundle* — the `.aab` is attached to that run's release.

### Why it's built this way
The old flow bumped versions locally, pushed a `v*` tag, and *then* let CI try to build it. When
the build failed (wrong Node, wrong JDK, a config that wouldn't load) the tag was already public
and had to be deleted and re-pushed by hand. Now the tag is the **last** thing that happens, so a
red build simply produces no release — fix and push again.

---

## How it fits together
- `capacitor.config.js` — the native shell (remote `server.url`, appId, UA tag). Deliberately
  CommonJS: a `.ts` config breaks `cap sync` on Node ≥ 22.12.
- `lib/platform.ts` / `lib/app-config.ts` / `lib/updates.ts` — platform detection, version source,
  and the GitHub-Releases update check.
- `components/download-android.tsx` — browser-only "Download" links (login + sidebar).
- `components/update-gate.tsx` — native-only "Update available" popup (Upgrade → download + install),
  plus the manual "Check for updates" button shown in **Settings → App & notifications**.
- `lib/native-push.ts` — registers the FCM token with `/api/notifications/register`.
- Backend `lib/fcm-send.ts` + `lib/push-send.ts` — fan notifications out to browser (Web Push) and
  Android (FCM). Notification icon = the logo silhouette (`android/.../ic_stat_notify`).

Regenerate every icon (web favicon/PWA + Android launcher, adaptive and notification) after
changing the logo: `npm run gen-icons`. The source of truth is
`public/brandImages/logo-master.jpg`.
