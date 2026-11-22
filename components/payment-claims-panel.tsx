"use client";

import { useCallback, useEffect, useState } from "react";
import { Inbox, Check, X, Wallet } from "lucide-react";
import { rentMasterFetch } from "../lib/api-service";
import { toast } from "./toast";
import { useT } from "../lib/i18n";
import { formatCurrency, formatMonth } from "../lib/format";
import { Card, Badge, Button } from "./ui";
import type { ClaimSource, PaymentClaim } from "../types/api";
import { ClaimDetailLine } from "./pay-bill-modal";

// =====================================================================================
// PAYEE WORK QUEUE — claims submitted by tenants / flat owners.
//
// A claim is NOT money. "Mark received" on a rent claim goes through the normal billing PATCH,
// which is the ONLY place a payment row (and therefore money) is created; the backend closes the
// claim as part of that same request. Service-charge claims are closed here, but the building
// admin still records the actual receipt in the Invoices tab — hence onServiceChargeConfirm,
// which lets that screen open its existing RecordPaymentModal prefilled from the claim.
// =====================================================================================

export function PaymentClaimsPanel({
  source, onServiceChargeConfirm, onChanged,
}: {
  source?: ClaimSource;
  /** Building console: hand the claim back so its RecordPaymentModal can be opened prefilled. */
  onServiceChargeConfirm?: (claim: PaymentClaim) => void;
  onChanged?: () => void | Promise<void>;
}) {
  const t = useT();
  const [claims, setClaims] = useState<PaymentClaim[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const qs = source ? `?source=${source}` : "";
      const res = await rentMasterFetch<{ data: PaymentClaim[] }>(`/api/admin/payment-claims${qs}`);
      setClaims((res.data || []).filter((c) => c.status === "pending"));
    } catch {
      // Before ADD_PAYMENT_CLAIMS.sql there are no claims — an empty queue is the safe state.
      setClaims([]);
    }
  }, [source]);

  useEffect(() => { void load(); }, [load]);

  async function decide(claim: PaymentClaim, action: "confirm" | "dismiss") {
    try {
      setBusy(claim.id);
      await rentMasterFetch(`/api/admin/payment-claims/${claim.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      toast.success(t(action === "confirm" ? "Claim marked as checked." : "Claim dismissed."));
      await load();
      await onChanged?.();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function markRentReceived(claim: PaymentClaim) {
    try {
      setBusy(claim.id);
      await rentMasterFetch(`/api/admin/billing/${claim.ref_id}`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus: "paid" }),
      });
      toast.success(t("Payment recorded."));
      await load();
      await onChanged?.();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2 text-primary"><Inbox className="h-4 w-4" /></div>
        <div>
          <h3 className="text-sm font-bold text-heading">{t("Payments awaiting confirmation")}</h3>
          <p className="text-xs text-subtle">
            {t("Payers told us how they paid. Check each one before you record the money.")}
          </p>
        </div>
        {claims.length > 0 && <Badge tone="amber" className="ml-auto">{claims.length}</Badge>}
      </div>

      {claims.length === 0 ? (
        <p className="text-sm text-muted">{t("Nothing waiting for confirmation.")}</p>
      ) : (
        <div className="space-y-3">
          {claims.map((c) => (
            <div key={c.id} className="rounded-xl border border-line/[0.08] bg-overlay/[0.02] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-heading">
                  {c.refLabel ? formatMonth(c.refLabel) : (c.source === 'rent' ? t("Rent") : t("Service charge"))}
                </span>
                {typeof c.amount === 'number' && (
                  <span className="text-sm font-bold text-fg">{formatCurrency(c.amount)}</span>
                )}
                <Badge tone="slate">{t(c.source === 'rent' ? "Rent" : "Service charge")}</Badge>
              </div>
              <div className="mt-1"><ClaimDetailLine claim={c} /></div>
              <div className="mt-3 flex flex-wrap gap-2">
                {c.source === "rent" ? (
                  <Button size="sm" icon={Check} loading={busy === c.id}
                    onClick={() => markRentReceived(c)}>{t("Mark received")}</Button>
                ) : (
                  <Button size="sm" icon={Wallet} loading={busy === c.id}
                    onClick={() => onServiceChargeConfirm ? onServiceChargeConfirm(c) : decide(c, "confirm")}>
                    {t("Confirm")}
                  </Button>
                )}
                <Button size="sm" variant="secondary" icon={X} loading={busy === c.id}
                  onClick={() => decide(c, "dismiss")}>{t("Dismiss")}</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
