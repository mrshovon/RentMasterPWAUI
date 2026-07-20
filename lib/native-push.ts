// Native (Capacitor/Android) push registration via FCM. Runs ONLY inside the installed
// app; the browser keeps using Web Push (lib/push.ts). Gets an FCM token from the
// @capacitor/push-notifications plugin and registers it with the backend as an
// `android` device token, and deep-links the WebView when a notification is tapped.
//
// Plugins are imported dynamically so the browser bundle never evaluates native code.

import { isNativeApp } from "./platform";
import { getSessionToken, BACKEND_API_BASE } from "./api-service";

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

    // FCM token -> backend. Fires again automatically if the token rotates.
    await PushNotifications.addListener("registration", (token) => {
      void registerToken(token.value);
    });
    await PushNotifications.addListener("registrationError", (err) => {
      console.error("[native-push] registration error:", err);
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
