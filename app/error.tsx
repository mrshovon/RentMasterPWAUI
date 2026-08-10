"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RotateCw, Home } from "lucide-react";
import { reportClientError } from "../lib/client-log";
import { useT } from "../lib/i18n";

// =============================================================================
// Route-level error boundary.
//
// Until this existed, an uncaught render error produced a white screen: React unmounted the tree,
// Next had nothing to put in its place, and the only trace was a console line in a browser nobody
// would ever look at. The user's whole experience of the failure was that the app vanished.
//
// Now: a calm card, a way out, and a reference the admin can look up in the Logs tab.
//
// `global-error.tsx` is the sibling that catches failures in the root layout itself; this one
// covers everything below it, which is where crashes actually happen.
// =============================================================================

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  // Generated on the client so the same id is shown here and posted with the report.
  const [reference] = useState(() => `ui_${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    reportClientError(error, {
      requestId: reference,
      extra: { kind: "render", digest: error.digest ?? null },
    });
  }, [error, reference]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="card-surface w-full max-w-md p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
          <AlertTriangle className="h-6 w-6 text-danger" />
        </div>

        <h1 className="mt-5 text-lg font-bold text-heading">{t("Something went wrong")}</h1>
        <p className="mt-2 text-sm text-subtle">
          {t("This screen ran into an unexpected problem. Your data is safe — try again, and if it keeps happening, share the reference below with support.")}
        </p>

        <p className="mt-4 select-all rounded-lg bg-bg px-3 py-2 font-mono text-xs text-subtle">
          {reference}
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary px-4 py-2.5 text-sm font-semibold text-btn-ink transition hover:bg-primary/90"
          >
            <RotateCw className="h-4 w-4" />
            {t("Try again")}
          </button>
          <button
            onClick={() => window.location.replace("/")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-fg transition hover:bg-bg"
          >
            <Home className="h-4 w-4" />
            {t("Back to sign in")}
          </button>
        </div>
      </div>
    </div>
  );
}
