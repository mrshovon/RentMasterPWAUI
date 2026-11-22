"use client";

import { useEffect, useState } from "react";
import { QrCode, Info } from "lucide-react";
import { Button, Field, Modal, Select, TextInput } from "./ui";
import { toast } from "./toast";
import { useT } from "../lib/i18n";
import { apiSubmitPaymentClaim } from "../lib/api-service";
import type { ClaimMethod, ClaimSource, PayToConfig } from "../types/api";

// =====================================================================================
// PAYER-SIDE "I PAID YOU THIS WAY" MODAL — rent tenants and flat owners share it.
//
// The payee's account/QR/instructions are a READ-ONLY copy fetched with the invoice. The method
// is preselected from the payee's default, but the payer is free to change it — it is a default,
// never a lock. Transaction ID and remarks are optional and only asked for bank / P2P QR.
//
// Submitting here does NOT record money. It writes a claim and (for rent) flips the ledger to
// 'sent'; the payee still records the real receipt. The wording says so explicitly.
// =====================================================================================

export const CLAIM_METHODS: ClaimMethod[] = ["cash", "proxy", "bank", "p2p_qr"];
export const DETAIL_METHODS: ClaimMethod[] = ["bank", "p2p_qr"];

export const METHOD_LABELS: Record<ClaimMethod, string> = {
  cash: "In person",
  proxy: "Sent by someone else",
  bank: "Bank or MFS transfer",
  p2p_qr: "Bangla QR (P2P)",
};

export function claimMethodLabel(label: (s: string) => string, method: ClaimMethod): string {
  return label(METHOD_LABELS[method] || method);
}

export function PayBillModal({
  open, onClose, payTo, source, refId, amountLabel, onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  payTo: PayToConfig | null | undefined;
  source: ClaimSource;
  refId: string;
  amountLabel: string;
  onSubmitted?: () => void | Promise<void>;
}) {
  const t = useT();
  const allowed: ClaimMethod[] = payTo?.methods?.length
    ? CLAIM_METHODS.filter((m) => payTo.methods.includes(m))
    : CLAIM_METHODS;
  const initial = allowed.includes(payTo?.defaultMethod as ClaimMethod)
    ? payTo!.defaultMethod
    : allowed[0];
  const [method, setMethod] = useState<ClaimMethod>(initial || "p2p_qr");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMethod(initial || "p2p_qr");
    setReference("");
    setNote("");
    // The default is a property of the payee's setup; re-read it each time the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payTo?.defaultMethod, payTo?.methods]);

  async function submit() {
    if (!refId) return;
    try {
      setSaving(true);
      const res = await apiSubmitPaymentClaim({
        source,
        refId,
        method,
        ...(DETAIL_METHODS.includes(method) ? { reference, note } : {}),
      });
      toast.success(res.message || t("Payment details sent — awaiting confirmation."));
      await onSubmitted?.();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const showDetails = DETAIL_METHODS.includes(method);
  const hasPayTo = !!payTo && !!(payTo.account || payTo.qrUrl || payTo.instructions);

  return (
    <Modal open={open} onClose={onClose} title="Tell us how you paid"
      subtitle={amountLabel}>
      <div className="space-y-4">
        {hasPayTo ? (
          <div className="space-y-3 rounded-xl bg-surface-2 p-4">
            {payTo?.qrUrl && (
              <div className="flex flex-col items-center gap-1">
                <button type="button" onClick={() => setZoom(true)}
                  title={t("Tap to enlarge and scan")}>
                  <img src={payTo.qrUrl} alt={t("Payment QR code")}
                    className="h-44 w-44 rounded-xl bg-white object-contain p-2" />
                </button>
                <span className="text-[11px] text-subtle">{t("Tap the QR to enlarge and scan")}</span>
              </div>
            )}
            {payTo?.account && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  {t("Account details")}
                </div>
                <div className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-fg">
                  {payTo.account}
                </div>
              </div>
            )}
            {payTo?.instructions && (
              <p className="whitespace-pre-wrap text-xs text-muted">{payTo.instructions}</p>
            )}
          </div>
        ) : (
          <p className="rounded-xl bg-surface-2 p-4 text-sm text-muted">
            {t("No payment details have been set up yet. Contact the payee, then tell us how you paid.")}
          </p>
        )}

        <Field label="Payment method"
          hint="Already set to your payee's default — change it if you paid a different way.">
          <Select value={method} onChange={(e) => setMethod(e.target.value as ClaimMethod)}>
            {allowed.map((m) => (
              <option key={m} value={m}>{claimMethodLabel(t, m)}</option>
            ))}
          </Select>
        </Field>

        {showDetails && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Transaction ID" hint="Optional — helps them find your payment.">
              <TextInput value={reference} onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. TXN123456" />
            </Field>
            <Field label="Remarks" hint="Optional — anything that helps them recognise it.">
              <TextInput value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. rent for July" />
            </Field>
          </div>
        )}

        <p className="flex items-start gap-2 text-xs text-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t("This only tells the payee what you did. They will confirm after they check the money; the invoice is not paid yet.")}
        </p>

        <Button onClick={submit} loading={saving} className="w-full">
          {t("Send payment details")}
        </Button>
      </div>

      {zoom && payTo?.qrUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6"
          onClick={() => setZoom(false)}>
          <button type="button" onClick={() => setZoom(false)} aria-label={t("Close")}>
            <img src={payTo.qrUrl} alt={t("Payment QR code")}
              className="max-h-[85vh] max-w-[85vw] rounded-2xl bg-white p-4 object-contain" />
          </button>
        </div>
      )}
    </Modal>
  );
}

/** Compact read-only line for a submitted claim, reused by both payee work queues. */
export function ClaimDetailLine({ claim }: { claim: { method: ClaimMethod; reference?: string | null; note?: string | null } }) {
  const t = useT();
  const bits = [claimMethodLabel(t, claim.method)];
  if (claim.reference) bits.push(`#${claim.reference}`);
  if (claim.note) bits.push(claim.note);
  return <span className="text-xs text-muted">{bits.join(" · ")}</span>;
}

export function ClaimMethodIcon() {
  return <QrCode className="h-3.5 w-3.5" />;
}
