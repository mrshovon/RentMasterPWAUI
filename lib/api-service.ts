// =============================================================================
// Centralized fetch engine that talks to the Bari360 backend (rent-master-pwa).
// The backend runs on :3000, this UI on :3001. CORS + header-based identity
// injection is handled by the backend middleware.
//
// There is NO unauthenticated fallback identity. An earlier revision sent hardcoded demo UUIDs
// in x-rentmaster-uid / x-rentmaster-tenant-id whenever no token was present, pairing with the
// backend's BYPASS_FOR_TESTING switch. That switch is off and the middleware strips
// client-supplied identity headers, so the fallback could never actually authenticate — but it
// did mean a signed-out client kept firing requests that merely 401'd instead of failing
// loudly, which is part of how a logged-out dashboard came to look alive. No token now means no
// request: see requireToken() below.
// =============================================================================

import { reportClientError } from "./client-log";
import { LEGAL_VERSION } from "../content/legal/generated";
import type { PublicPlan } from "../types/api";

export const BACKEND_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

interface FetchOptions extends RequestInit {
  role?: "owner" | "tenant" | "admin";
}

// Errors carry the HTTP status and the backend's machine-readable `code` when it sends one
// (SUBSCRIPTION_LOCKED, ITEM_DISABLED, LIMIT_REACHED, LOGIN_BLOCKED, …), so callers can branch
// on *why* a call failed instead of string-matching the message.
export class ApiError extends Error {
  status: number;
  code?: string;
  /**
   * The backend's correlation id for this failure (`req_7f3k9q`). Present on 5xx, where the
   * message is deliberately generic and the real detail lives in app_logs under this id — so
   * quoting it to support is the only way back to what actually went wrong.
   */
  requestId?: string;
  constructor(message: string, status: number, code?: string, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

// -----------------------------------------------------------------------------
// ENTITLEMENT INVALIDATION
//
// The server is always right about a plan — the token carries no plan claims, so every request is
// evaluated against current state. The client is the part that goes stale: `plan` is fetched once
// into React state and, until this existed, never refetched. An owner whose plan lapsed, or whose
// add-on an admin revoked, kept the UI perks for the rest of the session while every write
// silently 403'd underneath.
//
// These codes ARE the invalidation signal. If the server just refused a write on entitlement
// grounds, the UI's copy of the plan is provably out of date, and the cheapest possible correction
// is to refetch it right then. No polling interval catches this as fast, because the user pressing
// the button is the event.
//
// A module-level pub/sub rather than an import of the hook: lib/use-plan.ts imports THIS file, so
// calling into it from here would be a cycle.
// -----------------------------------------------------------------------------
const ENTITLEMENT_CODES = new Set([
  "SUBSCRIPTION_LOCKED",
  "ITEM_DISABLED",
  "LIMIT_REACHED",
  "FEATURE_NOT_ENABLED",
]);

type EntitlementListener = (code: string) => void;
const entitlementListeners = new Set<EntitlementListener>();

/** Subscribe to "the server says your entitlements changed". Returns an unsubscribe function. */
export function onEntitlementChange(fn: EntitlementListener): () => void {
  entitlementListeners.add(fn);
  return () => entitlementListeners.delete(fn);
}

function notifyEntitlementChange(code: string): void {
  for (const fn of entitlementListeners) {
    try { fn(code); } catch { /* a bad listener must not break the fetch that found this */ }
  }
}

const SESSION_KEY = "rentmaster_session";

// The shape we persist in localStorage. `refreshToken`/`expiresAt` are present for owner/admin
// (Supabase) sessions and drive silent token renewal; tenants have a long-lived JWT and neither.
export interface StoredSession {
  // "building" is the BUILDING ADMIN. The auth metadata role is `building_admin`; it is stored
  // in the short form here because this value doubles as the dashboard route segment
  // (`window.location.replace("/" + role)`), and `/building_admin` is not a URL anyone wants.
  role: "owner" | "tenant" | "admin" | "building";
  userId: string;
  name: string;
  token?: string;
  refreshToken?: string;
  expiresAt?: number; // unix seconds (Supabase session.expires_at)
}

/**
 * Map the role the backend reports (straight from auth user_metadata) to the role we store —
 * which doubles as the dashboard route segment, so `building_admin` becomes `building`.
 *
 * Anything unrecognised falls back to "owner", which is what the login page did before this
 * existed and what middleware does server-side.
 */
export function sessionRoleFor(authRole: string | null | undefined): StoredSession["role"] {
  switch (authRole) {
    case "admin": return "admin";
    case "tenant": return "tenant";
    case "building_admin":
    case "building": return "building";
    default: return "owner";
  }
}

export function getStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function setStoredSession(session: StoredSession): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* ignore */ }
}

// Kept in sync with the cacheName in app/sw.ts. Not renamed with the Bari360 rebrand: it names
// a cache bucket already sitting in every existing user's browser, and changing it would orphan
// those rather than clear them.
const API_CACHE_NAME = "rentmaster-api-get";

// The service worker keeps a network-first cache of every API GET (see app/sw.ts). It is keyed
// on URL alone with no notion of who asked, so leaving it in place after sign-out lets the next
// person on the device read the previous user's data whenever the network is slow or offline.
// Best-effort: no SW in dev, and an older browser without Cache Storage simply skips this.
export async function purgeApiCache(): Promise<void> {
  if (typeof caches === "undefined") return;
  try { await caches.delete(API_CACHE_NAME); } catch { /* ignore */ }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  void purgeApiCache();
}

// Bounce to the sign-in screen. `replace` so the dashboard we are leaving cannot be reached
// again with Back — the whole point of this module's session handling.
export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== "/") window.location.replace("/");
}

// Reads the real access token (if the user logged in) from localStorage.
export function getSessionToken(): string | null {
  return getStoredSession()?.token || null;
}

// Asserts a token exists before a request goes out. Called when we have already tried to
// refresh, so reaching here means the session is genuinely gone: tear down what is left and
// bounce, rather than sending an anonymous request that would only 401.
function requireToken(token: string | null): string {
  if (token) return token;
  clearSession();
  redirectToLogin();
  throw new ApiError("Your session has expired. Please sign in again.", 401);
}

// Single-flight refresh: concurrent callers share one in-flight request so we never send the
// (rotating) refresh token twice in parallel, which Supabase would treat as reuse and revoke.
let refreshInFlight: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const session = getStoredSession();
    if (!session?.refreshToken) return null; // tenants / no refresh token -> can't refresh
    try {
      const res = await fetch(`${BACKEND_API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success || !json.token) {
        clearSession();
        return null;
      }
      setStoredSession({
        ...session,
        token: json.token,
        refreshToken: json.refreshToken ?? session.refreshToken,
        expiresAt: json.expiresAt ?? session.expiresAt,
      });
      return json.token as string;
    } catch {
      // Network error — keep the session (don't log the user out over a blip).
      return session.token || null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

// Returns a currently-valid access token, refreshing first if it's expired/near expiry.
// Returns null if there's no session or the refresh failed (caller should treat as logged out).
export async function ensureValidToken(): Promise<string | null> {
  const session = getStoredSession();
  if (!session) return null;
  if (session.refreshToken && session.expiresAt) {
    const now = Math.floor(Date.now() / 1000);
    if (session.expiresAt - now <= 60) {
      return refreshAccessToken();
    }
  }
  return session.token || null;
}

// Real login → returns { token, refreshToken?, expiresAt?, role, id, name }. Throws on bad creds.
export async function apiLogin(payload: {
  mode: "owner" | "admin" | "tenant";
  email?: string; password?: string; phone?: string; passcode?: string;
}): Promise<{ token: string; refreshToken?: string; expiresAt?: number; role: string; id: string; name: string }> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(`Cannot reach backend at ${BACKEND_API_BASE}. Is the API server running on :3000?`);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new ApiError(json.error || "Login failed.", res.status, json.code);
  }
  return json;
}

// Which edition of the Terms and Privacy Policy is currently published. Public endpoint — the
// signup form needs this before any account exists. Falls back to the version compiled into the
// documents themselves, so a failed read never blocks signup; the backend applies the same
// fallback, so the two agree.
export async function apiTermsVersion(): Promise<string> {
  try {
    const res = await fetch(`${BACKEND_API_BASE}/api/app/terms-version`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    const version = json?.data?.version;
    return typeof version === "string" && version.trim() ? version.trim() : LEGAL_VERSION;
  } catch {
    return LEGAL_VERSION;
  }
}

// The admin's edited text for one legal document, or null when nothing has been saved and the
// compiled edition in content/legal/generated.ts is still what should be shown.
//
// Public endpoint — /privacy and /terms are readable signed out, which Google Play requires. Every
// failure path returns null rather than throwing, because the caller already holds a complete
// document: a backend that is down must leave the published policy readable, not blank.
export async function apiLegalDoc(
  doc: "privacy" | "terms",
  lang: "en" | "bn",
): Promise<string | null> {
  try {
    const res = await fetch(
      `${BACKEND_API_BASE}/api/app/legal?doc=${doc}&lang=${lang}`,
      { cache: "no-store" },
    );
    const json = await res.json().catch(() => ({}));
    const markdown = json?.markdown;
    return typeof markdown === "string" && markdown.trim() ? markdown : null;
  } catch {
    return null;
  }
}

// The publicly listed plans, for /plans. Public endpoint — a prospect has no account. Returns an
// empty list on any failure; the page renders its own "unavailable" state rather than an error,
// which is a better public face and still leaves the contact route open.
export async function apiPublicPlans(): Promise<PublicPlan[]> {
  try {
    const res = await fetch(`${BACKEND_API_BASE}/api/app/plans`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    return Array.isArray(json?.data) ? (json.data as PublicPlan[]) : [];
  } catch {
    return [];
  }
}

// A "Contact us" enquiry from the public pricing page. Unlike the two helpers above this one
// THROWS: a person filling in a form has to be told whether it was sent.
export async function apiPublicContact(payload: {
  name: string; email: string; phone: string; tierId?: string; message: string;
}): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_API_BASE}/api/app/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(`Cannot reach backend at ${BACKEND_API_BASE}. Is the API server running on :3000?`);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new ApiError(json.error || "Could not send your message.", res.status, json.code);
  }
}

// Owner self-signup → creates an auto-confirmed owner and returns a session (same shape as
// apiLogin) so the caller can persist() and land on /owner. Throws with the backend's message.
export async function apiSignup(payload: {
  name: string; email: string; phone?: string; password: string;
  // Consent, recorded server-side in terms_acceptances. `termsVersion` is the edition the form
  // actually displayed, echoed back so the stored record names the text this person was shown.
  // The backend refuses with TERMS_NOT_ACCEPTED unless acceptedTerms is literally true.
  acceptedTerms: boolean; termsVersion: string;
}): Promise<{ token: string; refreshToken?: string; expiresAt?: number; role: string; id: string; name: string }> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(`Cannot reach backend at ${BACKEND_API_BASE}. Is the API server running on :3000?`);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new ApiError(json.error || "Sign up failed.", res.status, json.code);
  }
  return json;
}

// Tell the backend to revoke the session server-side. Without this, signing out only forgets
// the tokens locally — a refresh token copied out of localStorage beforehand would keep working
// until it expired. Best-effort and deliberately un-awaited by callers: a failed or slow call
// must never stop someone signing out.
export async function apiLogout(): Promise<void> {
  const session = getStoredSession();
  if (!session?.token) return;
  try {
    await fetch(`${BACKEND_API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: session.token, refreshToken: session.refreshToken }),
      keepalive: true, // survives the navigation away that follows immediately
    });
  } catch {
    /* offline or backend down — the local session is cleared regardless */
  }
}

// Request a password-reset email (owner self-service). The backend always returns a generic
// success even if the email doesn't exist, so this never reveals whether an account is present.
export async function apiForgotPassword(email: string): Promise<void> {
  try {
    await fetch(`${BACKEND_API_BASE}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new Error(`Cannot reach backend at ${BACKEND_API_BASE}. Is the API server running on :3000?`);
  }
}

// After the reset page changes the password via the Supabase recovery session, tell the backend
// so it can write the audit-log row. Best-effort — a failure here must not block the user.
export async function apiResetComplete(accessToken: string): Promise<void> {
  try {
    await fetch(`${BACKEND_API_BASE}/api/auth/reset-complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });
  } catch {
    /* non-fatal: the password change already succeeded on Supabase */
  }
}

// Multipart file upload — cannot go through rentMasterFetch (which forces a JSON
// content-type). Sends the file to the backend storage route and returns the public URL.
export async function uploadFile(
  file: File,
  opts: { role?: "owner" | "tenant"; folder?: string } = {}
): Promise<string> {
  // `role` is accepted for call-site symmetry with rentMasterFetch but no longer read: the
  // backend derives identity from the bearer token, never from a caller-supplied role.
  const { folder } = opts;

  const form = new FormData();
  form.append("file", file);
  if (folder) form.append("folder", folder);

  // Refresh first if the token is stale, then require one. Let the browser set the multipart
  // Content-Type/boundary itself — setting it by hand drops the boundary and the upload fails.
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${requireToken(await ensureValidToken())}`);

  let response: Response;
  try {
    response = await fetch(`${BACKEND_API_BASE}/api/admin/uploads`, {
      method: "POST",
      headers,
      body: form,
      cache: "no-store",
    });
  } catch {
    throw new Error(
      `Cannot reach backend at ${BACKEND_API_BASE}. Is the API server running on :3000?`
    );
  }

  // Same treatment as rentMasterFetch: a 401 here means the session died mid-upload, so end it
  // rather than leaving the user on a dashboard that can no longer do anything.
  if (response.status === 401) {
    clearSession();
    redirectToLogin();
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.success) {
    throw new Error(json.error || `Upload failed (${response.status}).`);
  }
  return json.url as string;
}

export async function rentMasterFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  // `role` is no longer read — identity comes from the bearer token alone. Kept in the options
  // type so the ~200 existing call sites that pass it still typecheck.
  const { role: _role, ...nativeOptions } = options;
  const targetUrl = `${BACKEND_API_BASE}${endpoint}`;

  function buildHeaders(bearer: string): Headers {
    const headers = new Headers(nativeOptions.headers);
    headers.set("Content-Type", "application/json");
    headers.set("Authorization", `Bearer ${bearer}`);
    return headers;
  }

  async function attempt(bearer: string): Promise<Response> {
    return fetch(targetUrl, { ...nativeOptions, headers: buildHeaders(bearer), cache: "no-store" });
  }

  try {
    // Throws (and bounces) when there is no session at all, so a signed-out page can never sit
    // there quietly firing anonymous requests.
    let response = await attempt(requireToken(await ensureValidToken()));

    // 401 after a valid-looking token: try one silent refresh and retry.
    //
    // The refresh attempt used to be gated on `getStoredSession()?.refreshToken`, which meant
    // the whole branch — including the bounce to login — was skipped for tenants (who have no
    // refresh token) and for anyone already signed out. They stayed on a dead dashboard
    // collecting error toasts. Now the 401 always ends the session; only the refresh attempt
    // itself is conditional.
    if (response.status === 401) {
      const fresh = getStoredSession()?.refreshToken ? await refreshAccessToken() : null;
      if (fresh) {
        response = await attempt(fresh);
      }
      if (response.status === 401) {
        clearSession();
        redirectToLogin();
        throw new ApiError("Your session has expired. Please sign in again.", 401);
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // The server refused on entitlement grounds ⇒ our copy of the plan is stale. Tell whoever
      // holds it to refetch, before the error is thrown and the caller turns it into a toast.
      if (errorData.code && ENTITLEMENT_CODES.has(errorData.code)) {
        notifyEntitlementChange(errorData.code);
      }

      throw new ApiError(
        errorData.error || `Request failed (${response.status}) — ${endpoint}`,
        response.status,
        errorData.code,
        errorData.requestId
      );
    }

    return (await response.json()) as T;
  } catch (error: any) {
    // Surface a friendlier message when the backend simply isn't running.
    if (error?.message === "Failed to fetch") {
      throw new Error(
        `Cannot reach backend at ${BACKEND_API_BASE}. Is the API server running on :3000?`
      );
    }
    // Optional-chained: a thrown null would otherwise throw again here, inside the catch,
    // and the caller's toast would never fire at all.
    console.error(`[API] ${endpoint} —`, error?.message);

    // Tee it into app_logs — but only what a log can actually help with.
    //
    // 401 is skipped: it is the ordinary end of a session, already handled above by signing the
    // user out, and logging it would bury the real failures under routine expiry. A 5xx already
    // wrote its own row server-side, so what is recorded here is the CLIENT's view of it — which
    // is worth having, because it carries the route, the viewport and whether the browser thought
    // it was online, none of which the server can see.
    if (error?.status !== 401) {
      reportClientError(error, {
        route: endpoint,
        status: error?.status,
        code: error?.code,
        requestId: error?.requestId,
        extra: { kind: "fetch" },
      });
    }
    throw error;
  }
}
