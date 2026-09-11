"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button, Card, WordmarkLink } from "../../../components/ui";
import { rentMasterFetch } from "../../../lib/api-service";
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
// So the cancel is now recorded. The server does the deciding — see the route for why it takes no
// id and why every guard lives in the WHERE clause — and this page only reports what it said.
//
// ⚠️ 'completed' is not a paranoid branch. The webhook races this page by design, and someone can
// reach /payment/cancelled after actually paying (a stale tab, a back button). Claiming "cancelled"
// there would tell someone their money had been refused when their plan had just gone live.
// =====================================================================================

type Outcome = "cancelled" | "nothing_to_cancel" | "completed" | "unknown";

export default function PaymentCancelledPage() {
  const t = useT();
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
        const res = await rentMasterFetch<{ data: { outcome: Outcome } }>(
          "/api/admin/payments/uddoktapay/cancel",
          { method: "POST", role: "owner" },
        );
        setOutcome(res.data?.outcome ?? "unknown");
      } catch {
        // Nothing was charged either way, so there is nothing alarming to report. The plan tab is
        // the honest next step, and the stale-attempt sweep will clear the row regardless.
        setOutcome("unknown");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const paid = outcome === "completed";

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

        <Button className="w-full" onClick={() => window.location.replace("/owner#plan")}>
          Back to my plan
        </Button>
      </Card>
    </main>
  );
}
