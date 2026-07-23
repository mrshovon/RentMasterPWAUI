"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Pencil, Trash2, Lock, Sparkles, HardHat, Phone, Building2, CircleDollarSign,
  CalendarClock, History, BadgeCheck, UserRoundX, UserRoundCheck, Wallet, Upload, X,
} from "lucide-react";
import { rentMasterFetch, uploadFile } from "../lib/api-service";
import { toast } from "./toast";
import { confirmDialog } from "./confirm";
import { formatCurrency, formatDate } from "../lib/format";
import type { Property, Staff, StaffPayment, StaffPaymentMethod } from "../types/api";
import {
  Card, StatCard, Badge, Button, Modal, Field, TextInput, TextArea, Select,
  PageHeader, EmptyState, SearchInput, Spinner,
} from "./ui";

// =============================================================================
// STAFF — owner module (paid add-on).
//
// Lives in its own file rather than inside app/owner/page.tsx like the other tabs:
// that file is already ~3000 lines and this feature is self-contained, fetching its
// own data instead of drawing on the page's state. Same components and idioms as the
// inline tabs, so it reads the same.
//
// Salary is an ad-hoc log by design — a staff member has an agreed monthly_salary on
// record, and each real payment is one staff_payments row. There is no payroll cycle.
// =============================================================================

const METHOD_LABEL: Record<StaffPaymentMethod, string> = {
  cash: "Cash",
  bkash: "bKash",
  nagad: "Nagad",
  bank: "Bank",
  other: "Other",
};

const DESIGNATIONS = ["Caretaker", "Security guard", "Cleaner", "Electrician", "Plumber", "Manager", "Other"];

const todayStr = () => new Date().toISOString().slice(0, 10);

export function StaffTab({
  enabled,
  properties,
  onContact,
}: {
  /** From GET /api/admin/subscription -> features.staff.enabled. */
  enabled: boolean;
  properties: Property[];
  /** Opens the "contact us" enquiry modal owned by the page. */
  onContact: () => void;
}) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [payments, setPayments] = useState<StaffPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const [editing, setEditing] = useState<Staff | null>(null);
  const [adding, setAdding] = useState(false);
  const [payFor, setPayFor] = useState<Staff | null>(null);
  const [historyFor, setHistoryFor] = useState<Staff | null>(null);

  const load = useCallback(async () => {
    if (!enabled) { setLoading(false); return; }
    try {
      setLoading(true);
      const [s, p] = await Promise.allSettled([
        rentMasterFetch<{ data: Staff[] }>("/api/admin/staff", { role: "owner" }),
        rentMasterFetch<{ data: StaffPayment[] }>("/api/admin/staff/payments", { role: "owner" }),
      ]);
      if (s.status === "fulfilled") setStaff(s.value.data || []);
      if (p.status === "fulfilled") setPayments(p.value.data || []);
      if (s.status === "rejected") toast.error((s.reason as Error).message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => { load(); }, [load]);

  // Total paid out this calendar month, across everyone.
  const paidThisMonth = useMemo(() => {
    const prefix = todayStr().slice(0, 7);
    return payments
      .filter((p) => String(p.paid_on).startsWith(prefix))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  const activeStaff = useMemo(() => staff.filter((s) => s.is_active), [staff]);
  const monthlyWageBill = useMemo(
    () => activeStaff.reduce((sum, s) => sum + Number(s.monthly_salary || 0), 0),
    [activeStaff]
  );

  const q = query.trim().toLowerCase();
  const filtered = q
    ? staff.filter((s) =>
        [s.name, s.phone, s.designation, s.properties?.name].some((v) =>
          String(v ?? "").toLowerCase().includes(q)))
    : staff;

  async function toggleActive(s: Staff) {
    const next = !s.is_active;
    const prev = staff;
    setStaff((xs) => xs.map((x) => (x.id === s.id ? { ...x, is_active: next } : x)));
    try {
      await rentMasterFetch(`/api/admin/staff/${s.id}`, {
        method: "PATCH", role: "owner", body: JSON.stringify({ isActive: next }),
      });
      toast.success(next ? `${s.name} marked active.` : `${s.name} marked inactive.`);
    } catch (e: any) {
      setStaff(prev); // rollback
      toast.error(e.message);
    }
  }

  async function remove(s: Staff) {
    if (!(await confirmDialog({
      title: "Remove staff member?",
      message: `Delete ${s.name}? Their payment history goes with them. To keep the record, mark them inactive instead.`,
      confirmLabel: "Delete",
      danger: true,
    }))) return;
    try {
      setBusy(s.id);
      await rentMasterFetch(`/api/admin/staff/${s.id}`, { method: "DELETE", role: "owner" });
      toast.success(`${s.name} removed.`);
      await load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  }

  if (!enabled) return <StaffLocked onContact={onContact} />;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-sm text-muted">
        <Spinner /> Loading your staff…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        subtitle="Your caretakers, guards and cleaners — their details, and what you've paid them."
        action={<Button icon={Plus} onClick={() => setAdding(true)}>Add staff</Button>}
      />

      {staff.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Active staff" value={String(activeStaff.length)} icon={HardHat} accent="indigo" />
          <StatCard label="Monthly wage bill" value={formatCurrency(monthlyWageBill)} icon={Wallet} accent="cyan" />
          <StatCard label="Paid this month" value={formatCurrency(paidThisMonth)} icon={CircleDollarSign} accent="emerald" />
        </div>
      )}

      {staff.length === 0 ? (
        <EmptyState
          icon={HardHat}
          title="No staff yet"
          hint="Add the people who work on your properties — record their salary, and log each payment as you make it."
          action={<Button icon={Plus} onClick={() => setAdding(true)}>Add staff</Button>}
        />
      ) : (
        <>
          <SearchInput value={query} onChange={setQuery} placeholder="Search by name, phone, role or property…" />
          {filtered.length === 0 ? (
            <EmptyState icon={HardHat} title="No matches" hint={`No staff match "${query}".`} />
          ) : (
            <div className="space-y-3">
              {filtered.map((s) => (
                <StaffCard
                  key={s.id}
                  staff={s}
                  paidTotal={payments
                    .filter((p) => p.staff_id === s.id)
                    .reduce((sum, p) => sum + Number(p.amount || 0), 0)}
                  busy={busy === s.id}
                  onEdit={() => setEditing(s)}
                  onPay={() => setPayFor(s)}
                  onHistory={() => setHistoryFor(s)}
                  onToggleActive={() => toggleActive(s)}
                  onDelete={() => remove(s)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <StaffModal
        open={adding || !!editing}
        staff={editing}
        properties={properties}
        onClose={() => { setAdding(false); setEditing(null); }}
        onSaved={async () => { setAdding(false); setEditing(null); await load(); }}
      />
      <LogPaymentModal
        staff={payFor}
        onClose={() => setPayFor(null)}
        onSaved={async () => { setPayFor(null); await load(); }}
      />
      <PaymentHistoryModal
        staff={historyFor}
        payments={historyFor ? payments.filter((p) => p.staff_id === historyFor.id) : []}
        onClose={() => setHistoryFor(null)}
        onChanged={load}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- locked state */

function StaffLocked({ onContact }: { onContact: () => void }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Staff" subtitle="Manage the people who work on your properties." />
      <Card className="overflow-hidden">
        <div className="border-b border-line/[0.06] bg-gradient-to-r from-primary/10 to-accent/5 px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-line/[0.08] bg-overlay/[0.03] text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-heading">Staff is an add-on</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Keep a record of every caretaker, guard and cleaner you employ — their salary, the
            property they cover, and every payment you make them.
          </p>
        </div>
        <div className="space-y-4 p-6">
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              "Staff profiles with photo, NID, phone and joining date",
              "Assign each person to one of your properties",
              "Record the agreed monthly salary",
              "Log salary payments and keep a running history",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm text-fg">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {line}
              </li>
            ))}
          </ul>
          <div className="rounded-xl border border-line/[0.06] bg-overlay/[0.02] p-4 text-sm text-muted">
            Included with the <span className="font-semibold text-fg">Whole Building</span> plan,
            or available as a paid add-on to your current plan.
          </div>
          <Button icon={Sparkles} className="w-full" onClick={onContact}>
            Contact us to enable Staff
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------- staff card */

function StaffCard({
  staff: s, paidTotal, busy, onEdit, onPay, onHistory, onToggleActive, onDelete,
}: {
  staff: Staff;
  paidTotal: number;
  busy: boolean;
  onEdit: () => void;
  onPay: () => void;
  onHistory: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <StaffAvatar staff={s} />
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-subtle">#{s.staff_no}</span>
              <span className="truncate text-sm font-bold text-heading">{s.name}</span>
              {s.designation && <Badge tone="indigo">{s.designation}</Badge>}
              <Badge tone={s.is_active ? "emerald" : "slate"}>{s.is_active ? "Active" : "Inactive"}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              {s.phone && (
                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{s.phone}</span>
              )}
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {s.properties ? `${s.properties.name} · ${s.properties.flat_no}` : "No property assigned"}
              </span>
              {s.joining_date && (
                <span className="flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" />Joined {formatDate(s.joining_date)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="text-muted">
                Salary <span className="font-semibold text-fg">{formatCurrency(s.monthly_salary)}</span>/mo
              </span>
              <span className="text-muted">
                Paid to date <span className="font-semibold text-success">{formatCurrency(paidTotal)}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1">
          <Button size="sm" variant="success" icon={CircleDollarSign} onClick={onPay}>Pay</Button>
          <IconBtn title="Payment history" icon={History} onClick={onHistory} />
          <IconBtn title="Edit" icon={Pencil} onClick={onEdit} />
          <IconBtn
            title={s.is_active ? "Mark inactive" : "Mark active"}
            icon={s.is_active ? UserRoundX : UserRoundCheck}
            onClick={onToggleActive}
          />
          <IconBtn title="Delete" icon={Trash2} tone="rose" loading={busy} onClick={onDelete} />
        </div>
      </div>
    </Card>
  );
}

function StaffAvatar({ staff: s }: { staff: Staff }) {
  const initials = s.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-line/[0.08] bg-overlay/[0.03]">
      {s.photo_url ? (
        <img
          src={s.photo_url}
          alt={s.name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-black text-subtle">
          {initials || "?"}
        </div>
      )}
    </div>
  );
}

function IconBtn({
  title, icon: Icon, onClick, loading, tone = "slate",
}: {
  title: string;
  icon: typeof Pencil;
  onClick: () => void;
  loading?: boolean;
  tone?: "slate" | "rose";
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={loading}
      className={
        "rounded-lg p-2 transition disabled:opacity-50 " +
        (tone === "rose"
          ? "text-danger hover:bg-danger/10"
          : "text-muted hover:bg-overlay/[0.06] hover:text-heading")
      }
    >
      {loading ? <Spinner /> : <Icon className="h-4 w-4" />}
    </button>
  );
}

/* ---------------------------------------------------------------- add / edit */

function StaffModal({
  open, staff: editing, properties, onClose, onSaved,
}: {
  open: boolean;
  staff: Staff | null;
  properties: Property[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [salary, setSalary] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [nidNumber, setNidNumber] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [nidDocUrl, setNidDocUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset the form each time the modal opens, so a previous edit never bleeds into a new add.
  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setPhone(editing?.phone ?? "");
    setDesignation(editing?.designation ?? "");
    setPropertyId(editing?.property_id ?? "");
    setSalary(editing ? String(editing.monthly_salary ?? "") : "");
    setJoiningDate(editing?.joining_date?.slice(0, 10) ?? "");
    setNidNumber(editing?.nid_number ?? "");
    setAddress(editing?.address ?? "");
    setNotes(editing?.notes ?? "");
    setPhotoUrl(editing?.photo_url ?? null);
    setNidDocUrl(editing?.nid_doc_url ?? null);
  }, [open, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("A name is required."); return; }
    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      designation: designation.trim(),
      propertyId,               // "" clears the assignment
      monthlySalary: Number(salary) || 0,
      joiningDate,
      nidNumber: nidNumber.trim(),
      address: address.trim(),
      notes: notes.trim(),
      photoUrl,
      nidDocUrl,
    };
    try {
      setSaving(true);
      if (editing) {
        await rentMasterFetch(`/api/admin/staff/${editing.id}`, {
          method: "PATCH", role: "owner", body: JSON.stringify(payload),
        });
        toast.success(`${payload.name} updated.`);
      } else {
        await rentMasterFetch("/api/admin/staff", {
          method: "POST", role: "owner", body: JSON.stringify(payload),
        });
        toast.success(`${payload.name} added.`);
      }
      await onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? "Edit staff member" : "Add staff member"}
      subtitle={editing ? editing.name : "Their details, salary and property"}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required>
            <TextInput required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </Field>
          <Field label="Phone">
            <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01712345678" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role">
            <Select value={designation} onChange={(e) => setDesignation(e.target.value)}>
              <option value="">Select a role…</option>
              {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </Field>
          <Field label="Monthly salary" hint="The agreed figure. Payments are logged separately.">
            <TextInput
              type="number" min="0" step="any" inputMode="decimal"
              value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="0"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Property" hint="Optional — leave blank if they cover everything.">
            <Select value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
              <option value="">No property assigned</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name} · {p.flat_no}</option>
              ))}
            </Select>
          </Field>
          <Field label="Joining date">
            <TextInput type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
          </Field>
        </div>

        <Field label="NID number">
          <TextInput value={nidNumber} onChange={(e) => setNidNumber(e.target.value)} placeholder="National ID number" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <ImageField label="Photo" value={photoUrl} onChange={setPhotoUrl} />
          <ImageField label="NID document" value={nidDocUrl} onChange={setNidDocUrl} />
        </div>

        <Field label="Address">
          <TextArea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Where they live" />
        </Field>
        <Field label="Notes">
          <TextArea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth remembering" />
        </Field>

        <Button type="submit" loading={saving} icon={editing ? Pencil : Plus} className="w-full">
          {editing ? "Save changes" : "Add staff member"}
        </Button>
      </form>
    </Modal>
  );
}

/** Upload one image (photo / NID scan) through the shared uploads route. */
function ImageField({
  label, value, onChange,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be re-picked after a failure
    if (!file) return;
    try {
      setUploading(true);
      onChange(await uploadFile(file, { role: "owner", folder: "staff" }));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Field label={label} hint="JPG, PNG or WebP.">
      {value ? (
        <div className="flex items-center gap-3">
          <a
            href={value} target="_blank" rel="noreferrer"
            className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line/[0.08] bg-overlay/[0.02]"
          >
            <img src={value} alt={label} className="h-full w-full object-cover" />
          </a>
          <Button type="button" size="sm" variant="ghost" icon={X} onClick={() => onChange(null)}>
            Remove
          </Button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line/[0.12] bg-overlay/[0.02] px-4 py-5 text-xs font-semibold text-muted transition hover:border-line/20 hover:text-fg">
          {uploading ? <Spinner /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading…" : `Upload ${label.toLowerCase()}`}
          <input type="file" accept="image/*" className="hidden" onChange={pick} disabled={uploading} />
        </label>
      )}
    </Field>
  );
}

/* ---------------------------------------------------------------- log a payment */

function LogPaymentModal({
  staff: s, onClose, onSaved,
}: {
  staff: Staff | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState(todayStr());
  const [method, setMethod] = useState<StaffPaymentMethod>("cash");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Prefill with the agreed salary — the common case is paying exactly that.
  useEffect(() => {
    if (!s) return;
    setAmount(s.monthly_salary ? String(s.monthly_salary) : "");
    setPaidOn(todayStr());
    setMethod("cash");
    setNote("");
  }, [s]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!s) return;
    if (!(Number(amount) > 0)) { toast.error("Enter an amount greater than zero."); return; }
    try {
      setSaving(true);
      await rentMasterFetch("/api/admin/staff/payments", {
        method: "POST", role: "owner",
        body: JSON.stringify({ staffId: s.id, amount: Number(amount), paidOn, method, note: note.trim() }),
      });
      toast.success(`${formatCurrency(Number(amount))} recorded for ${s.name}.`);
      await onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={!!s} onClose={onClose} title="Log a salary payment" subtitle={s?.name}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" required>
            <TextInput
              type="number" min="1" step="any" inputMode="decimal" required
              value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
            />
          </Field>
          <Field label="Paid on" required>
            <TextInput type="date" required value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
          </Field>
        </div>
        <Field label="Method">
          <Select value={method} onChange={(e) => setMethod(e.target.value as StaffPaymentMethod)}>
            {(Object.keys(METHOD_LABEL) as StaffPaymentMethod[]).map((m) => (
              <option key={m} value={m}>{METHOD_LABEL[m]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Note">
          <TextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. July salary, or an advance" />
        </Field>
        <Button type="submit" loading={saving} icon={CircleDollarSign} className="w-full">
          Record payment
        </Button>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------- history */

function PaymentHistoryModal({
  staff: s, payments, onClose, onChanged,
}: {
  staff: Staff | null;
  payments: StaffPayment[];
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const total = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  async function remove(p: StaffPayment) {
    if (!(await confirmDialog({
      title: "Delete payment?",
      message: `Remove the ${formatCurrency(p.amount)} payment from ${formatDate(p.paid_on)}?`,
      confirmLabel: "Delete",
      danger: true,
    }))) return;
    try {
      setBusy(p.id);
      await rentMasterFetch(`/api/admin/staff/payments/${p.id}`, { method: "DELETE", role: "owner" });
      toast.success("Payment deleted.");
      await onChanged();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  }

  return (
    <Modal open={!!s} onClose={onClose} size="lg" title="Payment history" subtitle={s?.name}>
      {payments.length === 0 ? (
        <EmptyState icon={History} title="No payments yet"
          hint="Payments you log for this person will appear here." />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-line/[0.06] bg-overlay/[0.02] px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Total paid</span>
            <span className="text-lg font-extrabold text-success">{formatCurrency(total)}</span>
          </div>
          {payments.map((p) => (
            <div key={p.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-line/[0.06] bg-overlay/[0.02] px-4 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-subtle">#{p.payment_no}</span>
                  <span className="text-sm font-bold text-heading">{formatCurrency(p.amount)}</span>
                  <Badge tone="slate">{METHOD_LABEL[p.method] ?? p.method}</Badge>
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  {formatDate(p.paid_on)}{p.note ? ` · ${p.note}` : ""}
                </div>
              </div>
              <IconBtn title="Delete" icon={Trash2} tone="rose" loading={busy === p.id} onClick={() => remove(p)} />
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
