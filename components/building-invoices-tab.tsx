"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Pencil, Trash2, ReceiptText, Wallet, History, Sparkles, CircleDollarSign,
} from "lucide-react";
import { rentMasterFetch } from "../lib/api-service";
import { toast } from "./toast";
import { confirmDialog } from "./confirm";
import { formatCurrency, formatDate, formatMonth } from "../lib/format";
import { Building, BuildingOwner, BuildingServiceInvoice, BuildingServicePayment } from "../types/api";
import { buildReceiptHtml } from "../lib/receipt";
import { ReceiptModal } from "./receipt-modal";
import {
  Card, StatCard, Badge, Button, Modal, Field, TextInput, Select, PageHeader, EmptyState,
} from "./ui";

// =====================================================================================
// 🏢 BUILDING ADMIN — SERVICE CHARGE
//
// Issue each owner their monthly share, and record the money as it arrives. The truth model is
// the rent cycle's, one level up: building_service_payments rows are the truth and the invoice's
// amount_paid / payment_status / paid_at are derived server-side. Nothing here writes them.
//
// English-only, like app/building/page.tsx and app/admin/page.tsx — see the EXCLUDE list in
// scripts/check-i18n.mjs. This is an operator screen. The OWNER-facing view of the same invoices
// is components/service-charge-tab.tsx, which is fully translated.
// =====================================================================================

/** Current month as "YYYY-MM" in local time. `toISOString()` would give the previous month on the
 *  1st anywhere east of UTC, which is everywhere this app is used. */
export function currentBillingMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function statusTone(status: string): "emerald" | "amber" | "slate" {
  return status === "paid" ? "emerald" : status === "partial" ? "amber" : "slate";
}

export function BuildingInvoicesTab({
  owners, building, signatureUrl,
}: {
  owners: BuildingOwner[];
  building: Building | null;
  signatureUrl?: string | null;
}) {
  const [month, setMonth] = useState(currentBillingMonth());
  const [invoices, setInvoices] = useState<BuildingServiceInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [paying, setPaying] = useState<BuildingServiceInvoice | null>(null);
  const [history, setHistory] = useState<BuildingServiceInvoice | null>(null);
  const [editing, setEditing] = useState<BuildingServiceInvoice | null>(null);
  const [receipt, setReceipt] = useState<
    { html: string; phone: string | null; message: string; fileName: string } | null
  >(null);
  const [receiptBusy, setReceiptBusy] = useState<string | null>(null);
  // Set by RecordPaymentModal once its reload has landed. An id, never the invoice object — that
  // one is pre-payment and would print DUE on a receipt for money just received.
  const [pendingReceiptId, setPendingReceiptId] = useState<string | null>(null);

  // owner_id -> roster row, so the table shows a name rather than a uuid.
  const ownerById = useMemo(() => {
    const m: Record<string, BuildingOwner> = {};
    owners.forEach((o) => { m[o.owner_id] = o; });
    return m;
  }, [owners]);

  // A service charge is billed to a FLAT OWNER, not a tenant, and carries no house rent — hence
  // the label overrides on buildReceiptHtml rather than a second template. See lib/receipt.ts.
  const openReceipt = useCallback(
    async (inv: BuildingServiceInvoice) => {
      if (!building) {
        toast.error("Your building details are still loading — try again in a moment.");
        return;
      }
      const owner = ownerById[inv.owner_id];

      // Installments, best-effort: the list endpoint does not carry payments, and the receipt
      // itemises a history only when there is more than one. A failure here degrades to the
      // plain "Date:" row rather than blocking the receipt.
      setReceiptBusy(inv.id);
      let paid: { paidOn: string; amount: number }[] = [];
      try {
        const res = await rentMasterFetch<{ data: BuildingServicePayment[] }>(
          `/api/admin/building/invoices/${inv.id}/payments`
        );
        paid = (res.data || []).map((x) => ({ paidOn: x.paid_on, amount: Number(x.amount || 0) }));
      } catch {
        /* non-fatal */
      } finally {
        setReceiptBusy(null);
      }

      const partyName = owner?.name || owner?.email || "Flat Owner";
      const html = buildReceiptHtml({
        copyLabel: "Owner Copy",
        ownerName: building.name,
        propertyAddress: [building.address, building.city].filter(Boolean).join(", ") || null,
        refNo: inv.invoice_no ? `#${inv.invoice_no}` : null,
        billingMonth: inv.billing_month,
        unitLabel: owner?.unit_label || null,
        partyLabel: "Flat Owner",
        tenantName: partyName,
        houseRent: 0,
        serviceCharge: Number(inv.service_charge || 0),
        extraCharge: Number(inv.extra_charge || 0),
        discount: Number(inv.discount || 0),
        total: Number(inv.total_payable || 0),
        paymentStatus: inv.payment_status,
        paidAt: inv.paid_at,
        payments: paid,
        amountPaid: Number(inv.amount_paid || 0),
        note: inv.extra_charge_remarks || inv.note,
        signatureUrl,
        // The three that make this a service charge rather than rent.
        hideZeroLines: true,
        signatureCaption: "Authorised Signature",
        fixedNote: null,
      });

      setReceipt({
        html,
        phone: owner?.phone || null,
        message: `Here is your service charge receipt for ${formatMonth(inv.billing_month)} — ${formatCurrency(Number(inv.total_payable || 0))}.`,
        fileName: `service-charge-receipt-${inv.billing_month}`,
      });
    },
    [building, ownerById, signatureUrl]
  );

  // Built from the RELOADED invoice, not the record modal's copy of it. See pendingReceiptId.
  useEffect(() => {
    if (!pendingReceiptId) return;
    const inv = invoices.find((x) => x.id === pendingReceiptId);
    setPendingReceiptId(null);
    if (inv) void openReceipt(inv);
  }, [pendingReceiptId, invoices, openReceipt]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await rentMasterFetch<{ data: BuildingServiceInvoice[] }>(
        `/api/admin/building/invoices?month=${encodeURIComponent(month)}`
      );
      setInvoices(res.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => {
    const billed = invoices.reduce((s, i) => s + Number(i.total_payable || 0), 0);
    const collected = invoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0);
    return { billed, collected, outstanding: Math.max(0, billed - collected) };
  }, [invoices]);

  // Active owners with no invoice yet this month — exactly what Generate would create, so the
  // button can say how many and disable itself when there is nothing to do.
  const missing = useMemo(() => {
    const billed = new Set(invoices.map((i) => i.owner_id));
    return owners.filter((o) => o.is_active && !billed.has(o.owner_id));
  }, [owners, invoices]);

  async function generate() {
    try {
      setGenerating(true);
      const res = await rentMasterFetch<{ created: number; skipped: number; message?: string }>(
        "/api/admin/building/invoices",
        { method: "POST", body: JSON.stringify({ billingMonth: month, generateAll: true }) }
      );
      if (res.created > 0) toast.success(`${res.created} invoice(s) issued for ${month}.`);
      else toast.info(res.message || "Nothing to issue — everyone is already billed.");
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function remove(inv: BuildingServiceInvoice) {
    const ok = await confirmDialog({
      title: "Delete this invoice?",
      message: `${ownerById[inv.owner_id]?.name || "This owner"} will no longer be billed for ${inv.billing_month}.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await rentMasterFetch(`/api/admin/building/invoices/${inv.id}`, { method: "DELETE" });
      toast.success("Invoice deleted.");
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service charge"
        subtitle="Bill each owner their monthly share, and record the money as it comes in."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Plus} onClick={() => setIssuing(true)}>Issue one</Button>
            <Button icon={Sparkles} loading={generating} onClick={generate} disabled={!missing.length}>
              {missing.length ? `Generate (${missing.length})` : "Generate"}
            </Button>
          </div>
        }
      />

      <Card className="p-4">
        <Field label="Billing month" hint="Invoices are listed and generated for this month.">
          <TextInput
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value || currentBillingMonth())}
          />
        </Field>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Billed" value={formatCurrency(totals.billed)} icon={ReceiptText} accent="indigo" />
        <StatCard label="Collected" value={formatCurrency(totals.collected)} icon={Wallet} accent="emerald" />
        <StatCard label="Outstanding" value={formatCurrency(totals.outstanding)} icon={CircleDollarSign} accent="amber" />
      </div>

      {loading ? (
        <Card className="p-8 text-center text-sm text-muted">Loading invoices…</Card>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={`No invoices for ${month}`}
          hint={
            missing.length
              ? "Press Generate to issue one to every active owner using their default service charge."
              : "There are no active owners to bill yet."
          }
          action={
            missing.length
              ? <Button icon={Sparkles} loading={generating} onClick={generate}>Generate</Button>
              : undefined
          }
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-line/[0.06] bg-overlay/[0.02] text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="p-4">Owner</th>
                <th className="p-4">Payable</th>
                <th className="p-4">Paid</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const owner = ownerById[inv.owner_id];
                const settled = inv.payment_status === "paid";
                return (
                  <tr key={inv.id} className="border-b border-line/[0.04] last:border-0">
                    <td className="p-4">
                      <div className="font-medium text-heading">{owner?.name || "—"}</div>
                      <div className="text-xs text-muted">{owner?.unit_label || owner?.email || "—"}</div>
                    </td>
                    <td className="p-4 text-fg">
                      {formatCurrency(Number(inv.total_payable || 0))}
                      {Number(inv.extra_charge || 0) > 0 && (
                        <div className="text-xs text-muted">
                          incl. extra {formatCurrency(Number(inv.extra_charge))}
                        </div>
                      )}
                      {Number(inv.discount || 0) > 0 && (
                        <div className="text-xs text-muted">
                          less discount {formatCurrency(Number(inv.discount))}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-fg">{formatCurrency(Number(inv.amount_paid || 0))}</td>
                    <td className="p-4">
                      <Badge tone={statusTone(inv.payment_status)}>{inv.payment_status}</Badge>
                      {inv.paid_at && <div className="mt-1 text-xs text-muted">{formatDate(inv.paid_at)}</div>}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        {!settled && <Button size="sm" icon={Wallet} onClick={() => setPaying(inv)}>Record</Button>}
                        {/* Offered at every status: a receipt for a part-paid invoice is a
                            legitimate document, and it prints its own Balance Due row. */}
                        <Button size="sm" variant="ghost" icon={ReceiptText}
                          loading={receiptBusy === inv.id}
                          onClick={() => void openReceipt(inv)}>Receipt</Button>
                        <Button size="sm" variant="ghost" icon={History} onClick={() => setHistory(inv)}>History</Button>
                        {!settled && (
                          <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditing(inv)}>Edit</Button>
                        )}
                        {Number(inv.amount_paid || 0) === 0 && (
                          <Button size="sm" variant="danger" icon={Trash2} onClick={() => remove(inv)}>Delete</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <IssueInvoiceModal
        open={issuing}
        month={month}
        owners={owners.filter((o) => o.is_active)}
        onClose={() => setIssuing(false)}
        onIssued={load}
      />
      <EditInvoiceModal invoice={editing} onClose={() => setEditing(null)} onSaved={load} />
      <RecordPaymentModal
        invoice={paying}
        ownerName={paying ? ownerById[paying.owner_id]?.name || null : null}
        onClose={() => setPaying(null)}
        onRecorded={load}
        onReceipt={setPendingReceiptId}
      />
      {/* A sibling of the record modal, never a child — nested, it would unmount with it. */}
      <ReceiptModal
        open={!!receipt}
        onClose={() => setReceipt(null)}
        html={receipt?.html || ""}
        phone={receipt?.phone}
        message={receipt?.message}
        fileName={receipt?.fileName}
        title="Service charge receipt"
        noPhoneToast="This owner has no valid phone number for WhatsApp."
        noPhoneHint="No valid WhatsApp number on file for this owner."
      />
      <PaymentHistoryModal
        invoice={history}
        ownerName={history ? ownerById[history.owner_id]?.name || null : null}
        onClose={() => setHistory(null)}
        onChanged={load}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- issue / edit */

function IssueInvoiceModal({
  open, month, owners, onClose, onIssued,
}: {
  open: boolean;
  month: string;
  owners: BuildingOwner[];
  onClose: () => void;
  onIssued: () => Promise<void>;
}) {
  const empty = {
    ownerId: "", serviceCharge: "", extraCharge: "", extraChargeRemarks: "", discount: "", note: "",
  };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  // Pre-fill from the roster the moment an owner is picked. Storing a default service charge is
  // pointless if the person still has to retype it, and retyping is how the two figures diverge.
  function pickOwner(ownerId: string) {
    const o = owners.find((x) => x.owner_id === ownerId);
    setForm((f) => ({ ...f, ownerId, serviceCharge: o ? String(o.default_service_charge ?? "") : "" }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ownerId) { toast.error("Choose an owner."); return; }
    try {
      setSaving(true);
      await rentMasterFetch("/api/admin/building/invoices", {
        method: "POST",
        body: JSON.stringify({
          billingMonth: month,
          ownerId: form.ownerId,
          serviceCharge: Number(form.serviceCharge || 0),
          extraCharge: Number(form.extraCharge || 0),
          extraChargeRemarks: form.extraChargeRemarks,
          discount: Number(form.discount || 0),
          note: form.note,
        }),
      });
      setForm(empty);
      await onIssued();
      onClose();
      toast.success("Invoice issued.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const total = Number(form.serviceCharge || 0) + Number(form.extraCharge || 0) - Number(form.discount || 0);

  return (
    <Modal open={open} onClose={onClose} title="Issue an invoice" subtitle={`Billing month ${month}`}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Owner" required>
          <Select required value={form.ownerId} onChange={(e) => pickOwner(e.target.value)}>
            <option value="">Choose an owner…</option>
            {owners.map((o) => (
              <option key={o.owner_id} value={o.owner_id}>
                {`${o.name || o.email}${o.unit_label ? ` — ${o.unit_label}` : ""}`}
              </option>
            ))}
          </Select>
        </Field>
        <ChargeFields form={form} setForm={setForm} requireService />
        <TotalRow total={total} />
        <Button type="submit" loading={saving} className="w-full">Issue invoice</Button>
      </form>
    </Modal>
  );
}

function EditInvoiceModal({
  invoice, onClose, onSaved,
}: {
  invoice: BuildingServiceInvoice | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    ownerId: "", serviceCharge: "", extraCharge: "", extraChargeRemarks: "", discount: "", note: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!invoice) return;
    setForm({
      ownerId: invoice.owner_id,
      serviceCharge: String(invoice.service_charge ?? ""),
      extraCharge: String(invoice.extra_charge ?? ""),
      extraChargeRemarks: invoice.extra_charge_remarks || "",
      discount: String(invoice.discount ?? ""),
      note: invoice.note || "",
    });
  }, [invoice]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice) return;
    try {
      setSaving(true);
      await rentMasterFetch(`/api/admin/building/invoices/${invoice.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          serviceCharge: Number(form.serviceCharge || 0),
          extraCharge: Number(form.extraCharge || 0),
          extraChargeRemarks: form.extraChargeRemarks,
          discount: Number(form.discount || 0),
          note: form.note,
        }),
      });
      await onSaved();
      onClose();
      toast.success("Invoice updated.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const total = Number(form.serviceCharge || 0) + Number(form.extraCharge || 0) - Number(form.discount || 0);

  return (
    <Modal
      open={!!invoice}
      onClose={onClose}
      title="Edit invoice"
      subtitle={invoice ? `${formatMonth(invoice.billing_month)} · #${invoice.invoice_no ?? ""}` : undefined}
    >
      <form onSubmit={submit} className="space-y-4">
        <ChargeFields form={form} setForm={setForm} />
        <TotalRow total={total} />
        <Button type="submit" loading={saving} className="w-full">Save changes</Button>
      </form>
    </Modal>
  );
}

type ChargeForm = {
  ownerId: string; serviceCharge: string; extraCharge: string;
  extraChargeRemarks: string; discount: string; note: string;
};

/** The charge lines, shared by issue and edit so the two forms can never drift apart. */
function ChargeFields({
  form, setForm, requireService,
}: {
  form: ChargeForm;
  setForm: (f: ChargeForm) => void;
  requireService?: boolean;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Service charge" required={requireService}>
          <TextInput
            required={requireService} type="number" min="0" step="0.01" value={form.serviceCharge}
            onChange={(e) => setForm({ ...form, serviceCharge: e.target.value })}
          />
        </Field>
        <Field label="Extra charge">
          <TextInput
            type="number" min="0" step="0.01" value={form.extraCharge}
            onChange={(e) => setForm({ ...form, extraCharge: e.target.value })}
          />
        </Field>
      </div>
      {Number(form.extraCharge || 0) > 0 && (
        <Field label="What is the extra charge for?" hint="Shown on the owner's statement.">
          <TextInput
            value={form.extraChargeRemarks}
            onChange={(e) => setForm({ ...form, extraChargeRemarks: e.target.value })}
          />
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Discount">
          <TextInput
            type="number" min="0" step="0.01" value={form.discount}
            onChange={(e) => setForm({ ...form, discount: e.target.value })}
          />
        </Field>
        <Field label="Note" hint="Shown to the owner.">
          <TextInput value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </Field>
      </div>
    </>
  );
}

/** The server recomputes this from the charge lines and clamps it at zero — shown here only so
 *  the number is not a surprise after saving. */
function TotalRow({ total }: { total: number }) {
  return (
    <div className="rounded-xl bg-surface-2 px-4 py-3 text-sm">
      <span className="text-muted">Total payable: </span>
      <strong className="text-heading">{formatCurrency(Math.max(0, total))}</strong>
    </div>
  );
}

/* ---------------------------------------------------------------- money */

function RecordPaymentModal({
  invoice, ownerName, onClose, onRecorded, onReceipt,
}: {
  invoice: BuildingServiceInvoice | null;
  ownerName: string | null;
  onClose: () => void;
  onRecorded: () => Promise<void>;
  /** Hands the parent the INVOICE ID once the reload has landed, so the receipt is built from the
   *  refreshed row rather than this modal's pre-payment copy of it. */
  onReceipt: (invoiceId: string) => void;
}) {
  const outstanding = invoice
    ? Math.max(0, Number(invoice.total_payable || 0) - Number(invoice.amount_paid || 0))
    : 0;
  const [form, setForm] = useState({ amount: "", method: "cash", paidOn: "", note: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!invoice) return;
    setForm({
      amount: String(outstanding || ""),
      method: "cash",
      paidOn: new Date().toISOString().slice(0, 10),
      note: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice) return;
    const amount = Number(form.amount || 0);
    if (!(amount > 0)) { toast.error("Enter an amount greater than zero."); return; }
    try {
      setSaving(true);
      await rentMasterFetch(`/api/admin/building/invoices/${invoice.id}/payments`, {
        method: "POST",
        body: JSON.stringify({ amount, method: form.method, paidOn: form.paidOn, note: form.note }),
      });
      await onRecorded();
      onClose();
      toast.success("Payment recorded.");
      // After onRecorded(), so the parent's invoice list already carries the new figures.
      onReceipt(invoice.id);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={!!invoice}
      onClose={onClose}
      title="Record a payment"
      subtitle={ownerName ? `${ownerName} · outstanding ${formatCurrency(outstanding)}` : undefined}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" required hint="Pre-filled with the full outstanding balance.">
            <TextInput
              required type="number" min="0.01" step="0.01" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </Field>
          <Field label="Received on" required>
            <TextInput
              required type="date" value={form.paidOn}
              onChange={(e) => setForm({ ...form, paidOn: e.target.value })}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Method">
            <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="bank">Bank</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Note">
            <TextInput value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
        </div>
        <p className="text-xs text-muted">
          This also books an income entry into your default account, if Accounts is set up.
        </p>
        <Button type="submit" loading={saving} className="w-full">Record payment</Button>
      </form>
    </Modal>
  );
}

function PaymentHistoryModal({
  invoice, ownerName, onClose, onChanged,
}: {
  invoice: BuildingServiceInvoice | null;
  ownerName: string | null;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [payments, setPayments] = useState<BuildingServicePayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!invoice) { setPayments([]); return; }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await rentMasterFetch<{ data: BuildingServicePayment[] }>(
          `/api/admin/building/invoices/${invoice.id}/payments`
        );
        if (!cancelled) setPayments(res.data || []);
      } catch (e: any) {
        if (!cancelled) toast.error(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [invoice]);

  async function remove(p: BuildingServicePayment) {
    if (!invoice) return;
    const ok = await confirmDialog({
      title: "Delete this payment?",
      message: "The income entry it created is reversed too, and the invoice status walks back down.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      setBusy(p.id);
      await rentMasterFetch(`/api/admin/building/invoices/${invoice.id}/payments/${p.id}`, { method: "DELETE" });
      setPayments((list) => list.filter((x) => x.id !== p.id));
      await onChanged();
      toast.success("Payment deleted.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal
      open={!!invoice}
      onClose={onClose}
      title="Payment history"
      subtitle={ownerName && invoice ? `${ownerName} · ${formatMonth(invoice.billing_month)}` : undefined}
    >
      {loading ? (
        <p className="py-6 text-center text-sm text-muted">Loading…</p>
      ) : payments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Nothing recorded against this invoice yet.</p>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-4 py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-heading">{formatCurrency(Number(p.amount || 0))}</div>
                <div className="text-xs text-muted">
                  {`${formatDate(p.paid_on)} · ${p.method}${p.note ? ` · ${p.note}` : ""}`}
                </div>
              </div>
              <Button size="sm" variant="danger" icon={Trash2} loading={busy === p.id} onClick={() => remove(p)}>
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
