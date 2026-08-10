"use client";

import { useEffect, useState } from "react";
import { reportClientError } from "../lib/client-log";

// =============================================================================
// Root-layout error boundary — the last line of defence.
//
// `app/error.tsx` covers everything rendered INSIDE the root layout, which is where crashes
// normally happen. This one catches the rarer case where the root layout itself fails, and Next
// replaces the entire document with it — no layout, no LanguageProvider, no globals.css.
//
// Which is why everything here is deliberately primitive: its own <html>/<body>, inline styles,
// no `t()`, no theme tokens, no imports beyond the reporter. A boundary that depends on the thing
// that just broke is not a boundary. English-only for the same reason — the translation context
// is one of the things that is gone.
// =============================================================================

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [reference] = useState(() => `ui_${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    reportClientError(error, {
      requestId: reference,
      extra: { kind: "render-global", digest: error.digest ?? null },
    });
  }, [error, reference]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f8fb",
          color: "#0f172a",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: "420px",
            width: "100%",
            textAlign: "center",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "32px",
          }}
        >
          <h1 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px" }}>
            Bari360 could not start
          </h1>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#475569", margin: "0 0 16px" }}>
            Something failed while loading the app. Your data is safe. Please reload — if this keeps
            happening, share the reference below with support.
          </p>
          <p
            style={{
              fontFamily: "ui-monospace, Menlo, monospace",
              fontSize: "12px",
              color: "#475569",
              background: "#f1f5f9",
              borderRadius: "8px",
              padding: "8px 12px",
              margin: "0 0 24px",
              userSelect: "all",
            }}
          >
            {reference}
          </p>
          <button
            onClick={reset}
            style={{
              width: "100%",
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#ffffff",
              background: "#136aba",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
