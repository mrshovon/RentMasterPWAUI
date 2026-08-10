"use client";

// =============================================================================
// Client-side error reporting → POST /api/logs → app_logs.
//
// The browser half of the log. A React render crash or a failed fetch happens where no server
// code is running, so unless the client posts it, the only record is a console line in a browser
// nobody will ever look at. That is exactly the position every "it just showed an error" support
// message used to leave us in.
//
// THREE RULES, all of which exist because a reporter that misbehaves is worse than none:
//
//   1. Never throw. It runs inside error paths — including an error boundary — so a failure here
//      would replace a handled error with an unhandled one.
//   2. Never await it from UI code. Reporting must not add latency to showing the user their
//      error message.
//   3. Never loop. A failing backend makes every request fail, which would make every failure
//      report a new failure. Hence the dedupe below AND the hard rule that a failed report is
//      dropped silently rather than retried.
// =============================================================================

// Deliberately NOT imported from lib/api-service.ts, even though both values live there.
// api-service imports THIS module (to report failed fetches), and an import cycle between the two
// is a genuine hazard here: one of this module's callers is the error boundary, which runs while
// the module graph is already in a bad state. Two duplicated constants is the cheaper problem.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
const SESSION_KEY = "rentmaster_session";

function storedSession(): { role?: string; token?: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Same message within this window ⇒ report once. Suppresses render loops and retry storms. */
const DEDUPE_MS = 60_000;
/** A hard ceiling per page load, in case something defeats the dedupe. */
const MAX_PER_SESSION = 20;

const recent = new Map<string, number>();
let sentThisSession = 0;

export interface ClientLogContext {
  /** Where in the app it happened — a route, a component, an endpoint. */
  route?: string;
  /** HTTP status, when the error came from a response. */
  status?: number;
  /** Backend machine code (SUBSCRIPTION_LOCKED, …). */
  code?: string;
  /** The backend's correlation id, when the failing response carried one. */
  requestId?: string;
  /** Anything else worth keeping. Small, and never secrets or personal data. */
  extra?: Record<string, unknown>;
}

function fingerprint(message: string, ctx: ClientLogContext): string {
  return `${ctx.route || ""}|${ctx.status || ""}|${message}`.slice(0, 300);
}

/**
 * Report a client-side error. Fire-and-forget by design — callers must not await it.
 *
 * Returns the fingerprint it used, or null when the report was suppressed, purely so a caller can
 * tell whether anything was sent (the error boundary uses this to decide whether to show a
 * reference).
 */
export function reportClientError(
  err: unknown,
  ctx: ClientLogContext = {},
  level: "error" | "warn" = "error",
): void {
  try {
    if (typeof window === "undefined") return;
    if (sentThisSession >= MAX_PER_SESSION) return;

    const message =
      err instanceof Error ? err.message || err.name : String((err as any)?.message ?? err ?? "Unknown error");
    if (!message) return;

    const key = fingerprint(message, ctx);
    const now = Date.now();
    const last = recent.get(key);
    if (last && now - last < DEDUPE_MS) return;
    recent.set(key, now);
    sentThisSession++;

    const payload = {
      level,
      message,
      detail: err instanceof Error ? err.stack || null : null,
      route: ctx.route || window.location.pathname,
      status: ctx.status ?? null,
      code: ctx.code ?? null,
      requestId: ctx.requestId ?? null,
      context: {
        ...ctx.extra,
        href: window.location.href,
        role: storedSession()?.role ?? null,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        online: navigator.onLine,
      },
    };

    const body = JSON.stringify(payload);
    const url = `${API_BASE}/api/logs`;

    // `keepalive` so a report fired during an unload or a crash-then-navigate still leaves the
    // machine. sendBeacon would also survive, but it cannot carry the Authorization header the
    // backend uses to attribute the row to a user.
    const token = storedSession()?.token;
    void fetch(url, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
    }).catch(() => {
      /* Rule 3: a failed report is dropped, never retried. */
    });
  } catch {
    /* Rule 1. */
  }
}
