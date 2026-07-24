# RentMaster Android — setup & release guide

The Android app is a **Capacitor** shell that loads the live site in a native WebView, with
**FCM** push and an in-app **update popup** driven by **GitHub Releases**. Builds are produced by
GitHub Actions (`.github/workflows/android-release.yml`) — no local Android SDK needed.

Sections 0–3 are one-time setup.

---

## When do I need a new APK?

**Almost never — and there is only one codebase.**

This repo is the website, the PWA *and* the Android app. `capacitor.config.js` sets `server.url`,
so the APK is a thin shell whose WebView **loads the live site over the network** every time it
opens. The only web asset inside the ~5 MB APK is `capacitor-www/index.html`: a 909-byte spinner
shown for the moment before the real site loads. Your screens are not in the APK.

**Ships automatically, no APK:**

| You change | How users get it |
|---|---|
| The backend repo (`rent-master-pwa`) | Push → Vercel → everyone instantly: web, PWA and app alike. A backend change *never* needs an APK. |
| `app/`, `components/`, `lib/`, `types/` here | Push → Vercel → the app's WebView loads it on next open. |

The service worker uses `skipWaiting` + `clientsClaim` (`app/sw.ts`), so a new deploy takes over on
the next launch instead of waiting for tabs to close. Occasionally a user needs one relaunch.

**Needs a new APK — the native shell only:**

- `android/**` — permissions (`AndroidManifest.xml`), app icons and splash (`res/`), FCM config
  (`google-services.json`), Gradle/SDK bumps.
- `capacitor.config.js` — **especially the production URL.** If the domain moves, already-installed
  APKs keep pointing at the old one, and a release is the only way to redirect them.
- `package.json` — Capacitor plugin versions (`app`, `filesystem`, `push-notifications`,
  `file-opener`) and the `MAJOR.MINOR` the release number is built from.

CI decides this for you: it diffs the pushed range and only releases when one of those paths
changed. A web-only push finishes in seconds with the build skipped, and the run log says why.

**Overrides**, both read from the **first line** of the commit message:

- `[force apk]` — release anyway. Use it when a batch of web work deserves a "What's new" popup;
  users already have the changes, but the notes tell them what landed.
- `[skip apk]` — never release, even for a native change. Wins over everything.
- Actions tab → *Android Release* → **Run workflow** does the same as `[force apk]`, and is the only
  way to also get a Play Store `.aab`.

**Release numbers will have gaps** (`v1.1.12` → `v1.1.30`). The patch is the CI run number and
skipped runs still consume one. That's fine: `versionCode` only has to increase, never be
contiguous.

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

**1. Keep `RELEASE_NOTES.md` current as you go.**

That file *is* the GitHub Release body **and** the "What's new" list users read in the in-app
update popup. Because releases now happen only on native changes, it should describe everything
since the **last APK release** — which may be several pushes' worth. Write it for users, not for
yourself:

- One `- ` bullet per user-visible change; the popup renders each as a ticked line.
- **Plain text only — no `**bold**`.** The popup renders notes as plain text, so markdown emphasis
  shows up as literal asterisks on the phone.
- **No version heading.** The popup already titles itself "What's new in v1.1.x" and the release is
  named after the tag, so a hand-written version line only goes stale.

If a release happens and this file wasn't touched in that push, the build still succeeds but logs
a warning — and the release republishes the *previous* bullets, showing users changes they already
have.

**2. Push.**

```bash
git push origin main
```

If the push touched the native shell (see *When do I need a new APK?* above), CI builds a **signed
APK**, and only then creates the tag `v<version>` and a **GitHub Release** whose body is
`RELEASE_NOTES.md`. Otherwise it stops at the gate in a few seconds and Vercel alone ships the
change.

When a release does run, within a couple of minutes the APK is downloadable from the Releases page
(and from the in-app "Download / Upgrade" links), and installed apps see the **update popup** on
their next launch or foreground.

**Versioning is automatic.** `MAJOR.MINOR` comes from `package.json`; the patch number is the CI
run number, so numbers climb with gaps and nothing is bumped by hand. To start a new series, edit
`version` in `package.json` to e.g. `1.2.0` and push — that also counts as a native change, so it
releases immediately as `1.2.<run>`.

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
