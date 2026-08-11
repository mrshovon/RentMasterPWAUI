// Native (Capacitor/Android) push registration via FCM. Runs ONLY inside the installed
// app; the browser keeps using Web Push (lib/push.ts). Gets an FCM token from the
// @capacitor/push-notifications plugin and registers it with the backend as an
// `android` device token, and deep-links the WebView when a notification is tapped.
//
// Plugins are imported dynamically so the browser bundle never evaluates native code.

import { isNativeApp } from "./platform";
import { getSessionToken, BACKEND_API_BASE } from "./api-service";
import { getStoredSound, playTone } from "./notification-sound";

let started = false;

export async function ensureNativePush(): Promise<void> {
  if (!isNativeApp() || started) return;
  started = true;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    // Request the OS notification permission (Android 13+ prompts here).
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") {
      started = false; // let a later attempt retry after the user enables it
      return;
    }

    await createSoundChannels(PushNotifications);

    // FCM token -> backend. Fires again automatically if the token rotates.
    await PushNotifications.addListener("registration", (token) => {
      void registerToken(token.value);
    });
    await PushNotifications.addListener("registrationError", (err) => {
      console.error("[native-push] registration error:", err);
    });

    // A push that lands while the app is OPEN. Android hands it to the plugin instead of the
    // notification tray, so nothing is drawn and nothing is played — the owner sitting on their
    // dashboard would otherwise never know a tenant had just filed something. Play the tone
    // ourselves, and only the brand one: 'default' is a system sound we have no way to reach from
    // here, and 'off' means off.
    await PushNotifications.addListener("pushNotificationReceived", () => {
      if (getStoredSound() === "custom") playTone();
    });

    // Tap on a notification -> deep-link the WebView to payload.data.url.
    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const url = (action.notification?.data?.url as string) || "/";
      if (typeof window !== "undefined" && url) window.location.href = url;
    });

    await PushNotifications.register();
  } catch (err) {
    console.error("[native-push] setup failed:", err);
    started = false;
  }
}

/**
 * Create one Android notification channel per sound option, so the backend can pick a sound by
 * naming a channel (see SOUND_CHANNELS in lib/fcm-send.ts on the backend — the ids must match
 * exactly, or the notification lands on an auto-created channel with default settings).
 *
 * ⚠️ Android freezes a channel's sound the moment it is created. Nothing can change it afterwards,
 * not an app update and not the user's setting — which is exactly why there are three channels
 * rather than one we reconfigure, and why the ids carry a `_v1`. Changing the brand tone later
 * means creating `bari360_tone_v2`; editing this is a no-op on every phone that already ran the app.
 *
 * `sound` resolves to res/raw/<name> — see android/app/src/main/res/raw/bari360_tone.mp3. The
 * plugin strips the extension itself.
 *
 * Safe to call on every launch: createChannel is an upsert, so this also self-heals after the user
 * clears app data. Failures are logged and swallowed — a missing channel costs the custom tone,
 * but push itself must still register.
 */
async function createSoundChannels(
  PushNotifications: typeof import("@capacitor/push-notifications")["PushNotifications"],
): Promise<void> {
  try {
    await PushNotifications.createChannel({
      id: "bari360_tone_v1",
      name: "Bari360 alerts",
      description: "Rent, invoice and maintenance alerts, with the Bari360 tone.",
      sound: "bari360_tone.mp3",
      importance: 5,
      visibility: 1,
      vibration: true,
    });
    await PushNotifications.createChannel({
      id: "bari360_default_v1",
      name: "Bari360 alerts (device tone)",
      description: "The same alerts, using your phone's own notification sound.",
      importance: 5,
      visibility: 1,
      vibration: true,
    });
    await PushNotifications.createChannel({
      id: "bari360_silent_v1",
      name: "Bari360 alerts (silent)",
      description: "The same alerts, with no sound. They still appear in your notification tray.",
      // IMPORTANCE_LOW. Android has no "notification without a sound" flag — silence IS the
      // importance level, so this is the only way to honour the Off setting on Android 8+.
      importance: 2,
      visibility: 1,
      vibration: false,
    });
  } catch (err) {
    console.error("[native-push] could not create notification channels:", err);
  }
}

async function registerToken(token: string): Promise<void> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const session = getSessionToken();
    if (session) headers["Authorization"] = `Bearer ${session}`;
    await fetch(`${BACKEND_API_BASE}/api/notifications/register`, {
      method: "POST",
      headers,
      body: JSON.stringify({ token, deviceDetails: "android" }),
    });
  } catch (err) {
    console.error("[native-push] token registration failed:", err);
  }
}
