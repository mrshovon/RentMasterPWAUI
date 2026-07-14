"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, CreditCard, Megaphone, Plus, Ban, KeyRound,
  Trash2, Mail, CheckCircle2, ShieldOff, ShieldCheck, Inbox, Building2, Eye,
  RotateCcw, CircleDollarSign, Pencil, Power, Percent, LifeBuoy,
} from "lucide-react";
import { rentMasterFetch } from "../../lib/api-service";
import { toast } from "../../components/toast";
import { confirmDialog } from "../../components/confirm";
import { useSessionGuard } from "../../lib/use-session";
import { useTabState } from "../../lib/use-tab";
import { usePendingAction } from "../../lib/use-pending";
import {
  AdminOwner, AdminOwnerDetail, SubscriptionTier,
  SupportTicket, TicketStatus, TicketCategory, PriorityLevel,
} from "../../types/api";
import { formatCurrency, formatDate } from "../../lib/format";
import { DashboardShell, NavItem } from "../../components/shell";
import { AttachmentStrip } from "../../components/attachments";
import {
  Card, StatCard, Badge, Button, Modal, Field, TextInput, TextArea, Select,
  PageHeader, EmptyState, Alert, FullScreenLoader, SearchInput, Spinner,
} from "../../components/ui";

const ticketStatusTone: Record<TicketStatus, "slate" | "indigo" | "cyan" | "emerald"> = {
  submitted: "slate", assigned: "indigo", in_progress: "cyan", done: "emerald",
};
const ticketStatusLabel: Record<TicketStatus, string> = {
  submitted: "Submitted", assigned: "Assigned", in_progress: "In progress", done: "Done",
};
const ticketCategoryLabel: Record<TicketCategory, string> = {
  billing: "Billing", technical: "Technical", account: "Account",
  feature_request: "Feature request", other: "Other",
};
const ticketPriorityTone: Record<PriorityLevel, "slate" | "amber" | "rose"> = {
  low: "slate", medium: "amber", high: "rose", urgent: "rose",
};

export default function AdminDashboard() {
  const { session, checkingSession, logout } = useSessionGuard("admin");
  const { isPending, run } = usePendingAction();
  const [tab, setTab] = useTabState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [owners, setOwners] = useState<AdminOwner[]>([]);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [tierModal, setTierModal] = useState<{ mode: "create" | "edit"; tier?: SubscriptionTier } | null>(null);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);

  async function refreshOwners() {
    const res = await rentMasterFetch("/api/super-admin/owners", { role: "admin" });
    setOwners(res.data || []);
  }
  async function refreshTiers() {
    const res = await rentMasterFetch("/api/super-admin/tiers", { role: "admin" });
    setTiers(res.data || []);
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [o, t, s] = await Promise.allSettled([
          rentMasterFetch("/api/super-admin/owners", { role: "admin" }),
          rentMasterFetch("/api/super-admin/tiers", { role: "admin" }),
          rentMasterFetch("/api/super-admin/support-tickets", { role: "admin" }),
        ]);
        if (o.status === "fulfilled") setOwners(o.value.data || []);
        if (t.status === "fulfilled") setTiers(t.value.data || []);
        if (s.status === "fulfilled") setTickets(s.value.data || []);
        const err = [o, t, s].find((r) => r.status === "rejected");
        if (err && err.status === "rejected") setError((err.reason as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metrics = {
    total: owners.length,
    active: owners.filter((o) => !o.suspended).length,
    suspended: owners.filter((o) => o.suspended).length,
    subscribed: owners.filter((o) => o.subscription?.status === "active").length,
    openTickets: tickets.filter((t) => t.status !== "done").length,
  };

  const nav: NavItem[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "owners", label: "Owners", icon: Users, badge: owners.length },
    { key: "subscriptions", label: "Plans", icon: CreditCard },
    { key: "notices", label: "Circulate", icon: Megaphone },
    { key: "tickets", label: "Tickets", icon: LifeBuoy, badge: metrics.openTickets },
  ];

  // The PATCH response is the bare row (no owner join) — keep the enrichment we already have.
  function applyTicketUpdate(updated: SupportTicket) {
    setTickets((xs) => xs.map((x) => (x.id === updated.id ? { ...x, ...updated, owner: x.owner } : x)));
  }

  async function quickToggleSuspend(o: AdminOwner) {
    const action = o.suspended ? "reactivate" : "suspend";
    if (!o.suspended && !(await confirmDialog({
      title: "Suspend access?",
      message: `Suspend access for ${o.name || o.email}? They won't be able to sign in until reactivated.`,
      confirmLabel: "Suspend",
      danger: true,
    }))) return;
    // Mutate + refetch is two round-trips; without a pending state the row just sits there.
    await run(`owner:${o.id}`, async () => {
      try {
        await rentMasterFetch(`/api/super-admin/owners/${o.id}`, {
          method: "PATCH", role: "admin", body: JSON.stringify({ action }),
        });
        await refreshOwners();
        toast.success(action === "suspend" ? "Owner suspended." : "Owner reactivated.");
      } catch (e: any) { toast.error(e.message); }
    });
  }

  async function deleteOwner(o: AdminOwner) {
    if (!(await confirmDialog({
      title: "Delete owner account?",
      message: `Permanently delete ${o.name || o.email}? This removes their login account and cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    }))) return;
    await run(`owner:${o.id}`, async () => {
      try {
        await rentMasterFetch(`/api/super-admin/owners/${o.id}`, { method: "DELETE", role: "admin" });
        await refreshOwners();
        toast.success("Owner account deleted.");
      } catch (e: any) { toast.error(e.message); }
    });
  }

  async function toggleTier(t: SubscriptionTier) {
    const activating = t.is_active === false;
    await run(`tier:${t.id}`, async () => {
      try {
        await rentMasterFetch(`/api/super-admin/tiers/${t.id}`, {
          method: "PATCH", role: "admin",
          body: JSON.stringify({ action: activating ? "activate" : "deactivate" }),
        });
        await refreshTiers();
        toast.success(activating ? "Plan activated." : "Plan deactivated.");
      } catch (e: any) { toast.error(e.message); }
    });
  }

  async function deleteTier(t: SubscriptionTier) {
    if (!(await confirmDialog({
      title: "Delete plan?",
      message: `Delete the "${t.name}" plan? Consider deactivating instead if it's in use.`,
      confirmLabel: "Delete",
      danger: true,
    }))) return;
    await run(`tier:${t.id}`, async () => {
      try {
        await rentMasterFetch(`/api/super-admin/tiers/${t.id}`, { method: "DELETE", role: "admin" });
        await refreshTiers();
        toast.success("Plan deleted.");
      } catch (e: any) { toast.error(e.message); }
    });
  }

  if (checkingSession || loading)
    return <FullScreenLoader label="Loading admin console…" sub="Fetching owners & subscription plans" />;

  return (
    <DashboardShell
      brand="admin"
      roleLabel="Super Admin"
      sessionName={session?.name}
      sessionId={session?.userId}
      nav={nav}
      active={tab}
      onNavigate={setTab}
      onLogout={logout}
    >
      {error && <div className="mb-6"><Alert>{error}</Alert></div>}

      {tab === "overview" && (
        <div className="space-y-8">
          <PageHeader title="Admin overview" subtitle="Platform-wide owners and subscriptions." />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Owner accounts" accent="amber" icon={Users} value={metrics.total} />
            <StatCard label="Active" accent="emerald" icon={CheckCircle2} value={metrics.active} />
            <StatCard label="Suspended" accent="rose" icon={Ban} value={metrics.suspended} />
            <StatCard label="On a plan" accent="indigo" icon={CreditCard} value={metrics.subscribed} />
          </div>
          <Card className="p-6">
            <h3 className="mb-4 text-sm font-bold text-slate-200">Recently added owners</h3>
            <div className="space-y-3">
              {owners.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-100">{o.name || "—"}</div>
                    <div className="truncate text-xs text-slate-500">{o.email}</div>
                  </div>
                  <Badge tone={o.suspended ? "rose" : "emerald"}>{o.suspended ? "Suspended" : "Active"}</Badge>
                </div>
              ))}
              {owners.length === 0 && <p className="text-sm text-slate-500">No owner accounts yet.</p>}
            </div>
          </Card>
        </div>
      )}

      {tab === "owners" && (
        <OwnersTab
          owners={owners}
          onAdd={() => setCreateOpen(true)}
          onView={setDetailId}
          onToggleSuspend={quickToggleSuspend}
          onDelete={deleteOwner}
          isPending={isPending}
        />
      )}

      {tab === "subscriptions" && (
        <PlansTab
          tiers={tiers}
          onCreate={() => setTierModal({ mode: "create" })}
          onEdit={(t) => setTierModal({ mode: "edit", tier: t })}
          onToggle={toggleTier}
          onDelete={deleteTier}
          isPending={isPending}
        />
      )}

      {tab === "notices" && <CirculateTab />}

      {tab === "tickets" && <TicketsTab tickets={tickets} onOpen={setActiveTicket} />}

      <CreateOwnerModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refreshOwners} />
      <OwnerDetailModal
        ownerId={detailId}
        tiers={tiers}
        onClose={() => setDetailId(null)}
        onChanged={refreshOwners}
      />
      <TierModal state={tierModal} onClose={() => setTierModal(null)} onSaved={refreshTiers} />
      <TicketStatusModal
        ticket={activeTicket}
        onClose={() => setActiveTicket(null)}
        onSaved={applyTicketUpdate}
      />
    </DashboardShell>
  );
}

/* ============================================================ OWNERS TAB */
function OwnersTab({
  owners, onAdd, onView, onToggleSuspend, onDelete, isPending,
}: {
  owners: AdminOwner[];
  onAdd: () => void;
  onView: (id: string) => void;
  onToggleSuspend: (o: AdminOwner) => void;
  onDelete: (o: AdminOwner) => void;
  isPending: (key: string) => boolean;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? owners.filter((o) =>
        [o.name, o.email, o.phone, o.role].some((v) => String(v ?? "").toLowerCase().includes(q)))
    : owners;
  return (
    <div className="space-y-6">
      <PageHeader title="Owner accounts" subtitle="Create and manage owner logins, permissions and access."
        action={<Button icon={Plus} onClick={onAdd}>Add owner</Button>} />
      {owners.length === 0 ? (
        <EmptyState icon={Users} title="No owners yet" hint="Create the first owner account to get started."
          action={<Button icon={Plus} onClick={onAdd}>Add owner</Button>} />
      ) : (
        <>
        <SearchInput value={query} onChange={setQuery} placeholder="Search by name, email, phone or role…" />
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No matches" hint={`No owners match "${query}".`} />
        ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-4">Owner</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-white/[0.02]">
                    <td className="p-4">
                      <div className="font-semibold text-slate-100">{o.name || "—"}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-500"><Mail className="h-3 w-3" /> {o.email}</div>
                    </td>
                    <td className="p-4"><Badge tone={o.role === "admin" ? "amber" : "slate"}>{o.role}</Badge></td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={o.suspended ? "rose" : "emerald"}>{o.suspended ? "Suspended" : "Active"}</Badge>
                        {o.permissions_revoked && <Badge tone="amber">No perms</Badge>}
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">
                      {o.subscription?.status === "active" ? (
                        <Badge tone="indigo">{o.subscription.tier_id}</Badge>
                      ) : <span className="text-xs text-slate-500">—</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn title="View / manage" tone="indigo" icon={Eye} onClick={() => onView(o.id)} />
                        <IconBtn title={o.suspended ? "Reactivate" : "Suspend"} tone={o.suspended ? "emerald" : "amber"}
                          icon={o.suspended ? RotateCcw : Ban} onClick={() => onToggleSuspend(o)}
                          loading={isPending(`owner:${o.id}`)} />
                        <IconBtn title="Delete" tone="rose" icon={Trash2} onClick={() => onDelete(o)}
                          loading={isPending(`owner:${o.id}`)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        )}
        </>
      )}
    </div>
  );
}

function IconBtn({
  title, tone, icon: Icon, onClick, loading,
}: {
  title: string; tone: "indigo" | "amber" | "emerald" | "rose"; icon: typeof Eye; onClick: () => void;
  loading?: boolean;
}) {
  const tones = {
    indigo: "text-indigo-400 hover:bg-indigo-500/10",
    amber: "text-amber-400 hover:bg-amber-500/10",
    emerald: "text-emerald-400 hover:bg-emerald-500/10",
    rose: "text-rose-400 hover:bg-rose-500/10",
  };
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={loading}
      className={`rounded-lg p-1.5 transition disabled:pointer-events-none disabled:opacity-50 ${tones[tone]}`}
    >
      {loading ? <Spinner className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
    </button>
  );
}

/* ============================================================ SUPPORT TICKETS TAB */
const TICKET_FILTERS: { key: TicketStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "submitted", label: "Submitted" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
];

function ticketAge(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  return days === 1 ? "1 day" : `${days} days`;
}

function TicketsTab({
  tickets, onOpen,
}: {
  tickets: SupportTicket[]; onOpen: (t: SupportTicket) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TicketStatus | "all">("all");

  const q = query.trim().toLowerCase();
  const filtered = tickets
    .filter((t) => filter === "all" || t.status === filter)
    .filter((t) =>
      !q ||
      [t.subject, t.description, t.owner?.name, t.owner?.email, `#${t.ticket_no}`]
        .some((v) => String(v ?? "").toLowerCase().includes(q)));

  return (
    <div className="space-y-6">
      <PageHeader title="Support tickets" subtitle="Issues and queries raised by property owners." />

      {tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No tickets" hint="When an owner raises a ticket, it lands here." />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1"><SearchInput value={query} onChange={setQuery} placeholder="Search by subject, owner or #number…" /></div>
            <div className="flex flex-wrap gap-1.5">
              {TICKET_FILTERS.map((f) => {
                const count = f.key === "all" ? tickets.length : tickets.filter((t) => t.status === f.key).length;
                const isActive = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? "bg-amber-500/15 text-amber-300"
                        : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"
                    }`}
                  >
                    {f.label} <span className="opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={LifeBuoy} title="No matches" hint="No tickets match the current search or filter." />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="p-4">#</th>
                      <th className="p-4">Owner</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Age</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filtered.map((t) => (
                      <tr key={t.id} className="hover:bg-white/[0.02]">
                        <td className="p-4 font-mono text-xs text-slate-500">#{t.ticket_no}</td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-100">{t.owner?.name || "—"}</div>
                          <div className="flex items-center gap-1 text-xs text-slate-500"><Mail className="h-3 w-3" /> {t.owner?.email || "unknown"}</div>
                        </td>
                        <td className="p-4">
                          <div className="max-w-[260px] truncate font-medium text-slate-200">{t.subject}</div>
                        </td>
                        <td className="p-4"><Badge tone="slate">{ticketCategoryLabel[t.category]}</Badge></td>
                        <td className="p-4"><Badge tone={ticketPriorityTone[t.priority]}>{t.priority}</Badge></td>
                        <td className="p-4"><Badge tone={ticketStatusTone[t.status]}>{ticketStatusLabel[t.status]}</Badge></td>
                        <td className="p-4 text-xs text-slate-500">{ticketAge(t.created_at)}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            <IconBtn title="Open / update" tone="indigo" icon={Eye} onClick={() => onOpen(t)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function TicketStatusModal({
  ticket, onClose, onSaved,
}: {
  ticket: SupportTicket | null;
  onClose: () => void;
  onSaved: (t: SupportTicket) => void;
}) {
  const [status, setStatus] = useState<TicketStatus>("submitted");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
      setRemarks(ticket.admin_remarks || "");
    }
  }, [ticket]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ticket) return;
    try {
      setSaving(true);
      const res = await rentMasterFetch(`/api/super-admin/support-tickets/${ticket.id}`, {
        method: "PATCH", role: "admin",
        body: JSON.stringify({ status, adminRemarks: remarks }),
      });
      if (res.success) {
        onSaved(res.data);
        onClose();
        toast.success(`Ticket #${ticket.ticket_no} updated.`);
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal
      open={!!ticket}
      onClose={onClose}
      size="lg"
      title={ticket ? `Ticket #${ticket.ticket_no}` : "Ticket"}
      subtitle={ticket?.subject}
    >
      {ticket && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={ticketPriorityTone[ticket.priority]}>{ticket.priority}</Badge>
            <Badge tone="slate">{ticketCategoryLabel[ticket.category]}</Badge>
            <Badge tone={ticketStatusTone[ticket.status]}>{ticketStatusLabel[ticket.status]}</Badge>
            <span className="ml-auto text-xs text-slate-500">Raised {formatDate(ticket.created_at)}</span>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              From {ticket.owner?.name || "owner"}{ticket.owner?.email ? ` · ${ticket.owner.email}` : ""}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{ticket.description}</p>
          </div>

          <AttachmentStrip raw={ticket.attachment_file_url} />

          <form onSubmit={submit} className="space-y-4 border-t border-white/[0.06] pt-5">
            <Field label="Status" required>
              <Select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)}>
                <option value="submitted">Submitted</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </Select>
            </Field>
            <Field label="Resolution note" hint="Shared with the owner on their ticket.">
              <TextArea rows={4} value={remarks} onChange={(e) => setRemarks(e.target.value)}
                placeholder="What was done, or what you need from them…" />
            </Field>
            <Button type="submit" loading={saving} className="w-full">Save update</Button>
          </form>
        </div>
      )}
    </Modal>
  );
}

/* ============================================================ PLANS TAB */
function discountedPrice(t: SubscriptionTier) {
  const d = Number(t.discount_percent || 0);
  return d > 0 ? Number(t.price) * (1 - d / 100) : Number(t.price);
}

function PlansTab({
  tiers, onCreate, onEdit, onToggle, onDelete, isPending,
}: {
  tiers: SubscriptionTier[];
  onCreate: () => void; onEdit: (t: SubscriptionTier) => void;
  onToggle: (t: SubscriptionTier) => void; onDelete: (t: SubscriptionTier) => void;
  isPending: (key: string) => boolean;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title="Subscription plans" subtitle="Create, edit, discount or deactivate the plans owners can subscribe to."
        action={<Button icon={Plus} onClick={onCreate}>New plan</Button>} />
      {tiers.length === 0 ? (
        <EmptyState icon={CreditCard} title="No plans configured" hint="Create your first subscription plan."
          action={<Button icon={Plus} onClick={onCreate}>New plan</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...tiers]
            .sort((a, b) => (a.billing_interval === "custom" ? 1 : 0) - (b.billing_interval === "custom" ? 1 : 0) || Number(a.price) - Number(b.price))
            .map((t) => {
            const inactive = t.is_active === false;
            const disc = Number(t.discount_percent || 0);
            const isContact = t.billing_interval === "custom";
            return (
              <Card key={t.id} className={`flex flex-col gap-3 p-5 ${inactive ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400"><CreditCard className="h-5 w-5" /></div>
                  <div className="flex gap-1">
                    {disc > 0 && <Badge tone="emerald"><Percent className="mr-0.5 inline h-3 w-3" />{disc}% off</Badge>}
                    <Badge tone={inactive ? "rose" : "slate"}>{inactive ? "Inactive" : "Active"}</Badge>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-100">{t.name}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{t.description}</p>
                </div>
                <div className="flex items-end justify-between border-t border-white/[0.06] pt-3">
                  <div className="text-xs text-slate-500">
                    <div>Properties: {t.max_properties_allowed < 0 ? "Unlimited" : t.max_properties_allowed}</div>
                    <div>Tenants: {t.max_tenants_allowed < 0 ? "Unlimited" : t.max_tenants_allowed}</div>
                  </div>
                  <div className="text-right">
                    {isContact ? (
                      <span className="text-lg font-black text-cyan-400">Contact us</span>
                    ) : (
                      <>
                        {disc > 0 ? (
                          <div>
                            <span className="mr-1 text-xs text-slate-500 line-through">{formatCurrency(t.price)}</span>
                            <span className="text-lg font-black text-amber-400">{formatCurrency(discountedPrice(t))}</span>
                          </div>
                        ) : (
                          <span className="text-lg font-black text-amber-400">{formatCurrency(t.price)}</span>
                        )}
                        <span className="text-xs text-slate-500">/{t.billing_interval}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" icon={Pencil} onClick={() => onEdit(t)} className="flex-1">Edit</Button>
                  <Button size="sm" variant="secondary" icon={Power} onClick={() => onToggle(t)} className="flex-1"
                    loading={isPending(`tier:${t.id}`)}>
                    {inactive ? "Activate" : "Deactivate"}
                  </Button>
                  <IconBtn title="Delete" tone="rose" icon={Trash2} onClick={() => onDelete(t)}
                    loading={isPending(`tier:${t.id}`)} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================ TIER MODAL */
function TierModal({
  state, onClose, onSaved,
}: {
  state: { mode: "create" | "edit"; tier?: SubscriptionTier } | null;
  onClose: () => void; onSaved: () => void;
}) {
  const empty = { id: "", name: "", description: "", price: "0", billing_interval: "month", maxProperties: "-1", maxTenants: "-1", discountPercent: "0" };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const isEdit = state?.mode === "edit";

  useEffect(() => {
    if (!state) return;
    if (state.mode === "edit" && state.tier) {
      const t = state.tier;
      setForm({
        id: t.id, name: t.name, description: t.description || "",
        price: String(t.price), billing_interval: t.billing_interval,
        maxProperties: String(t.max_properties_allowed), maxTenants: String(t.max_tenants_allowed),
        discountPercent: String(t.discount_percent ?? 0),
      });
    } else setForm(empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name: form.name, description: form.description, price: form.price,
        billing_interval: form.billing_interval, maxProperties: form.maxProperties,
        maxTenants: form.maxTenants, discountPercent: form.discountPercent,
      };
      if (isEdit && state?.tier) {
        await rentMasterFetch(`/api/super-admin/tiers/${state.tier.id}`, { method: "PATCH", role: "admin", body: JSON.stringify(payload) });
      } else {
        await rentMasterFetch("/api/super-admin/tiers", { method: "POST", role: "admin", body: JSON.stringify({ ...payload, id: form.id }) });
      }
      onSaved(); onClose();
      toast.success(isEdit ? "Plan updated." : "Plan created.");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={!!state} onClose={onClose} size="lg" title={isEdit ? "Edit plan" : "New plan"}
      subtitle={isEdit ? state?.tier?.id : "Configure a new subscription tier."}>
      <form onSubmit={submit} className="space-y-4">
        {!isEdit && (
          <Field label="Plan ID" required hint="Lowercase key, e.g. premium_yearly">
            <TextInput required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
          </Field>
        )}
        <Field label="Name" required>
          <TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Description">
          <TextArea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (৳)" required>
            <TextInput required type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </Field>
          <Field label="Billing interval">
            <Select value={form.billing_interval} onChange={(e) => setForm({ ...form, billing_interval: e.target.value })}>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
              <option value="custom">Custom (Contact us)</option>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Max properties" hint="-1 = unlimited">
            <TextInput type="number" value={form.maxProperties} onChange={(e) => setForm({ ...form, maxProperties: e.target.value })} />
          </Field>
          <Field label="Max tenants" hint="-1 = unlimited">
            <TextInput type="number" value={form.maxTenants} onChange={(e) => setForm({ ...form, maxTenants: e.target.value })} />
          </Field>
        </div>
        <Field label="Discount (%)" hint="Applied to the displayed price when > 0.">
          <TextInput type="number" min="0" max="100" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} />
        </Field>
        <Button type="submit" loading={saving} className="w-full">{isEdit ? "Save changes" : "Create plan"}</Button>
      </form>
    </Modal>
  );
}

/* ============================================================ CIRCULATE TAB */
function CirculateTab() {
  const [form, setForm] = useState({ title: "", content: "" });
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await rentMasterFetch("/api/admin/notices", {
        method: "POST", role: "admin",
        body: JSON.stringify({
          senderType: "system_admin", targetScope: "all_owners",
          title: form.title, content: form.content,
        }),
      });
      if (res.success) { setForm({ title: "", content: "" }); setSent(true); toast.success("Notice circulated to all owners."); }
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Circulate notice" subtitle="Broadcast an announcement to every owner on the platform." />
      {sent && <Alert>Notice circulated to all owners. <button className="underline" onClick={() => setSent(false)}>Send another</button></Alert>}
      <Card className="max-w-2xl p-6">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title" required>
            <TextInput required placeholder="e.g. Scheduled maintenance window" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Message" required>
            <TextArea required rows={5} placeholder="Write your platform-wide announcement…" value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </Field>
          <Button type="submit" loading={saving} icon={Inbox} className="w-full">Circulate to all owners</Button>
        </form>
      </Card>
    </div>
  );
}

/* ============================================================ CREATE OWNER */
function CreateOwnerModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const empty = { email: "", pass: "", name: "", phone: "", role: "owner" };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await rentMasterFetch("/api/super-admin/owners", {
        method: "POST", role: "admin", body: JSON.stringify(form),
      });
      if (res.success) { setForm(empty); onCreated(); onClose(); toast.success("Owner account created."); }
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create owner account" subtitle="A new login is provisioned immediately.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" required>
          <TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email" required>
            <TextInput required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <TextInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Temporary password" required>
            <TextInput required value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </Select>
          </Field>
        </div>
        <Button type="submit" loading={saving} className="w-full">Create account</Button>
      </form>
    </Modal>
  );
}

/* ============================================================ OWNER DETAIL */
function OwnerDetailModal({
  ownerId, tiers, onClose, onChanged,
}: {
  ownerId: string | null; tiers: SubscriptionTier[]; onClose: () => void; onChanged: () => void;
}) {
  const [detail, setDetail] = useState<AdminOwnerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState({ name: "", phone: "" });
  const [newPass, setNewPass] = useState("");
  const [tierId, setTierId] = useState("");

  async function load() {
    if (!ownerId) return;
    setLoading(true);
    try {
      const res = await rentMasterFetch(`/api/super-admin/owners/${ownerId}`, { role: "admin" });
      setDetail(res.data);
      setEdit({ name: res.data?.name || "", phone: res.data?.phone || "" });
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (ownerId) { setDetail(null); setNewPass(""); setTierId(""); load(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  async function patch(body: any, after?: () => void) {
    if (!ownerId) return;
    setBusy(true);
    try {
      const res = await rentMasterFetch(`/api/super-admin/owners/${ownerId}`, {
        method: "PATCH", role: "admin", body: JSON.stringify(body),
      });
      after?.();
      await load();
      onChanged();
      toast.success(res?.message || "Owner updated.");
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  async function assignPlan() {
    if (!ownerId || !tierId) return;
    setBusy(true);
    try {
      const tier = tiers.find((t) => t.id === tierId);
      await rentMasterFetch("/api/super-admin/subscriptions", {
        method: "POST", role: "admin",
        body: JSON.stringify({ ownerId, tierId, amountPaid: tier ? discountedPrice(tier) : 0, durationDays: 30 }),
      });
      await load();
      onChanged();
      toast.success(`Plan assigned${tier ? `: ${tier.name}` : ""}.`);
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  return (
    <Modal open={!!ownerId} onClose={onClose} size="lg" title="Manage owner"
      subtitle={detail?.email || undefined}>
      {loading || !detail ? (
        <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
      ) : (
        <div className="space-y-6">
          {/* Status + stats */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={detail.suspended ? "rose" : "emerald"}>{detail.suspended ? "Suspended" : "Active"}</Badge>
            {detail.permissions_revoked && <Badge tone="amber">Permissions revoked</Badge>}
            <Badge tone={detail.role === "admin" ? "amber" : "slate"}>{detail.role}</Badge>
            <span className="ml-auto text-xs text-slate-500">Joined {formatDate(detail.created_at)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat icon={Building2} label="Properties" value={detail.propertyCount} />
            <MiniStat icon={Users} label="Tenants" value={detail.tenantCount} />
          </div>

          {/* Edit details */}
          <Section title="Details">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name"><TextInput value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label="Phone"><TextInput value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
            </div>
            <Button size="sm" variant="secondary" loading={busy} onClick={() => patch({ name: edit.name, phone: edit.phone })}>Save details</Button>
          </Section>

          {/* Subscription */}
          <Section title="Subscription">
            {detail.subscription?.status === "active" ? (
              <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm">
                <span className="text-slate-200">
                  {detail.subscription.subscription_tiers?.name || detail.subscription.tier_id}
                  <span className="ml-2 text-xs text-slate-500">exp {detail.subscription.expiry_date ? formatDate(detail.subscription.expiry_date) : "—"}</span>
                </span>
                <Button size="sm" variant="danger" loading={busy} onClick={() => patch({ action: "cancel_subscription" })}>Cancel</Button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No active plan.</p>
            )}
            <div className="flex gap-2">
              <Select value={tierId} onChange={(e) => setTierId(e.target.value)} className="flex-1">
                <option value="">Assign a plan…</option>
                {tiers.filter((t) => t.is_active !== false).map((t) => (
                  <option key={t.id} value={t.id}>{t.name} · {formatCurrency(discountedPrice(t))}</option>
                ))}
              </Select>
              <Button size="sm" icon={CircleDollarSign} loading={busy} disabled={!tierId} onClick={assignPlan}>Assign</Button>
            </div>
          </Section>

          {/* Reset password */}
          <Section title="Reset password">
            <div className="flex gap-2">
              <TextInput placeholder="New password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="flex-1" />
              <Button size="sm" icon={KeyRound} variant="secondary" loading={busy} disabled={!newPass}
                onClick={() => patch({ password: newPass }, () => setNewPass(""))}>Reset</Button>
            </div>
          </Section>

          {/* Access controls */}
          <Section title="Access & permissions">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={detail.suspended ? "success" : "secondary"} icon={detail.suspended ? RotateCcw : Ban} loading={busy}
                onClick={() => patch({ action: detail.suspended ? "reactivate" : "suspend" })}>
                {detail.suspended ? "Restore access" : "Suspend access"}
              </Button>
              <Button size="sm" variant="secondary" icon={detail.permissions_revoked ? ShieldCheck : ShieldOff} loading={busy}
                onClick={() => patch({ action: detail.permissions_revoked ? "grant_permission" : "revoke_permission" })}>
                {detail.permissions_revoked ? "Grant permissions" : "Revoke permissions"}
              </Button>
              <Button size="sm" variant="danger" icon={Trash2} loading={busy}
                onClick={async () => { if (await confirmDialog({ title: "Delete account?", message: "Delete this account permanently? This cannot be undone.", confirmLabel: "Delete", danger: true })) deleteThis(); }}>
                Delete account
              </Button>
            </div>
          </Section>
        </div>
      )}
    </Modal>
  );

  async function deleteThis() {
    if (!ownerId) return;
    setBusy(true);
    try {
      await rentMasterFetch(`/api/super-admin/owners/${ownerId}`, { method: "DELETE", role: "admin" });
      onChanged();
      onClose();
      toast.success("Owner account deleted.");
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</div>
      {children}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="rounded-lg bg-white/[0.04] p-2 text-amber-400"><Icon className="h-4 w-4" /></div>
      <div>
        <div className="text-lg font-black text-slate-100">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      </div>
    </div>
  );
}
