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

// Reads the real session token (if the user logged in) from localStorage.
export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("rentmaster_session") || "{}").token || null;
  } catch {
    return null;
  }
}

// Real login → returns { token, role, id, name }. Throws on bad credentials.
export async function apiLogin(payload: {
  mode: "owner" | "admin" | "tenant";
  email?: string; password?: string; phone?: string; passcode?: string;
}): Promise<{ token: string; role: string; id: string; name: string }> {
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

  const headers = new Headers(nativeOptions.headers);
  headers.set("Content-Type", "application/json");

  // Real session token when logged in; otherwise fall back to demo identity headers
  // (the backend keeps BYPASS_FOR_TESTING as a fallback for the one-click demo).
  const token = getSessionToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else if (role === "tenant") {
    headers.set("x-rentmaster-tenant-id", DEMO_TENANT_ID);
  } else {
    headers.set("x-rentmaster-uid", DEMO_OWNER_ID);
  }

  const targetUrl = `${BACKEND_API_BASE}${endpoint}`;

  try {
    const response = await fetch(targetUrl, {
      ...nativeOptions,
      headers,
      cache: "no-store",
    });

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
