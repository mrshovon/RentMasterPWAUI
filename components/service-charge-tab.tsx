"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ReceiptText, Wallet, CircleDollarSign, Building2 } from "lucide-react";
import { rentMasterFetch } from "../lib/api-service";
import { toast } from "./toast";
import { useT } from "../lib/i18n";
import { formatCurrency, formatDate, formatMonth } from "../lib/format";
import { BuildingServiceInvoice, BuildingStatementResponse } from "../types/api";
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

  if (loading) {
    return <Card className="p-8 text-center text-sm text-muted">{t("Loading…")}</Card>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service charge"
        subtitle="What your building bills you each month, and what has been received."
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
                    <Button size="sm" variant="secondary" onClick={() => setOpen(inv)}>View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <InvoiceDetailModal invoice={open} onClose={() => setOpen(null)} />
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
