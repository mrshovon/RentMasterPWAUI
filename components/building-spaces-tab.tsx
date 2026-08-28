"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Home, Users, ReceiptText, Wallet, KeyRound, DoorOpen, CircleDollarSign,
} from "lucide-react";
import { rentMasterFetch } from "../lib/api-service";
import { toast } from "./toast";
import { confirmDialog } from "./confirm";
import { formatCurrency, formatDate, formatMonth } from "../lib/format";
import { Building, Property, Tenant, BillingLedger, BillingPayment } from "../types/api";
import { buildReceiptHtml } from "../lib/receipt";
import { resolveReceiptMessage } from "../lib/whatsapp";
import { ReceiptModal } from "./receipt-modal";
import { validatePhone } from "../lib/validate";
import {
  Card, StatCard, Badge, Button, Modal, Field, TextInput, Select, PageHeader, EmptyState,
} from "./ui";
import { useT } from "../lib/i18n";

// =====================================================================================
// 🏢 BUILDING ADMIN — SPACES, TENANTS AND RENT
//
// A building usually has some space of its own to let: the rooftop, a shop on the ground floor,
// the caretaker's room, a parking bay. This is that — and it runs on the EXISTING owner routes
// (/api/admin/properties, /api/admin/tenants, /api/admin/billing), because a building admin is an
// "owner-shaped" account and every one of those routes already scopes on `owner_id = <caller>`.
// No new tables, no new endpoints, no fork of the rent logic.
//
// Purpose-built rather than reusing the owner dashboard's tabs: those live inside a 3,600-line
// page file and are wired into its state, so lifting them out would be a large refactor of a
// screen that is live and working. A building's own space is also a much smaller problem than a
// landlord's whole portfolio, so a simpler surface is the right one.
//
// Translated, like the rest of the app. This console was English-only by a standing decision
// that was overturned once it became clear DashboardShell shows a language toggle here — so a
// building admin was offered a Bangla switch that changed nothing. See scripts/check-i18n.mjs.
// =====================================================================================

// The slug is what the API stores; the label is what a human reads. The dropdown used to
// render the slug itself, so it offered "cash" and "bkash" in lower case in both languages.
const RENT_METHODS = ["cash", "bkash", "nagad", "bank", "other"] as const;
const RENT_METHOD_LABEL: Record<string, string> = {
  cash: "Cash", bkash: "bKash", nagad: "Nagad", bank: "Bank", other: "Other",
};

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function BuildingSpacesTab({
  onChanged, building, signatureUrl,
}: {
  onChanged?: () => void;
  building: Building | null;
  signatureUrl?: string | null;
}) {
  const t = useT();
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [ledgers, setLedgers] = useState<BillingLedger[]>([]);
  const [payments, setPayments] = useState<BillingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<
    { html: string; phone: string | null; message: string; fileName: string } | null
  >(null);
  // Set by RecordRentModal after its reload resolves; the effect below turns it into a receipt.
  // Never the ledger object itself — that one is pre-payment. See openReceipt.
  const [pendingReceiptId, setPendingReceiptId] = useState<string | null>(null);

  const [spaceOpen, setSpaceOpen] = useState(false);
  const [tenantFor, setTenantFor] = useState<Property | null>(null);
  const [invoiceFor, setInvoiceFor] = useState<Tenant | null>(null);
  const [payFor, setPayFor] = useState<BillingLedger | null>(null);
  const [passcode, setPasscode] = useState<{ name: string; code: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [p, t, l, bp] = await Promise.allSettled([
        rentMasterFetch<{ data: Property[] }>("/api/admin/properties"),
        rentMasterFetch<{ data: Tenant[] }>("/api/admin/tenants"),
        rentMasterFetch<{ data: BillingLedger[] }>("/api/admin/billing"),
        // The installment log. A receipt for rent paid in two parts has to itemise both, and
        // without this it would silently print a single "Date:" row.
        rentMasterFetch<{ data: BillingPayment[] }>("/api/admin/billing/payments"),
      ]);
      if (p.status === "fulfilled") setProperties(p.value.data || []);
      else toast.error((p.reason as Error).message);
      if (t.status === "fulfilled") setTenants(t.value.data || []);
      if (l.status === "fulfilled") setLedgers(l.value.data || []);
      if (bp.status === "fulfilled") setPayments(bp.value.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function reload() {
    await load();
    onChanged?.();
  }

  const paymentsFor = useCallback(
    (ledgerId: string) =>
      payments
        .filter((x) => x.ledger_id === ledgerId)
        .sort((x, y) => x.paid_on.localeCompare(y.paid_on)),
    [payments]
  );

  // An ordinary rent receipt — the building's own space is let exactly like any other property,
  // so this is the same call app/owner/page.tsx makes, with none of the service-charge overrides.
  const openReceipt = useCallback(
    (l: BillingLedger) => {
      const tenant = tenants.find((x) => x.id === l.tenant_id);
      const prop = properties.find((x) => x.id === l.property_id);
      const tenantName = l.tenants?.name || tenant?.name || "Tenant";
      const html = buildReceiptHtml({
        copyLabel: "Tenant Copy",
        // The space's own receipt name wins (a ground-floor shop may be let under a trading
        // name); the building is the fallback, never the admin's personal account name.
        ownerName: prop?.receipt_name || building?.name || "Owner",
        propertyAddress: prop?.address || building?.address || null,
        refNo: l.property_id,
        billingMonth: l.billing_month,
        tenantName,
        houseRent: l.rent_amount,
        serviceCharge: l.service_charge,
        extraCharge: l.extra_charge,
        discount: l.discount,
        total: l.total_payable,
        paymentStatus: l.payment_status,
        paidAt: l.paid_at,
        dueDay: tenant?.due_date,
        payments: paymentsFor(l.id).map((x) => ({ paidOn: x.paid_on, amount: Number(x.amount) })),
        amountPaid: Number(l.amount_paid || 0),
        note: l.extra_charge_remarks,
        signatureUrl,
      });
      setReceipt({
        html,
        phone: l.tenants?.phone || tenant?.phone || null,
        // The default sentence, not the admin's own WhatsApp template — that is an owner setting
        // about their own tenants, and this console does not load it.
        message: resolveReceiptMessage(null, {
          tenant: tenantName,
          month: formatMonth(l.billing_month),
          amount: formatCurrency(Number(l.total_payable || 0)),
          status: l.payment_status,
          property: prop?.name || "",
        }),
        fileName: `rent-receipt-${l.billing_month}`,
      });
    },
    [tenants, properties, building, signatureUrl, paymentsFor]
  );

  // Resolved here rather than inside RecordRentModal so the receipt is built from the RELOADED
  // ledger and payment list. The modal's own copy of the ledger is pre-payment — using it would
  // print DUE, a stale Balance Due, and omit the installment just recorded.
  useEffect(() => {
    if (!pendingReceiptId) return;
    const l = ledgers.find((x) => x.id === pendingReceiptId);
    setPendingReceiptId(null);
    if (l) openReceipt(l);
  }, [pendingReceiptId, ledgers, openReceipt]);

  const tenantByProperty = useMemo(() => {
    const m: Record<string, Tenant> = {};
    tenants.forEach((t) => { if (t.property_id) m[t.property_id] = t; });
    return m;
  }, [tenants]);

  const metrics = useMemo(() => {
    const unpaid = ledgers.filter((l) => l.payment_status !== "paid");
    return {
      spaces: properties.length,
      occupied: properties.filter((p) => !p.is_vacant).length,
      monthlyRent: tenants.reduce((s, t) => s + Number(t.monthly_rent || 0), 0),
      outstanding: unpaid.reduce(
        (s, l) => s + Math.max(0, Number(l.total_payable || 0) - Number(l.amount_paid || 0)),
        0
      ),
    };
  }, [properties, tenants, ledgers]);

  async function resetPasscode(t: Tenant) {
    const ok = await confirmDialog({
      title: `Reset the passcode for ${t.name}?`,
      message: "Their old passcode stops working immediately. You will be shown the new one once.",
      confirmLabel: "Reset",
    });
    if (!ok) return;
    try {
      const res = await rentMasterFetch<{ passcode?: string }>(`/api/admin/tenants/${t.id}`, {
        method: "PATCH",
        body: JSON.stringify({ resetPasscode: true }),
      });
      if (res.passcode) setPasscode({ name: t.name, code: res.passcode });
      else toast.success("Passcode reset.");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  if (loading) return <Card className="p-8 text-center text-sm text-muted">Loading…</Card>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spaces"
        subtitle="The building's own rentable space — rooftop, shops, parking, the caretaker's room — and the rent it brings in."
        action={<Button icon={Plus} onClick={() => setSpaceOpen(true)}>Add space</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Spaces" value={metrics.spaces} icon={Home} accent="indigo" />
        <StatCard label="Occupied" value={metrics.occupied} icon={DoorOpen} accent="emerald" />
        <StatCard label="Monthly rent" value={formatCurrency(metrics.monthlyRent)} icon={Wallet} accent="cyan" />
        <StatCard label="Outstanding" value={formatCurrency(metrics.outstanding)} icon={CircleDollarSign} accent="amber" />
      </div>

      {properties.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No spaces yet"
          hint="Add the first one — a shop, the rooftop, a parking bay. You can then put a tenant in it and bill them rent."
          action={<Button icon={Plus} onClick={() => setSpaceOpen(true)}>Add space</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {properties.map((p) => {
            const tenant = tenantByProperty[p.id];
            return (
              <Card key={p.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-heading">{p.name}</h3>
                    <p className="text-xs text-muted">{p.flat_no ? `${p.flat_no} · ` : ""}{p.address}</p>
                  </div>
                  <Badge tone={p.is_vacant ? "slate" : "emerald"}>{p.is_vacant ? "Vacant" : "Occupied"}</Badge>
                </div>

                {tenant ? (
                  <div className="mt-4 rounded-xl bg-surface-2 px-4 py-3">
                    <div className="text-sm font-medium text-heading">{tenant.name}</div>
                    <div className="text-xs text-muted">
                      {t("{0} · {1} / month · due day {2}")
                        .replace("{0}", String(tenant.phone))
                        .replace("{1}", formatCurrency(Number(tenant.monthly_rent || 0)))
                        .replace("{2}", String(tenant.due_date))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" icon={ReceiptText} onClick={() => setInvoiceFor(tenant)}>Bill rent</Button>
                      <Button size="sm" variant="ghost" icon={KeyRound} onClick={() => resetPasscode(tenant)}>
                        Passcode
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <Button size="sm" variant="secondary" icon={Users} onClick={() => setTenantFor(p)}>
                      Add a tenant
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ---------------- rent invoices ---------------- */}
      {ledgers.length > 0 && (
        <Card className="overflow-x-auto">
          <div className="border-b border-line/[0.06] px-5 py-4">
            <h3 className="text-sm font-semibold text-heading">{t("Rent invoices")}</h3>
          </div>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line/[0.06] bg-overlay/[0.02] text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="p-4">{t("Tenant")}</th>
                <th className="p-4">{t("Month")}</th>
                <th className="p-4">{t("Payable")}</th>
                <th className="p-4">{t("Paid")}</th>
                <th className="p-4">{t("Status")}</th>
                <th className="p-4 text-right">{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {ledgers.map((l) => (
                <tr key={l.id} className="border-b border-line/[0.04] last:border-0">
                  <td className="p-4 font-medium text-heading">{l.tenants?.name || "—"}</td>
                  <td className="p-4 text-fg">{formatMonth(l.billing_month)}</td>
                  <td className="p-4 text-fg">{formatCurrency(Number(l.total_payable || 0))}</td>
                  <td className="p-4 text-fg">{formatCurrency(Number(l.amount_paid || 0))}</td>
                  <td className="p-4">
                    <Badge tone={l.payment_status === "paid" ? "emerald" : l.payment_status === "partial" ? "amber" : "slate"}>
                      {l.payment_status}
                    </Badge>
                    {l.paid_at && <div className="mt-1 text-xs text-muted">{formatDate(l.paid_at)}</div>}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      {l.payment_status !== "paid" && (
                        <Button size="sm" icon={Wallet} onClick={() => setPayFor(l)}>Record</Button>
                      )}
                      {/* Offered at every status, like the owner dashboard: a receipt for a
                          part-paid invoice is a legitimate document, and it prints its balance. */}
                      <Button size="sm" variant="ghost" icon={ReceiptText} onClick={() => openReceipt(l)}>
                        Receipt
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <AddSpaceModal open={spaceOpen} onClose={() => setSpaceOpen(false)} onSaved={reload} />
      <AddTenantModal
        property={tenantFor}
        onClose={() => setTenantFor(null)}
        onSaved={reload}
        onPasscode={(name, code) => setPasscode({ name, code })}
      />
      <BillRentModal tenant={invoiceFor} onClose={() => setInvoiceFor(null)} onSaved={reload} />
      <RecordRentModal
        ledger={payFor}
        onClose={() => setPayFor(null)}
        onSaved={reload}
        onReceipt={setPendingReceiptId}
      />
      <PasscodeModal info={passcode} onClose={() => setPasscode(null)} />
      {/* A sibling of the record modal, never a child of it — nested, it would unmount the
          instant payFor went null. */}
      <ReceiptModal
        open={!!receipt}
        onClose={() => setReceipt(null)}
        html={receipt?.html || ""}
        phone={receipt?.phone}
        message={receipt?.message}
        fileName={receipt?.fileName}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- spaces & tenants */

function AddSpaceModal({
  open, onClose, onSaved,
}: { open: boolean; onClose: () => void; onSaved: () => Promise<void> }) {
  const empty = { name: "", address: "", flatNo: "" };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      await rentMasterFetch("/api/admin/properties", { method: "POST", body: JSON.stringify(form) });
      setForm(empty);
      await onSaved();
      onClose();
      toast.success("Space added.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a space"
      subtitle="Something the building itself lets out, not a flat an owner holds.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" required>
          <TextInput required value={form.name} placeholder="Ground floor shop"
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Address" required>
          <TextInput required value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Field>
        <Field label="Unit / reference" required hint="How you refer to it — Shop 1, Rooftop, Bay B.">
          <TextInput required value={form.flatNo}
            onChange={(e) => setForm({ ...form, flatNo: e.target.value })} />
        </Field>
        <Button type="submit" loading={saving} className="w-full">Add space</Button>
      </form>
    </Modal>
  );
}

function AddTenantModal({
  property, onClose, onSaved, onPasscode,
}: {
  property: Property | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onPasscode: (name: string, code: string) => void;
}) {
  const empty = { name: "", phone: "", monthlyRent: "", dueDate: "5", rentedDate: "", advanceAmount: "" };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(empty); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [property]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!property) return;
    const parsedPhone = validatePhone(form.phone, { required: true });
    if (!parsedPhone.ok) { toast.error(parsedPhone.error); return; }
    try {
      setSaving(true);
      const res = await rentMasterFetch<{ passcode?: string }>("/api/admin/tenants", {
        method: "POST",
        body: JSON.stringify({
          propertyId: property.id,
          name: form.name,
          phone: parsedPhone.value,
          monthlyRent: Number(form.monthlyRent || 0),
          dueDate: Number(form.dueDate || 5),
          rentedDate: form.rentedDate || null,
          advanceAmount: Number(form.advanceAmount || 0),
        }),
      });
      setForm(empty);
      await onSaved();
      onClose();
      // Shown ONCE — it is not recoverable afterwards, only resettable.
      if (res.passcode) onPasscode(form.name, res.passcode);
      else toast.success("Tenant added.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={!!property} onClose={onClose} title="Add a tenant" subtitle={property?.name}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required>
            <TextInput required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Phone" required hint="This is how they sign in.">
            <TextInput required value={form.phone} placeholder="01XXXXXXXXX"
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Monthly rent" required>
            <TextInput required type="number" min="0" step="0.01" value={form.monthlyRent}
              onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })} />
          </Field>
          <Field label="Rent due on" required hint="Day of the month.">
            <TextInput required type="number" min="1" max="31" value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tenancy started">
            <TextInput type="date" value={form.rentedDate}
              onChange={(e) => setForm({ ...form, rentedDate: e.target.value })} />
          </Field>
          <Field label="Advance held">
            <TextInput type="number" min="0" step="0.01" value={form.advanceAmount}
              onChange={(e) => setForm({ ...form, advanceAmount: e.target.value })} />
          </Field>
        </div>
        <Button type="submit" loading={saving} className="w-full">Add tenant</Button>
      </form>
    </Modal>
  );
}

function PasscodeModal({
  info, onClose,
}: { info: { name: string; code: string } | null; onClose: () => void }) {
  const t = useT();
  return (
    <Modal open={!!info} onClose={onClose} title="Their sign-in passcode"
      subtitle="Shown once. Write it down before closing.">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          {t("{0} signs in with their phone number and this passcode.").replace("{0}", info?.name || "")}
        </p>
        <div className="rounded-xl bg-surface-2 px-4 py-6 text-center">
          <span className="font-mono text-3xl font-semibold tracking-[0.3em] text-heading">{info?.code}</span>
        </div>
        <Button className="w-full" onClick={onClose}>I have written it down</Button>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------- rent */

function BillRentModal({
  tenant, onClose, onSaved,
}: { tenant: Tenant | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const t = useT();
  const [form, setForm] = useState({
    billingMonth: currentMonth(), rentAmount: "", serviceCharge: "", extraCharge: "",
    extraChargeRemarks: "", discount: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    setForm({
      billingMonth: currentMonth(),
      rentAmount: String(tenant.monthly_rent ?? ""),
      serviceCharge: String(tenant.service_charge ?? ""),
      extraCharge: "", extraChargeRemarks: "", discount: "",
    });
  }, [tenant]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant?.property_id) { toast.error("This tenant is not in a space."); return; }
    try {
      setSaving(true);
      await rentMasterFetch("/api/admin/billing", {
        method: "POST",
        body: JSON.stringify({
          tenantId: tenant.id,
          propertyId: tenant.property_id,
          billingMonth: form.billingMonth,
          rentAmount: Number(form.rentAmount || 0),
          serviceCharge: Number(form.serviceCharge || 0),
          extraCharge: Number(form.extraCharge || 0),
          extraChargeRemarks: form.extraChargeRemarks,
          discount: Number(form.discount || 0),
        }),
      });
      await onSaved();
      onClose();
      toast.success("Rent invoice created.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const total =
    Number(form.rentAmount || 0) + Number(form.serviceCharge || 0) +
    Number(form.extraCharge || 0) - Number(form.discount || 0);

  return (
    <Modal open={!!tenant} onClose={onClose} title="Bill rent" subtitle={tenant?.name}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Billing month" required>
          <TextInput required type="month" value={form.billingMonth}
            onChange={(e) => setForm({ ...form, billingMonth: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rent" required>
            <TextInput required type="number" min="0" step="0.01" value={form.rentAmount}
              onChange={(e) => setForm({ ...form, rentAmount: e.target.value })} />
          </Field>
          <Field label="Service charge">
            <TextInput type="number" min="0" step="0.01" value={form.serviceCharge}
              onChange={(e) => setForm({ ...form, serviceCharge: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Extra charge">
            <TextInput type="number" min="0" step="0.01" value={form.extraCharge}
              onChange={(e) => setForm({ ...form, extraCharge: e.target.value })} />
          </Field>
          <Field label="Discount">
            <TextInput type="number" min="0" step="0.01" value={form.discount}
              onChange={(e) => setForm({ ...form, discount: e.target.value })} />
          </Field>
        </div>
        {Number(form.extraCharge || 0) > 0 && (
          <Field label="What is the extra charge for?">
            <TextInput value={form.extraChargeRemarks}
              onChange={(e) => setForm({ ...form, extraChargeRemarks: e.target.value })} />
          </Field>
        )}
        <div className="rounded-xl bg-surface-2 px-4 py-3 text-sm">
          <span className="text-muted">{t("Total payable")}: </span>
          <strong className="text-heading">{formatCurrency(Math.max(0, total))}</strong>
        </div>
        <Button type="submit" loading={saving} className="w-full">Create invoice</Button>
      </form>
    </Modal>
  );
}

function RecordRentModal({
  ledger, onClose, onSaved, onReceipt,
}: {
  ledger: BillingLedger | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
  /** Hands the parent the LEDGER ID once the reload has landed, so it can build a receipt from
   *  the refreshed row. Deliberately not the ledger object — this one is pre-payment. */
  onReceipt: (ledgerId: string) => void;
}) {
  const t = useT();
  const outstanding = ledger
    ? Math.max(0, Number(ledger.total_payable || 0) - Number(ledger.amount_paid || 0))
    : 0;
  const [form, setForm] = useState({ amount: "", method: "cash", paidOn: "", note: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ledger) return;
    setForm({
      amount: String(outstanding || ""),
      method: "cash",
      paidOn: new Date().toISOString().slice(0, 10),
      note: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledger]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ledger) return;
    const amount = Number(form.amount || 0);
    if (!(amount > 0)) { toast.error("Enter an amount greater than zero."); return; }
    try {
      setSaving(true);
      await rentMasterFetch("/api/admin/billing/payments", {
        method: "POST",
        body: JSON.stringify({
          ledgerId: ledger.id, amount, method: form.method, paidOn: form.paidOn, note: form.note,
        }),
      });
      await onSaved();
      onClose();
      toast.success("Payment recorded.");
      // After onSaved(), so the parent's ledger and payment lists already carry this payment.
      onReceipt(ledger.id);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={!!ledger} onClose={onClose} title="Record rent received"
      subtitle={ledger ? `${ledger.tenants?.name || ""} · outstanding ${formatCurrency(outstanding)}` : undefined}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" required>
            <TextInput required type="number" min="0.01" step="0.01" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </Field>
          <Field label="Received on" required hint="Cannot be a future date.">
            <TextInput required type="date" max={new Date().toISOString().slice(0, 10)} value={form.paidOn}
              onChange={(e) => setForm({ ...form, paidOn: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Method">
            <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              {RENT_METHODS.map((m) => (
                <option key={m} value={m}>{t(RENT_METHOD_LABEL[m])}</option>
              ))}
            </Select>
          </Field>
          <Field label="Note">
            <TextInput value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
        </div>
        <Button type="submit" loading={saving} className="w-full">Record payment</Button>
      </form>
    </Modal>
  );
}
