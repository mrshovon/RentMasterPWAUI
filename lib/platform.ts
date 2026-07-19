// =============================================================================
// Runtime platform detection — distinguishes the native Capacitor Android app
// from a normal browser (or installed PWA). Used to:
//   - show "Download Android app" ONLY in a browser (not inside the app)
//   - run the in-app update popup ONLY inside the native app
// Capacitor injects `window.Capacitor` with isNativePlatform(); we fall back to a
// UA token for safety. All guards are SSR-safe (return false on the server).
// =============================================================================

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

function cap(): CapacitorGlobal | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

// True inside the installed native (Capacitor) app.
export function isNativeApp(): boolean {
  const c = cap();
  if (c?.isNativePlatform?.()) return true;
  // Fallback: our Android build appends a UA token (see capacitor.config appendUserAgent).
  if (typeof navigator !== "undefined" && /RentMasterApp/i.test(navigator.userAgent)) return true;
  return false;
}

// "android" | "ios" | "web".
export function getPlatform(): string {
  const c = cap();
  if (c?.getPlatform) return c.getPlatform();
  if (typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent)) return "android";
  return "web";
}

export function isAndroid(): boolean {
  return getPlatform() === "android";
}

// True in a plain browser (where we surface the download-the-app affordance).
export function isBrowser(): boolean {
  return typeof window !== "undefined" && !isNativeApp();
}
