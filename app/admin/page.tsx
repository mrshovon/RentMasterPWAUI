"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard, Users, CreditCard, Megaphone, Plus, Ban, KeyRound,
  Trash2, Mail, CheckCircle2, ShieldOff, ShieldCheck, Inbox, Building2, Eye,
  RotateCcw, CircleDollarSign, Pencil, Power, Percent, LifeBuoy, MessageSquare, User,
  Wallet, Upload, Image as ImageIcon, X, Check, HardHat, Settings, Wrench,
  BarChart3, Radio, Smartphone, Globe, TrendingUp, TrendingDown, Minus, EyeOff,
  ScrollText, ChevronDown, ChevronRight, RefreshCw,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { rentMasterFetch, uploadFile } from "../../lib/api-service";
import { toast } from "../../components/toast";
import { confirmDialog } from "../../components/confirm";
import { useSessionGuard } from "../../lib/use-session";
import { usePresenceHeartbeat } from "../../lib/presence";
import { useTabState } from "../../lib/use-tab";
import { usePendingAction } from "../../lib/use-pending";
import { useRevalidateOnFocus } from "../../lib/use-revalidate";
import {
  AdminOwner, AdminOwnerDetail, SubscriptionTier,
  SupportTicket, TicketStatus, TicketCategory, PriorityLevel,
  PasswordResetRecord, ResetMethod, ContactMessage, ContactStatus,
  PaymentSubmission, PaymentSubmissionStatus, PaymentConfig,
  MaintenanceMode, NoticeScope, AccountProfile, AnalyticsSummary, DayCount,
  LogRecord, LogLevel, LogSource, LogsResponse,
} from "../../types/api";
import { formatCurrency, formatDate, formatDateTime } from "../../lib/format";
import { DashboardShell, NavItem } from "../../components/shell";
import { AttachmentStrip } from "../../components/attachments";
import { AppSettingsCard } from "../../components/app-settings-card";
import { AnnouncementModal, type Announcement } from "../../components/announcement-gate";
import { OwnerProfileCard } from "../../components/profile-card";
import {
  Card, StatCard, Badge, Button, Modal, Field, TextInput, TextArea, Select,
  PageHeader, EmptyState, Alert, FullScreenLoader, SearchInput, Spinner,
  EmailField, PhoneField,
} from "../../components/ui";
import { validateEmail, validatePhone } from "../../lib/validate";
import { PLAN_ADDONS, AddonKey, addonsOnTier, FREE_TIER_ID } from "../../lib/addons";

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
  usePresenceHeartbeat(!checkingSession);
  const { isPending, run } = usePendingAction();
  const [tab, setTab] = useTabState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [owners, setOwners] = useState<AdminOwner[]>([]);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [resets, setResets] = useState<PasswordResetRecord[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [payments, setPayments] = useState<PaymentSubmission[]>([]);
  const [account, setAccount] = useState<AccountProfile | null>(null);
  // Platform-wide counts for the Overview tiles (tenants + online). The Analytics tab fetches
  // its own copy with a date range; this one is just the default window.
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [tierModal, setTierModal] = useState<{ mode: "create" | "edit"; tier?: SubscriptionTier } | null>(null);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [activeMessage, setActiveMessage] = useState<ContactMessage | null>(null);
  const [activePayment, setActivePayment] = useState<PaymentSubmission | null>(null);

  async function refreshOwners() {
    const res = await rentMasterFetch("/api/super-admin/owners", { role: "admin" });
    setOwners(res.data || []);
  }
  async function refreshTiers() {
    const res = await rentMasterFetch("/api/super-admin/tiers", { role: "admin" });
    setTiers(res.data || []);
  }

  // `first` blanks the screen with a spinner; a background revalidation must not.
  const loadAll = useCallback(async (first = false) => {
    {
      try {
        if (first) setLoading(true);
        const [o, t, s, r, c, p] = await Promise.allSettled([
          rentMasterFetch("/api/super-admin/owners", { role: "admin" }),
          rentMasterFetch("/api/super-admin/tiers", { role: "admin" }),
          rentMasterFetch("/api/super-admin/support-tickets", { role: "admin" }),
          rentMasterFetch("/api/super-admin/password-resets", { role: "admin" }),
          rentMasterFetch("/api/super-admin/contact-messages", { role: "admin" }),
          rentMasterFetch("/api/super-admin/payments", { role: "admin" }),
        ]);
        if (o.status === "fulfilled") setOwners(o.value.data || []);
        if (t.status === "fulfilled") setTiers(t.value.data || []);
        if (s.status === "fulfilled") setTickets(s.value.data || []);
        if (r.status === "fulfilled") setResets(r.value.data || []);
        if (c.status === "fulfilled") setMessages(c.value.data || []);
        if (p.status === "fulfilled") setPayments(p.value.data || []);
        const err = [o, t, s].find((r) => r.status === "rejected");
        if (err && err.status === "rejected") setError((err.reason as Error).message);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => { void loadAll(true); }, [loadAll]);

  // The admin console is a queue: pending payments, new messages, open tickets. Loading once per
  // mount meant the badge counts were as old as the tab, which for a console someone leaves open
  // all day is the whole working session. 30s-throttled.
  useRevalidateOnFocus(() => { void loadAll(); });

  // The signed-in account, for the "Signed in as …" line on the overview. The stored session
  // carries a name but no email, so this is the only source for it.
  useEffect(() => {
    (async () => {
      try {
        const res = await rentMasterFetch<{ data: AccountProfile }>("/api/admin/owner/profile", { role: "admin" });
        setAccount(res.data);
      } catch { /* non-fatal — the overview falls back to its static header */ }
    })();
  }, []);

  // Platform totals + who is online, for the Overview tiles. Non-fatal: the tiles fall back
  // to owner-only figures, and this returns zeroes anyway until ADD_PRESENCE.sql has been run.
  useEffect(() => {
    (async () => {
      try {
        const res = await rentMasterFetch<{ data?: unknown } & AnalyticsSummary>(
          "/api/super-admin/analytics", { role: "admin" });
        setStats(res);
      } catch { /* non-fatal */ }
    })();
  }, []);

  const metrics = {
    total: owners.length,
    active: owners.filter((o) => !o.suspended).length,
    suspended: owners.filter((o) => o.suspended).length,
    subscribed: owners.filter((o) => o.subscription?.status === "active").length,
    openTickets: tickets.filter((t) => t.status !== "done").length,
    newMessages: messages.filter((m) => m.status === "new").length,
    pendingPayments: payments.filter((p) => p.status === "pending").length,
    // Owners/admins with the app open right now. The Analytics tab reports platform-wide
    // online counts including tenants; this one is scoped to the accounts in this list.
    onlineOwners: owners.filter((o) => o.online).length,
  };

  const nav: NavItem[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
    { key: "owners", label: "Owners", icon: Users, badge: owners.length },
    { key: "subscriptions", label: "Plans", icon: CreditCard },
    { key: "payments", label: "Payments", icon: CircleDollarSign, badge: metrics.pendingPayments },
    { key: "payment-setup", label: "Payment setup", icon: Wallet },
    { key: "notices", label: "Circulate", icon: Megaphone },
    { key: "tickets", label: "Tickets", icon: LifeBuoy, badge: metrics.openTickets },
    { key: "messages", label: "Messages", icon: Mail, badge: metrics.newMessages },
    { key: "reset-log", label: "Reset log", icon: KeyRound },
    { key: "logs", label: "Logs", icon: ScrollText },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  function applyMessageUpdate(updated: ContactMessage) {
    setMessages((xs) => xs.map((x) => (x.id === updated.id ? { ...x, ...updated, owner: x.owner } : x)));
  }

  // The PATCH response is the bare row (no owner join / tier_name) — keep the enrichment we have.
  function applyPaymentUpdate(updated: PaymentSubmission) {
    setPayments((xs) => xs.map((x) => (x.id === updated.id ? { ...x, ...updated, owner: x.owner, tier_name: x.tier_name } : x)));
  }

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
    await run(`owner-suspend:${o.id}`, async () => {
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
    // Deleting an owner now cascades through every property, tenant and invoice they own,
    // so say how much is about to go. The list payload carries no counts — fetch the detail
    // first. If that lookup fails, fall back to a generic warning rather than blocking.
    let scope = "";
    try {
      const res = await rentMasterFetch<{ data: AdminOwnerDetail }>(
        `/api/super-admin/owners/${o.id}`, { role: "admin" });
      const p = res.data?.propertyCount ?? 0;
      const t = res.data?.tenantCount ?? 0;
      if (p || t) {
        scope = ` This also permanently deletes ${p} propert${p === 1 ? "y" : "ies"} and ${t} tenant${t === 1 ? "" : "s"}, with all their invoices, documents and records.`;
      }
    } catch { /* non-fatal — the confirm still warns, just without numbers */ }

    if (!(await confirmDialog({
      title: "Delete owner account?",
      message: `Permanently delete ${o.name || o.email}?${scope} This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    }))) return;
    await run(`owner-delete:${o.id}`, async () => {
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
          {/* Greets by name like the tenant dashboard, and names the account signed in. Both
              fall back to the static header while the profile request is still in flight. */}
          <PageHeader
            title={session?.name ? `Welcome back, ${session.name}` : "Admin overview"}
            subtitle={account?.email
              ? `Signed in as ${account.email} · Super Admin`
              : "Platform-wide owners and subscriptions."}
          />
          {/* Platform-wide user counts (owners + tenants) come from the analytics endpoint —
              the owners list alone cannot see tenants. Falls back to the owner-only figures
              while that request is in flight or if it fails. */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="Users online now" accent="emerald" icon={Radio}
              value={stats ? stats.onlineNow.total : metrics.onlineOwners} />
            <StatCard label="Total platform users" accent="indigo" icon={Users}
              value={stats ? stats.totals.allUsers : metrics.total} />
            <StatCard label="Owner accounts" accent="amber" icon={Building2} value={metrics.total} />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Active" accent="emerald" icon={CheckCircle2} value={metrics.active} />
            <StatCard label="Suspended" accent="rose" icon={Ban} value={metrics.suspended} />
            <StatCard label="On a plan" accent="indigo" icon={CreditCard} value={metrics.subscribed} />
            <StatCard label="Tenants" accent="cyan" icon={Users} value={stats ? stats.totals.tenants : "—"} />
          </div>
          <Card className="p-6">
            <h3 className="mb-4 text-sm font-bold text-fg">Recently added owners</h3>
            <div className="space-y-3">
              {owners.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-heading">{o.name || "—"}</div>
                    <div className="truncate text-xs text-subtle">{o.email}</div>
                  </div>
                  <Badge tone={o.suspended ? "rose" : "emerald"}>{o.suspended ? "Suspended" : "Active"}</Badge>
                </div>
              ))}
              {owners.length === 0 && <p className="text-sm text-subtle">No owner accounts yet.</p>}
            </div>
          </Card>
        </div>
      )}

      {tab === "analytics" && <AnalyticsTab />}

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

      {tab === "payments" && <PaymentsTab payments={payments} onOpen={setActivePayment} />}

      {tab === "payment-setup" && <PaymentSetupTab />}

      {tab === "notices" && <CirculateTab owners={owners} />}

      {tab === "tickets" && <TicketsTab tickets={tickets} onOpen={setActiveTicket} />}

      {tab === "messages" && <MessagesTab messages={messages} onOpen={setActiveMessage} />}

      {tab === "reset-log" && <ResetLogTab resets={resets} />}

      {/* Fetches on open rather than with the dashboard's other lists: the log is the one table
          that grows without bound, so it must never be pulled just because someone signed in. */}
      {tab === "logs" && <LogsTab />}

      {tab === "settings" && <AdminSettingsTab />}

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
      <ContactMessageModal
        message={activeMessage}
        onClose={() => setActiveMessage(null)}
        onSaved={applyMessageUpdate}
      />
      <PaymentDecisionModal
        payment={activePayment}
        onClose={() => setActivePayment(null)}
        onSaved={applyPaymentUpdate}
      />
    </DashboardShell>
  );
}

/* ============================================================ ANALYTICS TAB */

const RANGE_PRESETS = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
] as const;

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => isoDay(new Date(Date.now() - n * 86400000));

// Percentage change vs the previous period of equal length. Null when there is no baseline —
// "+100%" against a zero previous period is noise, not information.
function pctChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function DeltaPill({ current, previous }: { current: number; previous: number }) {
  const pct = pctChange(current, previous);
  if (pct === null) {
    return <span className="inline-flex items-center gap-1 text-xs text-faint"><Minus className="h-3 w-3" />no prior data</span>;
  }
  const Icon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus;
  const tone = pct > 0 ? "text-success" : pct < 0 ? "text-danger" : "text-subtle";
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", tone)}>
      <Icon className="h-3 w-3" />{pct > 0 ? "+" : ""}{pct}% vs previous
    </span>
  );
}

/**
 * Daily signups, owners and tenants stacked per day.
 *
 * Hand-rolled SVG: there is no chart library in this project and one bar chart does not
 * justify adding ~50KB of dependency. Two series, so a legend is mandatory (identity is
 * never carried by colour alone), each bar carries a hover tooltip, and a table view sits
 * underneath for screen readers and for anyone who needs the actual numbers.
 */
function SignupChart({ ownerSeries, tenantSeries }: { ownerSeries: DayCount[]; tenantSeries: DayCount[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const days = ownerSeries.map((d, i) => ({
    date: d.date,
    owners: d.count,
    tenants: tenantSeries[i]?.count ?? 0,
    total: d.count + (tenantSeries[i]?.count ?? 0),
  }));
  const peak = Math.max(1, ...days.map((d) => d.total));
  const empty = days.every((d) => d.total === 0);

  // Label every ~7th day so the axis never collides with itself on a 90-day range.
  const labelEvery = Math.max(1, Math.ceil(days.length / 8));

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-fg">New users per day</h3>
        {/* Legend — always present for 2+ series. */}
        <div className="flex items-center gap-4 text-xs font-semibold text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-chart-1" />Owners
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-chart-2" />Tenants
          </span>
        </div>
      </div>

      {empty ? (
        <p className="py-10 text-center text-sm text-subtle">No signups in this period.</p>
      ) : (
        <>
          <div className="relative mt-5 overflow-x-auto">
            <div className="flex h-48 min-w-full items-end gap-[2px]" style={{ minWidth: days.length * 10 }}>
              {days.map((d, i) => (
                <div
                  key={d.date}
                  className="group relative flex h-full flex-1 cursor-default flex-col justify-end"
                  style={{ minWidth: 6 }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                >
                  {/* Tenants stack on top of owners; the 2px gap between the two fills is
                      what keeps the boundary readable without an outline. */}
                  {d.tenants > 0 && (
                    <div className="w-full rounded-t bg-chart-2"
                      style={{ height: `${(d.tenants / peak) * 100}%`, marginBottom: d.owners > 0 ? 2 : 0 }} />
                  )}
                  {d.owners > 0 && (
                    <div className={cn("w-full bg-chart-1", d.tenants > 0 ? "rounded-b" : "rounded-t")}
                      style={{ height: `${(d.owners / peak) * 100}%` }} />
                  )}
                  {/* Zero days still need a hit target, or the tooltip skips them. */}
                  {d.total === 0 && <div className="h-[2px] w-full rounded bg-line/[0.12]" />}

                  {hover === i && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-heading px-2.5 py-1.5 text-xs text-bg shadow-lg">
                      <div className="font-bold">{formatDate(d.date)}</div>
                      <div>{d.owners} owner{d.owners === 1 ? "" : "s"}</div>
                      <div>{d.tenants} tenant{d.tenants === 1 ? "" : "s"}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex min-w-full gap-[2px]" style={{ minWidth: days.length * 10 }}>
              {days.map((d, i) => (
                <div key={d.date} className="flex-1 text-center text-[9px] text-faint" style={{ minWidth: 6 }}>
                  {i % labelEvery === 0 ? d.date.slice(5) : ""}
                </div>
              ))}
            </div>
          </div>

          {/* Table view: the numbers without relying on colour or hover. Only days with
              activity, so a 90-day range doesn't produce 90 empty rows. */}
          <details className="mt-4">
            <summary className="cursor-pointer text-xs font-semibold text-muted hover:text-fg">
              View as table
            </summary>
            <div className="mt-2 max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase tracking-wider text-muted">
                  <tr><th className="py-1">Date</th><th className="py-1">Owners</th><th className="py-1">Tenants</th></tr>
                </thead>
                <tbody className="divide-y divide-line/[0.04]">
                  {days.filter((d) => d.total > 0).map((d) => (
                    <tr key={d.date}>
                      <td className="py-1 text-fg">{formatDate(d.date)}</td>
                      <td className="py-1 text-fg">{d.owners}</td>
                      <td className="py-1 text-fg">{d.tenants}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </Card>
  );
}

function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preset, setPreset] = useState<string>("30");
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(isoDay(new Date()));

  // Presets drive the two date inputs rather than being a separate mode, so switching to a
  // preset and then nudging one date is continuous instead of resetting.
  function applyPreset(key: string) {
    setPreset(key);
    setFrom(daysAgo(Number(key) - 1));
    setTo(isoDay(new Date()));
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await rentMasterFetch<AnalyticsSummary>(
          `/api/super-admin/analytics?from=${from}&to=${to}`, { role: "admin" });
        if (!cancelled) setData(res);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [from, to]);

  const online = data?.onlineNow;
  const web = online?.byPlatform?.web ?? 0;
  const android = online?.byPlatform?.android ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Platform growth and activity. Compare any two dates." />

      {/* Filters, in one row above the charts. */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-1">
            {RANGE_PRESETS.map((p) => (
              <button key={p.key} onClick={() => applyPreset(p.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  preset === p.key ? "bg-primary text-btn-ink" : "bg-overlay/[0.04] text-muted hover:text-fg"
                )}>
                {p.label}
              </button>
            ))}
          </div>
          <Field label="From">
            <TextInput type="date" value={from} max={to}
              onChange={(e) => { setFrom(e.target.value); setPreset("custom"); }} />
          </Field>
          <Field label="To">
            <TextInput type="date" value={to} min={from} max={isoDay(new Date())}
              onChange={(e) => { setTo(e.target.value); setPreset("custom"); }} />
          </Field>
        </div>
      </Card>

      {error && <Alert>{error}</Alert>}
      {loading && !data ? (
        <Card className="flex items-center justify-center p-12"><Spinner /></Card>
      ) : data ? (
        <>
          {/* Live figures — "now", not range-dependent. */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Online right now" accent="emerald" icon={Radio} value={online?.total ?? 0} />
            <StatCard label="Total users" accent="indigo" icon={Users} value={data.totals.allUsers} />
            <StatCard label="Owners" accent="amber" icon={Building2} value={data.totals.owners} />
            <StatCard label="Tenants" accent="cyan" icon={Users} value={data.totals.tenants} />
          </div>

          {/* Range-dependent figures, each against the preceding period of equal length. */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-muted">New users in range</div>
              <div className="mt-1 text-3xl font-black text-heading">{data.newUsers.total}</div>
              <div className="mt-1"><DeltaPill current={data.newUsers.total} previous={data.newUsers.previousTotal} /></div>
              <div className="mt-2 text-xs text-subtle">
                {data.newUsers.owners} owner{data.newUsers.owners === 1 ? "" : "s"} · {data.newUsers.tenants} tenant{data.newUsers.tenants === 1 ? "" : "s"}
              </div>
            </Card>
            <Card className="p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-muted">Active users in range</div>
              <div className="mt-1 text-3xl font-black text-heading">{data.activeUsers.current}</div>
              <div className="mt-1"><DeltaPill current={data.activeUsers.current} previous={data.activeUsers.previous} /></div>
              <div className="mt-2 text-xs text-subtle">Distinct accounts that opened the app</div>
            </Card>
          </div>

          <SignupChart ownerSeries={data.newUsers.ownerSeries} tenantSeries={data.newUsers.tenantSeries} />

          {/* Who is online, split by platform. */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-fg">Online right now, by platform</h3>
            {(online?.total ?? 0) === 0 ? (
              <p className="mt-3 text-sm text-subtle">
                Nobody is online. If this never changes, check that <code className="text-xs">ADD_PRESENCE.sql</code> has been run.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between rounded-lg border border-line/[0.06] bg-overlay/[0.02] px-3 py-2">
                  <span className="flex items-center gap-2 text-sm text-fg"><Globe className="h-4 w-4 text-muted" />Web</span>
                  <span className="font-black text-heading">{web}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-line/[0.06] bg-overlay/[0.02] px-3 py-2">
                  <span className="flex items-center gap-2 text-sm text-fg"><Smartphone className="h-4 w-4 text-muted" />Android app</span>
                  <span className="font-black text-heading">{android}</span>
                </div>
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}

/* ============================================================ PRESENCE */

// "3 min ago" / "2 days ago". Coarse on purpose — an exact clock time is noise when the
// question is only ever "recently, or a while back?". Falls back to the absolute date past
// a week, where a relative figure stops being meaningful.
function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "just now";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days <= 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(iso);
}

/**
 * Online dot, or when the account was last seen.
 *
 * `lastSeenAt` comes from the heartbeat and is the real answer. `lastSignInAt` is Supabase's
 * own field and only moves at login, so it is used only as a fallback for accounts that have
 * not sent a heartbeat yet (including every account until ADD_PRESENCE.sql has been run).
 */
function PresenceCell({ online, lastSeenAt, lastSignInAt }: {
  online?: boolean; lastSeenAt?: string | null; lastSignInAt?: string | null;
}) {
  if (online) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        Online
      </span>
    );
  }
  if (lastSeenAt) return <span className="text-xs text-subtle">Last seen {timeAgo(lastSeenAt)}</span>;
  if (lastSignInAt) return <span className="text-xs text-subtle">Signed in {timeAgo(lastSignInAt)}</span>;
  return <span className="text-xs text-faint">Never seen</span>;
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
              <thead className="border-b border-line/[0.06] bg-overlay/[0.02] text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="p-4">Owner</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Presence</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/[0.04]">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-overlay/[0.02]">
                    <td className="p-4">
                      <div className="font-semibold text-heading">{o.name || "—"}</div>
                      <div className="flex items-center gap-1 text-xs text-subtle"><Mail className="h-3 w-3" /> {o.email}</div>
                    </td>
                    <td className="p-4"><Badge tone={o.role === "admin" ? "amber" : "slate"}>{o.role}</Badge></td>
                    <td className="p-4"><PresenceCell online={o.online} lastSeenAt={o.last_seen_at} lastSignInAt={o.last_sign_in_at} /></td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={o.suspended ? "rose" : "emerald"}>{o.suspended ? "Suspended" : "Active"}</Badge>
                        {o.permissions_revoked && <Badge tone="amber">No perms</Badge>}
                      </div>
                    </td>
                    <td className="p-4 text-fg">
                      {o.subscription?.status === "active" ? (
                        <Badge tone="indigo">{o.subscription.tier_id}</Badge>
                      ) : <span className="text-xs text-subtle">—</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn title="View / manage" tone="indigo" icon={Eye} onClick={() => onView(o.id)} />
                        {/* Distinct pending keys per action — both used to be `owner:${id}`,
                            so starting either one showed a spinner on both buttons. */}
                        <IconBtn title={o.suspended ? "Reactivate" : "Suspend"} tone={o.suspended ? "emerald" : "amber"}
                          icon={o.suspended ? RotateCcw : Ban} onClick={() => onToggleSuspend(o)}
                          loading={isPending(`owner-suspend:${o.id}`)} />
                        <IconBtn title="Delete" tone="rose" icon={Trash2} onClick={() => onDelete(o)}
                          loading={isPending(`owner-delete:${o.id}`)} />
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
    indigo: "text-primary hover:bg-primary/10",
    amber: "text-warning hover:bg-warning/10",
    emerald: "text-success hover:bg-success/10",
    rose: "text-danger hover:bg-danger/10",
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
                        ? "bg-warning/15 text-warning"
                        : "text-subtle hover:bg-overlay/[0.05] hover:text-fg"
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
                  <thead className="border-b border-line/[0.06] bg-overlay/[0.02] text-[11px] uppercase tracking-wider text-muted">
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
                  <tbody className="divide-y divide-line/[0.04]">
                    {filtered.map((t) => (
                      <tr key={t.id} className="hover:bg-overlay/[0.02]">
                        <td className="p-4 font-mono text-xs text-subtle">#{t.ticket_no}</td>
                        <td className="p-4">
                          <div className="font-semibold text-heading">{t.owner?.name || "—"}</div>
                          <div className="flex items-center gap-1 text-xs text-subtle"><Mail className="h-3 w-3" /> {t.owner?.email || "unknown"}</div>
                        </td>
                        <td className="p-4">
                          <div className="max-w-[260px] truncate font-medium text-fg">{t.subject}</div>
                        </td>
                        <td className="p-4"><Badge tone="slate">{ticketCategoryLabel[t.category]}</Badge></td>
                        <td className="p-4"><Badge tone={ticketPriorityTone[t.priority]}>{t.priority}</Badge></td>
                        <td className="p-4"><Badge tone={ticketStatusTone[t.status]}>{ticketStatusLabel[t.status]}</Badge></td>
                        <td className="p-4 text-xs text-subtle">{ticketAge(t.created_at)}</td>
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
            <span className="ml-auto text-xs text-subtle">Raised {formatDate(ticket.created_at)}</span>
          </div>

          <div className="rounded-xl border border-line/[0.06] bg-overlay/[0.02] p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-subtle">
              From {ticket.owner?.name || "owner"}{ticket.owner?.email ? ` · ${ticket.owner.email}` : ""}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{ticket.description}</p>
          </div>

          <AttachmentStrip raw={ticket.attachment_file_url} />

          <form onSubmit={submit} className="space-y-4 border-t border-line/[0.06] pt-5">
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

/* ============================================================ CONTACT MESSAGES TAB */
const CONTACT_STATUS_TONE: Record<ContactStatus, "slate" | "indigo" | "emerald" | "amber"> = {
  new: "indigo", in_progress: "amber", resolved: "emerald", archived: "slate",
};
const CONTACT_STATUS_LABEL: Record<ContactStatus, string> = {
  new: "New", in_progress: "In progress", resolved: "Resolved", archived: "Archived",
};
const CONTACT_FILTERS: { key: ContactStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "in_progress", label: "In progress" },
  { key: "resolved", label: "Resolved" },
  { key: "archived", label: "Archived" },
];

function MessagesTab({
  messages, onOpen,
}: {
  messages: ContactMessage[]; onOpen: (m: ContactMessage) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ContactStatus | "all">("all");

  const q = query.trim().toLowerCase();
  const filtered = messages
    .filter((m) => filter === "all" || m.status === filter)
    .filter((m) =>
      !q ||
      [m.name, m.email, m.phone, m.message, m.owner?.name, m.owner?.email, `#${m.message_no}`]
        .some((v) => String(v ?? "").toLowerCase().includes(q)));

  return (
    <div className="space-y-6">
      <PageHeader title="Contact messages" subtitle="Enquiries owners sent from the Contact us button." />

      {messages.length === 0 ? (
        <EmptyState icon={Mail} title="No messages" hint="When an owner sends an enquiry, it lands here." />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1"><SearchInput value={query} onChange={setQuery} placeholder="Search by name, email or message…" /></div>
            <div className="flex flex-wrap gap-1.5">
              {CONTACT_FILTERS.map((f) => {
                const count = f.key === "all" ? messages.length : messages.filter((m) => m.status === f.key).length;
                const isActive = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      isActive ? "bg-warning/15 text-warning" : "text-subtle hover:bg-overlay/[0.05] hover:text-fg"
                    }`}
                  >
                    {f.label} <span className="opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Mail} title="No matches" hint="No messages match the current search or filter." />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="border-b border-line/[0.06] bg-overlay/[0.02] text-[11px] uppercase tracking-wider text-muted">
                    <tr>
                      <th className="p-4">#</th>
                      <th className="p-4">From</th>
                      <th className="p-4">Message</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Received</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/[0.04]">
                    {filtered.map((m) => (
                      <tr key={m.id} className="hover:bg-overlay/[0.02]">
                        <td className="p-4 font-mono text-xs text-subtle">#{m.message_no}</td>
                        <td className="p-4">
                          <div className="font-semibold text-heading">{m.name || m.owner?.name || "—"}</div>
                          <div className="flex items-center gap-1 text-xs text-subtle"><Mail className="h-3 w-3" /> {m.email || m.owner?.email || "unknown"}</div>
                        </td>
                        <td className="p-4"><div className="max-w-[280px] truncate text-fg">{m.message}</div></td>
                        <td className="p-4"><Badge tone={CONTACT_STATUS_TONE[m.status]}>{CONTACT_STATUS_LABEL[m.status]}</Badge></td>
                        <td className="p-4 text-xs text-subtle">{formatDate(m.created_at)}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            <IconBtn title="Open / update" tone="indigo" icon={Eye} onClick={() => onOpen(m)} />
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

function ContactMessageModal({
  message, onClose, onSaved,
}: {
  message: ContactMessage | null; onClose: () => void; onSaved: (m: ContactMessage) => void;
}) {
  const [status, setStatus] = useState<ContactStatus>("new");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (message) { setStatus(message.status); setNotes(message.admin_notes || ""); }
  }, [message]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message) return;
    try {
      setSaving(true);
      const res = await rentMasterFetch(`/api/super-admin/contact-messages/${message.id}`, {
        method: "PATCH", role: "admin",
        body: JSON.stringify({ status, adminNotes: notes }),
      });
      if (res.success) { onSaved(res.data); onClose(); toast.success(`Message #${message.message_no} updated.`); }
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={!!message} onClose={onClose} size="lg"
      title={message ? `Message #${message.message_no}` : "Message"}
      subtitle={message ? (message.name || message.owner?.name || undefined) : undefined}>
      {message && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={CONTACT_STATUS_TONE[message.status]}>{CONTACT_STATUS_LABEL[message.status]}</Badge>
            <span className="ml-auto text-xs text-subtle">Received {formatDate(message.created_at)}</span>
          </div>

          <div className="grid gap-2 rounded-xl border border-line/[0.06] bg-overlay/[0.02] p-4 text-sm sm:grid-cols-3">
            <div><div className="text-[11px] uppercase tracking-wider text-subtle">Name</div><div className="text-fg">{message.name || "—"}</div></div>
            <div><div className="text-[11px] uppercase tracking-wider text-subtle">Email</div><div className="text-fg">{message.email || message.owner?.email || "—"}</div></div>
            <div><div className="text-[11px] uppercase tracking-wider text-subtle">Phone</div><div className="text-fg">{message.phone || "—"}</div></div>
          </div>

          <div className="rounded-xl border border-line/[0.06] bg-overlay/[0.02] p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-subtle">Message</div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{message.message}</p>
          </div>

          <form onSubmit={submit} className="space-y-4 border-t border-line/[0.06] pt-5">
            <Field label="Status" required>
              <Select value={status} onChange={(e) => setStatus(e.target.value as ContactStatus)}>
                <option value="new">New</option>
                <option value="in_progress">In progress</option>
                <option value="resolved">Resolved</option>
                <option value="archived">Archived</option>
              </Select>
            </Field>
            <Field label="Internal note" hint="Not shown to the owner.">
              <TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Follow-up details, who's handling it…" />
            </Field>
            <Button type="submit" loading={saving} className="w-full">Save update</Button>
          </form>
        </div>
      )}
    </Modal>
  );
}

/* ============================================================ PAYMENTS TAB */
const PAYMENT_FILTERS: { key: PaymentSubmissionStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];
const PAYMENT_STATUS_TONE: Record<PaymentSubmissionStatus, "amber" | "emerald" | "rose"> = {
  pending: "amber", approved: "emerald", rejected: "rose",
};
const PAYMENT_STATUS_LABEL: Record<PaymentSubmissionStatus, string> = {
  pending: "Pending", approved: "Approved", rejected: "Rejected",
};

function PaymentsTab({
  payments, onOpen,
}: {
  payments: PaymentSubmission[]; onOpen: (p: PaymentSubmission) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PaymentSubmissionStatus | "all">("pending");

  const q = query.trim().toLowerCase();
  const filtered = payments
    .filter((p) => filter === "all" || p.status === filter)
    .filter((p) =>
      !q ||
      [p.owner?.name, p.owner?.email, p.txn_id, p.sender_msisdn, p.tier_name, `#${p.payment_no}`]
        .some((v) => String(v ?? "").toLowerCase().includes(q)));

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle="bKash payments owners submitted for plan activation. Approve to activate their plan." />

      {payments.length === 0 ? (
        <EmptyState icon={CircleDollarSign} title="No payments" hint="When an owner submits a payment, it lands here." />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1"><SearchInput value={query} onChange={setQuery} placeholder="Search by owner, txn id or number…" /></div>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_FILTERS.map((f) => {
                const count = f.key === "all" ? payments.length : payments.filter((p) => p.status === f.key).length;
                const isActive = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      isActive ? "bg-warning/15 text-warning" : "text-subtle hover:bg-overlay/[0.05] hover:text-fg"
                    }`}
                  >
                    {f.label} <span className="opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={CircleDollarSign} title="No matches" hint="No payments match the current search or filter." />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-line/[0.06] bg-overlay/[0.02] text-[11px] uppercase tracking-wider text-muted">
                    <tr>
                      <th className="p-4">#</th>
                      <th className="p-4">Owner</th>
                      <th className="p-4">Plan</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Sender / Txn</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Submitted</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/[0.04]">
                    {filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-overlay/[0.02]">
                        <td className="p-4 font-mono text-xs text-subtle">#{p.payment_no}</td>
                        <td className="p-4">
                          <div className="font-semibold text-heading">{p.owner?.name || "—"}</div>
                          <div className="flex items-center gap-1 text-xs text-subtle"><Mail className="h-3 w-3" /> {p.owner?.email || p.owner_email || "unknown"}</div>
                        </td>
                        <td className="p-4"><div className="max-w-[180px] truncate font-medium text-fg">{p.tier_name || p.tier_id}</div></td>
                        <td className="p-4 font-semibold text-heading">{formatCurrency(Number(p.amount || 0))}</td>
                        <td className="p-4">
                          <div className="text-fg">{p.sender_msisdn || "—"}</div>
                          <div className="font-mono text-xs text-subtle">{p.txn_id || "—"}</div>
                        </td>
                        <td className="p-4"><Badge tone={PAYMENT_STATUS_TONE[p.status]}>{PAYMENT_STATUS_LABEL[p.status]}</Badge></td>
                        <td className="p-4 text-xs text-subtle">{formatDate(p.created_at)}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            <IconBtn title="Review" tone="indigo" icon={Eye} onClick={() => onOpen(p)} />
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

function PaymentDecisionModal({
  payment, onClose, onSaved,
}: {
  payment: PaymentSubmission | null; onClose: () => void; onSaved: (p: PaymentSubmission) => void;
}) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState<null | "approved" | "rejected">(null);

  useEffect(() => { if (payment) setNotes(payment.admin_notes || ""); }, [payment]);

  async function decide(status: "approved" | "rejected") {
    if (!payment) return;
    if (status === "rejected" && !notes.trim()) { toast.error("Add a remark so the owner knows why."); return; }
    try {
      setSaving(status);
      const res = await rentMasterFetch(`/api/super-admin/payments/${payment.id}`, {
        method: "PATCH", role: "admin",
        body: JSON.stringify({ status, adminNotes: notes }),
      });
      if (res.success) {
        onSaved(res.data);
        onClose();
        toast.success(status === "approved" ? `Payment #${payment.payment_no} approved — plan activated.` : `Payment #${payment.payment_no} rejected.`);
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(null); }
  }

  const decided = payment && payment.status !== "pending";

  return (
    <Modal open={!!payment} onClose={onClose} size="lg"
      title={payment ? `Payment #${payment.payment_no}` : "Payment"}
      subtitle={payment ? (payment.tier_name || payment.tier_id) : undefined}>
      {payment && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={PAYMENT_STATUS_TONE[payment.status]}>{PAYMENT_STATUS_LABEL[payment.status]}</Badge>
            <span className="ml-auto text-xs text-subtle">Submitted {formatDate(payment.created_at)}</span>
          </div>

          <div className="grid gap-2 rounded-xl border border-line/[0.06] bg-overlay/[0.02] p-4 text-sm sm:grid-cols-2">
            <div><div className="text-[11px] uppercase tracking-wider text-subtle">Owner</div><div className="text-fg">{payment.owner?.name || "—"}</div></div>
            <div><div className="text-[11px] uppercase tracking-wider text-subtle">Email</div><div className="text-fg">{payment.owner?.email || payment.owner_email || "—"}</div></div>
            <div><div className="text-[11px] uppercase tracking-wider text-subtle">Plan</div><div className="text-fg">{payment.tier_name || payment.tier_id}</div></div>
            <div><div className="text-[11px] uppercase tracking-wider text-subtle">Amount</div><div className="font-semibold text-heading">{formatCurrency(Number(payment.amount || 0))}</div></div>
            <div><div className="text-[11px] uppercase tracking-wider text-subtle">Paid from</div><div className="font-mono text-fg">{payment.sender_msisdn || "—"}</div></div>
            <div><div className="text-[11px] uppercase tracking-wider text-subtle">Transaction id</div><div className="font-mono text-fg">{payment.txn_id || "—"}</div></div>
          </div>

          {decided ? (
            <div className="rounded-xl border border-line/[0.06] bg-overlay/[0.02] p-4 text-sm text-fg">
              This payment was already <strong>{PAYMENT_STATUS_LABEL[payment.status].toLowerCase()}</strong>
              {payment.admin_notes ? <> — {payment.admin_notes}</> : null}.
            </div>
          ) : (
            <div className="space-y-4 border-t border-line/[0.06] pt-5">
              <Field label="Remarks" hint="Required to reject — shown to the owner as the reason.">
                <TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Transaction id not found, amount mismatch…" />
              </Field>
              <div className="flex gap-3">
                <Button variant="secondary" icon={X} className="flex-1" loading={saving === "rejected"}
                  onClick={() => decide("rejected")}>Reject</Button>
                <Button icon={Check} className="flex-1" loading={saving === "approved"}
                  onClick={() => decide("approved")}>Approve &amp; activate</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ============================================================ PAYMENT SETUP TAB */
const MFS_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay", "mCash", "Tap", "Other"];

function PaymentSetupTab() {
  const [config, setConfig] = useState<PaymentConfig>({ provider: "bKash", walletNumber: "", instructions: "", qrUrl: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await rentMasterFetch<{ data: PaymentConfig }>("/api/super-admin/payment-config", { role: "admin" });
        if (res.data) setConfig(res.data);
      } catch { /* keep defaults */ }
      finally { setLoading(false); }
    })();
  }, []);

  async function onPickQr(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadFile(file, { role: "owner", folder: "payments" });
      setConfig((c) => ({ ...c, qrUrl: url }));
      toast.success("QR uploaded — remember to Save.");
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  }

  async function save() {
    // Every owner who upgrades sends money to this number. A typo here doesn't fail loudly —
    // it silently routes real payments to a stranger.
    const parsedWallet = validatePhone(config.walletNumber, { required: true });
    if (!parsedWallet.ok) { toast.error(parsedWallet.error); return; }
    try {
      setSaving(true);
      const res = await rentMasterFetch<{ data: PaymentConfig }>("/api/super-admin/payment-config", {
        method: "PUT", role: "admin",
        body: JSON.stringify({ ...config, walletNumber: parsedWallet.value }),
      });
      if (res.data) setConfig(res.data);
      toast.success("Payment setup saved.");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  if (loading) return <EmptyState icon={Wallet} title="Loading payment setup…" hint="Fetching the current configuration." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Payment setup" subtitle="The bKash details owners pay into when upgrading a plan." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-6">
          <Field label="Mobile payment service (MFS)" hint="Which service this number and QR belong to.">
            <Select value={MFS_PROVIDERS.includes(config.provider) ? config.provider : "Other"}
              onChange={(e) => setConfig((c) => ({ ...c, provider: e.target.value === "Other" ? "" : e.target.value }))}>
              {MFS_PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </Field>
          {!MFS_PROVIDERS.slice(0, -1).includes(config.provider) && (
            <Field label="Service name" hint="Name of the MFS owners will pay with.">
              <TextInput value={config.provider} onChange={(e) => setConfig((c) => ({ ...c, provider: e.target.value }))}
                placeholder="e.g. SureCash" />
            </Field>
          )}
          <PhoneField label={`${config.provider || "MFS"} number`} required
            hint="The personal number owners send money to."
            value={config.walletNumber}
            onChange={(v) => setConfig((c) => ({ ...c, walletNumber: v }))} />
          <Field label="Instructions" hint="Steps shown to the owner on the payment screen.">
            <TextArea rows={5} value={config.instructions} onChange={(e) => setConfig((c) => ({ ...c, instructions: e.target.value }))}
              placeholder={"1. Open bKash and choose Send Money\n2. Send the plan amount to the number above\n3. Enter the transaction id below"} />
          </Field>
          <Button icon={CheckCircle2} loading={saving} onClick={save} className="w-full">Save payment setup</Button>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="text-sm font-bold text-fg">{config.provider || "MFS"} QR code</div>
          <div className="flex items-center justify-center rounded-xl border border-dashed border-line/[0.12] bg-overlay/[0.02] p-6">
            {config.qrUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={config.qrUrl} alt="bKash QR" className="h-52 w-52 rounded-lg bg-white object-contain p-2" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-subtle">
                <ImageIcon className="h-10 w-10" />
                <span className="text-xs">No QR uploaded yet</span>
              </div>
            )}
          </div>
          <label className="block">
            <input type="file" accept="image/*" className="hidden" onChange={onPickQr} />
            <span className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-line/[0.1] bg-overlay/[0.03] px-4 py-2.5 text-sm font-semibold text-fg transition hover:bg-overlay/[0.06]">
              {uploading ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
              {config.qrUrl ? "Replace QR image" : "Upload QR image"}
            </span>
          </label>
          {config.qrUrl && (
            <Button variant="secondary" icon={Trash2} className="w-full" onClick={() => setConfig((c) => ({ ...c, qrUrl: null }))}>
              Remove QR
            </Button>
          )}
          <p className="text-xs text-subtle">Upload then click <strong>Save payment setup</strong> to publish. Owners see this QR on their payment screen.</p>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================ PASSWORD RESET LOG TAB */
const RESET_METHOD_LABEL: Record<ResetMethod, string> = {
  admin_reset: "Admin reset", self_service_email: "Email reset", self_change: "Self change",
};
const RESET_METHOD_TONE: Record<ResetMethod, "amber" | "indigo" | "emerald"> = {
  admin_reset: "amber", self_service_email: "indigo", self_change: "emerald",
};

function ResetLogTab({ resets }: { resets: PasswordResetRecord[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? resets.filter((r) =>
        [r.owner?.email, r.owner_email, r.owner?.name, RESET_METHOD_LABEL[r.reset_method], r.actor?.name, r.actor?.email]
          .some((v) => String(v ?? "").toLowerCase().includes(q)))
    : resets;

  return (
    <div className="space-y-6">
      <PageHeader title="Password reset log" subtitle="Every owner password change, newest first. Admin-only." />

      {resets.length === 0 ? (
        <EmptyState icon={KeyRound} title="No resets yet" hint="Password resets by owners or admins will appear here." />
      ) : (
        <>
          <SearchInput value={query} onChange={setQuery} placeholder="Search by owner, method or admin…" />
          {filtered.length === 0 ? (
            <EmptyState icon={KeyRound} title="No matches" hint={`No resets match "${query}".`} />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-line/[0.06] bg-overlay/[0.02] text-[11px] uppercase tracking-wider text-muted">
                    <tr>
                      <th className="p-4">#</th>
                      <th className="p-4">Owner</th>
                      <th className="p-4">Method</th>
                      <th className="p-4">Performed by</th>
                      <th className="p-4">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/[0.04]">
                    {filtered.map((r) => (
                      <tr key={r.id} className="hover:bg-overlay/[0.02]">
                        <td className="p-4 font-mono text-xs text-subtle">#{r.reset_no}</td>
                        <td className="p-4">
                          <div className="font-semibold text-heading">{r.owner?.name || "—"}</div>
                          <div className="flex items-center gap-1 text-xs text-subtle"><Mail className="h-3 w-3" /> {r.owner?.email || r.owner_email || "unknown"}</div>
                        </td>
                        <td className="p-4"><Badge tone={RESET_METHOD_TONE[r.reset_method]}>{RESET_METHOD_LABEL[r.reset_method]}</Badge></td>
                        <td className="p-4">
                          {r.reset_method === "admin_reset"
                            ? <span className="flex items-center gap-1 text-fg"><ShieldCheck className="h-3.5 w-3.5 text-warning" />{r.actor?.name || r.actor?.email || "Admin"}</span>
                            : <span className="flex items-center gap-1 text-muted"><User className="h-3.5 w-3.5" />Owner (self-service)</span>}
                        </td>
                        <td className="p-4 text-xs text-subtle">{formatDate(r.created_at)}</td>
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

/* ============================================================ APPLICATION LOG TAB */
const LOG_LEVEL_TONE: Record<LogLevel, "rose" | "amber" | "slate"> = {
  error: "rose", warn: "amber", info: "slate",
};
const LOG_SOURCE_LABEL: Record<LogSource, string> = {
  api: "API", client: "Browser", cron: "Scheduled job", email: "Email", push: "Push",
};

const LEVEL_FILTERS: { key: string; label: string }[] = [
  { key: "", label: "All levels" },
  { key: "error", label: "Errors" },
  { key: "warn", label: "Warnings" },
  { key: "info", label: "Info" },
];
const SOURCE_FILTERS: { key: string; label: string }[] = [
  { key: "", label: "All sources" },
  { key: "api", label: "API" },
  { key: "client", label: "Browser" },
  { key: "cron", label: "Scheduled job" },
  { key: "email", label: "Email" },
  { key: "push", label: "Push" },
];

/**
 * The diagnostic trail behind every error a user sees. Support flow: they quote the reference
 * from their screen ("req_7f3k9q"), you paste it into the search box, you get the stack.
 *
 * Filtering and paging are done by the SERVER here, unlike every other admin tab. Those fetch the
 * whole table and filter in the browser, which is fine for a few hundred owners and wrong for a
 * table that gains a row every time anything fails. Paging is keyset (`before=<created_at>`)
 * rather than offset, because this list grows at its head while you are reading it.
 */
function LogsTab() {
  const [rows, setRows] = useState<LogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [level, setLevel] = useState("");
  const [source, setSource] = useState("");
  const [query, setQuery] = useState("");
  // Applied search, separate from the input, so typing does not fire a request per keystroke.
  const [applied, setApplied] = useState("");
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load(cursor: string | null = null) {
    const params = new URLSearchParams();
    if (level) params.set("level", level);
    if (source) params.set("source", source);
    if (applied) params.set("q", applied);
    if (cursor) params.set("before", cursor);

    try {
      cursor ? setLoadingMore(true) : setLoading(true);
      setError(null);
      const res = await rentMasterFetch<LogsResponse>(
        `/api/super-admin/logs?${params.toString()}`,
        { role: "admin" },
      );
      setRows((prev) => (cursor ? [...prev, ...res.data] : res.data));
      setHasMore(res.hasMore);
      setNextBefore(res.nextBefore);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  // Re-runs whenever a filter or the APPLIED search changes; `query` alone does not trigger it.
  useEffect(() => { void load(null); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [level, source, applied]);

  async function purge() {
    const ok = await confirmDialog({
      title: "Clear old log entries?",
      message: "Everything older than 30 days will be permanently deleted. Recent entries are kept.",
      confirmLabel: "Clear old entries",
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await rentMasterFetch<{ message: string }>(
        "/api/super-admin/logs?olderThanDays=30",
        { method: "DELETE", role: "admin" },
      );
      toast.success(res.message);
      void load(null);
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logs"
        subtitle="Every error the app has recorded, newest first. Search a reference to find the user's exact failure."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search message, route, email or reference…"
          />
        </div>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-fg"
        >
          {LEVEL_FILTERS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-fg"
        >
          {SOURCE_FILTERS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
        <Button variant="ghost" icon={RefreshCw} onClick={() => setApplied(query.trim())}>
          Search
        </Button>
        <Button variant="ghost" icon={Trash2} onClick={purge}>Clear 30d+</Button>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Card className="flex items-center justify-center p-12"><Spinner /></Card>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Nothing logged"
          hint="Errors will appear here as they happen. An empty log is good news."
        />
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-line/[0.06] bg-overlay/[0.02] text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="p-4 w-8"></th>
                    <th className="p-4">#</th>
                    <th className="p-4">Level</th>
                    <th className="p-4">Source</th>
                    <th className="p-4">What happened</th>
                    <th className="p-4">Who</th>
                    <th className="p-4">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/[0.04]">
                  {rows.map((r) => (
                    <Fragment key={r.id}>
                      <tr
                        className="cursor-pointer hover:bg-overlay/[0.02]"
                        onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                      >
                        <td className="p-4 text-muted">
                          {expanded === r.id
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />}
                        </td>
                        <td className="p-4 font-mono text-xs text-subtle">#{r.log_no}</td>
                        <td className="p-4"><Badge tone={LOG_LEVEL_TONE[r.level]}>{r.level}</Badge></td>
                        <td className="p-4 text-xs text-subtle">{LOG_SOURCE_LABEL[r.source] ?? r.source}</td>
                        <td className="p-4">
                          <div className="max-w-[420px] truncate font-medium text-heading">{r.message}</div>
                          <div className="flex items-center gap-2 text-xs text-subtle">
                            {r.method && <span className="font-mono">{r.method}</span>}
                            {r.route && <span className="truncate font-mono">{r.route}</span>}
                            {r.status != null && <span>· {r.status}</span>}
                            {r.request_id && <span className="font-mono">· {r.request_id}</span>}
                          </div>
                        </td>
                        <td className="p-4 text-xs text-subtle">
                          {r.user_email || r.user_id || "—"}
                          {r.user_role && <div className="text-faint">{r.user_role}</div>}
                        </td>
                        <td className="p-4 whitespace-nowrap text-xs text-subtle">{formatDateTime(r.created_at)}</td>
                      </tr>

                      {expanded === r.id && (
                        <tr className="bg-overlay/[0.02]">
                          <td colSpan={7} className="p-4">
                            <div className="space-y-3">
                              <div className="text-xs text-subtle">
                                {r.ip && <span className="mr-4">IP {r.ip}</span>}
                                {r.code && <span className="mr-4">Code {r.code}</span>}
                                {r.user_agent && <span className="break-all">{r.user_agent}</span>}
                              </div>
                              {r.detail && (
                                <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-bg p-4 font-mono text-[11px] leading-relaxed text-subtle">
                                  {r.detail}
                                </pre>
                              )}
                              {r.context && Object.keys(r.context).length > 0 && (
                                <pre className="overflow-auto rounded-xl bg-bg p-4 font-mono text-[11px] text-subtle">
                                  {JSON.stringify(r.context, null, 2)}
                                </pre>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {hasMore && (
            <div className="flex justify-center">
              <Button variant="ghost" loading={loadingMore} onClick={() => void load(nextBefore)}>
                Load older entries
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ============================================================ PLANS TAB */
function discountedPrice(t: SubscriptionTier) {
  const d = Number(t.discount_percent || 0);
  return d > 0 ? Number(t.price) * (1 - d / 100) : Number(t.price);
}

// How long a plan runs, for the "৳500 /month" suffix. A 'days' plan states its own length;
// 'custom' is the enterprise contact tier and has no billing period to show.
function tenureLabel(t: SubscriptionTier) {
  if (t.billing_interval === "days") {
    const n = Number(t.duration_days || 0);
    return n === 1 ? "day" : `${n} days`;
  }
  if (t.billing_interval === "year") return "year";
  if (t.billing_interval === "month") return "month";
  return t.billing_interval;
}

// Which plan new self-signed-up owners land on. Empty => free (no history row). Non-custom only.
function DefaultSignupPlanCard({ tiers }: { tiers: SubscriptionTier[] }) {
  const [tierId, setTierId] = useState("");
  const [saving, setSaving] = useState(false);
  const selectable = tiers.filter((t) => t.billing_interval !== "custom" && t.is_active !== false);

  useEffect(() => {
    (async () => {
      try {
        const res = await rentMasterFetch<{ data: { defaultSignupTier: { tierId: string } } }>("/api/super-admin/settings", { role: "admin" });
        setTierId(res.data?.defaultSignupTier?.tierId || "");
      } catch { /* keep default */ }
    })();
  }, []);

  async function save(next: string) {
    setTierId(next);
    try {
      setSaving(true);
      await rentMasterFetch("/api/super-admin/settings", {
        method: "PATCH", role: "admin", body: JSON.stringify({ tierId: next }),
      });
      toast.success("Default signup plan updated.");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><User className="h-5 w-5" /></div>
        <div>
          <div className="text-sm font-bold text-heading">Default plan for new signups</div>
          <p className="mt-0.5 text-xs text-muted">The plan a newly self-registered owner starts on. Leave as Free unless you&apos;re running a promotion.</p>
        </div>
      </div>
      <div className="sm:w-56">
        <Select value={tierId} onChange={(e) => save(e.target.value)} disabled={saving}>
          <option value="">Free (default)</option>
          {selectable.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>
      </div>
    </Card>
  );
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
      <DefaultSignupPlanCard tiers={tiers} />
      {tiers.length === 0 ? (
        <EmptyState icon={CreditCard} title="No plans configured" hint="Create your first subscription plan."
          action={<Button icon={Plus} onClick={onCreate}>New plan</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...tiers]
            .sort((a, b) => (a.billing_interval === "custom" ? 1 : 0) - (b.billing_interval === "custom" ? 1 : 0) || Number(a.price) - Number(b.price))
            .map((t) => {
            const inactive = t.is_active === false;
            const hidden = t.is_public === false;
            const oneTime = t.is_recurring === false;
            const disc = Number(t.discount_percent || 0);
            const isContact = t.billing_interval === "custom";
            return (
              <Card key={t.id} className={`flex flex-col gap-3 p-5 ${inactive ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning"><CreditCard className="h-5 w-5" /></div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {disc > 0 && <Badge tone="emerald"><Percent className="mr-0.5 inline h-3 w-3" />{disc}% off</Badge>}
                    {/* Hidden is orthogonal to Inactive — a plan can be live but unlisted. */}
                    {hidden && <Badge tone="amber"><EyeOff className="mr-0.5 inline h-3 w-3" />Hidden</Badge>}
                    {oneTime && <Badge tone="cyan">One-time</Badge>}
                    <Badge tone={inactive ? "rose" : "slate"}>{inactive ? "Inactive" : "Active"}</Badge>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-heading">{t.name}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{t.description}</p>
                </div>
                <div className="flex items-end justify-between border-t border-line/[0.06] pt-3">
                  <div className="text-xs text-subtle">
                    <div>Properties: {t.max_properties_allowed < 0 ? "Unlimited" : t.max_properties_allowed}</div>
                    <div>Tenants: {t.max_tenants_allowed < 0 ? "Unlimited" : t.max_tenants_allowed}</div>
                  </div>
                  <div className="text-right">
                    {isContact ? (
                      <span className="text-lg font-black text-accent">Contact us</span>
                    ) : (
                      <>
                        {disc > 0 ? (
                          <div>
                            <span className="mr-1 text-xs text-subtle line-through">{formatCurrency(t.price)}</span>
                            <span className="text-lg font-black text-warning">{formatCurrency(discountedPrice(t))}</span>
                          </div>
                        ) : (
                          <span className="text-lg font-black text-warning">{formatCurrency(t.price)}</span>
                        )}
                        <span className="text-xs text-subtle">/{tenureLabel(t)}</span>
                      </>
                    )}
                  </div>
                </div>
                {/* Modules bundled with this plan — everyone on it gets them with no individual grant. */}
                {addonsOnTier(t).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {PLAN_ADDONS.filter((a) => addonsOnTier(t).includes(a.key)).map((a) => (
                      <Badge key={a.key} tone="cyan">{a.label}</Badge>
                    ))}
                  </div>
                )}
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

// Icons live here rather than in lib/addons.ts so that file stays free of presentation imports.
const ADDON_ICONS: Record<AddonKey, React.ReactNode> = {
  staff: <HardHat className="h-4 w-4 text-subtle" />,
  accounts: <Wallet className="h-4 w-4 text-subtle" />,
};

function TierModal({
  state, onClose, onSaved,
}: {
  state: { mode: "create" | "edit"; tier?: SubscriptionTier } | null;
  onClose: () => void; onSaved: () => void;
}) {
  const empty = { id: "", name: "", description: "", price: "0", billing_interval: "month", durationDays: "7", maxProperties: "-1", maxTenants: "-1", discountPercent: "0" };
  const [form, setForm] = useState(empty);
  // Listed to owners by default. Unticking keeps the plan fully usable but assign-only.
  const [isPublic, setIsPublic] = useState(true);
  // Renewable by default. Unticking makes it one-time — a trial.
  const [isRecurring, setIsRecurring] = useState(true);
  const [addons, setAddons] = useState<AddonKey[]>([]);
  // UI-only master switch: there is no "allows add-ons" column, and none is needed — the plan
  // simply bundles zero modules. Kept as its own bit of state so unticking it doesn't lose the
  // selection while the admin is still deciding.
  const [addonsOn, setAddonsOn] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = state?.mode === "edit";
  const isCustomDays = form.billing_interval === "days";
  // The Free baseline doubles as the fallback for owners with no plan at all, so it can never
  // bundle a paid module. The API rejects it too — this just explains why up front.
  const editingFreeTier = (isEdit ? state?.tier?.id : form.id.trim().toLowerCase()) === FREE_TIER_ID;

  useEffect(() => {
    if (!state) return;
    if (state.mode === "edit" && state.tier) {
      const t = state.tier;
      setForm({
        id: t.id, name: t.name, description: t.description || "",
        price: String(t.price), billing_interval: t.billing_interval,
        durationDays: String(t.duration_days ?? 7),
        maxProperties: String(t.max_properties_allowed), maxTenants: String(t.max_tenants_allowed),
        discountPercent: String(t.discount_percent ?? 0),
      });
      const current = addonsOnTier(t);
      setAddons(current);
      setAddonsOn(current.length > 0);
      setIsPublic(t.is_public !== false);
      setIsRecurring(t.is_recurring !== false);
    } else {
      setForm(empty);
      setAddons([]);
      setAddonsOn(false);
      setIsPublic(true);
      setIsRecurring(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const toggleAddon = (key: AddonKey) =>
    setAddons((xs) => (xs.includes(key) ? xs.filter((k) => k !== key) : [...xs, key]));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isCustomDays && !(Number(form.durationDays) > 0)) {
      toast.error("Enter how many days a custom-length plan runs for.");
      return;
    }
    // Master switch off (or the Free tier) means the plan bundles nothing, whatever is ticked.
    const selectedAddons = addonsOn && !editingFreeTier ? addons : [];

    const send = (confirmAddonRemoval = false) => {
      const payload = {
        name: form.name, description: form.description, price: form.price,
        billing_interval: form.billing_interval,
        // The server clears duration_days for any non-'days' interval, so sending it
        // unconditionally is safe and keeps the payload shape stable.
        durationDays: isCustomDays ? form.durationDays : null,
        maxProperties: form.maxProperties,
        maxTenants: form.maxTenants, discountPercent: form.discountPercent,
        isPublic,
        isRecurring,
        addons: selectedAddons,
        ...(confirmAddonRemoval ? { confirmAddonRemoval: true } : {}),
      };
      return isEdit && state?.tier
        ? rentMasterFetch(`/api/super-admin/tiers/${state.tier.id}`, { method: "PATCH", role: "admin", body: JSON.stringify(payload) })
        : rentMasterFetch("/api/super-admin/tiers", { method: "POST", role: "admin", body: JSON.stringify({ ...payload, id: form.id }) });
    };

    try {
      setSaving(true);
      try {
        await send();
      } catch (e: any) {
        // Taking a module off a plan removes it from everyone on that plan straight away, so
        // the server refuses once and tells us who loses access. Confirm, then repeat.
        if (e?.code !== "ADDON_REMOVAL_AFFECTS_OWNERS") throw e;
        const proceed = await confirmDialog({
          title: "Remove module access?",
          message: `${e.message} They keep access only if you have granted them the module individually.`,
          confirmLabel: "Remove anyway",
          danger: true,
        });
        if (!proceed) return;
        await send(true);
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
              <option value="days">Custom length (days)</option>
              <option value="custom">Contact us (enterprise)</option>
            </Select>
          </Field>
        </div>
        {isCustomDays && (
          <Field label="Plan length (days)" required hint="e.g. 7 for a one-week plan. The plan expires this many days after it is activated.">
            <TextInput required type="number" min="1" max="3650" value={form.durationDays}
              onChange={(e) => setForm({ ...form, durationDays: e.target.value })} />
          </Field>
        )}
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

        {/* Who can get this plan. Distinct from Deactivate, which retires it for everyone. */}
        <div className="rounded-xl border border-line/[0.08] bg-overlay/[0.02] p-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-fg">
            <input type="checkbox" checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--primary))]" />
            List this plan to owners
          </label>
          <p className="mt-1 text-xs text-subtle">
            {isPublic
              ? "Owners can see this plan and choose it themselves."
              : "Hidden: owners can't see or choose this plan — you assign it from their account page. Anyone already on it keeps seeing it so they can renew."}
          </p>

          <label className="mt-3 flex cursor-pointer items-center gap-2 border-t border-line/[0.06] pt-3 text-sm font-semibold text-fg">
            <input type="checkbox" checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--primary))]" />
            Owners can renew this plan
          </label>
          <p className="mt-1 text-xs text-subtle">
            {isRecurring
              ? "Owners can take this plan again whenever they like."
              : "One-time: an owner can take this plan once — use it for a trial. When it ends they drop to the free plan and must choose a different one. You can still re-assign it yourself."}
          </p>
        </div>

        {/* Add-on modules bundled with this plan. Anyone on the plan gets them straight away,
            with no per-owner grant needed. */}
        <div className="rounded-xl border border-line/[0.08] bg-overlay/[0.02] p-4">
          {editingFreeTier ? (
            <div className="text-sm text-muted">
              <div className="font-semibold text-fg">Add-on modules</div>
              <p className="mt-1 text-xs">
                The Free plan can&apos;t include paid modules — it&apos;s also what owners with no plan
                fall back to, so anything bundled here would reach all of them. Grant modules to
                individual owners from their account page instead.
              </p>
            </div>
          ) : (
            <>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-fg">
                <input type="checkbox" checked={addonsOn}
                  onChange={(e) => setAddonsOn(e.target.checked)}
                  className="h-4 w-4 accent-[rgb(var(--primary))]" />
                This plan includes add-on modules
              </label>
              <p className="mt-1 text-xs text-subtle">
                Owners on this plan get these without needing an individual grant.
              </p>
              {addonsOn && (
                <div className="mt-3 space-y-2 border-t border-line/[0.06] pt-3">
                  {PLAN_ADDONS.map((a) => (
                    <label key={a.key} className="flex cursor-pointer items-center gap-2 text-sm text-fg">
                      <input type="checkbox" checked={addons.includes(a.key)}
                        onChange={() => toggleAddon(a.key)}
                        className="h-4 w-4 accent-[rgb(var(--primary))]" />
                      {ADDON_ICONS[a.key]}
                      {a.label}
                    </label>
                  ))}
                  {addons.length === 0 && (
                    <p className="text-xs text-warning">Pick at least one module, or untick the box above.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <Button type="submit" loading={saving} className="w-full">{isEdit ? "Save changes" : "Create plan"}</Button>
      </form>
    </Modal>
  );
}

/* ============================================================ ADMIN SETTINGS TAB */
function AdminSettingsTab() {
  return (
    <div className="space-y-8">
      <PageHeader title="Settings" subtitle="Platform controls and this device's preferences." />
      <OwnerProfileCard />
      <AnnouncementCard />
      <MaintenanceCard />
      <BrevoConfigCard />
      <AnalyticsConfigCard />
      {/* NB: AppSettingsCard is this DEVICE's push/update preferences — despite the name it
          has nothing to do with the app_settings table the two cards above write to. */}
      <AppSettingsCard />
    </div>
  );
}

/**
 * Brevo transactional email. Connecting an account here is what makes the app send mail at all —
 * before this it sent none, and password recovery leaned on Supabase's built-in sender.
 *
 * THE API KEY IS WRITE-ONLY. The GET route returns `xkeysib-…4f2a` and a boolean, never the key,
 * so the field below shows a preview as its placeholder and sends "" to mean "leave it alone".
 * That is the one thing to keep in mind if this card is ever edited: an empty key field is not a
 * request to clear the key.
 */
interface BrevoConfigView {
  enabled: boolean;
  senderEmail: string;
  senderName: string;
  replyTo: string;
  hasApiKey: boolean;
  apiKeyPreview: string;
  encryptionReady: boolean;
}

function BrevoConfigCard() {
  const [cfg, setCfg] = useState<BrevoConfigView | null>(null);
  const [apiKey, setApiKey] = useState("");     // always starts blank — see above
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testTo, setTestTo] = useState("");

  function adopt(d: BrevoConfigView) {
    setCfg(d);
    setSenderEmail(d.senderEmail || "");
    setSenderName(d.senderName || "");
    setReplyTo(d.replyTo || "");
    setEnabled(!!d.enabled);
    setApiKey("");
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await rentMasterFetch<{ data: BrevoConfigView }>(
          "/api/super-admin/brevo-config", { role: "admin" });
        adopt(res.data);
      } catch { /* leave the defaults — the form still saves */ }
      finally { setLoading(false); }
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await rentMasterFetch<{ data: BrevoConfigView; message: string }>(
        "/api/super-admin/brevo-config",
        {
          method: "PUT", role: "admin",
          body: JSON.stringify({ apiKey, senderEmail, senderName, replyTo, enabled }),
        },
      );
      adopt(res.data);
      toast.success(res.message);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function sendTest() {
    const to = testTo.trim();
    const parsed = validateEmail(to, { required: true });
    if (!parsed.ok) { toast.error(parsed.error!); return; }
    try {
      setTesting(true);
      const res = await rentMasterFetch<{ message: string }>(
        "/api/super-admin/brevo-config",
        { method: "POST", role: "admin", body: JSON.stringify({ to }) },
      );
      toast.success(res.message);
    } catch (e: any) { toast.error(e.message); }
    finally { setTesting(false); }
  }

  if (loading) return <Card className="flex items-center justify-center p-8"><Spinner /></Card>;

  return (
    <Card className="p-6">
      <h3 className="text-sm font-bold text-fg">Email (Brevo)</h3>
      <p className="mt-1 text-xs text-subtle">
        Connect a Brevo account to send account-creation, password-change and password-reset
        emails. While this is off, password resets fall back to Supabase's built-in sender and no
        other email is sent at all.
      </p>

      {cfg && !cfg.encryptionReady && (
        <div className="mt-4">
          <Alert>
            NID_ENCRYPTION_KEY is not set on the server, so an API key cannot be stored securely.
            Set it in the backend environment before connecting Brevo.
          </Alert>
        </div>
      )}

      <form onSubmit={save} className="mt-4 max-w-lg space-y-4">
        <Field
          label="API key"
          hint={cfg?.hasApiKey
            ? "A key is stored. Leave this blank to keep it, or paste a new one to replace it."
            : "From Brevo → SMTP & API → API keys. Starts with xkeysib-."}
        >
          <TextInput
            type="password"
            value={apiKey}
            placeholder={cfg?.hasApiKey ? cfg.apiKeyPreview : "xkeysib-…"}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
          />
        </Field>

        <Field label="Sender email" hint="Must be a verified sender on your Brevo account, or every send is rejected.">
          <TextInput
            value={senderEmail}
            placeholder="no-reply@bari360.space"
            onChange={(e) => setSenderEmail(e.target.value)}
          />
        </Field>

        <Field label="Sender name" hint="The name recipients see in their inbox.">
          <TextInput value={senderName} placeholder="Bari360" onChange={(e) => setSenderName(e.target.value)} />
        </Field>

        <Field label="Reply-to address" hint="Optional. Where replies go if it isn't the sender address.">
          <TextInput value={replyTo} placeholder="support@bari360.space" onChange={(e) => setReplyTo(e.target.value)} />
        </Field>

        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 accent-[rgb(var(--primary))]"
          />
          Send emails through Brevo
        </label>

        <Button type="submit" loading={saving} icon={Mail}>Save email settings</Button>
      </form>

      {cfg?.hasApiKey && (
        <div className="mt-6 border-t border-line/[0.08] pt-5">
          <p className="text-xs text-subtle">
            Send a test message. This is the only way to find out whether your sender address is
            actually verified — Brevo accepts the settings and rejects the send.
          </p>
          <div className="mt-3 flex max-w-lg flex-wrap items-center gap-2">
            <div className="min-w-[220px] flex-1">
              <TextInput
                value={testTo}
                placeholder="you@example.com"
                onChange={(e) => setTestTo(e.target.value)}
              />
            </div>
            <Button variant="ghost" loading={testing} onClick={sendTest}>Send test</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Google Analytics wiring, so the IDs can be changed without a redeploy. The public
 * /api/app/analytics-config route serves these to every client, and components/analytics-gate.tsx
 * loads the Google tag when a surface is enabled.
 *
 * IDs only — there is deliberately no "paste your snippet" box. Arbitrary script stored here
 * would be injected into every page of the app for whoever holds the admin account.
 */
function AnalyticsConfigCard() {
  const [ga, setGa] = useState("");
  const [gtm, setGtm] = useState("");
  const [web, setWeb] = useState(false);
  const [app, setApp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await rentMasterFetch<{ data: {
          gaMeasurementId: string; gtmContainerId: string; enabledWeb: boolean; enabledApp: boolean;
        } }>("/api/super-admin/analytics-config", { role: "admin" });
        setGa(res.data.gaMeasurementId || "");
        setGtm(res.data.gtmContainerId || "");
        setWeb(!!res.data.enabledWeb);
        setApp(!!res.data.enabledApp);
      } catch { /* leave the defaults — the form still saves */ }
      finally { setLoading(false); }
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await rentMasterFetch<{ message: string }>("/api/super-admin/analytics-config", {
        method: "PUT", role: "admin",
        body: JSON.stringify({ gaMeasurementId: ga, gtmContainerId: gtm, enabledWeb: web, enabledApp: app }),
      });
      toast.success(res.message);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  if (loading) return <Card className="flex items-center justify-center p-8"><Spinner /></Card>;

  return (
    <Card className="p-6">
      <h3 className="text-sm font-bold text-fg">Google Analytics</h3>
      <p className="mt-1 text-xs text-subtle">
        Paste the IDs from your Google Analytics or Tag Manager account. Changes apply on the
        next page load — no redeploy needed.
      </p>
      <form onSubmit={save} className="mt-4 max-w-lg space-y-4">
        <Field label="GA4 measurement ID" hint="Looks like G-XXXXXXXXXX. Leave blank to turn GA4 off.">
          <TextInput value={ga} placeholder="G-XXXXXXXXXX"
            onChange={(e) => setGa(e.target.value.toUpperCase())} />
        </Field>
        <Field label="Tag Manager container ID" hint="Looks like GTM-XXXXXXX. Optional.">
          <TextInput value={gtm} placeholder="GTM-XXXXXXX"
            onChange={(e) => setGtm(e.target.value.toUpperCase())} />
        </Field>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-fg">
            <input type="checkbox" checked={web} onChange={(e) => setWeb(e.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--primary))]" />
            Track the website / installed PWA
          </label>
          <label className="flex items-center gap-2 text-sm text-fg">
            <input type="checkbox" checked={app} onChange={(e) => setApp(e.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--primary))]" />
            Track inside the Android app
          </label>
        </div>
        <Button type="submit" loading={saving} icon={BarChart3}>Save analytics settings</Button>
      </form>
    </Card>
  );
}

/**
 * System maintenance window. While it is on, every owner and tenant gets a blocking modal on
 * app open (components/maintenance-gate.tsx). The admin is never blocked — otherwise turning
 * it back off would need a database edit.
 */
/* ============================================================ ANNOUNCEMENT CARD */
// One announcement at a time, shown to every owner and tenant on app open while it is switched on.
// The admin is deliberately never shown it themselves (components/announcement-gate.tsx skips
// role 'admin') — that is what guarantees they can always reach this card to switch it back off.
// The Preview button below renders the real AnnouncementModal, so what is previewed cannot drift
// from what ships.
function AnnouncementCard() {
  const EMPTY: Announcement = { enabled: false, title: "", body: "", imageUrl: null, updatedAt: "" };
  const [draft, setDraft] = useState<Announcement>(EMPTY);
  const [saved, setSaved] = useState<Announcement>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await rentMasterFetch<{ data: Announcement }>("/api/super-admin/announcement", { role: "admin" });
        if (res.data) { setDraft(res.data); setSaved(res.data); }
      } catch (e: any) { toast.error(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadFile(file, { role: "owner", folder: "announcements" });
      setDraft((d) => ({ ...d, imageUrl: url }));
      toast.success("Image uploaded — remember to Save.");
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  }

  async function save(nextEnabled = draft.enabled) {
    try {
      setSaving(true);
      const res = await rentMasterFetch<{ data: Announcement }>("/api/super-admin/announcement", {
        method: "PATCH", role: "admin",
        body: JSON.stringify({
          enabled: nextEnabled,
          title: draft.title,
          body: draft.body,
          imageUrl: draft.imageUrl,
        }),
      });
      setDraft(res.data);
      setSaved(res.data);
      toast.success(res.data.enabled ? "Announcement is showing." : "Announcement is hidden.");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary"><Megaphone className="h-4 w-4" /></div>
          <div>
            <h3 className="text-sm font-bold text-heading">Announcement popup</h3>
            <p className="text-xs text-subtle">
              Owners and tenants see this every time they open the app, until you hide it. You never see it — use Preview.
            </p>
          </div>
        </div>
        <Badge tone={saved.enabled ? "emerald" : "slate"}>{saved.enabled ? "Showing" : "Hidden"}</Badge>
      </div>

      {loading ? (
        <p className="text-sm text-subtle">Loading…</p>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <Field label="Title" hint="Leave the title and details blank to show only the image.">
                <TextInput maxLength={120} value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder="e.g. Eid holiday support hours" />
              </Field>
              <Field label="Details">
                <TextArea rows={5} maxLength={1000} value={draft.body}
                  onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                  placeholder="What you want everyone to know." />
              </Field>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-bold text-fg">Image</div>
              <div className="flex items-center justify-center rounded-xl border border-dashed border-line/[0.12] bg-overlay/[0.02] p-4">
                {draft.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={draft.imageUrl} alt="Announcement" className="max-h-52 w-full rounded-lg object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-subtle">
                    <ImageIcon className="h-10 w-10" />
                    <span className="text-xs">No image uploaded yet</span>
                  </div>
                )}
              </div>
              <label className="block">
                <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
                <span className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-line/[0.1] bg-overlay/[0.03] px-4 py-2.5 text-sm font-semibold text-fg transition hover:bg-overlay/[0.06]">
                  {uploading ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                  {draft.imageUrl ? "Replace image" : "Upload image"}
                </span>
              </label>
              {draft.imageUrl && (
                <Button type="button" variant="secondary" icon={Trash2} className="w-full"
                  onClick={() => setDraft((d) => ({ ...d, imageUrl: null }))}>
                  Remove image
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="secondary" loading={saving}>Save announcement</Button>
            <Button type="button" variant="secondary" icon={Eye} onClick={() => setPreviewing(true)}>Preview</Button>
            {saved.enabled ? (
              <Button type="button" variant="danger" icon={EyeOff} loading={saving} onClick={() => save(false)}>
                Hide it
              </Button>
            ) : (
              <Button type="button" icon={Power} loading={saving} onClick={() => save(true)}>
                Show it
              </Button>
            )}
          </div>
          <p className="text-xs text-subtle">
            Saving publishes immediately while it is showing. Everyone sees the popup again the next time they open the app.
          </p>
        </form>
      )}

      {previewing && <AnnouncementModal announcement={draft} onClose={() => setPreviewing(false)} />}
    </Card>
  );
}

function MaintenanceCard() {
  const [mode, setMode] = useState<MaintenanceMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // The <input type="datetime-local"> value is local wall-clock with no zone; the API stores
  // UTC ISO. These two convert between them without dragging in a date library.
  function toLocalInput(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function fromLocalInput(value: string): string | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  const [enabled, setEnabled] = useState(false);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await rentMasterFetch<{ data: MaintenanceMode }>("/api/super-admin/maintenance", { role: "admin" });
        const m = res.data;
        setMode(m);
        setEnabled(!!m.enabled);
        setStartAt(toLocalInput(m.startAt));
        setEndAt(toLocalInput(m.endAt));
        setMessage(m.message || "");
      } catch (e: any) { toast.error(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  async function save(nextEnabled = enabled) {
    try {
      setSaving(true);
      const res = await rentMasterFetch<{ data: MaintenanceMode }>("/api/super-admin/maintenance", {
        method: "PATCH", role: "admin",
        body: JSON.stringify({
          enabled: nextEnabled,
          startAt: fromLocalInput(startAt),
          endAt: fromLocalInput(endAt),
          message,
        }),
      });
      setMode(res.data);
      setEnabled(!!res.data.enabled);
      toast.success(res.data.enabled ? "Maintenance mode is ON." : "Maintenance mode is off.");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-warning/10 p-2 text-warning"><Wrench className="h-4 w-4" /></div>
          <div>
            <h3 className="text-sm font-bold text-heading">System maintenance</h3>
            <p className="text-xs text-subtle">
              Owners and tenants see a blocking notice on app open. You are never blocked.
            </p>
          </div>
        </div>
        <Badge tone={mode?.enabled ? "rose" : "emerald"}>{mode?.enabled ? "ON" : "Off"}</Badge>
      </div>

      {loading ? (
        <p className="text-sm text-subtle">Loading…</p>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="From" hint="Shown to users. Leave blank for “until further notice”.">
              <TextInput type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </Field>
            <Field label="To">
              <TextInput type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </Field>
          </div>
          <Field label="Message" hint="Leave blank for the default wording.">
            <TextArea rows={3} value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. We're upgrading the billing engine. The app will be back shortly." />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="secondary" loading={saving}>Save window</Button>
            {mode?.enabled ? (
              <Button type="button" variant="secondary" icon={Power} loading={saving} onClick={() => save(false)}>
                Turn maintenance off
              </Button>
            ) : (
              <Button type="button" variant="danger" icon={Power} loading={saving} onClick={() => save(true)}>
                Turn maintenance on
              </Button>
            )}
          </div>
        </form>
      )}
    </Card>
  );
}

/* ============================================================ CIRCULATE TAB */

// The audiences the super-admin can address, in the order they're offered.
const CIRCULATE_AUDIENCES: { scope: NoticeScope; label: string; hint: string }[] = [
  { scope: "everyone", label: "Owners and tenants", hint: "everyone on the platform" },
  { scope: "all_owners", label: "All owners", hint: "every owner account" },
  { scope: "all_tenants", label: "All tenants", hint: "every tenant on the platform" },
  { scope: "individual_owner", label: "A specific owner", hint: "one owner account" },
];

type CirculateMode = "notice" | "welcome";

function CirculateModeSwitch({ mode, onChange }: { mode: CirculateMode; onChange: (m: CirculateMode) => void }) {
  const tabs: { key: CirculateMode; label: string; hint: string }[] = [
    { key: "notice", label: "One-off notice", hint: "Announce something to a chosen audience" },
    { key: "welcome", label: "Welcome new users", hint: "Greet people who joined recently" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)} title={t.hint}
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-semibold transition",
            mode === t.key ? "bg-primary text-btn-ink" : "bg-overlay/[0.04] text-muted hover:text-fg"
          )}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Welcome broadcast. Manual only — the admin sends it when they choose; there is no cron.
 *
 * Every send is recorded server-side, so already-welcomed people are skipped and pressing
 * Send twice does not double-message anyone. The count is fetched as a dry run first, so the
 * blast radius is visible on the button before anything goes out.
 */
function WelcomePanel() {
  const AUDIENCES = [
    { key: "both", label: "New owners and tenants" },
    { key: "new_owners", label: "New owners only" },
    { key: "new_tenants", label: "New tenants only" },
  ];
  const WINDOWS = [
    { key: "7", label: "Joined in the last 7 days" },
    { key: "30", label: "Joined in the last 30 days" },
    { key: "0", label: "Anyone never welcomed" },
  ];

  const [audience, setAudience] = useState("both");
  const [days, setDays] = useState("7");
  const [title, setTitle] = useState("Welcome to Bari360 👋");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState<{ count: number; dedupeAvailable: boolean } | null>(null);
  const [checking, setChecking] = useState(true);
  const [sending, setSending] = useState(false);

  // Dry run whenever the audience changes, so the button always states the real reach.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setChecking(true);
        const res = await rentMasterFetch<{ count: number; dedupeAvailable: boolean }>(
          `/api/super-admin/welcome?audience=${audience}&days=${days}`, { role: "admin" });
        if (!cancelled) setPreview({ count: res.count, dedupeAvailable: res.dedupeAvailable });
      } catch {
        if (!cancelled) setPreview(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [audience, days]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!(await confirmDialog({
      title: "Send welcome message?",
      message: `This sends an in-app notice and a push notification to ${preview?.count ?? 0} user${preview?.count === 1 ? "" : "s"}.`,
      confirmLabel: "Send",
    }))) return;
    try {
      setSending(true);
      const res = await rentMasterFetch<{ message: string }>("/api/super-admin/welcome", {
        method: "POST", role: "admin",
        body: JSON.stringify({ title, content, audience, days: Number(days) }),
      });
      toast.success(res.message);
      setContent("");
      setPreview((p) => (p ? { ...p, count: 0 } : p));
    } catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  }

  const count = preview?.count ?? 0;

  return (
    <Card className="max-w-2xl p-6">
      <form onSubmit={send} className="space-y-4">
        <Field label="Who to welcome" required>
          <Select value={audience} onChange={(e) => setAudience(e.target.value)}>
            {AUDIENCES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
          </Select>
        </Field>
        <Field label="How recently they joined" required
          hint="People who have already been welcomed are always skipped, so sending again is safe.">
          <Select value={days} onChange={(e) => setDays(e.target.value)}>
            {WINDOWS.map((w) => <option key={w.key} value={w.key}>{w.label}</option>)}
          </Select>
        </Field>

        {preview && !preview.dedupeAvailable && (
          <Alert>
            The welcome log table is missing, so already-welcomed users cannot be skipped and a
            second send would message people twice. Run <code>ADD_PRESENCE.sql</code> first.
          </Alert>
        )}

        <Field label="Title" required>
          <TextInput required value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Message" required>
          <TextArea required rows={5} placeholder="Write the welcome message…"
            value={content} onChange={(e) => setContent(e.target.value)} />
        </Field>

        <Button type="submit" loading={sending} icon={Megaphone} className="w-full"
          disabled={checking || count === 0}>
          {checking ? "Checking who's new…"
            : count === 0 ? "Nobody new to welcome"
            : `Send welcome to ${count} user${count === 1 ? "" : "s"}`}
        </Button>
        <p className="text-center text-xs text-subtle">
          Sends an in-app notice and a push notification.
        </p>
      </form>
    </Card>
  );
}

function CirculateTab({ owners }: { owners: AdminOwner[] }) {
  const [mode, setMode] = useState<CirculateMode>("notice");
  const [form, setForm] = useState<{
    scope: NoticeScope; targetOwnerId: string; title: string; content: string;
  }>({ scope: "everyone", targetOwnerId: "", title: "", content: "" });
  const [saving, setSaving] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const audience = CIRCULATE_AUDIENCES.find((a) => a.scope === form.scope)!;
  const selectedOwner = owners.find((o) => o.id === form.targetOwnerId);
  const audienceLabel =
    form.scope === "individual_owner"
      ? selectedOwner ? (selectedOwner.name || selectedOwner.email) : "the selected owner"
      : audience.hint;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.scope === "individual_owner" && !form.targetOwnerId) {
      toast.error("Choose which owner should receive this notice.");
      return;
    }
    try {
      setSaving(true);
      const res = await rentMasterFetch("/api/admin/notices", {
        method: "POST", role: "admin",
        body: JSON.stringify({
          senderType: "system_admin",
          targetScope: form.scope,
          targetOwnerId: form.scope === "individual_owner" ? form.targetOwnerId : null,
          title: form.title, content: form.content,
        }),
      });
      if (res.success) {
        setSentTo(audienceLabel);
        setForm({ ...form, title: "", content: "" });
        toast.success(`Notice circulated to ${audienceLabel}.`);
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  if (mode === "welcome") {
    return (
      <div className="space-y-6">
        <PageHeader title="Circulate" subtitle="Broadcast an announcement, or welcome the people who just joined." />
        <CirculateModeSwitch mode={mode} onChange={setMode} />
        <WelcomePanel />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Circulate" subtitle="Broadcast an announcement, or welcome the people who just joined." />
      <CirculateModeSwitch mode={mode} onChange={setMode} />
      {sentTo && (
        <Alert>
          Notice circulated to {sentTo}.{" "}
          <button className="underline" onClick={() => setSentTo(null)}>Send another</button>
        </Alert>
      )}
      <Card className="max-w-2xl p-6">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Send to" required>
            <Select value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value as NoticeScope, targetOwnerId: "" })}>
              {CIRCULATE_AUDIENCES.map((a) => (
                <option key={a.scope} value={a.scope}>{a.label}</option>
              ))}
            </Select>
          </Field>

          {form.scope === "individual_owner" && (
            <Field label="Owner" required hint="Only this owner sees the notice — their tenants do not.">
              <Select required value={form.targetOwnerId}
                onChange={(e) => setForm({ ...form, targetOwnerId: e.target.value })}>
                <option value="">Choose an owner…</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name ? `${o.name} — ${o.email}` : o.email}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Title" required>
            <TextInput required placeholder="e.g. Scheduled maintenance window" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Message" required>
            <TextArea required rows={5} placeholder="Write your announcement…" value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </Field>
          <Button type="submit" loading={saving} icon={Inbox} className="w-full">
            Circulate to {audienceLabel}
          </Button>
        </form>
      </Card>
    </div>
  );
}

/* ============================================================ CREATE OWNER */
function CreateOwnerModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const empty = { email: "", pass: "", name: "", phone: "", role: "owner", buildingName: "" };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const isBuildingAdmin = form.role === "building_admin";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsedEmail = validateEmail(form.email, { required: true });
    if (!parsedEmail.ok) { toast.error(parsedEmail.error); return; }
    const parsedPhone = validatePhone(form.phone);
    if (!parsedPhone.ok) { toast.error(parsedPhone.error); return; }
    // Same floor the public signup enforces. This path used to accept any password at all,
    // which meant the weakest accounts in the system were the ones an admin created.
    if (form.pass.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    try {
      setSaving(true);
      const res = await rentMasterFetch("/api/super-admin/owners", {
        method: "POST", role: "admin",
        body: JSON.stringify({ ...form, email: parsedEmail.value, phone: parsedPhone.value }),
      });
      if (res.success) {
        setForm(empty);
        onCreated();
        onClose();
        // The backend creates the building and assigns the Whole Building plan best-effort, and
        // reports anything it could not finish. Surfacing those is the difference between "the
        // account exists" and "the account works".
        if (res.warnings?.length) res.warnings.forEach((w: string) => toast.warning(w));
        else toast.success(isBuildingAdmin ? "Building admin account created." : "Owner account created.");
      }
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
          <EmailField label="Email" required value={form.email}
            onChange={(v) => setForm({ ...form, email: v })} />
          <PhoneField label="Phone" value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Temporary password" required hint="At least 8 characters.">
            <TextInput required minLength={8} value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="owner">Owner</option>
              <option value="building_admin">Building Admin</option>
              <option value="admin">Admin</option>
            </Select>
          </Field>
        </div>
        {isBuildingAdmin && (
          <Field
            label="Building name"
            required
            hint="Their building is created with this name and put on the Whole Building plan. They can edit the address and letterhead themselves."
          >
            <TextInput required value={form.buildingName}
              onChange={(e) => setForm({ ...form, buildingName: e.target.value })} />
          </Field>
        )}
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
        // No durationDays: the server derives the tenure from the tier itself. This used to
        // hardcode 30, so assigning a yearly plan gave the owner a month.
        body: JSON.stringify({ ownerId, tierId, amountPaid: tier ? discountedPrice(tier) : 0 }),
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
        <p className="py-8 text-center text-sm text-muted">Loading…</p>
      ) : (
        <div className="space-y-6">
          {/* Status + stats */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={detail.suspended ? "rose" : "emerald"}>{detail.suspended ? "Suspended" : "Active"}</Badge>
            {detail.permissions_revoked && <Badge tone="amber">Permissions revoked</Badge>}
            <Badge tone={detail.role === "admin" ? "amber" : "slate"}>{detail.role}</Badge>
            <span className="ml-auto text-xs text-subtle">Joined {formatDate(detail.created_at)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat icon={Building2} label="Properties" value={detail.propertyCount} />
            <MiniStat icon={Users} label="Tenants" value={detail.tenantCount} />
          </div>

          {/* Presence. `last_sign_in_at` has been on this payload all along but was never
              shown anywhere; `online` / devices come from the heartbeat. */}
          <Section title="Activity">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Status</span>
                <PresenceCell online={detail.online} lastSeenAt={detail.last_seen_at} lastSignInAt={detail.last_sign_in_at} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Last signed in</span>
                <span className="text-fg">
                  {detail.last_sign_in_at ? formatDateTime(detail.last_sign_in_at) : "Never"}
                </span>
              </div>
              {detail.devices && detail.devices.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted">
                    Devices ({detail.devices.length})
                  </div>
                  {detail.devices.map((d) => (
                    <div key={d.deviceId}
                      className="flex items-center justify-between rounded-lg border border-line/[0.06] bg-overlay/[0.02] px-3 py-2">
                      <span className="flex items-center gap-2 text-xs font-semibold text-fg">
                        {d.platform === "android"
                          ? <Smartphone className="h-3.5 w-3.5 text-success" />
                          : <Globe className="h-3.5 w-3.5 text-muted" />}
                        {d.platform === "android" ? "Android app" : "Web browser"}
                      </span>
                      <span className="text-xs text-subtle">
                        {d.online ? "Online now" : timeAgo(d.lastSeenAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="pt-1 text-xs text-faint">
                  No device activity recorded yet. (Requires ADD_PRESENCE.sql.)
                </p>
              )}
            </div>
          </Section>

          {/* Edit details */}
          <Section title="Details">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name"><TextInput value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <PhoneField label="Phone" value={edit.phone} onChange={(v) => setEdit({ ...edit, phone: v })} />
            </div>
            <Button size="sm" variant="secondary" loading={busy} onClick={() => {
              const parsed = validatePhone(edit.phone);
              if (!parsed.ok) { toast.error(parsed.error); return; }
              patch({ name: edit.name, phone: parsed.value });
            }}>Save details</Button>
          </Section>

          {/* Subscription */}
          <Section title="Subscription">
            {detail.subscription?.status === "active" ? (
              <div className="flex items-center justify-between rounded-lg border border-line/[0.06] bg-overlay/[0.02] px-3 py-2 text-sm">
                <span className="text-fg">
                  {detail.subscription.subscription_tiers?.name || detail.subscription.tier_id}
                  {/* A null expiry means a perpetual (free) plan — it is no longer written as a
                      far-future sentinel date, which is what used to render as "2126". */}
                  <span className="ml-2 text-xs text-subtle">
                    {detail.subscription.expiry_date ? `exp ${formatDate(detail.subscription.expiry_date)}` : "never expires"}
                  </span>
                </span>
                <Button size="sm" variant="danger" loading={busy} onClick={() => patch({ action: "cancel_subscription" })}>Cancel</Button>
              </div>
            ) : (
              <p className="text-xs text-subtle">No active plan.</p>
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

          {/* Paid add-ons */}
          <Section title="Add-ons">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-fg">
                    <HardHat className="h-4 w-4 text-subtle" /> Staff management
                  </div>
                  <div className="mt-0.5 text-xs text-subtle">
                    {detail.staff_included_in_plan
                      ? "Included with this owner's plan — no override needed."
                      : detail.staff_addon
                        ? `Granted as an add-on${detail.staff_addon_granted_at ? ` on ${formatDate(detail.staff_addon_granted_at)}` : ""}.`
                        : "Not enabled. Turn on once the owner has bought the add-on."}
                  </div>
                </div>
                {detail.staff_included_in_plan ? (
                  <Badge tone="emerald">Included in plan</Badge>
                ) : (
                  <Button size="sm" variant={detail.staff_addon ? "secondary" : "success"}
                    icon={detail.staff_addon ? ShieldOff : ShieldCheck} loading={busy}
                    onClick={() => patch({ action: detail.staff_addon ? "disable_staff_addon" : "enable_staff_addon" })}>
                    {detail.staff_addon ? "Disable Staff" : "Enable Staff"}
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-line/[0.06] pt-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-fg">
                    <Wallet className="h-4 w-4 text-subtle" /> Accounts &amp; bookkeeping
                  </div>
                  <div className="mt-0.5 text-xs text-subtle">
                    {detail.accounts_included_in_plan
                      ? "Included with this owner's plan — no override needed."
                      : detail.accounts_addon
                        ? `Granted as an add-on${detail.accounts_addon_granted_at ? ` on ${formatDate(detail.accounts_addon_granted_at)}` : ""}.`
                        : "Not enabled. Turn on once the owner has bought the add-on."}
                  </div>
                </div>
                {detail.accounts_included_in_plan ? (
                  <Badge tone="emerald">Included in plan</Badge>
                ) : (
                  <Button size="sm" variant={detail.accounts_addon ? "secondary" : "success"}
                    icon={detail.accounts_addon ? ShieldOff : ShieldCheck} loading={busy}
                    onClick={() => patch({ action: detail.accounts_addon ? "disable_accounts_addon" : "enable_accounts_addon" })}>
                    {detail.accounts_addon ? "Disable Accounts" : "Enable Accounts"}
                  </Button>
                )}
              </div>
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
                onClick={async () => {
                  // The counts are already on `detail` here — spell out the blast radius,
                  // since deleting an owner cascades through everything they own.
                  const p = detail.propertyCount ?? 0, t = detail.tenantCount ?? 0;
                  const scope = (p || t)
                    ? ` This also permanently deletes ${p} propert${p === 1 ? "y" : "ies"} and ${t} tenant${t === 1 ? "" : "s"}, with all their invoices, documents and records.`
                    : "";
                  if (await confirmDialog({ title: "Delete account?", message: `Delete this account permanently?${scope} This cannot be undone.`, confirmLabel: "Delete", danger: true })) deleteThis();
                }}>
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
    <div className="space-y-2 rounded-xl border border-line/[0.06] bg-overlay/[0.02] p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-subtle">{title}</div>
      {children}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line/[0.06] bg-overlay/[0.02] p-3">
      <div className="rounded-lg bg-overlay/[0.04] p-2 text-warning"><Icon className="h-4 w-4" /></div>
      <div>
        <div className="text-lg font-black text-heading">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-subtle">{label}</div>
      </div>
    </div>
  );
}
