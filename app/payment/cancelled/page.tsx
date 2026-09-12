"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button, Card, Spinner, WordmarkLink } from "../../../components/ui";
import { rentMasterFetch, BACKEND_API_BASE } from "../../../lib/api-service";
import { useAutoReturn } from "../../../lib/use-auto-return";
import { useT } from "../../../lib/i18n";

// =====================================================================================
// Registered as `cancel_url` on every charge — where the gateway drops someone who backed out.
//
// This page used to write nothing, on the reasoning that a cancelled checkout moved no money and
// so had nothing to reconcile. That was wrong, and in the one direction that hurt: the checkout
// route creates its pending payment_submissions row BEFORE the redirect, so backing out left that
// row at 'pending' forever — telling the owner "we've received your payment", putting a decision
// in the super admin's queue for a payment that never happened, and tripping the
// one-pending-at-a-time rule so the owner could not start another payment AT ALL.
//
// ⭐ WHY THIS PAGE CANNOT USE rentMasterFetch FOR THE CANCEL.
// On Android the gateway does not run in our app. Capacitor punts any off-origin navigation to
// Chrome, so by the time this page loads the payer is in a different browser with a different
// localStorage and NO session. rentMasterFetch would find no token, call redirectToLogin(), and
// `window.location.replace("/")` — throwing the payer onto the sign-in screen before they read a
// word of this page, with the pending row still stuck. That bounce is the bug being reported.
//
// So the link signs itself instead: the checkout route appends ?ref=&sig= and the PUBLIC route at
// /api/payments/uddoktapay/cancel verifies the signature. See lib/payments/cancel-token.ts. The
// authenticated route is kept only for payments started before that shipped, whose cancel_url has
// no signature — those still work when this page happens to have a session.
//
// ⚠️ 'completed' is not a paranoid branch. The webhook races this page by design, and someone can
// reach /payment/cancelled after actually paying (a stale tab, a back button). Claiming "cancelled"
// there would tell someone their money had been refused when their plan had just gone live.
// =====================================================================================

type Outcome = "cancelled" | "nothing_to_cancel" | "completed" | "unknown";

/** Long enough to read the two sentences above it, short enough not to feel stuck. */
const RETURN_SECONDS = 30;

function CancelledInner() {
  const t = useT();
  const params = useSearchParams();
  const ref = params.get("ref") || "";
  const sig = params.get("sig") || "";

  const [loading, setLoading] = useState(true);
  const [outcome, setOutcome] = useState<Outcome>("unknown");
  // React 18 StrictMode mounts effects twice in development. The second call is harmless — it
  // matches zero rows and answers 'nothing_to_cancel' — but that reads like a fault. One per mount,
  // the same guard app/payment/return/page.tsx uses.
  const asked = useRef(false);

  useEffect(() => {
    if (asked.current) return;
    asked.current = true;

    (async () => {
      try {
        if (ref && sig) {
          // The signed path. Plain fetch on purpose — see the note above about rentMasterFetch.
          const res = await fetch(`${BACKEND_API_BASE}/api/payments/uddoktapay/cancel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ref, sig }),
            cache: "no-store",
          });
          const json = await res.json().catch(() => null);
          setOutcome(json?.data?.outcome ?? "unknown");
        } else {
          // No signature: a payment started before signed links shipped. Needs a session, and only
          // has one when this page opened inside the app or the same browser.
          const res = await rentMasterFetch<{ data: { outcome: Outcome } }>(
            "/api/admin/payments/uddoktapay/cancel",
            { method: "POST", role: "owner" },
          );
          setOutcome(res.data?.outcome ?? "unknown");
        }
      } catch {
        // Nothing was charged either way, so there is nothing alarming to report. The stale-attempt
        // sweep in the checkout route clears the row on their next try regardless.
        setOutcome("unknown");
      } finally {
        setLoading(false);
      }
    })();
  }, [ref, sig]);

  const paid = outcome === "completed";
  // Parked until the answer is on screen, so the page never navigates out from under a spinner.
  const secondsLeft = useAutoReturn("/owner#plan", RETURN_SECONDS, !loading);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-4">
      <Card className="w-full max-w-md space-y-5 p-7 text-center">
        <div className="flex justify-center"><WordmarkLink className="h-7" /></div>
        <div className="flex justify-center">
          {loading
            ? <Loader2 className="h-12 w-12 animate-spin text-muted" aria-hidden />
            : paid
              ? <CheckCircle2 className="h-12 w-12 text-success" aria-hidden />
              : <XCircle className="h-12 w-12 text-muted" aria-hidden />}
        </div>

        <h1 className="font-display text-2xl font-extrabold text-heading">
          {loading ? t("Cancelling…") : paid ? t("Your payment went through") : t("Payment cancelled")}
        </h1>

        <p className="text-sm text-muted">
          {loading
            ? t("One moment — we are releasing your payment attempt.")
            : paid
              ? t("This payment completed before it was cancelled, so your plan is active. Nothing further is needed.")
              : t("Nothing has been charged and your plan has not changed. You can try again whenever you are ready.")}
        </p>

        <div className="space-y-2">
          <Button className="w-full" onClick={() => window.location.replace("/owner#plan")}>
            Back to my plan
          </Button>
          {secondsLeft !== null && (
            // aria-live is deliberately absent: announcing a new number every second would talk
            // over everything else on the page for a screen-reader user.
            <p className="text-[11px] text-subtle">
              {t("Returning automatically in {0}s").replace("{0}", String(secondsLeft))}
            </p>
          )}
        </div>
      </Card>
    </main>
  );
}

export default function PaymentCancelledPage() {
  // useSearchParams needs a Suspense boundary or the whole route opts out of static rendering.
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-bg"><Spinner className="h-7 w-7 text-primary" /></main>}>
      <CancelledInner />
    </Suspense>
  );
}
