// Client-side Web Push (VAPID) subscription — no Firebase. Subscribes the browser to
// push via the Serwist-registered service worker and registers it with the backend.
import { BACKEND_API_BASE } from "./api-service";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  // Back the array with an explicit ArrayBuffer so it satisfies BufferSource (not SharedArrayBuffer).
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * Ensure a push subscription exists and is registered with the backend. Safe to call on
 * every login — it's idempotent and fails silently if unsupported / permission denied.
 * `token` is the Bearer session token needed to authenticate the register call.
 */
export async function ensurePushSubscription(token?: string): Promise<void> {
  try {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window) ||
      !VAPID_PUBLIC_KEY
    ) {
      return;
    }

    // The SW is disabled in `next dev`; `ready` never resolves there, so bail after a
    // short wait instead of hanging the login flow.
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);
    if (!registration) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    await fetch(`${BACKEND_API_BASE}/api/notifications/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        subscription,
        deviceDetails: /Android/i.test(navigator.userAgent) ? "android" : "web",
      }),
    });
  } catch (err) {
    // Never let push setup break the login flow.
    console.warn("[push] subscription skipped:", err);
  }
}
