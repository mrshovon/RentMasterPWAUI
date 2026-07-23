"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Building2, Users, ReceiptText, Wrench, Megaphone,
  Plus, MapPin, KeyRound, Phone, CircleDollarSign, Home, TriangleAlert,
  CheckCircle2, Send, Circle, Inbox, Pencil, DoorOpen, FileText, Trash2, Upload, Download, X, History,
  Receipt, PenLine, Gem, Crown, Sparkles, ArrowUpCircle, Infinity as InfinityIcon, CalendarClock, Copy, RotateCcw,
  LifeBuoy, MessageSquare, Lock, Settings, MessageCircle, HardHat, Wallet,
} from "lucide-react";
import { rentMasterFetch, uploadFile, DEMO_OWNER_ID } from "../../lib/api-service";
import { toast } from "../../components/toast";
import { confirmDialog } from "../../components/confirm";
import { buildReceiptHtml } from "../../lib/receipt";
import { ReceiptModal } from "../../components/receipt-modal";
import { resolveReceiptMessage } from "../../lib/whatsapp";
import { useSessionGuard } from "../../lib/use-session";
import { useTabState } from "../../lib/use-tab";
import { usePendingAction } from "../../lib/use-pending";
import {
  Property, Tenant, BillingLedger, MaintenanceLog, Notice,
  PaymentStatus, PriorityLevel, ResolutionStatus, Document, OccupancyHistory, RentRevision,
  PlanState, PlanUsage, SubscriptionResponse, SubscriptionTier,
  SupportTicket, TicketStatus, TicketCategory,
  PaymentSubmission, PaymentConfig,
  Reminder, ReminderRecurrence,
} from "../../types/api";
import { formatCurrency, formatMonth, formatDate, ordinalDay } from "../../lib/format";
import { DashboardShell, NavItem } from "../../components/shell";
import { AttachmentStrip } from "../../components/attachments";
import { StaffTab } from "../../components/staff-tab";
import { AccountsTab } from "../../components/accounts-tab";
import {
  Card, StatCard, Badge, Button, Modal, Field, TextInput, TextArea, Select,
  PageHeader, EmptyState, Alert, FullScreenLoader, SearchInput, Spinner,
} from "../../components/ui";

const priorityTone: Record<PriorityLevel, "slate" | "amber" | "rose"> = {
  low: "slate", medium: "amber", high: "rose", urgent: "rose",
};
const statusTone: Record<PaymentStatus, "emerald" | "amber" | "rose"> = {
  paid: "emerald", sent: "amber", unpaid: "rose",
};
const maintStatusTone: Record<ResolutionStatus, "amber" | "cyan" | "emerald"> = {
  reported: "amber", in_progress: "cyan", resolved: "emerald",
};
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

export default function OwnerDashboard() {
  const { session, checkingSession, logout } = useSessionGuard("owner");
  const { isPending, run } = usePendingAction();
  const [tab, setTab] = useTabState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [ledgers, setLedgers] = useState<BillingLedger[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [plan, setPlan] = useState<SubscriptionResponse | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Modals
  const [ticketOpen, setTicketOpen] = useState(false);
  const [propOpen, setPropOpen] = useState(false);
  const [tenantOpen, setTenantOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderTemplate, setReminderTemplate] = useState<string>("");
  const [editProp, setEditProp] = useState<Property | null>(null);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [chargeProp, setChargeProp] = useState<Property | null>(null);
  const [editMaint, setEditMaint] = useState<MaintenanceLog | null>(null);
  const [docsTenant, setDocsTenant] = useState<Tenant | null>(null);
  const [historyProp, setHistoryProp] = useState<Property | null>(null);
  const [ownerSignature, setOwnerSignature] = useState<string | null>(null);
  const [sigOpen, setSigOpen] = useState(false);
  const [whatsappTemplate, setWhatsappTemplate] = useState<string>("");
  const [receipt, setReceipt] = useState<{ html: string; phone: string | null; message: string } | null>(null);
  const [revealPasscode, setRevealPasscode] = useState<{ name: string; code: string } | null>(null);
  // Staff add-on enquiry (opened from the locked Staff tab).
  const [staffContactOpen, setStaffContactOpen] = useState(false);
  // Accounts add-on enquiry (opened from the locked Accounts tab).
  const [accountsContactOpen, setAccountsContactOpen] = useState(false);

  // Reset a tenant's login passcode (random; shown once). Passcodes are not derivable
  // from the phone number, so a fresh one must be generated and shared explicitly.
  async function resetTenantPasscode(t: Tenant) {
    if (!(await confirmDialog({
      title: "Reset passcode?",
      message: `Generate a new login passcode for ${t.name}? Their current passcode will stop working.`,
      confirmLabel: "Reset",
    }))) return;
    await run(`passcode:${t.id}`, async () => {
      try {
        const res = await rentMasterFetch<{ passcode?: string }>(`/api/admin/tenants/${t.id}`, {
          method: "PATCH", role: "owner", body: JSON.stringify({ resetPasscode: true }),
        });
        if (res.passcode) setRevealPasscode({ name: t.name, code: res.passcode });
        toast.success("Passcode reset.");
      } catch (e: any) { toast.error(e.message); }
    });
  }

  // Unassigned tenants can't reach the resident portal by default; this is the owner's
  // per-tenant exception. Optimistic with rollback, like setPaymentStatus below.
  async function toggleTenantLogin(t: Tenant) {
    const next = !t.allow_login_unassigned;
    const prev = tenants;
    setTenants((xs) => xs.map((x) => (x.id === t.id ? { ...x, allow_login_unassigned: next } : x)));
    try {
      await rentMasterFetch(`/api/admin/tenants/${t.id}`, {
        method: "PATCH", role: "owner",
        body: JSON.stringify({ allowLoginUnassigned: next }),
      });
      toast.success(next
        ? `${t.name} can sign in while unassigned.`
        : `${t.name} is blocked from signing in.`);
    } catch (e: any) {
      setTenants(prev); // rollback
      toast.error(`Could not update login access: ${e.message}`);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [p, t, b, m, n, s, rm] = await Promise.allSettled([
          rentMasterFetch("/api/admin/properties", { role: "owner" }),
          rentMasterFetch("/api/admin/tenants", { role: "owner" }),
          rentMasterFetch("/api/admin/billing", { role: "owner" }),
          rentMasterFetch("/api/admin/maintenance", { role: "owner" }),
          rentMasterFetch("/api/admin/notices", { role: "owner" }),
          rentMasterFetch("/api/admin/support-tickets", { role: "owner" }),
          rentMasterFetch("/api/admin/reminders", { role: "owner" }),
        ]);
        if (p.status === "fulfilled") setProperties(p.value.data || []);
        if (t.status === "fulfilled") setTenants(t.value.data || []);
        if (b.status === "fulfilled") setLedgers(b.value.data || []);
        if (m.status === "fulfilled") setMaintenance(m.value.data || []);
        if (n.status === "fulfilled") setNotices(n.value.data || []);
        if (s.status === "fulfilled") setTickets(s.value.data || []);
        if (rm.status === "fulfilled") setReminders(rm.value.data || []);
        const firstErr = [p, t, b, m, n, s].find((r) => r.status === "rejected");
        if (firstErr && firstErr.status === "rejected")
          setError((firstErr.reason as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load the owner's plan state (limits, expiry, lock status).
  async function loadPlan() {
    try {
      const res = await rentMasterFetch<SubscriptionResponse>("/api/admin/subscription", { role: "owner" });
      setPlan(res);
    } catch { /* non-fatal — plan tab shows a retry */ }
  }
  useEffect(() => { loadPlan(); }, []);

  // Client-side pre-check before opening create modals. The server enforces these
  // authoritatively too — this is a friendlier early exit that routes to the Plan tab.
  function planBlockReason(kind: "property" | "tenant"): string | null {
    if (!plan) return null; // not loaded yet — let the server decide
    const s = plan.subscription;
    if (s.status === "locked") {
      return s.lockReason === "revoked"
        ? "Your management permissions have been revoked by an administrator. Contact support to restore access."
        : "Your subscription has lapsed. Renew your plan to continue managing your properties.";
    }
    const u = kind === "property" ? plan.usage.properties : plan.usage.tenants;
    if (u.limit !== -1 && u.current >= u.limit) {
      return `You've reached your ${s.tierName} limit of ${u.limit} ${kind === "property" ? "properties" : "tenants"}. Upgrade your plan to add more.`;
    }
    return null;
  }
  function guardedOpen(kind: "property" | "tenant", open: () => void) {
    const reason = planBlockReason(kind);
    if (reason) { toast.warning(reason); setTab("plan"); return; }
    open();
  }

  // ---- Derived metrics ----
  const metrics = useMemo(() => {
    const occupied = properties.filter((p) => !p.is_vacant).length;
    const monthlyRevenue = tenants.reduce((s, t) => s + Number(t.monthly_rent || 0), 0);
    const outstanding = ledgers
      .filter((l) => l.payment_status !== "paid")
      .reduce((s, l) => s + Number(l.total_payable || 0), 0);
    const unpaidCount = ledgers.filter((l) => l.payment_status !== "paid").length;
    const openTickets = maintenance.filter((m) => m.resolution_status !== "resolved").length;
    const openSupport = tickets.filter((t) => t.status !== "done").length;
    const pendingReminders = reminders.filter((r) => r.status === "pending").length;
    return { occupied, monthlyRevenue, outstanding, unpaidCount, openTickets, openSupport, pendingReminders };
  }, [properties, tenants, ledgers, maintenance, tickets, reminders]);

  const nav: NavItem[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "properties", label: "Properties", icon: Building2, badge: properties.length },
    { key: "tenants", label: "Tenants", icon: Users, badge: tenants.length },
    { key: "billing", label: "Billing", icon: ReceiptText, badge: metrics.unpaidCount },
    { key: "maintenance", label: "Requests", icon: Wrench, badge: metrics.openTickets },
    { key: "notices", label: "Notices", icon: Megaphone },
    { key: "reminders", label: "Reminders", icon: CalendarClock, badge: metrics.pendingReminders },
    // Always listed: when the add-on is off the tab explains the feature rather than hiding it.
    { key: "staff", label: "Staff", icon: HardHat },
    { key: "accounts", label: "Accounts", icon: Wallet },
    { key: "plan", label: "Plan", icon: Gem },
    { key: "support", label: "Support", icon: LifeBuoy, badge: metrics.openSupport },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  // ---- Status mutation (PATCH) ----
  async function setPaymentStatus(id: string, paymentStatus: PaymentStatus) {
    const prev = ledgers;
    setLedgers((ls) => ls.map((l) => (l.id === id ? { ...l, payment_status: paymentStatus } : l)));
    try {
      await rentMasterFetch(`/api/admin/billing/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus }),
        role: "owner",
      });
      toast.success(`Invoice marked ${paymentStatus}.`);
    } catch (e: any) {
      setLedgers(prev); // rollback
      toast.error(`Status update failed: ${e.message}`);
    }
  }

  // Load the owner's saved signature (from auth metadata) for receipts.
  useEffect(() => {
    (async () => {
      try {
        const res = await rentMasterFetch("/api/admin/owner/signature", { role: "owner" });
        setOwnerSignature(res.signatureUrl || null);
      } catch { /* ignore */ }
    })();
  }, []);

  // Load the owner's message templates (WhatsApp receipt + rent reminder) from Settings/auth metadata.
  const loadWhatsappTemplate = async () => {
    try {
      const res = await rentMasterFetch<{ whatsappMessageTemplate: string | null; reminderMessageTemplate: string | null }>(
        "/api/admin/owner/settings", { role: "owner" });
      setWhatsappTemplate(res.whatsappMessageTemplate || "");
      setReminderTemplate(res.reminderMessageTemplate || "");
    } catch { /* non-fatal — Settings tab shows an empty field */ }
  };
  useEffect(() => { loadWhatsappTemplate(); }, []);

  // Reload just the reminders list (after create/cancel/delete).
  const loadReminders = async () => {
    try {
      const res = await rentMasterFetch<{ data: Reminder[] }>("/api/admin/reminders", { role: "owner" });
      setReminders(res.data || []);
    } catch { /* non-fatal */ }
  };

  // Build an "Owner Copy" receipt (paid OR due) and open the preview, ready to share via WhatsApp.
  function openOwnerReceipt(l: BillingLedger) {
    const t = tenants.find((x) => x.id === l.tenant_id);
    const prop = properties.find((p) => p.id === l.property_id);
    const tenantName = l.tenants?.name || t?.name || "Tenant";
    const html = buildReceiptHtml({
      copyLabel: "Owner Copy",
      ownerName: session?.name || "Owner",
      propertyAddress: prop?.address || null,
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
      dueDay: t?.due_date,
      note: l.extra_charge_remarks,
      signatureUrl: ownerSignature,
    });
    const message = resolveReceiptMessage(whatsappTemplate, {
      tenant: tenantName,
      month: formatMonth(l.billing_month),
      amount: formatCurrency(l.total_payable),
      status: l.payment_status,
      property: prop?.name || "",
    });
    setReceipt({ html, phone: l.tenants?.phone || t?.phone || null, message });
  }

  // ---- Vacate a property (archives occupancy on the backend) ----
  async function vacateProperty(p: Property) {
    if (!(await confirmDialog({
      title: "Vacate property?",
      message: `Mark "${p.name}" as vacant? The current occupancy will be archived.`,
      confirmLabel: "Vacate",
      danger: true,
    }))) return;
    const prev = properties;
    setProperties((xs) => xs.map((x) => (x.id === p.id ? { ...x, is_vacant: true } : x)));
    try {
      await rentMasterFetch(`/api/admin/properties/${p.id}`, {
        method: "PATCH", body: JSON.stringify({ vacate: true }), role: "owner",
      });
      toast.success(`"${p.name}" marked vacant; occupancy archived.`);
    } catch (e: any) {
      setProperties(prev); // rollback
      toast.error(`Vacate failed: ${e.message}`);
    }
  }

  if (checkingSession || loading)
    return <FullScreenLoader label="Loading your portfolio…" sub="Syncing properties, tenants & ledgers" />;

  return (
    <DashboardShell
      brand="owner"
      roleLabel="HQ Admin Panel"
      sessionName={session?.name}
      sessionId={session?.userId}
      nav={nav}
      active={tab}
      onNavigate={setTab}
      onLogout={logout}
    >
      {error && <div className="mb-6"><Alert>{error}</Alert></div>}

      {plan && <PlanBanner plan={plan} onRenew={() => setTab("plan")} />}

      {tab === "overview" && (
        <OverviewTab
          properties={properties}
          tenants={tenants}
          metrics={metrics}
          maintenance={maintenance}
          onQuickInvoice={() => setInvoiceOpen(true)}
          onQuickProperty={() => guardedOpen("property", () => setPropOpen(true))}
        />
      )}

      {tab === "properties" && (
        <PropertiesTab
          properties={properties}
          disabledIds={plan?.disabled.propertyIds || []}
          onUpgrade={() => setTab("plan")}
          onAdd={() => guardedOpen("property", () => setPropOpen(true))}
          onEdit={setEditProp}
          onVacate={vacateProperty}
          onCharges={setChargeProp}
          onHistory={setHistoryProp}
        />
      )}

      {tab === "tenants" && (
        <TenantsTab
          tenants={tenants}
          properties={properties}
          disabledIds={plan?.disabled.tenantIds || []}
          onUpgrade={() => setTab("plan")}
          onAdd={() => guardedOpen("tenant", () => setTenantOpen(true))}
          onEdit={setEditTenant}
          onDocs={setDocsTenant}
          onResetPasscode={resetTenantPasscode}
          onToggleLogin={toggleTenantLogin}
          isPending={isPending}
        />
      )}

      {tab === "plan" && (
        <PlanTab plan={plan} onReload={loadPlan} ownerName={session?.name || null} />
      )}

      {tab === "billing" && (
        <BillingTab
          ledgers={ledgers}
          outstanding={metrics.outstanding}
          onCreate={() => setInvoiceOpen(true)}
          onStatus={setPaymentStatus}
          onReceipt={openOwnerReceipt}
          onSignature={() => setSigOpen(true)}
          hasSignature={!!ownerSignature}
        />
      )}

      {tab === "maintenance" && <MaintenanceTab logs={maintenance} onUpdate={setEditMaint} />}

      {tab === "notices" && (
        <NoticesTab notices={notices} onCreate={() => setNoticeOpen(true)} />
      )}

      {tab === "reminders" && (
        <RemindersTab
          reminders={reminders}
          tenants={tenants}
          onCreate={() => setReminderOpen(true)}
          onChanged={loadReminders}
        />
      )}

      {tab === "staff" && (
        <StaffTab
          enabled={!!plan?.features?.staff?.enabled}
          properties={properties}
          onContact={() => setStaffContactOpen(true)}
        />
      )}

      {tab === "accounts" && (
        <AccountsTab
          enabled={!!plan?.features?.accounts?.enabled}
          properties={properties}
          onContact={() => setAccountsContactOpen(true)}
        />
      )}

      {tab === "support" && (
        <SupportTab tickets={tickets} onCreate={() => setTicketOpen(true)} />
      )}

      {tab === "settings" && (
        <SettingsTab
          template={whatsappTemplate}
          onTemplateSaved={setWhatsappTemplate}
          reminderTemplate={reminderTemplate}
          onReminderTemplateSaved={setReminderTemplate}
        />
      )}

      {/* ---------- Modals ---------- */}
      <ContactModal
        open={staffContactOpen}
        subject="Enquiry about the Staff add-on"
        prefill="I'd like to enable the Staff add-on on my account. Please get in touch."
        ownerName={session?.name || null}
        onClose={() => setStaffContactOpen(false)}
      />
      <ContactModal
        open={accountsContactOpen}
        subject="Enquiry about the Accounts add-on"
        prefill="I'd like to enable the Accounts add-on on my account. Please get in touch."
        ownerName={session?.name || null}
        onClose={() => setAccountsContactOpen(false)}
      />
      <RaiseTicketModal
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
        onCreated={(t) => setTickets((x) => [t, ...x])}
      />
      <PropertyModal
        open={propOpen}
        onClose={() => setPropOpen(false)}
        onCreated={(p) => { setProperties((x) => [p, ...x]); loadPlan(); }}
      />
      <TenantModal
        open={tenantOpen}
        onClose={() => setTenantOpen(false)}
        properties={properties}
        onCreated={(t, passcode) => {
          setTenants((x) => [t, ...x]);
          setProperties((x) => x.map((p) => (p.id === t.property_id ? { ...p, is_vacant: false } : p)));
          loadPlan();
          if (passcode) setRevealPasscode({ name: t.name, code: passcode });
        }}
      />
      <InvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        tenants={tenants}
        onCreated={(l) => setLedgers((x) => [l, ...x])}
      />
      <NoticeModal
        open={noticeOpen}
        onClose={() => setNoticeOpen(false)}
        tenants={tenants}
        onCreated={(n) => setNotices((x) => [n, ...x])}
      />
      <ReminderModal
        open={reminderOpen}
        onClose={() => setReminderOpen(false)}
        tenants={tenants}
        template={reminderTemplate}
        onCreated={loadReminders}
      />
      <EditPropertyModal
        property={editProp}
        onClose={() => setEditProp(null)}
        onSaved={(p) => setProperties((xs) => xs.map((x) => (x.id === p.id ? { ...x, ...p } : x)))}
      />
      <EditTenantModal
        tenant={editTenant}
        properties={properties}
        onClose={() => setEditTenant(null)}
        onSaved={(t) => {
          const previousPropertyId = tenants.find((x) => x.id === t.id)?.property_id ?? null;
          setTenants((xs) =>
            xs.map((x) =>
              x.id === t.id
                // Re-derive the property join: the PATCH response doesn't embed it, and a
                // move makes the old one stale.
                ? { ...x, ...t, properties: properties.find((p) => p.id === t.property_id) ?? null }
                : x
            )
          );
          if (previousPropertyId !== t.property_id) {
            setProperties((ps) =>
              ps.map((p) =>
                p.id === t.property_id ? { ...p, is_vacant: false }
                  : p.id === previousPropertyId ? { ...p, is_vacant: true }
                    : p
              )
            );
          }
        }}
      />
      <ServiceChargeModal property={chargeProp} onClose={() => setChargeProp(null)} />
      <MaintenanceStatusModal
        log={editMaint}
        onClose={() => setEditMaint(null)}
        onSaved={(m) => setMaintenance((xs) => xs.map((x) => (x.id === m.id ? { ...x, ...m } : x)))}
      />
      <OwnerDocumentsModal tenant={docsTenant} onClose={() => setDocsTenant(null)} />
      <PropertyHistoryModal property={historyProp} onClose={() => setHistoryProp(null)} />
      <SignatureModal open={sigOpen} onClose={() => setSigOpen(false)} current={ownerSignature} onSaved={setOwnerSignature} />
      <ReceiptModal open={!!receipt} onClose={() => setReceipt(null)}
        html={receipt?.html || ""} phone={receipt?.phone} message={receipt?.message} />

      <Modal open={!!revealPasscode} onClose={() => setRevealPasscode(null)} title="Tenant login passcode">
        <div className="space-y-5">
          <p className="text-sm text-fg">
            Share this passcode with <span className="font-semibold text-heading">{revealPasscode?.name}</span> so they
            can sign in to the resident portal. For security it won&apos;t be shown again — you can reset it anytime.
          </p>
          <div className="flex items-center justify-between rounded-xl border border-success/20 bg-success/[0.06] px-4 py-4">
            <span className="flex items-center gap-2 font-mono text-2xl font-black tracking-[0.3em] text-success">
              <KeyRound className="h-5 w-5" />{revealPasscode?.code}
            </span>
            <Button size="sm" variant="secondary" icon={Copy}
              onClick={() => { navigator.clipboard?.writeText(revealPasscode?.code || ""); toast.success("Passcode copied."); }}>
              Copy
            </Button>
          </div>
          <Button className="w-full" onClick={() => setRevealPasscode(null)}>Done</Button>
        </div>
      </Modal>
    </DashboardShell>
  );
}

/* ============================================================ PLAN */
// A tier with a "custom" billing interval is a contact-us / enterprise plan
// (no self-service price, set up by the admin after the customer gets in touch).
const isContactTier = (t: SubscriptionTier) => t.billing_interval === "custom";

function planStatusBadge(s: PlanState): { tone: "emerald" | "amber" | "rose"; label: string } {
  if (s.status === "locked") return { tone: "rose", label: s.lockReason === "revoked" ? "Revoked" : "Lapsed" };
  if (s.status === "grace") return { tone: "amber", label: "In grace" };
  if (s.warnExpiringSoon) return { tone: "amber", label: "Expiring soon" };
  return { tone: "emerald", label: "Active" };
}

function PlanBanner({ plan, onRenew }: { plan: SubscriptionResponse; onRenew: () => void }) {
  const s = plan.subscription;
  let tone: "rose" | "amber" | null = null;
  let msg = "";
  if (s.status === "locked") {
    tone = "rose";
    msg = s.lockReason === "revoked"
      ? "Your management permissions have been revoked by an administrator. Contact support to restore access."
      : "Your subscription has lapsed. Renew your plan to regain access — you can still view your data.";
  } else if (s.status === "grace") {
    tone = "amber";
    msg = `Your ${s.tierName} plan expired. ${s.daysLeftInGrace} day${s.daysLeftInGrace === 1 ? "" : "s"} of grace left to renew before management is locked.`;
  } else if (s.warnExpiringSoon) {
    tone = "amber";
    msg = `Your ${s.tierName} plan expires in ${s.daysUntilExpiry} day${s.daysUntilExpiry === 1 ? "" : "s"}. Renew to avoid interruption.`;
  }
  if (!tone) return null;
  const cls = tone === "rose"
    ? "border-danger/30 bg-danger/10 text-danger"
    : "border-warning/30 bg-warning/10 text-warning";
  return (
    <div className={`mb-6 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${cls}`}>
      <div className="flex items-start gap-2 text-sm">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{msg}</span>
      </div>
      <Button size="sm" variant={tone === "rose" ? "danger" : "secondary"} icon={ArrowUpCircle} onClick={onRenew} className="shrink-0">
        {s.status === "locked" ? "Renew now" : "Manage plan"}
      </Button>
    </div>
  );
}

function UsageMeter({ label, current, limit, icon: Icon }: { label: string; current: number; limit: number; icon: any }) {
  const unlimited = limit === -1;
  const pct = unlimited ? 0 : Math.min(100, limit === 0 ? 100 : Math.round((current / limit) * 100));
  const atCap = !unlimited && current >= limit;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted">
          <Icon className="h-4 w-4" /> {label}
        </div>
        <div className="text-sm font-black text-heading">
          {current} / {unlimited ? <InfinityIcon className="inline h-4 w-4 align-middle" /> : limit}
        </div>
      </div>
      {!unlimited && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-overlay/[0.06]">
          <div className={`h-full rounded-full ${atCap ? "bg-danger" : "bg-primary"}`} style={{ width: `${pct}%` }} />
        </div>
      )}
      {unlimited && <div className="mt-3 text-xs text-success">Unlimited on your plan</div>}
      {atCap && <div className="mt-2 text-xs text-danger">Limit reached — upgrade to add more.</div>}
    </Card>
  );
}

function PlanTab({ plan, onReload, ownerName }: { plan: SubscriptionResponse | null; onReload: () => Promise<void>; ownerName: string | null }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [contactTier, setContactTier] = useState<SubscriptionTier | null>(null);
  const [paymentTier, setPaymentTier] = useState<SubscriptionTier | null>(null);
  const [payments, setPayments] = useState<PaymentSubmission[]>([]);

  // The owner's own payment submissions, so we can show a pending badge / rejection remarks.
  async function loadPayments() {
    try {
      const res = await rentMasterFetch<{ data: PaymentSubmission[] }>("/api/admin/payments", { role: "owner" });
      setPayments(res.data || []);
    } catch { /* non-fatal */ }
  }
  useEffect(() => { loadPayments(); }, []);

  if (!plan) {
    return (
      <EmptyState icon={Gem} title="Loading your plan…" hint="Fetching your subscription details."
        action={<Button size="sm" variant="secondary" onClick={onReload}>Retry</Button>} />
    );
  }

  const s = plan.subscription;
  const badge = planStatusBadge(s);
  const pendingPayment = payments.find((p) => p.status === "pending") || null;
  // Show the most recent rejection only if nothing newer (pending/approved) supersedes it.
  const latestPayment = payments[0] || null;
  const rejectedPayment = latestPayment?.status === "rejected" ? latestPayment : null;

  // Free tiers activate instantly; paid tiers go through the bKash payment screen (submit -> admin
  // approval). Custom tiers use Contact us (handled by their own button, not choose()).
  async function choose(tier: SubscriptionTier) {
    if (Number(tier.price) > 0) {
      if (pendingPayment) { toast.warning("You already have a payment awaiting approval."); return; }
      setPaymentTier(tier);
      return;
    }
    const isCurrent = tier.id === s.tierId;
    const verb = isCurrent ? "Renew" : "Switch to";
    if (!(await confirmDialog({
      title: `${verb} ${tier.name}?`,
      message: "Free plan — activation is instant.",
      confirmLabel: verb.replace(" to", ""),
    }))) return;
    try {
      setBusy(tier.id);
      const res = await rentMasterFetch<{ success: boolean; message: string }>("/api/admin/subscription", {
        method: "POST", role: "owner", body: JSON.stringify({ tierId: tier.id }),
      });
      await onReload();
      toast.success(res.message || "Plan updated.");
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Your plan" subtitle="Manage your subscription, limits and renewals." />

      {/* Current plan summary */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent text-btn-ink">
              {s.isFree ? <Sparkles className="h-5 w-5" /> : <Crown className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-heading">{s.tierName}</span>
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </div>
              <div className="text-xs text-muted">
                {s.isFree ? "Free · never expires" : `${formatCurrency(s.price)} / ${s.interval}`}
              </div>
            </div>
          </div>
          {!s.isFree && (
            <div className="flex items-center gap-2 text-sm text-fg">
              <CalendarClock className="h-4 w-4 text-subtle" />
              {s.status === "grace"
                ? <span className="text-warning">Expired · {s.daysLeftInGrace}d grace left</span>
                : s.status === "locked"
                  ? <span className="text-danger">Lapsed on {formatDate(s.expiryDate)}</span>
                  : <span>Renews / expires {formatDate(s.expiryDate)}{s.warnExpiringSoon ? ` · ${s.daysUntilExpiry}d left` : ""}</span>}
            </div>
          )}
        </div>
      </Card>

      {/* Payment awaiting approval */}
      {pendingPayment && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <div className="font-bold text-warning">Payment awaiting approval</div>
            <p className="mt-0.5 text-warning/90">
              We&apos;ve received your payment for the <strong>{pendingPayment.tier_name || pendingPayment.tier_id}</strong> plan
              (৳{Number(pendingPayment.amount || 0)}, txn {pendingPayment.txn_id}). Our team will review and activate it shortly.
            </p>
          </div>
        </div>
      )}

      {/* Last payment was rejected */}
      {!pendingPayment && rejectedPayment && (
        <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div>
            <div className="font-bold text-danger">Your last payment could not be approved</div>
            <p className="mt-0.5 text-danger/90">
              {rejectedPayment.admin_notes
                ? <>Reason: {rejectedPayment.admin_notes}</>
                : "Please review your payment details and try again."}
              {" "}You can submit a new payment below.
            </p>
          </div>
        </div>
      )}

      {/* Usage */}
      <div className="grid gap-4 sm:grid-cols-2">
        <UsageMeter label="Properties" current={plan.usage.properties.current} limit={plan.usage.properties.limit} icon={Building2} />
        <UsageMeter label="Tenants" current={plan.usage.tenants.current} limit={plan.usage.tenants.limit} icon={Users} />
      </div>

      {/* Available plans */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Available plans</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[...plan.availableTiers]
            .sort((a, b) => (isContactTier(a) ? 1 : 0) - (isContactTier(b) ? 1 : 0) || Number(a.price) - Number(b.price))
            .map((tier) => {
            const isCurrent = tier.id === s.tierId;
            const contact = isContactTier(tier);
            const unlimitedP = tier.max_properties_allowed === -1;
            const unlimitedT = tier.max_tenants_allowed === -1;
            const pOver = !unlimitedP && plan.usage.properties.current > tier.max_properties_allowed;
            const tOver = !unlimitedT && plan.usage.tenants.current > tier.max_tenants_allowed;
            const blockedDowngrade = !isCurrent && (pOver || tOver);
            return (
              <Card key={tier.id} className={`p-6 ${isCurrent ? "border-primary/40" : ""} ${contact ? "border-accent/30" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="text-base font-black text-heading">{tier.name}</div>
                  {isCurrent ? <Badge tone="indigo">Current</Badge> : contact ? <Badge tone="cyan">Custom</Badge> : null}
                </div>
                <div className="mt-1 text-2xl font-black text-heading">
                  {contact ? "Contact us" : tier.price > 0 ? formatCurrency(tier.price) : "Free"}
                  {!contact && tier.price > 0 && <span className="text-sm font-medium text-muted"> / {tier.billing_interval}</span>}
                </div>
                {tier.description && <p className="mt-2 text-xs text-muted">{tier.description}</p>}
                <ul className="mt-4 space-y-1.5 text-sm text-fg">
                  {contact ? (
                    <>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />Custom build for your entire building</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />Unlimited properties &amp; tenants</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />1 year free maintenance included</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />Monthly or yearly contract from year 2</li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />
                        {unlimitedP ? "Unlimited properties" : `Up to ${tier.max_properties_allowed} properties`}</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />
                        {unlimitedT ? "Unlimited tenants" : `Up to ${tier.max_tenants_allowed} tenants`}</li>
                    </>
                  )}
                </ul>
                <div className="mt-5">
                  {contact ? (
                    <Button className="w-full" icon={Send} onClick={() => setContactTier(tier)}>
                      Contact us
                    </Button>
                  ) : isCurrent && s.isFree ? (
                    <Button variant="secondary" className="w-full" disabled>Current plan</Button>
                  ) : blockedDowngrade ? (
                    <>
                      <Button variant="secondary" className="w-full" disabled>Downgrade blocked</Button>
                      <p className="mt-2 text-xs text-danger">
                        You use {plan.usage.properties.current} propert{plan.usage.properties.current === 1 ? "y" : "ies"} / {plan.usage.tenants.current} tenant{plan.usage.tenants.current === 1 ? "" : "s"}. Reduce to {unlimitedP ? "∞" : tier.max_properties_allowed} / {unlimitedT ? "∞" : tier.max_tenants_allowed} first.
                      </p>
                    </>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isCurrent ? "secondary" : tier.price > s.price ? "primary" : "secondary"}
                      icon={isCurrent ? undefined : ArrowUpCircle}
                      loading={busy === tier.id}
                      onClick={() => choose(tier)}
                    >
                      {isCurrent ? "Renew plan" : tier.price > s.price ? "Upgrade" : "Switch to this plan"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
        <p className="text-xs text-subtle">Paid plans are activated after our team confirms your bKash payment. The free plan never expires; paid plans renew on their billing interval and get a {`10`}-day grace period after expiry.</p>
      </div>

      <ContactModal open={!!contactTier} tier={contactTier} ownerName={ownerName} onClose={() => setContactTier(null)} />
      <PaymentModal
        tier={paymentTier}
        onClose={() => setPaymentTier(null)}
        onSubmitted={async () => { setPaymentTier(null); await loadPayments(); }}
      />
    </div>
  );
}

/* ============================================================ PAYMENT (bKash manual) */
function PaymentModal({
  tier, onClose, onSubmitted,
}: {
  tier: SubscriptionTier | null; onClose: () => void; onSubmitted: () => Promise<void>;
}) {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [senderMsisdn, setSenderMsisdn] = useState("");
  const [txnId, setTxnId] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const providerName = config?.provider || "bKash";

  useEffect(() => {
    setZoomed(false);
    if (!tier) return;
    setSenderMsisdn(""); setTxnId(""); setAmount(String(tier.price ?? ""));
    (async () => {
      try {
        const res = await rentMasterFetch<{ data: PaymentConfig }>("/api/admin/payment-config", { role: "owner" });
        setConfig(res.data);
      } catch { setConfig(null); }
    })();
  }, [tier]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!senderMsisdn.trim()) { toast.error("Enter the mobile number you paid from."); return; }
    if (!txnId.trim()) { toast.error("Enter the bKash transaction id."); return; }
    try {
      setSending(true);
      await rentMasterFetch("/api/admin/payments", {
        method: "POST", role: "owner",
        body: JSON.stringify({
          tierId: tier?.id,
          amount: amount ? Number(amount) : undefined,
          senderMsisdn: senderMsisdn.trim(),
          txnId: txnId.trim(),
        }),
      });
      toast.success("Payment submitted — we'll activate your plan once it's approved.");
      await onSubmitted();
    } catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  }

  return (
    <Modal open={!!tier} onClose={onClose} title="Complete your payment"
      subtitle={tier ? `${tier.name} · ৳${tier.price} / ${tier.billing_interval}` : undefined}>
      <div className="space-y-5">
        {/* Pay-to details */}
        <div className="rounded-xl border border-line/[0.08] bg-overlay/[0.02] p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-muted">Pay with {providerName}</div>
          {config?.qrUrl ? (
            <div className="mt-3 flex flex-col items-center gap-1">
              <button type="button" onClick={() => setZoomed(true)}
                className="rounded-lg ring-1 ring-line/10 transition hover:ring-primary/50"
                title="Tap to enlarge and scan">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={config.qrUrl} alt={`${providerName} QR code`} className="h-44 w-44 rounded-lg bg-white object-contain p-2" />
              </button>
              <span className="text-[11px] text-subtle">Tap the QR to enlarge and scan</span>
            </div>
          ) : null}
          {config?.walletNumber ? (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-overlay/[0.03] px-3 py-2">
              <div>
                <div className="text-[11px] text-subtle">{providerName} number</div>
                <div className="font-mono text-base font-bold text-heading">{config.walletNumber}</div>
              </div>
              <Button size="sm" variant="secondary" icon={Copy}
                onClick={() => { navigator.clipboard?.writeText(config.walletNumber); toast.success("Number copied."); }}>
                Copy
              </Button>
            </div>
          ) : null}
          {config?.instructions ? (
            <p className="mt-3 whitespace-pre-wrap text-xs text-muted">{config.instructions}</p>
          ) : null}
          {!config?.qrUrl && !config?.walletNumber && (
            <p className="mt-3 text-xs text-warning">Payment details haven&apos;t been set up yet. Please contact us.</p>
          )}
        </div>

        {/* Enlarged QR lightbox — tap anywhere to close */}
        {zoomed && config?.qrUrl && (
          <div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-black/80 p-6 backdrop-blur-sm"
            onClick={() => setZoomed(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.qrUrl} alt={`${providerName} QR code`}
              className="max-h-[80vh] w-auto max-w-[90vw] rounded-2xl bg-white object-contain p-4 shadow-2xl" />
            <span className="text-sm text-heading/80">Tap anywhere to close</span>
          </div>
        )}

        {/* Proof of payment */}
        <form onSubmit={submit} className="space-y-4">
          <p className="text-xs text-muted">After paying, enter your payment details below so we can verify and activate your plan.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mobile number you paid from" required>
              <TextInput value={senderMsisdn} onChange={(e) => setSenderMsisdn(e.target.value)} placeholder="01712345678" required />
            </Field>
            <Field label="Amount (৳)">
              <TextInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(tier?.price ?? "")} />
            </Field>
          </div>
          <Field label="bKash transaction id" required>
            <TextInput value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="e.g. 8N7A6B5C4D" required />
          </Field>
          <Button type="submit" loading={sending} icon={CircleDollarSign} className="w-full">Submit for approval</Button>
        </form>
      </div>
    </Modal>
  );
}

/* ============================================================ CONTACT US */
// Shared enquiry form. Opened from the Plan tab for a "contact us" tier, and from the
// Staff tab to ask for the Staff add-on — hence `open` is explicit rather than derived
// from `tier`, and `subject`/`prefill` cover the tier-less case.
function ContactModal({
  open, tier, subject, prefill, ownerName, onClose,
}: {
  open: boolean;
  tier?: SubscriptionTier | null;
  subject?: string;
  prefill?: string;
  ownerName: string | null;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Prefill the sender name and a starter message whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setName(ownerName || "");
    setMessage(
      prefill ?? (tier ? `I'm interested in the ${tier.name} plan. Please get in touch.` : "")
    );
    setEmail(""); setPhone("");
  }, [open, tier, prefill, ownerName]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) { toast.error("Please add a message."); return; }
    try {
      setSending(true);
      await rentMasterFetch("/api/admin/contact-messages", {
        method: "POST", role: "owner",
        body: JSON.stringify({
          name: name.trim(), email: email.trim(), phone: phone.trim(),
          tierId: tier?.id, message: message.trim(),
        }),
      });
      toast.success("Thanks — our team will reach out to you soon.");
      onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Contact us"
      subtitle={subject ?? (tier ? `Enquiry about the ${tier.name} plan` : undefined)}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Phone">
            <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01712345678" />
          </Field>
        </div>
        <Field label="Email">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Message" required>
          <TextArea rows={4} required value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about your building and what you need…" />
        </Field>
        <Button type="submit" loading={sending} icon={Send} className="w-full">Send enquiry</Button>
      </form>
    </Modal>
  );
}

/* ============================================================ OVERVIEW */
function OverviewTab({
  properties, tenants, metrics, maintenance, onQuickInvoice, onQuickProperty,
}: {
  properties: Property[]; tenants: Tenant[];
  metrics: { occupied: number; monthlyRevenue: number; outstanding: number; unpaidCount: number; openTickets: number };
  maintenance: MaintenanceLog[];
  onQuickInvoice: () => void; onQuickProperty: () => void;
}) {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Portfolio overview"
        subtitle="A live snapshot of your properties, income and open work."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Plus} onClick={onQuickProperty}>Property</Button>
            <Button icon={Plus} onClick={onQuickInvoice}>New invoice</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Properties" accent="indigo" icon={Building2}
          value={properties.length}
          sub={`${metrics.occupied} occupied · ${properties.length - metrics.occupied} vacant`} />
        <StatCard label="Tenants" accent="cyan" icon={Users}
          value={tenants.length} sub="Active residents" />
        <StatCard label="Monthly rent roll" accent="emerald" icon={CircleDollarSign}
          value={formatCurrency(metrics.monthlyRevenue)} sub="Expected per month" />
        <StatCard label="Outstanding" accent="rose" icon={ReceiptText}
          value={formatCurrency(metrics.outstanding)} sub={`${metrics.unpaidCount} unpaid invoice(s)`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-bold text-fg">Occupancy</h3>
          {properties.length === 0 ? (
            <p className="text-sm text-subtle">No properties yet.</p>
          ) : (
            <>
              <div className="mb-3 flex items-end justify-between">
                <span className="text-3xl font-black text-heading">
                  {Math.round((metrics.occupied / properties.length) * 100)}%
                </span>
                <span className="text-xs text-subtle">
                  {metrics.occupied}/{properties.length} units filled
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${(metrics.occupied / properties.length) * 100}%` }}
                />
              </div>
            </>
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-fg">Recent maintenance</h3>
            <Badge tone={metrics.openTickets ? "amber" : "emerald"}>
              {metrics.openTickets} open
            </Badge>
          </div>
          <div className="space-y-3">
            {maintenance.slice(0, 3).map((m) => (
              <div key={m.id} className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-overlay/[0.04] p-1.5 text-warning">
                  <Wrench className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-fg">{m.issue_title}</div>
                  <div className="text-xs text-subtle">
                    {m.properties?.name ?? "Property"} · {formatDate(m.created_at)}
                  </div>
                </div>
              </div>
            ))}
            {maintenance.length === 0 && (
              <p className="text-sm text-subtle">No maintenance reported. 🎉</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================ PROPERTIES */
function PropertiesTab({ properties, disabledIds, onUpgrade, onAdd, onEdit, onVacate, onCharges, onHistory }: {
  properties: Property[]; disabledIds: string[]; onUpgrade: () => void; onAdd: () => void;
  onEdit: (p: Property) => void; onVacate: (p: Property) => void;
  onCharges: (p: Property) => void; onHistory: (p: Property) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? properties.filter((p) =>
        [p.name, p.address, p.flat_no, p.id].some((v) => String(v ?? "").toLowerCase().includes(q)))
    : properties;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        subtitle="Every unit in your real-estate inventory."
        action={<Button icon={Plus} onClick={onAdd}>Add property</Button>}
      />
      {properties.length === 0 ? (
        <EmptyState icon={Building2} title="No properties yet"
          hint="Register your first unit to start onboarding tenants and billing rent."
          action={<Button icon={Plus} onClick={onAdd}>Add property</Button>} />
      ) : (
        <>
        <SearchInput value={query} onChange={setQuery} placeholder="Search by name, address or flat…" />
        {filtered.length === 0 ? (
          <EmptyState icon={Building2} title="No matches" hint={`No properties match "${query}".`} />
        ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const disabled = disabledIds.includes(p.id);
            return (
            <Card key={p.id} hover={!disabled} className={`flex flex-col gap-4 p-5 ${disabled ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Home className="h-5 w-5" />
                </div>
                {disabled ? (
                  <Badge tone="rose">Disabled</Badge>
                ) : (
                  <Badge tone={p.is_vacant ? "amber" : "emerald"}>
                    {p.is_vacant ? "Vacant" : "Occupied"}
                  </Badge>
                )}
              </div>
              <div>
                <h3 className="font-bold text-heading">{p.name}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                  <MapPin className="h-3.5 w-3.5" /> {p.address}
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-line/[0.06] pt-3 text-xs text-subtle">
                <span>Flat <span className="font-semibold text-fg">{p.flat_no}</span></span>
                <span className="font-mono">{p.id.slice(0, 8)}…</span>
              </div>
              {disabled ? (
                <Button size="sm" variant="secondary" icon={ArrowUpCircle} onClick={onUpgrade} className="w-full">
                  Upgrade to re-enable
                </Button>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" icon={Pencil} onClick={() => onEdit(p)} className="flex-1">Edit</Button>
                    <Button size="sm" variant="secondary" icon={CircleDollarSign} onClick={() => onCharges(p)} className="flex-1">Charges</Button>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" icon={History} onClick={() => onHistory(p)} className="flex-1">History</Button>
                    {!p.is_vacant && (
                      <Button size="sm" variant="ghost" icon={DoorOpen} onClick={() => onVacate(p)} className="flex-1">Vacate</Button>
                    )}
                  </div>
                </>
              )}
            </Card>
            );
          })}
        </div>
        )}
        </>
      )}
    </div>
  );
}

/* ============================================================ TENANTS */

// The tenant list renders twice — a desktop table and a mobile card list. These two controls live
// in both, so they're shared components: inlining them once let the mobile layout silently miss the
// login toggle and the passcode pending state entirely.

// Only meaningful for an unassigned tenant: with no property they're locked out of the resident
// portal by default, and this is the owner's per-tenant exception.
function LoginAccessToggle({ tenant, onToggle }: { tenant: Tenant; onToggle: (t: Tenant) => void }) {
  const allowed = tenant.allow_login_unassigned;
  return (
    <button
      onClick={() => onToggle(tenant)}
      title={allowed
        ? "Signed-in access is allowed. Click to block it."
        : "Blocked from signing in. Click to allow it anyway."}
      className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
        allowed
          ? "bg-success/10 text-success hover:bg-success/20"
          : "bg-danger/10 text-danger hover:bg-danger/20"
      }`}
    >
      {allowed
        ? <><KeyRound className="h-3 w-3" /> Login allowed</>
        : <><Lock className="h-3 w-3" /> Login blocked</>}
    </button>
  );
}

function ResetPasscodeButton({
  tenant, onReset, pending, label = "Reset",
}: { tenant: Tenant; onReset: (t: Tenant) => void; pending: boolean; label?: string }) {
  return (
    <button
      onClick={() => onReset(tenant)}
      disabled={pending}
      title="Generate a new login passcode"
      className="inline-flex items-center gap-1.5 rounded-lg bg-overlay/[0.04] px-2 py-1 text-xs text-fg transition hover:bg-overlay/[0.08] hover:text-heading disabled:pointer-events-none disabled:opacity-50"
    >
      {pending ? <Spinner className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />} {label}
    </button>
  );
}

function TenantsTab({
  tenants, properties, disabledIds, onUpgrade, onAdd, onEdit, onDocs, onResetPasscode, onToggleLogin,
  isPending,
}: {
  tenants: Tenant[]; properties: Property[]; disabledIds: string[]; onUpgrade: () => void; onAdd: () => void;
  onEdit: (t: Tenant) => void; onDocs: (t: Tenant) => void; onResetPasscode: (t: Tenant) => void;
  onToggleLogin: (t: Tenant) => void;
  isPending: (key: string) => boolean;
}) {
  const propName = (id: string | null) => (id ? properties.find((p) => p.id === id)?.name : undefined);
  const isDisabled = (id: string) => disabledIds.includes(id);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? tenants.filter((t) =>
        [t.name, t.phone, t.properties?.name ?? propName(t.property_id)].some((v) =>
          String(v ?? "").toLowerCase().includes(q)))
    : tenants;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        subtitle="Onboarded residents and their access credentials."
        action={<Button icon={Plus} onClick={onAdd}>Onboard tenant</Button>}
      />
      {tenants.length === 0 ? (
        <EmptyState icon={Users} title="No tenants onboarded"
          hint="Add a tenant to a property. A temporary passcode (last 4 phone digits) is generated automatically."
          action={<Button icon={Plus} onClick={onAdd}>Onboard tenant</Button>} />
      ) : (
        <>
          <SearchInput value={query} onChange={setQuery} placeholder="Search by name, phone or property…" />
          {filtered.length === 0 ? (
            <EmptyState icon={Users} title="No matches" hint={`No tenants match "${query}".`} />
          ) : (
          <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line/[0.06] bg-overlay/[0.02] text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="p-4">Resident</th>
                    <th className="p-4">Property</th>
                    <th className="p-4">Rent</th>
                    <th className="p-4">Due day</th>
                    <th className="p-4">Passcode</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/[0.04]">
                  {filtered.map((t) => {
                    const disabled = isDisabled(t.id);
                    return (
                    <tr key={t.id} className={`hover:bg-overlay/[0.02] ${disabled ? "opacity-60" : ""}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-2 font-semibold text-heading">
                          {t.name}{disabled && <Badge tone="rose">Disabled</Badge>}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-subtle">
                          <Phone className="h-3 w-3" /> {t.phone}
                        </div>
                      </td>
                      <td className="p-4 text-fg">
                        {t.properties?.name ?? propName(t.property_id) ?? (
                          // No property = no portal access by default. Offer the override here,
                          // where the owner can see *why* it applies.
                          <div className="space-y-1.5">
                            <Badge tone="amber">Unassigned</Badge>
                            <LoginAccessToggle tenant={t} onToggle={onToggleLogin} />
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-success">{formatCurrency(t.monthly_rent)}</td>
                      <td className="p-4 text-fg">{ordinalDay(t.due_date)}</td>
                      <td className="p-4">
                        <ResetPasscodeButton
                          tenant={t}
                          onReset={onResetPasscode}
                          pending={isPending(`passcode:${t.id}`)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          {disabled ? (
                            <Button size="sm" variant="secondary" icon={ArrowUpCircle} onClick={onUpgrade}>Upgrade</Button>
                          ) : (
                            <>
                              <Button size="sm" variant="secondary" icon={Pencil} onClick={() => onEdit(t)}>Edit</Button>
                              <Button size="sm" variant="secondary" icon={FileText} onClick={() => onDocs(t)}>Docs</Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((t) => {
              const disabled = isDisabled(t.id);
              return (
              <Card key={t.id} className={`p-4 ${disabled ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-semibold text-heading">
                    {t.name}{disabled && <Badge tone="rose">Disabled</Badge>}
                  </div>
                  <ResetPasscodeButton
                    tenant={t}
                    onReset={onResetPasscode}
                    pending={isPending(`passcode:${t.id}`)}
                    label="Reset passcode"
                  />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted">
                  <span>
                    {t.properties?.name ?? propName(t.property_id) ?? (
                      <Badge tone="amber">Unassigned</Badge>
                    )}
                  </span>
                  <span className="text-right font-semibold text-success">{formatCurrency(t.monthly_rent)}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{t.phone}</span>
                  <span className="text-right">Due {ordinalDay(t.due_date)}</span>
                </div>
                {/* Its own row, not squeezed into the grid cell beside the rent — it needs a real tap target. */}
                {!t.property_id && (
                  <div className="mt-3">
                    <LoginAccessToggle tenant={t} onToggle={onToggleLogin} />
                  </div>
                )}
                <div className="mt-3 flex justify-end gap-2">
                  {disabled ? (
                    <Button size="sm" variant="secondary" icon={ArrowUpCircle} onClick={onUpgrade}>Upgrade to re-enable</Button>
                  ) : (
                    <>
                      <Button size="sm" variant="secondary" icon={Pencil} onClick={() => onEdit(t)}>Edit</Button>
                      <Button size="sm" variant="secondary" icon={FileText} onClick={() => onDocs(t)}>Docs</Button>
                    </>
                  )}
                </div>
              </Card>
              );
            })}
          </div>
          </>
          )}
        </>
      )}
    </div>
  );
}

/* ============================================================ BILLING */
function BillingTab({
  ledgers, outstanding, onCreate, onStatus, onReceipt, onSignature, hasSignature,
}: {
  ledgers: BillingLedger[]; outstanding: number;
  onCreate: () => void; onStatus: (id: string, s: PaymentStatus) => void;
  onReceipt: (l: BillingLedger) => void; onSignature: () => void; hasSignature: boolean;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? ledgers.filter((l) =>
        [l.tenants?.name, formatMonth(l.billing_month), l.billing_month, l.payment_status].some((v) =>
          String(v ?? "").toLowerCase().includes(q)))
    : ledgers;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing ledger"
        subtitle="Generate rent invoices and track payment status."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={PenLine} onClick={onSignature}>
              {hasSignature ? "Signature" : "Add signature"}
            </Button>
            <Button icon={Plus} onClick={onCreate}>Create invoice</Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Invoices" value={ledgers.length} accent="indigo" />
        <StatCard label="Outstanding" value={formatCurrency(outstanding)} accent="rose" />
        <StatCard label="Collected"
          value={formatCurrency(ledgers.filter((l) => l.payment_status === "paid").reduce((s, l) => s + Number(l.total_payable), 0))}
          accent="emerald" />
      </div>

      {ledgers.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No invoices yet"
          hint="Create your first rent invoice for a tenant."
          action={<Button icon={Plus} onClick={onCreate}>Create invoice</Button>} />
      ) : (
        <>
        <SearchInput value={query} onChange={setQuery} placeholder="Search by tenant, month or status…" />
        {filtered.length === 0 ? (
          <EmptyState icon={ReceiptText} title="No matches" hint={`No invoices match "${query}".`} />
        ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line/[0.06] bg-overlay/[0.02] text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="p-4">Tenant / Month</th>
                  <th className="p-4">Rent</th>
                  <th className="p-4">Extras</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Mark as</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/[0.04]">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-overlay/[0.02]">
                    <td className="p-4">
                      <div className="font-semibold text-heading">{l.tenants?.name ?? "Tenant"}</div>
                      <div className="text-xs text-subtle">{formatMonth(l.billing_month)}</div>
                    </td>
                    <td className="p-4 text-fg">{formatCurrency(l.rent_amount)}</td>
                    <td className="p-4 text-fg">
                      {formatCurrency(Number(l.service_charge) + Number(l.extra_charge))}
                      {Number(l.discount) > 0 && (
                        <span className="ml-1 text-xs text-success">−{formatCurrency(l.discount)}</span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-heading">{formatCurrency(l.total_payable)}</td>
                    <td className="p-4"><Badge tone={statusTone[l.payment_status]}>{l.payment_status}</Badge></td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button title="Receipt & share" onClick={() => onReceipt(l)}
                          className="rounded-lg p-1.5 text-primary transition hover:bg-primary/10">
                          <Receipt className="h-4 w-4" />
                        </button>
                        <StatusButton active={l.payment_status === "unpaid"} tone="rose" icon={Circle}
                          onClick={() => onStatus(l.id, "unpaid")} title="Unpaid" />
                        <StatusButton active={l.payment_status === "sent"} tone="amber" icon={Send}
                          onClick={() => onStatus(l.id, "sent")} title="Sent" />
                        <StatusButton active={l.payment_status === "paid"} tone="emerald" icon={CheckCircle2}
                          onClick={() => onStatus(l.id, "paid")} title="Paid" />
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

function StatusButton({
  active, tone, icon: Icon, onClick, title,
}: {
  active: boolean; tone: "rose" | "amber" | "emerald";
  icon: typeof Circle; onClick: () => void; title: string;
}) {
  const tones = {
    rose: "text-danger hover:bg-danger/10",
    amber: "text-warning hover:bg-warning/10",
    emerald: "text-success hover:bg-success/10",
  };
  return (
    <button
      title={title}
      onClick={onClick}
      className={`rounded-lg p-1.5 transition ${tones[tone]} ${active ? "bg-overlay/[0.06] ring-1 ring-line/10" : "text-faint"}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/* ============================================================ MAINTENANCE */
function MaintenanceTab({ logs, onUpdate }: { logs: MaintenanceLog[]; onUpdate: (m: MaintenanceLog) => void }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance requests" subtitle="Incident tickets reported across your portfolio." />
      {logs.length === 0 ? (
        <EmptyState icon={Wrench} title="No maintenance tickets" hint="When tenants report issues, they'll appear here." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {logs.map((m) => (
            <Card key={m.id} className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-warning/10 p-2 text-warning"><TriangleAlert className="h-4 w-4" /></div>
                  <h3 className="font-bold text-heading">{m.issue_title}</h3>
                </div>
                <Badge tone={priorityTone[m.priority_level]}>{m.priority_level}</Badge>
              </div>
              {m.issue_description && <p className="text-sm leading-relaxed text-muted">{m.issue_description}</p>}
              <AttachmentStrip raw={m.attachment_file_url} />
              {m.resolution_remarks && (
                <div className="rounded-lg border border-line/[0.06] bg-overlay/[0.03] px-3 py-2 text-xs text-fg">
                  <span className="font-semibold text-muted">Owner note: </span>{m.resolution_remarks}
                </div>
              )}
              <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line/[0.06] pt-3 text-xs text-subtle">
                <span>{m.properties?.name ?? "Property"}</span>
                {m.tenants?.name && <span>· {m.tenants.name}</span>}
                <span>· {formatDate(m.created_at)}</span>
                <Badge tone={maintStatusTone[m.resolution_status]} className="ml-auto">
                  {m.resolution_status.replace("_", " ")}
                </Badge>
              </div>
              <Button size="sm" variant="secondary" icon={Pencil} onClick={() => onUpdate(m)} className="w-full">
                Update status
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================ SUPPORT TICKETS */
function SupportTab({ tickets, onCreate }: { tickets: SupportTicket[]; onCreate: () => void }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        subtitle="Raise an issue or a question with the RentMaster admin team."
        action={<Button icon={Plus} onClick={onCreate}>Raise a ticket</Button>}
      />
      {tickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No support tickets"
          hint="Stuck on something? Raise a ticket and an admin will pick it up."
          action={<Button icon={Plus} onClick={onCreate}>Raise a ticket</Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {tickets.map((t) => (
            <Card key={t.id} className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary"><LifeBuoy className="h-4 w-4" /></div>
                  <div>
                    <h3 className="font-bold text-heading">{t.subject}</h3>
                    <span className="text-[11px] font-semibold text-subtle">#{t.ticket_no}</span>
                  </div>
                </div>
                <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted">{t.description}</p>
              <AttachmentStrip raw={t.attachment_file_url} />
              {t.admin_remarks && (
                <div className="rounded-lg border border-primary/20 bg-primary/[0.06] px-3 py-2 text-xs text-fg">
                  <span className="flex items-center gap-1.5 font-semibold text-primary">
                    <MessageSquare className="h-3.5 w-3.5" /> Admin response
                  </span>
                  <p className="mt-1 leading-relaxed">{t.admin_remarks}</p>
                </div>
              )}
              <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line/[0.06] pt-3 text-xs text-subtle">
                <span>{ticketCategoryLabel[t.category]}</span>
                <span>· Raised {formatDate(t.created_at)}</span>
                {t.finished_at && <span>· Closed {formatDate(t.finished_at)}</span>}
                <Badge tone={ticketStatusTone[t.status]} className="ml-auto">
                  {ticketStatusLabel[t.status]}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function RaiseTicketModal({
  open, onClose, onCreated,
}: {
  open: boolean; onClose: () => void; onCreated: (t: SupportTicket) => void;
}) {
  const empty = { subject: "", description: "", category: "other" as TicketCategory, priority: "medium" as PriorityLevel };
  const [form, setForm] = useState(empty);
  const [items, setItems] = useState<{ file: File; preview: string; key: string }[]>([]);
  const [saving, setSaving] = useState(false);

  function clearFiles() {
    setItems((prev) => { prev.forEach((it) => URL.revokeObjectURL(it.preview)); return []; });
  }
  function reset() { setForm(empty); clearFiles(); }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next: { file: File; preview: string; key: string }[] = [];
    for (const f of Array.from(list)) {
      if (!f.type.startsWith("image/")) { toast.warning(`"${f.name}" is not an image — skipped.`); continue; }
      if (f.size > 8 * 1024 * 1024) { toast.warning(`"${f.name}" is over 8MB — skipped.`); continue; }
      next.push({ file: f, preview: URL.createObjectURL(f), key: `${f.name}-${f.size}-${Math.random().toString(36).slice(2)}` });
    }
    if (next.length) setItems((prev) => [...prev, ...next]);
  }

  function removeItem(key: string) {
    setItems((prev) => {
      const target = prev.find((it) => it.key === key);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((it) => it.key !== key);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const attachmentFileUrls = items.length
        ? await Promise.all(items.map((it) => uploadFile(it.file, { role: "owner", folder: "support" })))
        : [];

      const res = await rentMasterFetch("/api/admin/support-tickets", {
        method: "POST", role: "owner",
        body: JSON.stringify({ ...form, attachmentFileUrls }),
      });
      if (res.success) { onCreated(res.data); reset(); onClose(); toast.success("Ticket raised — an admin will pick it up."); }
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Raise a ticket" subtitle="The RentMaster admin team will be notified.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Subject" required>
          <TextInput required placeholder="e.g. Locked out after renewing my plan" value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        </Field>
        <Field label="Description" required>
          <TextArea required rows={4} placeholder="Describe the issue in detail…" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as TicketCategory })}>
              <option value="billing">Billing</option>
              <option value="technical">Technical</option>
              <option value="account">Account</option>
              <option value="feature_request">Feature request</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as PriorityLevel })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </Field>
        </div>
        <Field label="Screenshots" hint="Optional — attach one or more images (max 8MB each).">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {items.map((it) => (
              <div key={it.key} className="relative aspect-square overflow-hidden rounded-xl border border-line/[0.08]">
                <img src={it.preview} alt="Attachment preview" className="h-full w-full object-cover" />
                <button type="button" onClick={() => removeItem(it.key)}
                  className="absolute right-1 top-1 rounded-lg bg-black/60 p-1 text-heading transition hover:bg-black/80">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line/[0.12] bg-overlay/[0.02] text-center text-[11px] text-muted transition hover:border-primary/40 hover:text-fg">
              <Upload className="h-5 w-5" />
              <span>{items.length ? "Add more" : "Add image"}</span>
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }} />
            </label>
          </div>
        </Field>
        <Button type="submit" loading={saving} className="w-full">
          {saving ? "Submitting…" : "Submit ticket"}
        </Button>
      </form>
    </Modal>
  );
}

/* ============================================================ NOTICES */
function NoticesTab({ notices, onCreate }: { notices: Notice[]; onCreate: () => void }) {
  const scopeLabel: Record<string, string> = {
    all_tenants: "All tenants", individual_tenant: "One tenant", all_owners: "All owners",
    individual_owner: "Payment update",
  };
  const senderLabel = (t: Notice["sender_type"]) =>
    t === "system_admin" ? "System" : t === "tenant" ? "Tenant" : "You";
  return (
    <div className="space-y-6">
      <PageHeader title="Notices" subtitle="Broadcast announcements to your tenants."
        action={<Button icon={Plus} onClick={onCreate}>New notice</Button>} />
      {notices.length === 0 ? (
        <EmptyState icon={Megaphone} title="No notices yet" hint="Broadcast rent reminders, maintenance windows or building updates."
          action={<Button icon={Plus} onClick={onCreate}>New notice</Button>} />
      ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <Card key={n.id} className="space-y-2 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-primary">{n.title}</h3>
                <span className="shrink-0 font-mono text-[10px] text-subtle">{formatDate(n.created_at)}</span>
              </div>
              <p className="text-sm leading-relaxed text-fg">{n.content}</p>
              <div className="flex items-center gap-2 pt-1">
                <Badge tone="indigo">{scopeLabel[n.target_scope] ?? n.target_scope}</Badge>
                <Badge tone="slate">{senderLabel(n.sender_type)}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================ MODALS */
function PropertyModal({
  open, onClose, onCreated,
}: { open: boolean; onClose: () => void; onCreated: (p: Property) => void }) {
  const [form, setForm] = useState({ name: "", address: "", flatNo: "" });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await rentMasterFetch("/api/admin/properties", {
        method: "POST", role: "owner", body: JSON.stringify(form),
      });
      if (res.success) {
        onCreated(res.data);
        setForm({ name: "", address: "", flatNo: "" });
        onClose();
        toast.success("Property added.");
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Register property" subtitle="Add a new unit to your inventory.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Property name" required>
          <TextInput required placeholder="e.g. Grand Crimson Palace" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Address" required>
          <TextInput required placeholder="e.g. 12 Gulshan Ave, Dhaka" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Field>
        <Field label="Flat / Unit no." required>
          <TextInput required placeholder="e.g. 4B" value={form.flatNo}
            onChange={(e) => setForm({ ...form, flatNo: e.target.value })} />
        </Field>
        <Button type="submit" loading={saving} className="w-full">Save property</Button>
      </form>
    </Modal>
  );
}

function TenantModal({
  open, onClose, properties, onCreated,
}: {
  open: boolean; onClose: () => void; properties: Property[]; onCreated: (t: Tenant, passcode?: string) => void;
}) {
  const empty = {
    propertyId: "", name: "", phone: "", familyMembers: "1", nid: "",
    monthlyRent: "", dueDate: "5", rentedDate: "", serviceCharge: "0", advanceAmount: "0",
  };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const vacant = properties.filter((p) => p.is_vacant);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await rentMasterFetch("/api/admin/tenants", {
        method: "POST", role: "owner",
        body: JSON.stringify({
          propertyId: form.propertyId, name: form.name, phone: form.phone,
          familyMembers: Number(form.familyMembers) || 1, nid: form.nid || "",
          monthlyRent: form.monthlyRent, dueDate: form.dueDate,
          rentedDate: form.rentedDate || null,
          serviceCharge: Number(form.serviceCharge) || 0,
          advanceAmount: Number(form.advanceAmount) || 0,
        }),
      });
      if (res.success) { onCreated(res.data, res.passcode); setForm(empty); onClose(); toast.success("Tenant onboarded."); }
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Onboard tenant"
      subtitle="A secure login passcode is generated and shown to you once — share it with the tenant.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Property" required>
          <Select required value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })}>
            <option value="">Select a property…</option>
            {(vacant.length ? vacant : properties).map((p) => (
              <option key={p.id} value={p.id}>{p.name} · Flat {p.flat_no}{p.is_vacant ? "" : " (occupied)"}</option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full name" required>
            <TextInput required placeholder="Shovon Rahman" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Phone" required>
            <TextInput required placeholder="01712345678" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Monthly rent (৳)" required>
            <TextInput required type="number" min="0" placeholder="15000" value={form.monthlyRent}
              onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })} />
          </Field>
          <Field label="Rent due day" required hint="Day of month (1–31)">
            <TextInput required type="number" min="1" max="31" value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Service charge (৳)">
            <TextInput type="number" min="0" value={form.serviceCharge}
              onChange={(e) => setForm({ ...form, serviceCharge: e.target.value })} />
          </Field>
          <Field label="Advance / deposit (৳)">
            <TextInput type="number" min="0" value={form.advanceAmount}
              onChange={(e) => setForm({ ...form, advanceAmount: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Family members">
            <TextInput type="number" min="1" value={form.familyMembers}
              onChange={(e) => setForm({ ...form, familyMembers: e.target.value })} />
          </Field>
          <Field label="Rented since">
            <TextInput type="date" value={form.rentedDate}
              onChange={(e) => setForm({ ...form, rentedDate: e.target.value })} />
          </Field>
        </div>
        <Field label="National ID (NID)" hint="Stored hashed for verification.">
          <TextInput placeholder="NID number" value={form.nid}
            onChange={(e) => setForm({ ...form, nid: e.target.value })} />
        </Field>
        <Button type="submit" loading={saving} className="w-full">Onboard & generate passcode</Button>
      </form>
    </Modal>
  );
}

function InvoiceModal({
  open, onClose, tenants, onCreated,
}: { open: boolean; onClose: () => void; tenants: Tenant[]; onCreated: (l: BillingLedger) => void }) {
  const thisMonth = new Date().toISOString().slice(0, 7);
  const empty = {
    tenantId: "", billingMonth: thisMonth, rentAmount: "", serviceCharge: "0",
    extraCharge: "0", extraChargeRemarks: "", discount: "0",
  };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  // An invoice needs a property (the backend requires propertyId), so unassigned tenants
  // are not billable and would only cause confusion in the picker.
  const billable = tenants.filter((t) => t.property_id);
  const selected = billable.find((t) => t.id === form.tenantId);

  const total =
    (Number(form.rentAmount) || 0) + (Number(form.serviceCharge) || 0) +
    (Number(form.extraCharge) || 0) - (Number(form.discount) || 0);

  function pickTenant(id: string) {
    const t = billable.find((x) => x.id === id);
    setForm((f) => ({
      ...f, tenantId: id,
      rentAmount: t ? String(t.monthly_rent) : f.rentAmount,
      serviceCharge: t ? String(t.service_charge ?? 0) : f.serviceCharge,
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    try {
      setSaving(true);
      const res = await rentMasterFetch("/api/admin/billing", {
        method: "POST", role: "owner",
        body: JSON.stringify({
          tenantId: selected.id, propertyId: selected.property_id,
          billingMonth: form.billingMonth, rentAmount: form.rentAmount,
          serviceCharge: form.serviceCharge, extraCharge: form.extraCharge,
          extraChargeRemarks: form.extraChargeRemarks || null, discount: form.discount,
        }),
      });
      if (res.success) {
        // Enrich with tenant name for immediate table display
        onCreated({ ...res.data, tenants: { name: selected.name, phone: selected.phone } });
        setForm(empty); onClose();
        toast.success("Invoice created.");
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Create invoice"
      subtitle="Generate a monthly rent invoice for a tenant.">
      {billable.length === 0 ? (
        <p className="text-sm text-muted">
          {tenants.length === 0
            ? "Onboard a tenant first to create invoices."
            : "None of your tenants are assigned to a property. Assign one from the Tenants tab to invoice them."}
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tenant" required>
              <Select required value={form.tenantId} onChange={(e) => pickTenant(e.target.value)}>
                <option value="">Select tenant…</option>
                {billable.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.phone}</option>)}
              </Select>
            </Field>
            <Field label="Billing month" required>
              <TextInput required type="month" value={form.billingMonth}
                onChange={(e) => setForm({ ...form, billingMonth: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Rent (৳)" required>
              <TextInput required type="number" min="0" value={form.rentAmount}
                onChange={(e) => setForm({ ...form, rentAmount: e.target.value })} />
            </Field>
            <Field label="Service charge (৳)">
              <TextInput type="number" min="0" value={form.serviceCharge}
                onChange={(e) => setForm({ ...form, serviceCharge: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Extra charge (৳)">
              <TextInput type="number" min="0" value={form.extraCharge}
                onChange={(e) => setForm({ ...form, extraCharge: e.target.value })} />
            </Field>
            <Field label="Discount (৳)">
              <TextInput type="number" min="0" value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })} />
            </Field>
          </div>
          <Field label="Note (optional)" hint="Appears on the receipt — e.g. explain an extra charge.">
            <TextArea rows={2} placeholder="e.g. Extra charge is for the shared water-tank repair."
              value={form.extraChargeRemarks}
              onChange={(e) => setForm({ ...form, extraChargeRemarks: e.target.value })} />
          </Field>
          <div className="flex items-center justify-between rounded-xl border border-line/[0.06] bg-overlay/[0.03] px-4 py-3">
            <span className="text-sm font-semibold text-fg">Total payable</span>
            <span className="text-xl font-black text-success">{formatCurrency(total)}</span>
          </div>
          <Button type="submit" loading={saving} className="w-full">Generate invoice</Button>
        </form>
      )}
    </Modal>
  );
}

function NoticeModal({
  open, onClose, tenants, onCreated,
}: { open: boolean; onClose: () => void; tenants: Tenant[]; onCreated: (n: Notice) => void }) {
  const empty = { targetScope: "all_tenants", targetTenantId: "", title: "", content: "" };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await rentMasterFetch("/api/admin/notices", {
        method: "POST", role: "owner",
        body: JSON.stringify({
          senderType: "owner", targetScope: form.targetScope,
          targetTenantId: form.targetScope === "individual_tenant" ? form.targetTenantId : null,
          title: form.title, content: form.content,
        }),
      });
      if (res.success) { onCreated(res.data); setForm(empty); onClose(); toast.success("Notice sent."); }
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Broadcast notice" subtitle="Send an announcement to your tenants.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Audience" required>
          <Select value={form.targetScope} onChange={(e) => setForm({ ...form, targetScope: e.target.value })}>
            <option value="all_tenants">All tenants</option>
            <option value="individual_tenant">A specific tenant</option>
          </Select>
        </Field>
        {form.targetScope === "individual_tenant" && (
          <Field label="Tenant" required>
            <Select required value={form.targetTenantId}
              onChange={(e) => setForm({ ...form, targetTenantId: e.target.value })}>
              <option value="">Select tenant…</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.phone}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Title" required>
          <TextInput required placeholder="e.g. Water supply maintenance" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Message" required>
          <TextArea required rows={4} placeholder="Write your announcement…" value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </Field>
        <Button type="submit" loading={saving} icon={Inbox} className="w-full">Broadcast notice</Button>
      </form>
    </Modal>
  );
}

/* ============================================================ RENT REMINDERS */
const REMINDER_PLACEHOLDERS = ["{tenant}", "{amount}", "{property}", "{month}", "{due_date}"];

const reminderStatusTone: Record<Reminder["status"], "amber" | "emerald" | "slate"> = {
  pending: "amber", sent: "emerald", canceled: "slate",
};
const reminderStatusLabel: Record<Reminder["status"], string> = {
  pending: "Scheduled", sent: "Sent", canceled: "Canceled",
};

function RemindersTab({
  reminders, tenants, onCreate, onChanged,
}: {
  reminders: Reminder[]; tenants: Tenant[]; onCreate: () => void; onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const nameById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of tenants) m[t.id] = t.name;
    return m;
  }, [tenants]);

  function recipients(r: Reminder): string {
    if (r.target_all) return "All tenants";
    const names = r.tenant_ids.map((id) => nameById[id] || "tenant");
    if (names.length <= 2) return names.join(", ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
  }

  async function act(id: string, action: "cancel" | "send_now" | "delete") {
    if (action === "cancel" && !(await confirmDialog({ title: "Cancel reminder?", message: "It won't be sent.", confirmLabel: "Cancel it", danger: true }))) return;
    if (action === "delete" && !(await confirmDialog({ title: "Delete reminder?", message: "This removes it permanently.", confirmLabel: "Delete", danger: true }))) return;
    try {
      setBusy(id);
      if (action === "delete") {
        await rentMasterFetch(`/api/admin/reminders/${id}`, { method: "DELETE", role: "owner" });
        toast.success("Reminder deleted.");
      } else {
        const res = await rentMasterFetch<{ delivered?: number }>(`/api/admin/reminders/${id}`, {
          method: "PATCH", role: "owner", body: JSON.stringify({ action }),
        });
        toast.success(action === "cancel" ? "Reminder canceled." : `Reminder sent to ${res.delivered ?? 0} tenant(s).`);
      }
      await onChanged();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Rent reminders" subtitle="Schedule reminders to your tenants — once or every month."
        action={<Button icon={Plus} onClick={onCreate}>New reminder</Button>} />

      {reminders.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No reminders yet"
          hint="Create a reminder to nudge tenants about rent — pick tenants, write a message, set a date."
          action={<Button icon={Plus} onClick={onCreate}>New reminder</Button>} />
      ) : (
        <div className="space-y-3">
          {reminders.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-subtle">#{r.reminder_no}</span>
                    <Badge tone={reminderStatusTone[r.status]}>{reminderStatusLabel[r.status]}</Badge>
                    <Badge tone={r.recurrence === "monthly" ? "indigo" : "slate"}>
                      {r.recurrence === "monthly" ? "Monthly" : "One-time"}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {r.status === "pending" ? "Next: " : ""}{formatDate(r.scheduled_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-fg">
                    <Users className="h-4 w-4 text-subtle" /> {recipients(r)}
                  </div>
                  <p className="max-w-2xl whitespace-pre-wrap text-sm text-muted">{r.message}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {r.status === "pending" && (
                    <>
                      <IconBtnOwner title="Send now" tone="emerald" icon={Send} loading={busy === r.id} onClick={() => act(r.id, "send_now")} />
                      <IconBtnOwner title="Cancel" tone="amber" icon={X} loading={busy === r.id} onClick={() => act(r.id, "cancel")} />
                    </>
                  )}
                  <IconBtnOwner title="Delete" tone="rose" icon={Trash2} loading={busy === r.id} onClick={() => act(r.id, "delete")} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Small icon action button (local to the owner page).
function IconBtnOwner({
  title, tone, icon: Icon, onClick, loading,
}: {
  title: string; tone: "emerald" | "amber" | "rose"; icon: typeof Send; onClick: () => void; loading?: boolean;
}) {
  const tones = {
    emerald: "text-success hover:bg-success/10",
    amber: "text-warning hover:bg-warning/10",
    rose: "text-danger hover:bg-danger/10",
  };
  return (
    <button title={title} onClick={onClick} disabled={loading}
      className={`rounded-lg p-2 transition disabled:pointer-events-none disabled:opacity-50 ${tones[tone]}`}>
      {loading ? <Spinner className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
    </button>
  );
}

function ReminderModal({
  open, onClose, tenants, template, onCreated,
}: {
  open: boolean; onClose: () => void; tenants: Tenant[]; template: string; onCreated: () => Promise<void>;
}) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [targetAll, setTargetAll] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [scheduledDate, setScheduledDate] = useState(todayIso);
  const [recurrence, setRecurrence] = useState<ReminderRecurrence>("once");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTargetAll(false); setSelected([]);
      setMessage(template || "Hello {tenant}, this is a reminder that your rent of {amount} for {month} is due. Please pay by the {due_date}.");
      setScheduledDate(new Date().toISOString().slice(0, 10));
      setRecurrence("once");
    }
  }, [open, template]);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function insert(token: string) { setMessage((m) => `${m}${m && !m.endsWith(" ") ? " " : ""}${token} `); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) { toast.error("Write a message."); return; }
    if (!targetAll && selected.length === 0) { toast.error("Select at least one tenant (or choose All tenants)."); return; }
    try {
      setSaving(true);
      const res = await rentMasterFetch<{ delivered?: number }>("/api/admin/reminders", {
        method: "POST", role: "owner",
        body: JSON.stringify({ targetAll, tenantIds: selected, message: message.trim(), scheduledDate, recurrence }),
      });
      const sentNow = scheduledDate <= todayIso;
      toast.success(sentNow ? `Reminder sent to ${res.delivered ?? 0} tenant(s).` : "Reminder scheduled.");
      await onCreated();
      onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title="New rent reminder"
      subtitle="Pick tenants, write the message, and choose when it goes out.">
      <form onSubmit={submit} className="space-y-4">
        {/* Recipients */}
        <Field label="Recipients" required>
          <button type="button" onClick={() => setTargetAll((v) => !v)}
            className={`mb-2 flex w-full items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition ${
              targetAll ? "border-primary/40 bg-primary/10 text-primary" : "border-line/[0.08] text-fg hover:bg-overlay/[0.04]"
            }`}>
            {targetAll ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            All tenants
          </button>
          {!targetAll && (
            <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-line/[0.06] bg-overlay/[0.02] p-2">
              {tenants.length === 0 && <p className="p-2 text-xs text-subtle">No tenants yet.</p>}
              {tenants.map((t) => {
                const on = selected.includes(t.id);
                return (
                  <button type="button" key={t.id} onClick={() => toggle(t.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                      on ? "bg-success/10 text-success" : "text-fg hover:bg-overlay/[0.04]"
                    }`}>
                    {on ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-subtle" />}
                    <span className="flex-1 text-left">{t.name}</span>
                    <span className="text-xs text-subtle">{t.phone}</span>
                  </button>
                );
              })}
            </div>
          )}
          {!targetAll && selected.length > 0 && (
            <p className="mt-1.5 text-xs text-subtle">{selected.length} selected</p>
          )}
        </Field>

        {/* Message + placeholders */}
        <Field label="Message" required>
          <TextArea required rows={4} value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Write the reminder…" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {REMINDER_PLACEHOLDERS.map((p) => (
              <button type="button" key={p} onClick={() => insert(p)}
                className="rounded-md bg-overlay/[0.05] px-2 py-1 font-mono text-[11px] text-fg transition hover:bg-overlay/[0.1]">
                {p}
              </button>
            ))}
          </div>
        </Field>

        {/* Schedule */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" required>
            <TextInput type="date" required min={todayIso} value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)} />
          </Field>
          <Field label="Repeat" required>
            <Select value={recurrence} onChange={(e) => setRecurrence(e.target.value as ReminderRecurrence)}>
              <option value="once">One-time</option>
              <option value="monthly">Every month on this day</option>
            </Select>
          </Field>
        </div>

        <Button type="submit" loading={saving} icon={Send} className="w-full">
          {scheduledDate <= todayIso ? "Send reminder" : "Schedule reminder"}
        </Button>
      </form>
    </Modal>
  );
}

/* ============================================================ EDIT MODALS */
function EditPropertyModal({
  property, onClose, onSaved,
}: { property: Property | null; onClose: () => void; onSaved: (p: Property) => void }) {
  const [form, setForm] = useState({ name: "", address: "", flatNo: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (property) setForm({ name: property.name, address: property.address, flatNo: property.flat_no });
  }, [property]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!property) return;
    try {
      setSaving(true);
      const res = await rentMasterFetch(`/api/admin/properties/${property.id}`, {
        method: "PATCH", role: "owner",
        body: JSON.stringify({ name: form.name, address: form.address, flatNo: form.flatNo }),
      });
      if (res.success) { onSaved(res.data); onClose(); toast.success("Property updated."); }
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={!!property} onClose={onClose} title="Edit property" subtitle="Update this unit's details.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Property name" required>
          <TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Address" required>
          <TextInput required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Field>
        <Field label="Flat / Unit no." required>
          <TextInput required value={form.flatNo} onChange={(e) => setForm({ ...form, flatNo: e.target.value })} />
        </Field>
        <Button type="submit" loading={saving} className="w-full">Save changes</Button>
      </form>
    </Modal>
  );
}

const SERVICE_CHARGE_FIELDS = [
  { key: "caretaker", label: "Caretaker" },
  { key: "security_guard", label: "Security guard" },
  { key: "lift_maintenance", label: "Lift maintenance" },
  { key: "water", label: "Water" },
  { key: "common_electricity", label: "Common electricity" },
  { key: "common_gas", label: "Common gas" },
  { key: "dust_collectors", label: "Dust collectors" },
] as const;

function ServiceChargeModal({ property, onClose }: { property: Property | null; onClose: () => void }) {
  const blank = Object.fromEntries(SERVICE_CHARGE_FIELDS.map((f) => [f.key, "0"])) as Record<string, string>;
  const [form, setForm] = useState<Record<string, string>>(blank);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!property) return;
    setForm(blank);
    (async () => {
      try {
        setLoading(true);
        const res = await rentMasterFetch(
          `/api/admin/service-charge?propertyId=${encodeURIComponent(property.id)}`,
          { role: "owner" }
        );
        if (res.data) {
          setForm(Object.fromEntries(
            SERVICE_CHARGE_FIELDS.map((f) => [f.key, String(res.data[f.key] ?? 0)])
          ) as Record<string, string>);
        }
      } catch { /* start blank on error */ }
      finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property]);

  const total = SERVICE_CHARGE_FIELDS.reduce((s, f) => s + (Number(form[f.key]) || 0), 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!property) return;
    try {
      setSaving(true);
      const payload: Record<string, any> = { propertyId: property.id };
      for (const f of SERVICE_CHARGE_FIELDS) payload[f.key] = Number(form[f.key]) || 0;
      const res = await rentMasterFetch("/api/admin/service-charge", {
        method: "PUT", role: "owner", body: JSON.stringify(payload),
      });
      if (res.success) { onClose(); toast.success("Service charges saved."); }
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={!!property} onClose={onClose} size="lg"
      title="Service charge breakdown"
      subtitle={property ? `${property.name} · Flat ${property.flat_no}` : undefined}>
      {loading ? (
        <div className="py-8 text-center text-sm text-muted">Loading breakdown…</div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {SERVICE_CHARGE_FIELDS.map((f) => (
              <Field key={f.key} label={`${f.label} (৳)`}>
                <TextInput type="number" min="0" value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
              </Field>
            ))}
          </div>
          <div className="flex items-center justify-between rounded-xl border border-line/[0.06] bg-overlay/[0.03] px-4 py-3">
            <span className="text-sm font-semibold text-fg">Total service charge</span>
            <span className="text-xl font-black text-success">{formatCurrency(total)}</span>
          </div>
          <Button type="submit" loading={saving} className="w-full">Save breakdown</Button>
        </form>
      )}
    </Modal>
  );
}

function EditTenantModal({
  tenant, properties, onClose, onSaved,
}: { tenant: Tenant | null; properties: Property[]; onClose: () => void; onSaved: (t: Tenant) => void }) {
  const empty = { propertyId: "", name: "", phone: "", monthlyRent: "", serviceCharge: "", advanceAmount: "", dueDate: "", familyMembers: "" };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenant) setForm({
      propertyId: tenant.property_id ?? "",
      name: tenant.name, phone: tenant.phone,
      monthlyRent: String(tenant.monthly_rent ?? ""),
      serviceCharge: String(tenant.service_charge ?? 0),
      advanceAmount: String(tenant.advance_amount ?? 0),
      dueDate: String(tenant.due_date ?? ""),
      familyMembers: String(tenant.family_members ?? 1),
    });
  }, [tenant]);

  // A tenant can move into any unit that is free, or stay where they are. Occupied units
  // belonging to someone else are not offered — the backend rejects those anyway.
  const assignable = properties.filter((p) => p.is_vacant || p.id === tenant?.property_id);
  const moved = !!tenant && form.propertyId !== (tenant.property_id ?? "");

  const [revisions, setRevisions] = useState<RentRevision[]>([]);
  useEffect(() => {
    if (!tenant) { setRevisions([]); return; }
    (async () => {
      try {
        const res = await rentMasterFetch(`/api/admin/rent-revisions?tenantId=${encodeURIComponent(tenant.id)}`, { role: "owner" });
        setRevisions(res.data || []);
      } catch { setRevisions([]); }
    })();
  }, [tenant]);

  const rentChanged = !!tenant && Number(form.monthlyRent) !== Number(tenant.monthly_rent);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    try {
      setSaving(true);
      const res = await rentMasterFetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH", role: "owner",
        body: JSON.stringify({
          name: form.name, phone: form.phone,
          monthlyRent: form.monthlyRent, serviceCharge: form.serviceCharge,
          advanceAmount: form.advanceAmount, dueDate: form.dueDate, familyMembers: form.familyMembers,
          propertyId: form.propertyId || null,
        }),
      });
      if (res.success) { onSaved(res.data); onClose(); toast.success("Tenant updated."); }
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={!!tenant} onClose={onClose} size="lg" title="Edit tenant" subtitle="Update resident details, move the tenant, or revise rent.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Property" hint="Move the tenant to another unit, or leave them unassigned.">
          <Select value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })}>
            <option value="">— Unassigned —</option>
            {assignable.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · Flat {p.flat_no}{p.id === tenant?.property_id ? " (current)" : ""}
              </option>
            ))}
          </Select>
        </Field>
        {moved && (
          <div className="rounded-xl border border-accent/20 bg-accent/10 px-4 py-2.5 text-xs text-accent">
            {form.propertyId
              ? "The tenant's current unit will be marked vacant and the new one occupied."
              : tenant?.allow_login_unassigned
                ? "Unassigned tenants keep their record and history, but can't be invoiced until you assign them a unit. This tenant has the “Login allowed” override, so they'll still be able to sign in."
                : "Unassigned tenants keep their record and history, but can't be invoiced until you assign them a unit — and they'll be signed out and blocked from logging in. You can allow it from the Tenants list."}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full name" required>
            <TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Phone" required>
            <TextInput required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Monthly rent (৳)" required>
            <TextInput required type="number" min="0" value={form.monthlyRent}
              onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })} />
          </Field>
          <Field label="Rent due day" required hint="Day of month (1–31)">
            <TextInput required type="number" min="1" max="31" value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Service charge (৳)">
            <TextInput type="number" min="0" value={form.serviceCharge}
              onChange={(e) => setForm({ ...form, serviceCharge: e.target.value })} />
          </Field>
          <Field label="Advance / deposit (৳)">
            <TextInput type="number" min="0" value={form.advanceAmount}
              onChange={(e) => setForm({ ...form, advanceAmount: e.target.value })} />
          </Field>
        </div>
        <Field label="Family members">
          <TextInput type="number" min="1" value={form.familyMembers}
            onChange={(e) => setForm({ ...form, familyMembers: e.target.value })} />
        </Field>
        {rentChanged && (
          <div className="rounded-xl border border-warning/20 bg-warning/10 px-4 py-2.5 text-xs text-warning">
            Rent will change to {formatCurrency(Number(form.monthlyRent) || 0)} — the previous rent is archived for history.
          </div>
        )}
        <Button type="submit" loading={saving} className="w-full">Save changes</Button>
      </form>

      {revisions.length > 0 && (
        <div className="mt-6 space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-subtle">Rent revision history</h4>
          {revisions.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-line/[0.06] bg-overlay/[0.02] px-3 py-2 text-xs">
              <span className="text-muted">{formatDate(r.changed_at)}</span>
              <span className="text-fg">
                {formatCurrency(r.old_rent)} <span className="text-subtle">→</span>{" "}
                <span className="font-semibold text-success">{formatCurrency(r.new_rent)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* ============================================================ PROPERTY HISTORY */
function PropertyHistoryModal({ property, onClose }: { property: Property | null; onClose: () => void }) {
  const [rows, setRows] = useState<OccupancyHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!property) return;
    (async () => {
      try {
        setLoading(true);
        const res = await rentMasterFetch(`/api/admin/occupancy?propertyId=${encodeURIComponent(property.id)}`, { role: "owner" });
        setRows(res.data || []);
      } catch { setRows([]); }
      finally { setLoading(false); }
    })();
  }, [property]);

  return (
    <Modal open={!!property} onClose={onClose} size="lg" title="Occupancy history"
      subtitle={property ? `${property.name} · past residents` : undefined}>
      {loading ? (
        <p className="text-sm text-subtle">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">
          No past tenants archived yet. When you vacate this unit, the outgoing resident is recorded here.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((o) => (
            <div key={o.id} className="rounded-xl border border-line/[0.06] bg-overlay/[0.02] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-heading">{o.tenant_name}</div>
                <span className="text-xs text-subtle">{o.tenant_phone}</span>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-muted sm:grid-cols-3">
                <span>From: {o.lease_start ? formatDate(o.lease_start) : "—"}</span>
                <span>To: {o.lease_end ? formatDate(o.lease_end) : "—"}</span>
                <span className="font-semibold text-success">Rent paid: {formatCurrency(o.total_rent_paid ?? 0)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* ============================================================ OWNER SIGNATURE */
function SignatureModal({
  open, onClose, current, onSaved,
}: {
  open: boolean; onClose: () => void; current: string | null; onSaved: (url: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);

  function pick(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.warning("Please choose an image (a transparent PNG works best)."); return; }
    if (f.size > 8 * 1024 * 1024) { toast.warning("Image must be under 8MB."); return; }
    setPreview((p) => { if (p) URL.revokeObjectURL(p); return URL.createObjectURL(f); });
    setFile(f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    try {
      setSaving(true);
      const url = await uploadFile(file, { role: "owner", folder: "signatures" });
      const res = await rentMasterFetch("/api/admin/owner/signature", {
        method: "POST", role: "owner", body: JSON.stringify({ signatureUrl: url }),
      });
      if (res.success) {
        onSaved(url);
        setPreview((p) => { if (p) URL.revokeObjectURL(p); return ""; });
        setFile(null);
        onClose();
        toast.success("Signature saved.");
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Your signature"
      subtitle="Attached to every rent receipt you issue.">
      <form onSubmit={submit} className="space-y-4">
        {(preview || current) && (
          <div className="rounded-xl border border-line/[0.08] bg-white p-4 text-center">
            <img src={preview || current || ""} alt="Signature" className="mx-auto max-h-24 object-contain" />
          </div>
        )}
        <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line/[0.12] bg-overlay/[0.02] px-4 py-6 text-center text-sm text-muted transition hover:border-primary/40 hover:text-fg">
          <Upload className="h-5 w-5" />
          <span>{current ? "Replace signature image" : "Upload signature image"}</span>
          <span className="text-[11px] text-subtle">Transparent PNG recommended</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        </label>
        <Button type="submit" loading={saving} disabled={!file} className="w-full">Save signature</Button>
      </form>
    </Modal>
  );
}

/* ============================================================ SETTINGS */
const WA_PLACEHOLDERS = ["{tenant}", "{month}", "{amount}", "{status}", "{property}"];

function SettingsTab({
  template, onTemplateSaved, reminderTemplate, onReminderTemplateSaved,
}: {
  template: string; onTemplateSaved: (t: string) => void;
  reminderTemplate: string; onReminderTemplateSaved: (t: string) => void;
}) {
  const [text, setText] = useState(template);
  const [savingMsg, setSavingMsg] = useState(false);
  const [reminderText, setReminderText] = useState(reminderTemplate);
  const [savingReminder, setSavingReminder] = useState(false);

  // Keep the fields in sync if templates load after the tab first mounts.
  useEffect(() => { setText(template); }, [template]);
  useEffect(() => { setReminderText(reminderTemplate); }, [reminderTemplate]);

  async function saveTemplate(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSavingMsg(true);
      const res = await rentMasterFetch<{ whatsappMessageTemplate: string }>("/api/admin/owner/settings", {
        method: "POST", role: "owner", body: JSON.stringify({ whatsappMessageTemplate: text }),
      });
      onTemplateSaved(res.whatsappMessageTemplate ?? text);
      toast.success("Message template saved.");
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingMsg(false); }
  }

  async function saveReminderTemplate(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSavingReminder(true);
      const res = await rentMasterFetch<{ reminderMessageTemplate: string }>("/api/admin/owner/settings", {
        method: "POST", role: "owner", body: JSON.stringify({ reminderMessageTemplate: reminderText }),
      });
      onReminderTemplateSaved(res.reminderMessageTemplate ?? reminderText);
      toast.success("Reminder template saved.");
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingReminder(false); }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" subtitle="System preferences for your account." />

      {/* WhatsApp receipt message */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-success/10 p-2 text-success"><MessageCircle className="h-4 w-4" /></div>
          <div>
            <h3 className="text-sm font-bold text-heading">WhatsApp receipt message</h3>
            <p className="text-xs text-subtle">Sent alongside a rent receipt when you share it to WhatsApp.</p>
          </div>
        </div>
        <form onSubmit={saveTemplate} className="space-y-4">
          <Field label="Message template"
            hint="Leave blank to use a sensible default. Placeholders are filled in per receipt.">
            <TextArea rows={4} value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Hello {tenant}, please find your rent receipt for {month}. Amount: {amount} ({status})." />
          </Field>
          <div className="flex flex-wrap gap-1.5">
            {WA_PLACEHOLDERS.map((p) => (
              <button key={p} type="button"
                onClick={() => setText((t) => `${t}${t && !t.endsWith(" ") ? " " : ""}${p}`)}
                className="rounded-lg border border-line/[0.08] bg-overlay/[0.03] px-2 py-1 font-mono text-[11px] text-fg transition hover:border-success/40 hover:text-success">
                {p}
              </button>
            ))}
          </div>
          <Button type="submit" loading={savingMsg}>Save message</Button>
        </form>
      </Card>

      {/* Rent reminder message */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary"><CalendarClock className="h-4 w-4" /></div>
          <div>
            <h3 className="text-sm font-bold text-heading">Rent reminder message</h3>
            <p className="text-xs text-subtle">The default message pre-filled when you create a new reminder.</p>
          </div>
        </div>
        <form onSubmit={saveReminderTemplate} className="space-y-4">
          <Field label="Reminder template"
            hint="Leave blank to use a sensible default. Placeholders are filled in per tenant at send time.">
            <TextArea rows={4} value={reminderText} onChange={(e) => setReminderText(e.target.value)}
              placeholder="Hello {tenant}, your rent of {amount} for {month} is due. Please pay by the {due_date}." />
          </Field>
          <div className="flex flex-wrap gap-1.5">
            {REMINDER_PLACEHOLDERS.map((p) => (
              <button key={p} type="button"
                onClick={() => setReminderText((t) => `${t}${t && !t.endsWith(" ") ? " " : ""}${p}`)}
                className="rounded-lg border border-line/[0.08] bg-overlay/[0.03] px-2 py-1 font-mono text-[11px] text-fg transition hover:border-primary/40 hover:text-primary">
                {p}
              </button>
            ))}
          </div>
          <Button type="submit" loading={savingReminder}>Save reminder message</Button>
        </form>
      </Card>

      {/* Change password */}
      <ChangePasswordCard />
    </div>
  );
}

function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) { toast.error("New password must be at least 8 characters."); return; }
    if (next !== confirm) { toast.error("New passwords do not match."); return; }
    try {
      setSaving(true);
      await rentMasterFetch("/api/admin/owner/password", {
        method: "POST", role: "owner",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      setCurrent(""); setNext(""); setConfirm("");
      toast.success("Password updated.");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2 text-primary"><Lock className="h-4 w-4" /></div>
        <div>
          <h3 className="text-sm font-bold text-heading">Change password</h3>
          <p className="text-xs text-subtle">Update the password you use to sign in.</p>
        </div>
      </div>
      <form onSubmit={submit} className="max-w-md space-y-4">
        <Field label="Current password" required>
          <TextInput type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" />
        </Field>
        <Field label="New password" required hint="At least 8 characters.">
          <TextInput type="password" required value={next} onChange={(e) => setNext(e.target.value)} placeholder="••••••••" />
        </Field>
        <Field label="Confirm new password" required>
          <TextInput type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
        </Field>
        <Button type="submit" loading={saving}>Update password</Button>
      </form>
    </Card>
  );
}

/* ============================================================ MAINTENANCE STATUS */
function MaintenanceStatusModal({
  log, onClose, onSaved,
}: { log: MaintenanceLog | null; onClose: () => void; onSaved: (m: MaintenanceLog) => void }) {
  const [status, setStatus] = useState<ResolutionStatus>("reported");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (log) { setStatus(log.resolution_status); setRemarks(log.resolution_remarks ?? ""); }
  }, [log]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!log) return;
    try {
      setSaving(true);
      const res = await rentMasterFetch(`/api/admin/maintenance/${log.id}`, {
        method: "PATCH", role: "owner",
        body: JSON.stringify({ resolutionStatus: status, resolutionRemarks: remarks }),
      });
      if (res.success) { onSaved(res.data); onClose(); toast.success("Request updated."); }
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={!!log} onClose={onClose} title="Update maintenance status" subtitle={log ? log.issue_title : undefined}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Status" required>
          <Select value={status} onChange={(e) => setStatus(e.target.value as ResolutionStatus)}>
            <option value="reported">Reported</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
          </Select>
        </Field>
        <Field label="Remarks" hint="Shared with the tenant on their request.">
          <TextArea rows={4} placeholder="e.g. Plumber scheduled for Friday; parts ordered."
            value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </Field>
        <Button type="submit" loading={saving} className="w-full">Save update</Button>
      </form>
    </Modal>
  );
}

/* ============================================================ TENANT DOCUMENTS */
function OwnerDocumentsModal({ tenant, onClose }: { tenant: Tenant | null; onClose: () => void }) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("deed");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    setTitle(""); setDocType("deed"); setFile(null);
    (async () => {
      try {
        setLoading(true);
        const res = await rentMasterFetch(`/api/admin/documents?tenantId=${encodeURIComponent(tenant.id)}`, { role: "owner" });
        setDocs(res.data || []);
      } catch { setDocs([]); }
      finally { setLoading(false); }
    })();
  }, [tenant]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant || !file || !title.trim()) return;
    try {
      setUploading(true);
      const url = await uploadFile(file, { role: "owner", folder: "documents" });
      const res = await rentMasterFetch("/api/admin/documents", {
        method: "POST", role: "owner",
        body: JSON.stringify({ tenantId: tenant.id, title: title.trim(), docType, fileUrl: url }),
      });
      if (res.success) { setDocs((d) => [res.data, ...d]); setTitle(""); setFile(null); toast.success("Document uploaded."); }
    } catch (e: any) { toast.error(`Upload failed: ${e.message}`); }
    finally { setUploading(false); }
  }

  async function remove(id: string) {
    if (!(await confirmDialog({
      title: "Delete document?",
      message: "This permanently removes the document.",
      confirmLabel: "Delete",
      danger: true,
    }))) return;
    const prev = docs;
    setDocs((d) => d.filter((x) => x.id !== id));
    try {
      await rentMasterFetch(`/api/admin/documents/${id}`, { method: "DELETE", role: "owner" });
      toast.success("Document deleted.");
    } catch (e: any) { setDocs(prev); toast.error(`Delete failed: ${e.message}`); }
  }

  return (
    <Modal open={!!tenant} onClose={onClose} size="lg" title="Tenant documents"
      subtitle={tenant ? `${tenant.name} · visible only to this tenant` : undefined}>
      <form onSubmit={upload} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Document title" required>
            <TextInput required placeholder="e.g. Property deed" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Type">
            <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
              <option value="deed">Deed</option>
              <option value="agreement">Agreement</option>
              <option value="receipt">Receipt</option>
              <option value="other">Other</option>
            </Select>
          </Field>
        </div>
        <Field label="File" required hint="PDF or image, up to 8MB.">
          {file ? (
            <div className="flex items-center justify-between rounded-xl border border-line/[0.08] bg-overlay/[0.02] px-3 py-2 text-sm text-fg">
              <span className="truncate">{file.name}</span>
              <button type="button" onClick={() => setFile(null)} className="ml-2 text-muted transition hover:text-danger"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line/[0.12] bg-overlay/[0.02] px-4 py-4 text-sm text-muted transition hover:border-primary/40 hover:text-fg">
              <Upload className="h-4 w-4" /> Choose a file
              <input type="file" accept="image/*,application/pdf" className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          )}
        </Field>
        <Button type="submit" loading={uploading} disabled={!file || !title.trim()} icon={Upload} className="w-full">
          Upload document
        </Button>
      </form>

      <div className="mt-6 space-y-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-subtle">Existing documents</h4>
        {loading ? (
          <p className="text-sm text-subtle">Loading…</p>
        ) : docs.length === 0 ? (
          <p className="text-sm text-subtle">No documents yet for this tenant.</p>
        ) : (
          docs.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-xl border border-line/[0.06] bg-overlay/[0.02] px-3 py-2.5">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-fg">{d.title}</div>
                <div className="text-[10px] uppercase tracking-wider text-subtle">{d.doc_type ?? "document"} · {formatDate(d.created_at)}</div>
              </div>
              <a href={d.file_url} target="_blank" rel="noreferrer" title="Open"
                className="rounded-lg p-1.5 text-muted transition hover:bg-overlay/[0.06] hover:text-primary"><Download className="h-4 w-4" /></a>
              <button type="button" onClick={() => remove(d.id)} title="Delete"
                className="rounded-lg p-1.5 text-muted transition hover:bg-danger/10 hover:text-danger"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
