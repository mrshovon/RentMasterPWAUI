"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ReceiptText, Wallet, CircleDollarSign, Building2, FileText } from "lucide-react";
import { rentMasterFetch } from "../lib/api-service";
import { toast } from "./toast";
import { useT } from "../lib/i18n";
import { formatCurrency, formatDate, formatMonth } from "../lib/format";
import { BuildingServiceInvoice, BuildingStatementResponse } from "../types/api";
import { buildReceiptHtml } from "../lib/receipt";
import { buildOwnerStatementHtml, BuildingHeader } from "../lib/building-print";
import { ReceiptModal } from "./receipt-modal";
import { PrintModal } from "./print-modal";
import { Card, StatCard, Badge, Button, Modal, PageHeader, EmptyState } from "./ui";

// =====================================================================================
// 🧾 FLAT OWNER — MY SERVICE CHARGE
//
// The read-only other side of the building admin's invoices. An owner never records money
// against their own service charge — their building admin does — so there is nothing to submit
// here, only to read. The tab is mounted by app/owner/page.tsx and only when the owner's plan
// says they are in a building.
//
// Unlike components/building-invoices-tab.tsx (an operator screen, English), this is end-user
// facing and every string goes through t(). See lib/locales/bn.ts.
//
// ✍️ THE RECEIPT AND THE STATEMENT ARE THE SAME DOCUMENTS THE BUILDING ADMIN PRINTS, deliberately
// built by the same two builders with the same arguments — buildReceiptHtml() carrying the three
// service-charge overrides from building-invoices-tab.tsx, and buildOwnerStatementHtml() from the
// admin's Reports tab. Two documents describing one invoice must not be able to disagree, and the
// owner's copy is the one that leaves the app. Both carry the building admin's AUTHORISED
// SIGNATURE, which /api/admin/building/statement returns alongside the letterhead.
//
// Unlike the admin's copy there is no WhatsApp button: this is the owner's own copy of their own
// bill, so there is no counterparty to send it to. Hence hideWhatsapp on ReceiptModal.
// =====================================================================================

const statusTone = (s: string): "emerald" | "amber" | "rose" =>
  s === "paid" ? "emerald" : s === "partial" ? "amber" : "rose";

const statusLabel = (s: string): string =>
  s === "paid" ? "Paid" : s === "partial" ? "Partly paid" : "Unpaid";

export function ServiceChargeTab() {
  const t = useT();
  const [res, setRes] = useState<BuildingStatementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<BuildingServiceInvoice | null>(null);
  const [receipt, setReceipt] = useState<{ html: string; fileName: string; month: string } | null>(null);
  const [statement, setStatement] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRes(await rentMasterFetch<BuildingStatementResponse>("/api/admin/building/statement"));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const invoices = res?.data || [];

  const totals = useMemo(() => {
    const billed = invoices.reduce((s, i) => s + Number(i.total_payable || 0), 0);
    const paid = invoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0);
    return { billed, paid, due: Math.max(0, billed - paid) };
  }, [invoices]);

  /** The letterhead block both documents print under. Shared so a receipt and a statement issued
   *  minutes apart cannot show a different building. */
  const header: BuildingHeader | null = useMemo(() => {
    const b = res?.building;
    if (!b) return null;
    return {
      name: b.name,
      address: b.address,
      city: b.city,
      letterheadUrl: b.letterheadUrl,
      signatoryName: b.signatoryName,
      signatoryTitle: b.signatoryTitle,
      signatureUrl: b.signatureUrl,
    };
  }, [res]);

  function openReceipt(inv: BuildingServiceInvoice) {
    const b = res?.building;
    if (!b) {
      toast.error("Your building details are still loading — try again in a moment.");
      return;
    }
    const html = buildReceiptHtml({
      copyLabel: "Owner Copy",
      // The building is the issuing party here, not the reader — same as the admin's copy.
      ownerName: b.name,
      propertyAddress: [b.address, b.city].filter(Boolean).join(", ") || null,
      refNo: inv.invoice_no ? `#${inv.invoice_no}` : null,
      billingMonth: inv.billing_month,
      unitLabel: b.unitLabel,
      partyLabel: "Flat Owner",
      tenantName: res?.owner?.name || b.unitLabel || "Flat Owner",
      houseRent: 0,
      serviceCharge: Number(inv.service_charge || 0),
      extraCharge: Number(inv.extra_charge || 0),
      discount: Number(inv.discount || 0),
      total: Number(inv.total_payable || 0),
      paymentStatus: inv.payment_status,
      paidAt: inv.paid_at,
      // Already on the row — the statement endpoint returns the installments per invoice, which
      // is why this needs no extra fetch where the admin's copy does one.
      payments: (inv.payments || []).map((p) => ({ paidOn: p.paid_on, amount: Number(p.amount || 0) })),
      amountPaid: Number(inv.amount_paid || 0),
      note: inv.extra_charge_remarks || inv.note,
      signatureUrl: b.signatureUrl,
      // The three that make this a service charge rather than rent.
      hideZeroLines: true,
      signatureCaption: "Authorised Signature",
      fixedNote: null,
    });
    setReceipt({ html, fileName: `service-charge-receipt-${inv.billing_month}`, month: inv.billing_month });
  }

  function openStatement() {
    if (!header) {
      toast.error("Your building details are still loading — try again in a moment.");
      return;
    }
    setStatement(
      buildOwnerStatementHtml({
        building: header,
        owner: { name: res?.owner?.name || null, unitLabel: res?.building?.unitLabel || null },
        // Oldest first: the running balance in the statement only reads correctly forwards, and
        // the table above is newest-first.
        invoices: [...invoices]
          .sort((a, b) => String(a.billing_month).localeCompare(String(b.billing_month)))
          .map((i) => ({
            billing_month: i.billing_month,
            total_payable: Number(i.total_payable || 0),
            amount_paid: Number(i.amount_paid || 0),
            payment_status: i.payment_status,
          })),
        totals: { billed: totals.billed, received: totals.paid, due: totals.due },
      })
    );
  }

  if (loading) {
    return <Card className="p-8 text-center text-sm text-muted">{t("Loading…")}</Card>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service charge"
        subtitle="What your building bills you each month, and what has been received."
        action={
          invoices.length > 0 ? (
            <Button variant="secondary" icon={FileText} onClick={openStatement}>
              Print statement
            </Button>
          ) : undefined
        }
      />

      {res?.building && (
        <Card className="p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-heading">{res.building.name}</h3>
              {res.building.unitLabel && (
                <p className="mt-1 text-sm text-muted">
                  <span>{t("Your flat")}: </span>
                  <strong className="text-fg">{res.building.unitLabel}</strong>
                </p>
              )}
              <p className="mt-2 text-sm text-muted">
                {t("Your building administrator issues these invoices and records the payments.")}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Billed" value={formatCurrency(totals.billed)} icon={ReceiptText} accent="indigo" />
        <StatCard label="Received" value={formatCurrency(totals.paid)} icon={Wallet} accent="emerald" />
        <StatCard label="Due" value={formatCurrency(totals.due)} icon={CircleDollarSign} accent="amber" />
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No service charge invoices yet"
          hint="Your building administrator has not issued one to you."
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line/[0.06] bg-overlay/[0.02] text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="p-4">{t("Month")}</th>
                <th className="p-4">{t("Payable")}</th>
                <th className="p-4">{t("Received")}</th>
                <th className="p-4">{t("Status")}</th>
                <th className="p-4 text-right">{t("Details")}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-line/[0.04] last:border-0">
                  <td className="p-4 font-medium text-heading">{formatMonth(inv.billing_month)}</td>
                  <td className="p-4 text-fg">{formatCurrency(Number(inv.total_payable || 0))}</td>
                  <td className="p-4 text-fg">{formatCurrency(Number(inv.amount_paid || 0))}</td>
                  <td className="p-4">
                    <Badge tone={statusTone(inv.payment_status)}>{statusLabel(inv.payment_status)}</Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setOpen(inv)}>View</Button>
                      {/* Offered at every status, exactly as the building admin's copy is: an
                          unpaid invoice still prints a receipt showing what is owed, and that is
                          the document an owner takes to their building office. */}
                      <Button size="sm" icon={ReceiptText} onClick={() => openReceipt(inv)}>Receipt</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <InvoiceDetailModal invoice={open} onClose={() => setOpen(null)} />

      <ReceiptModal
        open={!!receipt}
        onClose={() => setReceipt(null)}
        html={receipt?.html || ""}
        title="Service charge receipt"
        fileName={receipt?.fileName}
        hideWhatsapp
      />

      <PrintModal
        open={!!statement}
        onClose={() => setStatement(null)}
        html={statement || ""}
        title="Service charge statement"
        subtitle="Every month you have been billed, and the balance after each."
        fileName={`service-charge-statement-${new Date().toISOString().slice(0, 10)}`}
      />
    </div>
  );
}

function InvoiceDetailModal({
  invoice,
  onClose,
}: {
  invoice: BuildingServiceInvoice | null;
  onClose: () => void;
}) {
  const t = useT();
  if (!invoice) return <Modal open={false} onClose={onClose} title="Invoice"><span /></Modal>;

  const payments = invoice.payments || [];
  const due = Math.max(0, Number(invoice.total_payable || 0) - Number(invoice.amount_paid || 0));

  const Line = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
    <div className="flex items-center justify-between py-2">
      <span className={strong ? "text-sm font-medium text-heading" : "text-sm text-muted"}>{t(label)}</span>
      <span className={strong ? "text-sm font-semibold text-heading" : "text-sm text-fg"}>{value}</span>
    </div>
  );

  return (
    <Modal open onClose={onClose} title="Service charge invoice" subtitle={formatMonth(invoice.billing_month)}>
      <div className="divide-y divide-line/[0.06]">
        <Line label="Service charge" value={formatCurrency(Number(invoice.service_charge || 0))} />
        {Number(invoice.extra_charge || 0) > 0 && (
          <Line
            label={invoice.extra_charge_remarks || "Extra charge"}
            value={formatCurrency(Number(invoice.extra_charge))}
          />
        )}
        {Number(invoice.discount || 0) > 0 && (
          <Line label="Discount" value={`- ${formatCurrency(Number(invoice.discount))}`} />
        )}
        <Line label="Total payable" value={formatCurrency(Number(invoice.total_payable || 0))} strong />
        <Line label="Received" value={formatCurrency(Number(invoice.amount_paid || 0))} />
        <Line label="Still due" value={formatCurrency(due)} strong />
      </div>

      {invoice.note && (
        <p className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">{invoice.note}</p>
      )}

      <h4 className="mt-6 text-sm font-semibold text-heading">{t("Payments")}</h4>
      {payments.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{t("Nothing received against this invoice yet.")}</p>
      ) : (
        <div className="mt-2 space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="rounded-xl bg-surface-2 px-4 py-3">
              <div className="text-sm font-medium text-heading">{formatCurrency(Number(p.amount || 0))}</div>
              <div className="text-xs text-muted">{formatDate(p.paid_on)}</div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
