"use client";

import { XCircle } from "lucide-react";
import { Button, Card, WordmarkLink } from "../../../components/ui";
import { useT } from "../../../lib/i18n";

// =====================================================================================
// Registered as `cancel_url` on every charge — where the gateway drops someone who backed out.
//
// Nothing is verified or written here: a cancelled checkout means no money moved, so there is
// nothing to reconcile. The pending payment_submissions row created before the redirect simply
// stays pending, which is also what blocks a second attempt until it is dealt with — hence the
// line telling them to ask us if they get stuck, rather than leaving them tapping a button that
// answers "you already have a payment in progress".
// =====================================================================================

export default function PaymentCancelledPage() {
  const t = useT();
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-4">
      <Card className="w-full max-w-md space-y-5 p-7 text-center">
        <div className="flex justify-center"><WordmarkLink className="h-7" /></div>
        <div className="flex justify-center">
          <XCircle className="h-12 w-12 text-muted" aria-hidden />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-heading">{t("Payment cancelled")}</h1>
        <p className="text-sm text-muted">
          {t("Nothing has been charged and your plan has not changed. You can try again whenever you are ready.")}
        </p>
        <p className="text-[11px] text-subtle">
          {t("If you are told a payment is already in progress, contact support and we will clear it for you.")}
        </p>
        <Button className="w-full" onClick={() => window.location.replace("/owner#plan")}>
          Back to my plan
        </Button>
      </Card>
    </main>
  );
}
