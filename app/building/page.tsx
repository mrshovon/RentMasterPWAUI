"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Users, Settings, Plus, Pencil, KeyRound, Ban, ShieldCheck,
  Unlink, Building2, CircleDollarSign, ReceiptText, Home, HardHat, Wallet, Wrench,
  Megaphone, FileText,
} from "lucide-react";
import { rentMasterFetch } from "../../lib/api-service";
import { toast } from "../../components/toast";
import { confirmDialog } from "../../components/confirm";
import { useSessionGuard } from "../../lib/use-session";
import { usePresenceHeartbeat } from "../../lib/presence";
import { useTabState } from "../../lib/use-tab";
import { usePlan } from "../../lib/use-plan";
import { useRevalidateOnFocus } from "../../lib/use-revalidate";
import { Building, BuildingOwner, Property } from "../../types/api";
import { formatCurrency, formatDate } from "../../lib/format";
import { DashboardShell, NavItem } from "../../components/shell";
import { AppSettingsCard } from "../../components/app-settings-card";
import { BuildingInvoicesTab } from "../../components/building-invoices-tab";
import { BuildingSpacesTab } from "../../components/building-spaces-tab";
import { BuildingSetupTab } from "../../components/building-setup-tab";
import { BuildingNoticesTab } from "../../components/building-notices-tab";
import { BuildingReportsTab } from "../../components/building-reports-tab";
import { StaffTab } from "../../components/staff-tab";
import { AccountsTab } from "../../components/accounts-tab";
import {
  Card, StatCard, Badge, Button, Modal, Field, TextInput, TextArea,
  PageHeader, EmptyState, FullScreenLoader, SearchInput, EmailField, PhoneField,
  PasswordInput,
} from "../../components/ui";
import { validateEmail, validatePhone } from "../../lib/validate";

// =====================================================================================
// 🏢 BUILDING ADMIN CONSOLE
//
// The middle tier of the hierarchy: super admin -> BUILDING ADMIN -> owner -> tenant.
// A building admin runs one building, creates the flat owners in it, and is the billing party
// for the Whole Building plan that covers them all.
//
// The accounts created here are ORDINARY owners — same dashboard, same features. The only
// difference is a building_owners row, which makes their plan resolve through this building.
//
// Like app/admin/page.tsx, this console is exempt from check-i18n (see scripts/check-i18n.mjs):
// it is an operator tool, and translating it is a deliberate later decision rather than a tax
// on every phase of the build.
// =====================================================================================

export default function BuildingAdminDashboard() {
  const { session, checkingSession, logout } = useSessionGuard("building");
  usePresenceHeartbeat(!!session);

  const [tab, setTab] = useTabState("overview");
  const [building, setBuilding] = useState<Building | null>(null);
  const [owners, setOwners] = useState<BuildingOwner[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<BuildingOwner | null>(null);

  // A building admin is plan-governed exactly like an owner, and the Whole Building tier bundles
  // Staff and Accounts. usePlan is what keeps that current — an admin revoking an add-on mid
  // session must close the tab, not wait for the next login. See lib/use-plan.ts.
  const { plan } = usePlan(!!session);

  const load = useCallback(async () => {
    try {
      const [b, o, p] = await Promise.allSettled([
        rentMasterFetch<{ data: Building }>("/api/admin/building"),
        rentMasterFetch<{ data: BuildingOwner[] }>("/api/admin/building/owners"),
        // The building's OWN rentable space, from the ordinary owner route — it already scopes on
        // owner_id, which for this caller is the building admin's uid.
        rentMasterFetch<{ data: Property[] }>("/api/admin/properties"),
      ]);
      if (b.status === "fulfilled") setBuilding(b.value.data);
      else toast.error((b.reason as Error).message);
      if (o.status === "fulfilled") setOwners(o.value.data || []);
      if (p.status === "fulfilled") setProperties(p.value.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) load();
  }, [session, load]);
  useRevalidateOnFocus(load);

  const metrics = useMemo(() => {
    const active = owners.filter((o) => o.is_active);
    return {
      owners: owners.length,
      active: active.length,
      monthlyServiceCharge: active.reduce((sum, o) => sum + Number(o.default_service_charge || 0), 0),
    };
  }, [owners]);

  const nav: NavItem[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "owners", label: "Owners", icon: Users, badge: owners.length },
    { key: "invoices", label: "Service charge", icon: ReceiptText },
    { key: "spaces", label: "Spaces", icon: Home, badge: properties.length },
    // Listed even when off, with a crown, rather than hidden — the same call the owner dashboard
    // makes. The Whole Building tier bundles both, so this is normally just a plain tab.
    { key: "staff", label: "Staff", icon: HardHat, locked: !plan?.features?.staff?.enabled },
    { key: "accounts", label: "Accounts", icon: Wallet, locked: !plan?.features?.accounts?.enabled },
    { key: "notices", label: "Notices", icon: Megaphone },
    { key: "reports", label: "Reports", icon: FileText },
    { key: "setup", label: "Setup", icon: Wrench },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  // The building admin is already on the top plan, so there is no upsell to show them. If a
  // module is somehow off, the honest answer is "ask support", not "buy an upgrade".
  const contactSupport = () =>
    toast.info("This module is part of the Whole Building plan. Contact support if it is switched off.");

  if (checkingSession || !session) return <FullScreenLoader label="Checking your session" />;
  if (loading) return <FullScreenLoader label="Loading your building" />;

  return (
    <DashboardShell
      brand="building"
      roleLabel="Building Admin"
      sessionName={session.name}
      sessionId={session.userId}
      nav={nav}
      active={tab}
      onNavigate={setTab}
      onLogout={logout}
    >
      {tab === "overview" && (
        <OverviewTab building={building} metrics={metrics} onAdd={() => setCreateOpen(true)} />
      )}
      {tab === "owners" && (
        <OwnersTab
          owners={owners}
          onAdd={() => setCreateOpen(true)}
          onEdit={setEditing}
          onReload={load}
        />
      )}
      {tab === "invoices" && <BuildingInvoicesTab owners={owners} />}
      {tab === "spaces" && <BuildingSpacesTab onChanged={load} />}
      {/* Mounted, not rebuilt: these are the same components the owner dashboard uses, and the
          routes behind them already scope on owner_id — which for this caller is the building. */}
      {tab === "staff" && (
        <StaffTab
          enabled={!!plan?.features?.staff?.enabled}
          properties={properties}
          onContact={contactSupport}
        />
      )}
      {tab === "accounts" && (
        <AccountsTab
          enabled={!!plan?.features?.accounts?.enabled}
          properties={properties}
          onContact={contactSupport}
        />
      )}
      {tab === "notices" && <BuildingNoticesTab building={building} owners={owners} />}
      {tab === "reports" && <BuildingReportsTab owners={owners} />}
      {tab === "setup" && <BuildingSetupTab />}
      {tab === "settings" && <SettingsTab building={building} onSaved={load} />}

      <CreateOwnerModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={load}
      />
      <EditOwnerModal owner={editing} onClose={() => setEditing(null)} onSaved={load} />
    </DashboardShell>
  );
}

/* ============================================================ OVERVIEW */

function OverviewTab({
  building,
  metrics,
  onAdd,
}: {
  building: Building | null;
  metrics: { owners: number; active: number; monthlyServiceCharge: number };
  onAdd: () => void;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={building?.name || "Your building"}
        subtitle={building?.address || "Add an address in Settings so it prints on your notices."}
        action={<Button icon={Plus} onClick={onAdd}>Add owner</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Owners" value={metrics.owners} icon={Users} accent="indigo" />
        <StatCard label="Active" value={metrics.active} icon={ShieldCheck} accent="emerald" />
        <StatCard
          label="Service charge / month"
          value={formatCurrency(metrics.monthlyServiceCharge)}
          sub="Sum of every active owner's default"
          icon={CircleDollarSign}
          accent="amber"
        />
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-heading">Your plan</h3>
        <p className="mt-2 text-sm text-muted">
          This building runs on the <strong className="text-fg">Whole Building</strong> plan. Every
          owner you create here is covered by it — they never see a price or a payment screen, and
          they are not capped at the free limits.
        </p>
      </Card>
    </div>
  );
}

/* ============================================================ OWNERS */

function OwnersTab({
  owners,
  onAdd,
  onEdit,
  onReload,
}: {
  owners: BuildingOwner[];
  onAdd: () => void;
  onEdit: (o: BuildingOwner) => void;
  onReload: () => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = owners.filter((o) => {
    const hay = `${o.name || ""} ${o.email || ""} ${o.phone || ""} ${o.unit_label || ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  async function act(ownerId: string, body: Record<string, unknown>, okMsg: string) {
    try {
      setBusy(ownerId);
      await rentMasterFetch(`/api/admin/building/owners/${ownerId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      toast.success(okMsg);
      await onReload();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function detach(o: BuildingOwner) {
    const ok = await confirmDialog({
      title: `Detach ${o.name || "this owner"}?`,
      message:
        "Their login keeps working and nothing is deleted — but they leave your building, and their plan drops back to the free limits (2 properties, 2 tenants).",
      confirmLabel: "Detach",
      danger: true,
    });
    if (!ok) return;
    try {
      setBusy(o.owner_id);
      await rentMasterFetch(`/api/admin/building/owners/${o.owner_id}`, { method: "DELETE" });
      toast.success("Owner detached from the building.");
      await onReload();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function resetPassword(o: BuildingOwner) {
    const password = window.prompt(`New password for ${o.name || o.email} (at least 8 characters):`);
    if (!password) return;
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    await act(o.owner_id, { action: "password", password }, "Password reset. Give it to them out of band.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Owners"
        subtitle="The flat owners in this building. Each one gets an ordinary owner login."
        action={<Button icon={Plus} onClick={onAdd}>Add owner</Button>}
      />

      <SearchInput value={q} onChange={setQ} placeholder="Search by name, email, phone or flat…" />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={owners.length ? "No match" : "No owners yet"}
          hint={
            owners.length
              ? "Try a different search."
              : "Add the first flat owner. They get their own login and the normal owner dashboard."
          }
          action={owners.length ? undefined : <Button icon={Plus} onClick={onAdd}>Add owner</Button>}
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-line/[0.06] bg-overlay/[0.02] text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="p-4">Owner</th>
                <th className="p-4">Flat</th>
                <th className="p-4">Service charge</th>
                <th className="p-4">Joined</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.owner_id} className="border-b border-line/[0.04] last:border-0">
                  <td className="p-4">
                    <div className="font-medium text-heading">{o.name || "—"}</div>
                    <div className="text-xs text-muted">{o.email || "—"}</div>
                    {o.phone && <div className="text-xs text-subtle">{o.phone}</div>}
                  </td>
                  <td className="p-4 text-fg">{o.unit_label || "—"}</td>
                  <td className="p-4 text-fg">{formatCurrency(Number(o.default_service_charge || 0))}</td>
                  <td className="p-4 text-muted">{formatDate(o.joined_at)}</td>
                  <td className="p-4">
                    {o.suspended ? (
                      <Badge tone="rose">Suspended</Badge>
                    ) : o.is_active ? (
                      <Badge tone="emerald">Active</Badge>
                    ) : (
                      <Badge tone="slate">Inactive</Badge>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="secondary" icon={Pencil} onClick={() => onEdit(o)}>Edit</Button>
                      <Button
                        size="sm" variant="ghost" icon={KeyRound}
                        loading={busy === o.owner_id}
                        onClick={() => resetPassword(o)}
                      >
                        Password
                      </Button>
                      {o.suspended ? (
                        <Button
                          size="sm" variant="ghost" icon={ShieldCheck}
                          loading={busy === o.owner_id}
                          onClick={() => act(o.owner_id, { action: "reactivate" }, "Login reactivated.")}
                        >
                          Reactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm" variant="ghost" icon={Ban}
                          loading={busy === o.owner_id}
                          onClick={() => act(o.owner_id, { action: "suspend" }, "Login suspended.")}
                        >
                          Suspend
                        </Button>
                      )}
                      <Button
                        size="sm" variant="danger" icon={Unlink}
                        loading={busy === o.owner_id}
                        onClick={() => detach(o)}
                      >
                        Detach
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ============================================================ CREATE / EDIT OWNER */

function CreateOwnerModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const empty = {
    name: "", email: "", phone: "", password: "",
    unitLabel: "", defaultServiceCharge: "",
  };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsedEmail = validateEmail(form.email, { required: true });
    if (!parsedEmail.ok) { toast.error(parsedEmail.error); return; }
    const parsedPhone = validatePhone(form.phone);
    if (!parsedPhone.ok) { toast.error(parsedPhone.error); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters."); return; }

    try {
      setSaving(true);
      await rentMasterFetch("/api/admin/building/owners", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          email: parsedEmail.value,
          phone: parsedPhone.value,
          defaultServiceCharge: Number(form.defaultServiceCharge || 0),
        }),
      });
      setForm(empty);
      await onCreated();
      onClose();
      toast.success("Owner created. Give them the password out of band.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add an owner"
      subtitle="They get an ordinary owner login, covered by this building's plan.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" required>
          <TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <EmailField label="Email" required value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <PhoneField label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        </div>
        <Field label="Temporary password" required hint="At least 8 characters. Send it to them separately.">
          <PasswordInput required minLength={8} value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Flat / unit" hint="Printed on their statements.">
            <TextInput value={form.unitLabel} placeholder="Flat 4B"
              onChange={(e) => setForm({ ...form, unitLabel: e.target.value })} />
          </Field>
          <Field label="Monthly service charge" hint="Pre-fills each invoice; editable per month.">
            <TextInput type="number" min="0" step="0.01" value={form.defaultServiceCharge}
              onChange={(e) => setForm({ ...form, defaultServiceCharge: e.target.value })} />
          </Field>
        </div>
        <Button type="submit" loading={saving} className="w-full">Create owner</Button>
      </form>
    </Modal>
  );
}

function EditOwnerModal({
  owner,
  onClose,
  onSaved,
}: {
  owner: BuildingOwner | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", phone: "", unitLabel: "", defaultServiceCharge: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!owner) return;
    setForm({
      name: owner.name || "",
      phone: owner.phone || "",
      unitLabel: owner.unit_label || "",
      defaultServiceCharge: String(owner.default_service_charge ?? ""),
    });
  }, [owner]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!owner) return;
    const parsedPhone = validatePhone(form.phone);
    if (!parsedPhone.ok) { toast.error(parsedPhone.error); return; }
    try {
      setSaving(true);
      await rentMasterFetch(`/api/admin/building/owners/${owner.owner_id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          phone: parsedPhone.value,
          unitLabel: form.unitLabel,
          defaultServiceCharge: Number(form.defaultServiceCharge || 0),
        }),
      });
      await onSaved();
      onClose();
      toast.success("Owner updated.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={!!owner} onClose={onClose} title="Edit owner" subtitle={owner?.email || undefined}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <PhoneField label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Flat / unit">
            <TextInput value={form.unitLabel} onChange={(e) => setForm({ ...form, unitLabel: e.target.value })} />
          </Field>
          <Field label="Monthly service charge">
            <TextInput type="number" min="0" step="0.01" value={form.defaultServiceCharge}
              onChange={(e) => setForm({ ...form, defaultServiceCharge: e.target.value })} />
          </Field>
        </div>
        <Button type="submit" loading={saving} className="w-full">Save changes</Button>
      </form>
    </Modal>
  );
}

/* ============================================================ SETTINGS */

function SettingsTab({ building, onSaved }: { building: Building | null; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({
    name: "", address: "", city: "", signatoryName: "", signatoryTitle: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!building) return;
    setForm({
      name: building.name || "",
      address: building.address || "",
      city: building.city || "",
      signatoryName: building.signatory_name || "",
      signatoryTitle: building.signatory_title || "",
      notes: building.notes || "",
    });
  }, [building]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      await rentMasterFetch("/api/admin/building", { method: "PATCH", body: JSON.stringify(form) });
      await onSaved();
      toast.success("Building details saved.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Your building's details and your own account." />

      <Card className="p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-heading">
          <Building2 className="h-4 w-4 text-primary" /> Building details
        </h3>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Building name" required>
            <TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Address">
              <TextInput value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <Field label="City">
              <TextInput value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Authorised signatory" hint="Printed under the signature on notices.">
              <TextInput value={form.signatoryName}
                onChange={(e) => setForm({ ...form, signatoryName: e.target.value })} />
            </Field>
            <Field label="Signatory title">
              <TextInput value={form.signatoryTitle} placeholder="Chairman"
                onChange={(e) => setForm({ ...form, signatoryTitle: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes" hint="Internal only — never printed.">
            <TextArea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <Button type="submit" loading={saving}>Save building</Button>
        </form>
      </Card>

      <AppSettingsCard />
    </div>
  );
}
