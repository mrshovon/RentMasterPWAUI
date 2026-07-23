"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Pencil, Trash2, Lock, Sparkles, Wallet, Landmark, Banknote, Smartphone,
  Star, ArrowRightLeft, TrendingUp, TrendingDown, Scale, Building2, BadgeCheck,
  Power, Filter, CircleDollarSign,
} from "lucide-react";
import { rentMasterFetch } from "../lib/api-service";
import { toast } from "./toast";
import { confirmDialog } from "./confirm";
import { formatCurrency, formatDate, formatMonth } from "../lib/format";
import type {
  Property, Account, AccountType, AccountTransaction, AccountTransfer, TxnDirection,
} from "../types/api";
import {
  Card, StatCard, Badge, Button, Modal, Field, TextInput, TextArea, Select,
  PageHeader, EmptyState, Spinner,
} from "./ui";

// =============================================================================
// ACCOUNTS — owner module (paid add-on).
//
// A lightweight bookkeeping ledger: the owner's "wallets" (cash / bank / MFS), the
// income & expense entries against them, and transfers between them. Two automations
// feed it from elsewhere — an invoice marked Paid books an income, a staff salary
// booked books an expense — both posting to the owner's DEFAULT account.
//
// Lives in its own file (not inside app/owner/page.tsx) for the same reason as staff:
// it is self-contained and fetches its own data.
// =============================================================================

const ACCOUNT_TYPE_META: Record<AccountType, { label: string; icon: typeof Wallet }> = {
  cash: { label: "Cash in hand", icon: Banknote },
  bank: { label: "Bank", icon: Landmark },
  mfs: { label: "Mobile money", icon: Smartphone },
  other: { label: "Other", icon: Wallet },
};

const INCOME_CATEGORIES = ["Rent", "Deposit", "Advance", "Service charge", "Other"];
const EXPENSE_CATEGORIES = ["Salary", "Utility", "Maintenance", "Repair", "Tax", "Supplies", "Other"];

const todayStr = () => new Date().toISOString().slice(0, 10);
const thisMonthStr = () => new Date().toISOString().slice(0, 7);

export function AccountsTab({
  enabled,
  properties,
  onContact,
}: {
  /** From GET /api/admin/subscription -> features.accounts.enabled. */
  enabled: boolean;
  properties: Property[];
  /** Opens the "contact us" enquiry modal owned by the page. */
  onContact: () => void;
}) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [txns, setTxns] = useState<AccountTransaction[]>([]);
  const [transfers, setTransfers] = useState<AccountTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  // Filters (applied client-side to the income/expense list + the income/expense cards).
  const [monthFilter, setMonthFilter] = useState<string>(thisMonthStr()); // "" = all months
  const [propertyFilter, setPropertyFilter] = useState<string>("");       // "" = all properties

  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [addingAccount, setAddingAccount] = useState(false);
  const [txnModal, setTxnModal] = useState<TxnDirection | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) { setLoading(false); return; }
    try {
      setLoading(true);
      const [a, t, x] = await Promise.allSettled([
        rentMasterFetch<{ data: Account[] }>("/api/admin/accounts", { role: "owner" }),
        rentMasterFetch<{ data: AccountTransaction[] }>("/api/admin/accounts/transactions", { role: "owner" }),
        rentMasterFetch<{ data: AccountTransfer[] }>("/api/admin/accounts/transfers", { role: "owner" }),
      ]);
      if (a.status === "fulfilled") setAccounts(a.value.data || []);
      if (t.status === "fulfilled") setTxns(t.value.data || []);
      if (x.status === "fulfilled") setTransfers(x.value.data || []);
      if (a.status === "rejected") toast.error((a.reason as Error).message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => { load(); }, [load]);

  // Per-account current balance (all-time): opening + income − expense − transfers out + transfers in.
  const balances = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of accounts) map.set(a.id, Number(a.opening_balance || 0));
    for (const t of txns) {
      const cur = map.get(t.account_id) ?? 0;
      map.set(t.account_id, cur + (t.direction === "income" ? 1 : -1) * Number(t.amount || 0));
    }
    for (const x of transfers) {
      map.set(x.from_account_id, (map.get(x.from_account_id) ?? 0) - Number(x.amount || 0));
      map.set(x.to_account_id, (map.get(x.to_account_id) ?? 0) + Number(x.amount || 0));
    }
    return map;
  }, [accounts, txns, transfers]);

  const totalBalance = useMemo(
    () => accounts.reduce((s, a) => s + (balances.get(a.id) ?? 0), 0),
    [accounts, balances]
  );

  // Income/expense list under the active month + property filters.
  const filteredTxns = useMemo(() => {
    return txns.filter((t) => {
      if (monthFilter && !String(t.txn_date).startsWith(monthFilter)) return false;
      if (propertyFilter && t.property_id !== propertyFilter) return false;
      return true;
    });
  }, [txns, monthFilter, propertyFilter]);

  const totalIncome = useMemo(
    () => filteredTxns.filter((t) => t.direction === "income").reduce((s, t) => s + Number(t.amount || 0), 0),
    [filteredTxns]
  );
  const totalExpense = useMemo(
    () => filteredTxns.filter((t) => t.direction === "expense").reduce((s, t) => s + Number(t.amount || 0), 0),
    [filteredTxns]
  );

  // Distinct months present in the data, newest first, for the month dropdown.
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    for (const t of txns) set.add(String(t.txn_date).slice(0, 7));
    set.add(thisMonthStr());
    return Array.from(set).sort().reverse();
  }, [txns]);

  const hasDefault = accounts.some((a) => a.is_default && a.is_active);

  async function setDefault(a: Account) {
    if (a.is_default) return;
    const prev = accounts;
    setAccounts((xs) => xs.map((x) => ({ ...x, is_default: x.id === a.id })));
    try {
      await rentMasterFetch(`/api/admin/accounts/${a.id}`, {
        method: "PATCH", role: "owner", body: JSON.stringify({ isDefault: true }),
      });
      toast.success(`${a.name} is now your default account.`);
    } catch (e: any) {
      setAccounts(prev);
      toast.error(e.message);
    }
  }

  async function toggleActive(a: Account) {
    const next = !a.is_active;
    const prev = accounts;
    setAccounts((xs) => xs.map((x) => (x.id === a.id ? { ...x, is_active: next } : x)));
    try {
      await rentMasterFetch(`/api/admin/accounts/${a.id}`, {
        method: "PATCH", role: "owner", body: JSON.stringify({ isActive: next }),
      });
      toast.success(next ? `${a.name} reopened.` : `${a.name} closed.`);
    } catch (e: any) {
      setAccounts(prev);
      toast.error(e.message);
    }
  }

  async function removeAccount(a: Account) {
    if (!(await confirmDialog({
      title: "Delete account?",
      message: `Delete ${a.name}? Every income, expense and transfer recorded against it goes with it. To keep the history, close the account instead.`,
      confirmLabel: "Delete",
      danger: true,
    }))) return;
    try {
      setBusy(a.id);
      await rentMasterFetch(`/api/admin/accounts/${a.id}`, { method: "DELETE", role: "owner" });
      toast.success(`${a.name} removed.`);
      await load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  }

  async function removeTxn(t: AccountTransaction) {
    if (!(await confirmDialog({
      title: "Delete entry?",
      message: `Remove the ${formatCurrency(t.amount)} ${t.direction} from ${formatDate(t.txn_date)}?`,
      confirmLabel: "Delete",
      danger: true,
    }))) return;
    try {
      setBusy(t.id);
      await rentMasterFetch(`/api/admin/accounts/transactions/${t.id}`, { method: "DELETE", role: "owner" });
      toast.success("Entry deleted.");
      await load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  }

  async function removeTransfer(x: AccountTransfer) {
    if (!(await confirmDialog({
      title: "Delete transfer?",
      message: `Remove the ${formatCurrency(x.amount)} transfer from ${formatDate(x.txn_date)}?`,
      confirmLabel: "Delete",
      danger: true,
    }))) return;
    try {
      setBusy(x.id);
      await rentMasterFetch(`/api/admin/accounts/transfers/${x.id}`, { method: "DELETE", role: "owner" });
      toast.success("Transfer deleted.");
      await load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  }

  if (!enabled) return <AccountsLocked onContact={onContact} />;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-sm text-muted">
        <Spinner /> Loading your accounts…
      </div>
    );
  }

  const filterLabel = monthFilter ? formatMonth(monthFilter) : "All time";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        subtitle="Track your cash, bank and mobile-money balances — and every taka in and out."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" icon={ArrowRightLeft}
              onClick={() => setTransferOpen(true)} disabled={accounts.length < 2}>
              Transfer
            </Button>
            <Button size="sm" variant="success" icon={TrendingUp}
              onClick={() => setTxnModal("income")} disabled={accounts.length === 0}>
              Income
            </Button>
            <Button size="sm" variant="danger" icon={TrendingDown}
              onClick={() => setTxnModal("expense")} disabled={accounts.length === 0}>
              Expense
            </Button>
            <Button size="sm" icon={Plus} onClick={() => setAddingAccount(true)}>Add account</Button>
          </div>
        }
      />

      {/* Summary — balance is all-time; income/expense follow the filters. */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total balance" value={formatCurrency(totalBalance)} icon={Scale} accent="cyan"
          sub={`Across ${accounts.length} account${accounts.length === 1 ? "" : "s"}`} />
        <StatCard label={`Income · ${filterLabel}`} value={formatCurrency(totalIncome)} icon={TrendingUp} accent="emerald" />
        <StatCard label={`Expense · ${filterLabel}`} value={formatCurrency(totalExpense)} icon={TrendingDown} accent="rose" />
      </div>

      {/* Accounts */}
      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          hint="Add a cash, bank or mobile-money account to start tracking your income and expenses."
          action={<Button icon={Plus} onClick={() => setAddingAccount(true)}>Add account</Button>}
        />
      ) : (
        <div className="space-y-3">
          <SectionLabel>Accounts</SectionLabel>
          {!hasDefault && (
            <div className="rounded-xl border border-warning/20 bg-warning/[0.06] px-4 py-3 text-xs text-warning">
              No default account set. Marking an invoice paid or logging a staff salary won’t be booked
              automatically until you star one account as the default.
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {accounts.map((a) => (
              <AccountCard
                key={a.id}
                account={a}
                balance={balances.get(a.id) ?? 0}
                busy={busy === a.id}
                onSetDefault={() => setDefault(a)}
                onEdit={() => setEditingAccount(a)}
                onToggleActive={() => toggleActive(a)}
                onDelete={() => removeAccount(a)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filters + income/expense ledger */}
      {accounts.length > 0 && (
        <div className="space-y-3">
          <SectionLabel>Income &amp; expenses</SectionLabel>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-subtle">
              <Filter className="h-3.5 w-3.5" /> Filter
            </span>
            <Select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="w-auto">
              <option value="">All months</option>
              {monthOptions.map((m) => <option key={m} value={m}>{formatMonth(m)}</option>)}
            </Select>
            <Select value={propertyFilter} onChange={(e) => setPropertyFilter(e.target.value)} className="w-auto">
              <option value="">All properties</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.flat_no}</option>)}
            </Select>
          </div>

          {filteredTxns.length === 0 ? (
            <EmptyState icon={CircleDollarSign} title="No entries"
              hint="No income or expenses match this filter. Record one with the Income or Expense button above." />
          ) : (
            <Card className="divide-y divide-line/[0.06]">
              {filteredTxns.map((t) => (
                <TxnRow key={t.id} txn={t} busy={busy === t.id} onDelete={() => removeTxn(t)} />
              ))}
            </Card>
          )}
        </div>
      )}

      {/* Transfers */}
      {transfers.length > 0 && (
        <div className="space-y-3">
          <SectionLabel>Transfers</SectionLabel>
          <Card className="divide-y divide-line/[0.06]">
            {transfers.map((x) => (
              <TransferRow key={x.id} transfer={x} busy={busy === x.id} onDelete={() => removeTransfer(x)} />
            ))}
          </Card>
        </div>
      )}

      {/* Modals */}
      <AccountModal
        open={addingAccount || !!editingAccount}
        account={editingAccount}
        onClose={() => { setAddingAccount(false); setEditingAccount(null); }}
        onSaved={async () => { setAddingAccount(false); setEditingAccount(null); await load(); }}
      />
      <TransactionModal
        direction={txnModal}
        accounts={accounts.filter((a) => a.is_active)}
        properties={properties}
        onClose={() => setTxnModal(null)}
        onSaved={async () => { setTxnModal(null); await load(); }}
      />
      <TransferModal
        open={transferOpen}
        accounts={accounts.filter((a) => a.is_active)}
        onClose={() => setTransferOpen(false)}
        onSaved={async () => { setTransferOpen(false); await load(); }}
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{children}</h3>;
}

/* ---------------------------------------------------------------- locked state */

function AccountsLocked({ onContact }: { onContact: () => void }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Accounts" subtitle="Track your building's money — balances, income and expenses." />
      <Card className="overflow-hidden">
        <div className="border-b border-line/[0.06] bg-gradient-to-r from-accent/10 to-success/5 px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-line/[0.08] bg-overlay/[0.03] text-accent">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-heading">Accounts is an add-on</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Keep the books for your building — cash, bank and mobile-money accounts, every income and
            expense, and money moved between them, all in one place.
          </p>
        </div>
        <div className="space-y-4 p-6">
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              "Cash, bank and mobile-money accounts with live balances",
              "Record income and expenses, tagged to a property",
              "Filter by property and by month",
              "Rent you mark paid and salaries you pay book themselves",
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
            Contact us to enable Accounts
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------- account card */

function AccountCard({
  account: a, balance, busy, onSetDefault, onEdit, onToggleActive, onDelete,
}: {
  account: Account;
  balance: number;
  busy: boolean;
  onSetDefault: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const meta = ACCOUNT_TYPE_META[a.type] ?? ACCOUNT_TYPE_META.other;
  const Icon = meta.icon;
  return (
    <Card className={"p-5" + (a.is_active ? "" : " opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line/[0.08] bg-overlay/[0.03] text-accent">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-subtle">#{a.account_no}</span>
              <span className="truncate text-sm font-bold text-heading">{a.name}</span>
              {a.is_default && <Badge tone="cyan">Default</Badge>}
              {!a.is_active && <Badge tone="slate">Closed</Badge>}
            </div>
            <div className="text-xs text-muted">{meta.label}</div>
            <div className="pt-1 text-lg font-extrabold text-heading">{formatCurrency(balance)}</div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          <IconBtn
            title={a.is_default ? "Default account" : "Make default"}
            icon={Star}
            active={a.is_default}
            onClick={onSetDefault}
          />
          <IconBtn title="Edit" icon={Pencil} onClick={onEdit} />
          <IconBtn title={a.is_active ? "Close account" : "Reopen account"} icon={Power} onClick={onToggleActive} />
          <IconBtn title="Delete" icon={Trash2} tone="rose" loading={busy} onClick={onDelete} />
        </div>
      </div>
    </Card>
  );
}

function IconBtn({
  title, icon: Icon, onClick, loading, active, tone = "slate",
}: {
  title: string;
  icon: typeof Pencil;
  onClick: () => void;
  loading?: boolean;
  active?: boolean;
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
        (active
          ? "text-warning hover:bg-warning/10"
          : tone === "rose"
            ? "text-danger hover:bg-danger/10"
            : "text-muted hover:bg-overlay/[0.06] hover:text-heading")
      }
    >
      {loading ? <Spinner /> : <Icon className={"h-4 w-4" + (active ? " fill-warning" : "")} />}
    </button>
  );
}

/* ---------------------------------------------------------------- ledger rows */

function TxnRow({ txn: t, busy, onDelete }: { txn: AccountTransaction; busy: boolean; onDelete: () => void }) {
  const income = t.direction === "income";
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className={
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg " +
          (income ? "bg-success/10 text-success" : "bg-danger/10 text-danger")
        }>
          {income ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-heading">{t.category || (income ? "Income" : "Expense")}</span>
            {t.source !== "manual" && <Badge tone="indigo">Auto</Badge>}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
            <span>{formatDate(t.txn_date)}</span>
            {t.accounts && <span>{t.accounts.name}</span>}
            {t.properties && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />{t.properties.name} · {t.properties.flat_no}
              </span>
            )}
            {t.note && <span className="truncate">{t.note}</span>}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={"text-sm font-extrabold " + (income ? "text-success" : "text-danger")}>
          {income ? "+" : "−"}{formatCurrency(t.amount)}
        </span>
        <IconBtn title="Delete" icon={Trash2} tone="rose" loading={busy} onClick={onDelete} />
      </div>
    </div>
  );
}

function TransferRow({ transfer: x, busy, onDelete }: { transfer: AccountTransfer; busy: boolean; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-overlay/[0.04] text-fg">
          <ArrowRightLeft className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-heading">
            {x.from_account?.name ?? "—"} <span className="text-subtle">→</span> {x.to_account?.name ?? "—"}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted">
            <span>{formatDate(x.txn_date)}</span>
            {x.note && <span className="truncate">{x.note}</span>}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-extrabold text-fg">{formatCurrency(x.amount)}</span>
        <IconBtn title="Delete" icon={Trash2} tone="rose" loading={busy} onClick={onDelete} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- account modal */

function AccountModal({
  open, account: editing, onClose, onSaved,
}: {
  open: boolean;
  account: Account | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("cash");
  const [openingBalance, setOpeningBalance] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setType(editing?.type ?? "cash");
    setOpeningBalance(editing ? String(editing.opening_balance ?? "") : "");
    setNote(editing?.note ?? "");
  }, [open, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("A name is required."); return; }
    const payload = {
      name: name.trim(),
      type,
      openingBalance: Number(openingBalance) || 0,
      note: note.trim(),
    };
    try {
      setSaving(true);
      if (editing) {
        await rentMasterFetch(`/api/admin/accounts/${editing.id}`, {
          method: "PATCH", role: "owner", body: JSON.stringify(payload),
        });
        toast.success(`${payload.name} updated.`);
      } else {
        await rentMasterFetch("/api/admin/accounts", {
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
      title={editing ? "Edit account" : "Add account"}
      subtitle={editing ? editing.name : "Cash, bank or mobile money"}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" required>
          <TextInput required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. City Bank, bKash, Cash box" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value as AccountType)}>
              {(Object.keys(ACCOUNT_TYPE_META) as AccountType[]).map((k) => (
                <option key={k} value={k}>{ACCOUNT_TYPE_META[k].label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Opening balance" hint={editing ? "Editing won't move recorded entries." : "Balance on the day you start tracking."}>
            <TextInput type="number" step="any" inputMode="decimal"
              value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="0" />
          </Field>
        </div>
        <Field label="Note">
          <TextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Anything worth remembering (account number, holder…)" />
        </Field>
        <Button type="submit" loading={saving} icon={editing ? Pencil : Plus} className="w-full">
          {editing ? "Save changes" : "Add account"}
        </Button>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------- transaction modal */

const CUSTOM = "__custom__";

function TransactionModal({
  direction, accounts, properties, onClose, onSaved,
}: {
  direction: TxnDirection | null;
  accounts: Account[];
  properties: Property[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [txnDate, setTxnDate] = useState(todayStr());
  const [propertyId, setPropertyId] = useState("");
  const [categorySel, setCategorySel] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const presets = direction === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    if (!direction) return;
    const def = accounts.find((a) => a.is_default) ?? accounts[0];
    setAccountId(def?.id ?? "");
    setAmount("");
    setTxnDate(todayStr());
    setPropertyId("");
    setCategorySel("");
    setCustomCategory("");
    setNote("");
  }, [direction, accounts]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!direction) return;
    if (!accountId) { toast.error("Choose an account."); return; }
    if (!(Number(amount) > 0)) { toast.error("Enter an amount greater than zero."); return; }
    const category = categorySel === CUSTOM ? customCategory.trim() : categorySel;
    try {
      setSaving(true);
      await rentMasterFetch("/api/admin/accounts/transactions", {
        method: "POST", role: "owner",
        body: JSON.stringify({
          accountId, direction, amount: Number(amount), txnDate,
          propertyId, category, note: note.trim(),
        }),
      });
      toast.success(`${formatCurrency(Number(amount))} ${direction} recorded.`);
      await onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  const income = direction === "income";

  return (
    <Modal open={!!direction} onClose={onClose}
      title={income ? "Record income" : "Record expense"}
      subtitle={income ? "Money coming in" : "Money going out"}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Account" required>
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Select an account…</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}{a.is_default ? " (default)" : ""}</option>
              ))}
            </Select>
          </Field>
          <Field label="Amount" required>
            <TextInput type="number" min="1" step="any" inputMode="decimal" required
              value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" required>
            <TextInput type="date" required value={txnDate} onChange={(e) => setTxnDate(e.target.value)} />
          </Field>
          <Field label="Category">
            <Select value={categorySel} onChange={(e) => setCategorySel(e.target.value)}>
              <option value="">No category</option>
              {presets.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value={CUSTOM}>Custom…</option>
            </Select>
          </Field>
        </div>
        {categorySel === CUSTOM && (
          <Field label="Custom category" required>
            <TextInput required value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Type a category" />
          </Field>
        )}
        <Field label="Property" hint="Optional — tie this entry to one of your properties.">
          <Select value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
            <option value="">No property</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.flat_no}</option>)}
          </Select>
        </Field>
        <Field label="Note">
          <TextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything worth remembering" />
        </Field>
        <Button type="submit" loading={saving} variant={income ? "success" : "danger"}
          icon={income ? TrendingUp : TrendingDown} className="w-full">
          {income ? "Record income" : "Record expense"}
        </Button>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------- transfer modal */

function TransferModal({
  open, accounts, onClose, onSaved,
}: {
  open: boolean;
  accounts: Account[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [txnDate, setTxnDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFromAccountId(accounts[0]?.id ?? "");
    setToAccountId(accounts[1]?.id ?? "");
    setAmount("");
    setTxnDate(todayStr());
    setNote("");
  }, [open, accounts]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) { toast.error("Choose both accounts."); return; }
    if (fromAccountId === toAccountId) { toast.error("Choose two different accounts."); return; }
    if (!(Number(amount) > 0)) { toast.error("Enter an amount greater than zero."); return; }
    try {
      setSaving(true);
      await rentMasterFetch("/api/admin/accounts/transfers", {
        method: "POST", role: "owner",
        body: JSON.stringify({ fromAccountId, toAccountId, amount: Number(amount), txnDate, note: note.trim() }),
      });
      toast.success(`${formatCurrency(Number(amount))} transferred.`);
      await onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Transfer between accounts"
      subtitle="Move money without counting it as income or expense">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="From" required>
            <Select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)}>
              <option value="">Select…</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
          <Field label="To" required>
            <Select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
              <option value="">Select…</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" required>
            <TextInput type="number" min="1" step="any" inputMode="decimal" required
              value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </Field>
          <Field label="Date" required>
            <TextInput type="date" required value={txnDate} onChange={(e) => setTxnDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Note">
          <TextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. moved cash to bank" />
        </Field>
        <Button type="submit" loading={saving} icon={ArrowRightLeft} className="w-full">
          Transfer
        </Button>
      </form>
    </Modal>
  );
}
