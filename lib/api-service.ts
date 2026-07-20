// =============================================================================
// Centralized fetch engine that talks to the RentMaster backend (rent-master-pwa).
// The backend runs on :3000, this UI on :3001. CORS + header-based identity
// injection is handled by the backend middleware.
// =============================================================================

export const BACKEND_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

// Demo identities (backend middleware currently runs in BYPASS_FOR_TESTING mode
// and expects these header-injected UUIDs).
export const DEMO_OWNER_ID = "0fc9f350-95ca-4a38-8d2b-56eb5c761bb8";
export const DEMO_TENANT_ID = "1b2a02cb-c78f-49a6-8b49-c1a211efbb59";

interface FetchOptions extends RequestInit {
  role?: "owner" | "tenant" | "admin";
}

// Errors carry the HTTP status and the backend's machine-readable `code` when it sends one
// (SUBSCRIPTION_LOCKED, ITEM_DISABLED, LIMIT_REACHED, LOGIN_BLOCKED, …), so callers can branch
// on *why* a call failed instead of string-matching the message.
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const SESSION_KEY = "rentmaster_session";

// The shape we persist in localStorage. `refreshToken`/`expiresAt` are present for owner/admin
// (Supabase) sessions and drive silent token renewal; tenants have a long-lived JWT and neither.
export interface StoredSession {
  role: "owner" | "tenant" | "admin";
  userId: string;
  name: string;
  token?: string;
  refreshToken?: string;
  expiresAt?: number; // unix seconds (Supabase session.expires_at)
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

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

// Reads the real access token (if the user logged in) from localStorage.
export function getSessionToken(): string | null {
  return getStoredSession()?.token || null;
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

// Owner self-signup → creates an auto-confirmed owner and returns a session (same shape as
// apiLogin) so the caller can persist() and land on /owner. Throws with the backend's message.
export async function apiSignup(payload: {
  name: string; email: string; phone?: string; password: string;
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
  const { role = "owner", folder } = opts;

  const form = new FormData();
  form.append("file", file);
  if (folder) form.append("folder", folder);

  // Real token if logged in; else demo identity header. Let the browser set the
  // multipart Content-Type/boundary.
  const headers = new Headers();
  const token = getSessionToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  else if (role === "tenant") headers.set("x-rentmaster-tenant-id", DEMO_TENANT_ID);
  else headers.set("x-rentmaster-uid", DEMO_OWNER_ID);

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
  const { role = "owner", ...nativeOptions } = options;
  const targetUrl = `${BACKEND_API_BASE}${endpoint}`;

  // Builds headers for one attempt, using the given bearer token (or demo identity fallback).
  function buildHeaders(bearer: string | null): Headers {
    const headers = new Headers(nativeOptions.headers);
    headers.set("Content-Type", "application/json");
    if (bearer) {
      headers.set("Authorization", `Bearer ${bearer}`);
    } else if (role === "tenant") {
      headers.set("x-rentmaster-tenant-id", DEMO_TENANT_ID);
    } else {
      headers.set("x-rentmaster-uid", DEMO_OWNER_ID);
    }
    return headers;
  }

  async function attempt(bearer: string | null): Promise<Response> {
    return fetch(targetUrl, { ...nativeOptions, headers: buildHeaders(bearer), cache: "no-store" });
  }

  try {
    let response = await attempt(getSessionToken());

    // Access token expired: try one silent refresh, then retry the request. If refresh fails,
    // the session is dead — clear it and bounce to login (owner/admin only; tenants have no
    // refresh token so this is skipped).
    if (response.status === 401 && getStoredSession()?.refreshToken) {
      const fresh = await refreshAccessToken();
      if (fresh) {
        response = await attempt(fresh);
      } else {
        clearSession();
        if (typeof window !== "undefined" && window.location.pathname !== "/") {
          window.location.replace("/");
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `Request failed (${response.status}) — ${endpoint}`,
        response.status,
        errorData.code
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
    console.error(`[API] ${endpoint} —`, error.message);
    throw error;
  }
}
