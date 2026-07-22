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

export type PushPermission = "granted" | "default" | "denied" | "unsupported";

/** What the browser currently allows, without prompting. */
export function getPushPermission(): PushPermission {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window) ||
    !VAPID_PUBLIC_KEY
  ) {
    return "unsupported";
  }
  return Notification.permission as PushPermission;
}

/**
 * Ensure a push subscription exists and is registered with the backend. Idempotent and
 * safe to call on every login *and* on every dashboard mount — the latter is what heals a
 * device whose earlier registration failed (a subscription can exist in the browser while
 * the backend has no record of it, e.g. if the register call was blocked by CORS).
 *
 * `token` is the Bearer session token needed to authenticate the register call.
 * Pass `prompt: false` to skip devices that haven't granted permission yet, so a silent
 * background re-registration never triggers a permission dialog out of nowhere.
 */
export async function ensurePushSubscription(
  token?: string,
  { prompt = true }: { prompt?: boolean } = {},
): Promise<void> {
  try {
    if (getPushPermission() === "unsupported") return;
    if (!prompt && Notification.permission !== "granted") return;

    // The SW is disabled in `next dev`; `ready` never resolves there, so bail instead of
    // hanging. A cold PWA start on Android can take a few seconds to activate the worker.
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000)),
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

    const res = await fetch(`${BACKEND_API_BASE}/api/notifications/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        // Always "web": this is a Web Push subscription whatever OS the browser runs on.
        // This used to send the operating system, so a PWA on Android registered as
        // "android" — the label the backend reserves for native FCM tokens — and its
        // notifications were routed to FCM and never delivered. The native app registers
        // through lib/native-push.ts, which is the only thing that may claim "android".
        subscription,
        deviceDetails: "web",
      }),
    });

    // Don't fail the caller, but don't vanish either: a silent register failure here is
    // exactly how push ends up dead with no trace.
    if (!res.ok) {
      console.error(`[push] register failed (${res.status}):`, await res.text().catch(() => ""));
    }
  } catch (err) {
    // Never let push setup break the login or dashboard render.
    console.warn("[push] subscription skipped:", err);
  }
}
