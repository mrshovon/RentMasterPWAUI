"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, TriangleAlert, XCircle } from "lucide-react";
import { rentMasterFetch } from "../../../lib/api-service";
import { Button, Card, Spinner, WordmarkLink } from "../../../components/ui";
import { useT } from "../../../lib/i18n";

// =====================================================================================
// WHERE UDDOKTAPAY SENDS THE PAYER BACK TO.
//
// Registered as `redirect_url` on every charge, with return_type "GET", so the gateway appends
// ?invoice_id=… . This page's only job is to hand that id to the backend, which re-verifies with
// the gateway and fulfils the order.
//
// ⭐ THIS PAGE IS NOT THE SOURCE OF TRUTH AND CANNOT BE.
// Anyone can open it with any invoice_id. It proves nothing; it only asks. Every check that
// matters — did this payment complete, is it the right amount, does it belong to this order —
// happens server-side in lib/payments/uddoktapay-fulfil.ts against a fresh verify-payment call.
//
// It also races the webhook by design. Whichever gets there first fulfils; the other is told
// 'already_fulfilled', which this page renders as success, because from the payer's point of
// view it is one.
// =====================================================================================

type Outcome = "activated" | "already_fulfilled" | "pending" | "failed" | "mismatch" | "unconfigured";

/** Outcome -> the sentence the payer reads, in their language. */
function localMessage(t: (s: string) => string, outcome: Outcome | null, serverMessage: string): string {
  switch (outcome) {
    case "activated":
    case "already_fulfilled":
      return t("Your plan is now active. Thank you!");
    case "pending":
      return t("This payment has not finished yet. If money has left your account it will be applied automatically.");
    case "failed":
      return t("This payment did not go through. Nothing has been charged.");
    case "unconfigured":
      return t("Online payment is not available right now.");
    default:
      // 'mismatch' and anything unrecognised: the server's wording is deliberately vague and
      // points at support, which is the right advice whatever the underlying cause was.
      return serverMessage || t("We could not match this payment to an order. Please contact support.");
  }
}

function ReturnInner() {
  const t = useT();
  const params = useSearchParams();
  const invoiceId = params.get("invoice_id") || "";

  const [loading, setLoading] = useState(true);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [message, setMessage] = useState("");
  // React 18 StrictMode mounts effects twice in development. Verifying twice is harmless — that
  // is the whole point of the idempotency work — but it would show the second call's
  // "already processed" answer, which reads like a fault. One shot per mount.
  const asked = useRef(false);

  useEffect(() => {
    if (asked.current) return;
    asked.current = true;

    if (!invoiceId) {
      setOutcome("mismatch");
      setMessage(t("This link is missing its payment reference."));
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await rentMasterFetch<{ data: { outcome: Outcome; message: string } }>(
          "/api/admin/payments/uddoktapay/verify",
          { method: "POST", role: "owner", body: JSON.stringify({ invoiceId }) },
        );
        setOutcome(res.data?.outcome ?? "mismatch");
        setMessage(res.data?.message ?? "");
      } catch (e: any) {
        // The payment may well have succeeded — we just could not confirm it from here. Say so
        // honestly rather than "payment failed", which would send someone to pay a second time.
        setOutcome("pending");
        setMessage(
          e?.message ||
            t("We could not confirm your payment just now. If money has left your account it will be applied shortly."),
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [invoiceId, t]);

  const good = outcome === "activated" || outcome === "already_fulfilled";
  const waiting = outcome === "pending";

  const Icon = good ? CheckCircle2 : waiting ? Clock : outcome === "failed" ? XCircle : TriangleAlert;
  const tone = good ? "text-success" : waiting ? "text-warning" : "text-danger";

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-4">
      <Card className="w-full max-w-md space-y-5 p-7 text-center">
        <div className="flex justify-center"><WordmarkLink className="h-7" /></div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Spinner className="h-7 w-7 text-primary" />
            <p className="text-sm text-muted">{t("Confirming your payment…")}</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <Icon className={`h-12 w-12 ${tone}`} aria-hidden />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-heading">
              {good
                ? t("Payment received")
                : waiting
                  ? t("Payment is still processing")
                  : t("We could not confirm this payment")}
            </h1>
            {/* The outcome is translated HERE rather than rendering the server's message, which
                is English-only and would leave a Bangla user reading English at the one moment
                they most need to understand what happened to their money. The server text is kept
                as the fallback for outcomes with no local wording. */}
            <p className="text-sm text-muted">{localMessage(t, outcome, message)}</p>
            {!good && (
              <p className="text-[11px] text-subtle">
                {t("Reference: {0}").replace("{0}", invoiceId || "—")}
              </p>
            )}
          </>
        )}

        {!loading && (
          <Button className="w-full" onClick={() => window.location.replace("/owner#plan")}>
            Back to my plan
          </Button>
        )}
      </Card>
    </main>
  );
}

export default function PaymentReturnPage() {
  // useSearchParams needs a Suspense boundary or the whole route opts out of static rendering
  // and the build warns.
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-bg"><Spinner className="h-7 w-7 text-primary" /></main>}>
      <ReturnInner />
    </Suspense>
  );
}
