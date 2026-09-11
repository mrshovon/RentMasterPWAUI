"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Users, Settings, Plus, Pencil, KeyRound, Ban, ShieldCheck,
  Unlink, Building2, CircleDollarSign, ReceiptText, Home, HardHat, Wallet, Wrench,
  Megaphone, FileText, CreditCard, Trash2, TriangleAlert, CheckCircle2,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { rentMasterFetch } from "../../lib/api-service";
import { toast } from "../../components/toast";
import { confirmDialog } from "../../components/confirm";
import { useSessionGuard } from "../../lib/use-session";
import { usePresenceHeartbeat } from "../../lib/presence";
import { useTabState } from "../../lib/use-tab";
import { usePlan } from "../../lib/use-plan";
import { useRevalidateOnFocus } from "../../lib/use-revalidate";
import {
  Building, BuildingOwner, BuildingOwnerFlat, BuildingPlanState, BuildingServiceInvoice, Property,
} from "../../types/api";
import { formatCurrency, formatDate } from "../../lib/format";
import { DashboardShell, NavItem } from "../../components/shell";
import { useT } from "../../lib/i18n";
import { AppSettingsCard } from "../../components/app-settings-card";
import { SignatureCard } from "../../components/signature-card";
import { BuildingInvoicesTab } from "../../components/building-invoices-tab";
import { BuildingSpacesTab } from "../../components/building-spaces-tab";
import { BuildingSetupTab } from "../../components/building-setup-tab";
import { BuildingNoticesTab } from "../../components/building-notices-tab";
import { BuildingReportsTab } from "../../components/building-reports-tab";
import { BuildingPlanTab, BuildingPlanBanner } from "../../components/building-plan-tab";
import { StaffTab } from "../../components/staff-tab";
import { AccountsTab } from "../../components/accounts-tab";
import {
  Card, StatCard, Badge, Button, Modal, Field, TextInput, TextArea,
  PageHeader, EmptyState, FullScreenLoader, SearchInput, EmailField, PhoneField,
  PasswordInput, SectionBanner, MetricCard, HubTile,
} from "../../components/ui";
import { validateEmail, validatePhone, memberOwnerLoginId } from "../../lib/validate";

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
// This console IS covered by check-i18n. It was exempt once, on the grounds that it is an
// operator tool; that call was overturned when DashboardShell started showing a language
// toggle here, so every new string needs a lib/locales/bn.ts entry.
// =====================================================================================

export default function BuildingAdminDashboard() {
  const t = useT();
  const { session, checkingSession, logout } = useSessionGuard("building");
  usePresenceHeartbeat(!!session);

  const [tab, setTab] = useTabState("overview");
  const [building, setBuilding] = useState<Building | null>(null);
  const [owners, setOwners] = useState<BuildingOwner[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  // Every service-charge invoice this building has ever raised, not just the current month:
  // the Overview reports what is still OWED, and arrears do not expire at a month boundary.
  // The Service charge tab keeps its own month-scoped fetch; it answers a different question.
  const [invoices, setInvoices] = useState<BuildingServiceInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<BuildingOwner | null>(null);

  // A building admin is plan-governed exactly like an owner, and the Whole Building tier bundles
  // Staff and Accounts. usePlan is what keeps that current — an admin revoking an add-on mid
  // session must close the tab, not wait for the next login. See lib/use-plan.ts.
  const { plan } = usePlan(!!session);

  const load = useCallback(async () => {
    try {
      const [b, o, p, inv] = await Promise.allSettled([
        rentMasterFetch<{ data: Building }>("/api/admin/building"),
        rentMasterFetch<{ data: BuildingOwner[] }>("/api/admin/building/owners"),
        // The building's OWN rentable space, from the ordinary owner route — it already scopes on
        // owner_id, which for this caller is the building admin's uid.
        rentMasterFetch<{ data: Property[] }>("/api/admin/properties"),
        rentMasterFetch<{ data: BuildingServiceInvoice[] }>("/api/admin/building/invoices"),
      ]);
      if (b.status === "fulfilled") setBuilding(b.value.data);
      else toast.error((b.reason as Error).message);
      if (o.status === "fulfilled") setOwners(o.value.data || []);
      if (p.status === "fulfilled") setProperties(p.value.data || []);
      // Best-effort, like its two siblings above: a dashboard with no money figures still
      // beats a dashboard that refuses to render at all.
      if (inv.status === "fulfilled") setInvoices(inv.value.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) load();
  }, [session, load]);

  // Its own effect, not a fourth entry in load(): load() re-runs on window focus and on every
  // change the tabs report, and a signature never changes. Mirrors app/owner/page.tsx.
  // Uploaded from the Settings tab (SignatureCard), which calls setSignatureUrl directly so a
  // new signature reaches the receipts without a refetch. Null is fine: the documents print the
  // rule with no image above it.
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const res = await rentMasterFetch<{ signatureUrl?: string | null }>("/api/admin/owner/signature");
        setSignatureUrl(res.signatureUrl || null);
      } catch {
        /* non-fatal — a receipt without a signature image is still a receipt */
      }
    })();
  }, [session]);
  // The contract's live state, for the banner that rides above EVERY tab. Someone whose building
  // is days from locking should not have to open the Plan tab to discover that.
  const [planState, setPlanState] = useState<BuildingPlanState | null>(null);
  const loadPlanState = useCallback(async () => {
    try {
      const res = await rentMasterFetch<{ data: { state: BuildingPlanState | null } }>(
        "/api/admin/building/plan"
      );
      setPlanState(res.data?.state || null);
    } catch {
      /* non-fatal — no banner is better than a broken dashboard */
    }
  }, []);
  useEffect(() => { if (session) void loadPlanState(); }, [session, loadPlanState]);

  useRevalidateOnFocus(load);

  const metrics = useMemo(() => {
    const active = owners.filter((o) => o.is_active);
    // Per FLAT, not per owner. owners.default_service_charge is frozen at the roster level and
    // under-reports every owner who holds more than one flat — the same sum OwnersTab already
    // does for its own column. Falls back to the roster figure for a pre-flats row.
    const activeFlats = active.flatMap((o) =>
      o.flats?.length ? o.flats.filter((f) => f.is_active) : []);
    // Owners with no flats row at all (pre-ADD_BUILDING_OWNER_FLATS) still carry their charge
    // on the roster, and dropping them would silently under-report the monthly total.
    const flatlessCharge = active
      .filter((o) => !o.flats?.length)
      .reduce((sum, o) => sum + Number(o.default_service_charge || 0), 0);
    const unpaid = invoices.filter((i) => i.payment_status !== "paid");
    return {
      owners: owners.length,
      active: active.length,
      flats: activeFlats.length + active.filter((o) => !o.flats?.length).length,
      monthlyServiceCharge:
        activeFlats.reduce((sum, f) => sum + Number(f.default_service_charge || 0), 0) + flatlessCharge,
      invoiceCount: invoices.length,
      // What is still OWED — a partly-paid invoice contributes only its remaining balance.
      outstanding: unpaid.reduce(
        (sum, i) => sum + Math.max(0, Number(i.total_payable || 0) - Number(i.amount_paid || 0)),
        0,
      ),
      unpaidCount: unpaid.length,
      settledCount: invoices.length - unpaid.length,
      collectionPct: invoices.length
        ? Math.round(((invoices.length - unpaid.length) / invoices.length) * 100)
        : 0,
    };
  }, [owners, invoices]);

  const nav: NavItem[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "plan", label: "Plan", icon: CreditCard },
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
    toast.info(t("This module is part of the Whole Building plan. Contact support if it is switched off."));

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
      <BuildingPlanBanner state={planState} onOpen={() => setTab("plan")} />

      {tab === "overview" && (
        <OverviewTab
          building={building}
          metrics={metrics}
          planState={planState}
          properties={properties}
          nav={nav}
          onNavigate={setTab}
          onAdd={() => setCreateOpen(true)}
        />
      )}
      {tab === "plan" && <BuildingPlanTab building={building} />}
      {tab === "owners" && (
        <OwnersTab
          owners={owners}
          onAdd={() => setCreateOpen(true)}
          onEdit={setEditing}
          onReload={load}
        />
      )}
      {tab === "invoices" && (
        <BuildingInvoicesTab owners={owners} building={building} signatureUrl={signatureUrl} />
      )}
      {tab === "spaces" && (
        <BuildingSpacesTab onChanged={load} building={building} signatureUrl={signatureUrl} />
      )}
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
      {tab === "notices" && (
        <BuildingNoticesTab building={building} owners={owners} signatureUrl={signatureUrl} />
      )}
      {tab === "reports" && <BuildingReportsTab owners={owners} signatureUrl={signatureUrl} />}
      {tab === "setup" && <BuildingSetupTab />}
      {tab === "settings" && (
        <SettingsTab
          building={building}
          onSaved={load}
          signatureUrl={signatureUrl}
          onSignatureSaved={setSignatureUrl}
        />
      )}

      <CreateOwnerModal
        open={createOpen}
        building={building}
        onClose={() => setCreateOpen(false)}
        onCreated={load}
      />
      <EditOwnerModal owner={editing} onClose={() => setEditing(null)} onSaved={load} />
    </DashboardShell>
  );
}

/* ============================================================ OVERVIEW */
// The console landing screen is a HUB, matching the owner Overview (app/owner/page.tsx): a
// building strip, the two numbers that decide whether this month needs any action, and a launcher
// for every other tab. The old 3-up StatCard row is gone — the metric pair and the collection line
// say the same things in one place instead of two that can disagree.
//
// The "Your plan" card stays below the hub: it is the only screen in the app that says what the
// Whole Building plan actually covers.

/** Remembers whether the Overview body is expanded. Per browser, per device. */
const OVERVIEW_OPEN_KEY = "bari360-building-overview-open";

type TileTone = "neutral" | "primary" | "success" | "warning" | "danger";

function OverviewTab({
  building, metrics, planState, properties, nav, onNavigate, onAdd,
}: {
  building: Building | null;
  metrics: {
    owners: number; active: number; flats: number; monthlyServiceCharge: number;
    invoiceCount: number; outstanding: number;
    unpaidCount: number; settledCount: number; collectionPct: number;
  };
  /** The contract's live state, for the Plan tile's one line of detail. Null until it loads, or
   *  if the request failed — the tile then falls back to naming the plan rather than a date. */
  planState: BuildingPlanState | null;
  properties: Property[];
  /** The shell's own nav array. The tile grid is built from it so the two can never disagree
   *  about what exists, what it is called, or what its badge says. */
  nav: NavItem[];
  onNavigate: (key: string) => void;
  onAdd: () => void;
}) {
  const t = useT();

  // Initialised to `true` and corrected on mount rather than read from storage during render:
  // reading localStorage while rendering desynchronises the server-rendered HTML from the
  // client's first paint.
  const [open, setOpen] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem(OVERVIEW_OPEN_KEY) === "0") setOpen(false);
    } catch { /* private mode / storage disabled — stay expanded */ }
  }, []);
  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      try { localStorage.setItem(OVERVIEW_OPEN_KEY, next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  }

  // Which number the Service charge tile reports. A LENS on the same invoices, not a filter:
  // nothing is hidden anywhere else on the screen, and the tile still opens the full tab.
  const [lens, setLens] = useState<"all" | "unpaid">("all");

  // Whole phrases either side of the assembly — a bare "flats" is not a translatable string.
  const flatCount = t(metrics.flats === 1 ? "{0} flat" : "{0} flats").replace("{0}", String(metrics.flats));
  const ownerCount = t(metrics.owners === 1 ? "{0} owner" : "{0} owners").replace("{0}", String(metrics.owners));

  // The Plan tile's line. Days beat a date when the clock is running out, and the honest answer
  // while planState is still in flight is the plan's name, not a guess at its expiry.
  const planSub = !planState
    ? t("Whole Building")
    : planState.status === "locked"
      ? t("Locked — renew to continue")
      : planState.status === "grace" && planState.daysLeftInGrace != null
        ? t("{0} days left in grace").replace("{0}", String(planState.daysLeftInGrace))
        : planState.warnExpiringSoon && planState.daysUntilExpiry != null
          ? t("{0} days left").replace("{0}", String(planState.daysUntilExpiry))
          : planState.expiryDate
            ? t("Active until {0}").replace("{0}", formatDate(planState.expiryDate))
            : t("Whole Building");

  // How each tile presents itself, keyed by nav key. Everything else about a tile — its label,
  // icon, badge and locked flag — comes straight off the nav item.
  const tileMeta: Record<string, { sub: ReactNode; tone: TileTone }> = {
    plan: { tone: "warning", sub: planSub },
    owners: { tone: "neutral", sub: `${ownerCount}, ${flatCount}` },
    invoices: {
      tone: metrics.outstanding > 0 ? "danger" : "success",
      sub: lens === "unpaid"
        ? t("{0} unpaid").replace("{0}", String(metrics.unpaidCount))
        : t("{0} due").replace("{0}", formatCurrency(metrics.outstanding)),
    },
    spaces: {
      tone: "neutral",
      sub: t(properties.length === 1 ? "{0} building-owned unit" : "{0} building-owned units")
        .replace("{0}", String(properties.length)),
    },
    staff: { tone: "neutral", sub: t("Guards & maids") },
    accounts: { tone: "primary", sub: t("Ledger & dues") },
    notices: { tone: "neutral", sub: t("Send alerts") },
    reports: { tone: "primary", sub: t("Statements & income") },
    setup: { tone: "neutral", sub: t("Amenities & sources") },
    settings: { tone: "neutral", sub: t("Preferences") },
  };

  // Every tab except this one. Order, labels, badges and the add-on crowns all come from nav.
  const tiles = nav.filter((n) => n.key !== "overview");

  return (
    <div className="space-y-3">
      {/* ---- Which building this is, how big it is, and the one creation action ---- */}
      <Card className="flex items-center gap-3 p-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Badge tone="indigo">Whole Building</Badge>
            <span className="truncate text-sm font-bold text-heading">
              {building?.name || t("Your building")}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
            <span className="truncate">
              {building?.address || t("Add an address in Settings so it prints on your notices.")}
            </span>
            {metrics.flats > 0 && (
              <>
                {/* A drawn dot, not a middot character: a punctuation-only text node is copy as
                    far as check-i18n is concerned, and there is nothing here to translate. */}
                <span className="h-1 w-1 shrink-0 rounded-full bg-faint" aria-hidden />
                <span className="font-bold text-success">{flatCount}</span>
              </>
            )}
          </div>
        </div>
        <Button icon={Plus} onClick={onAdd} className="shrink-0 rounded-full">Add owner</Button>
      </Card>

      {/* ---- The section header, which is also its collapse control ---- */}
      <SectionBanner
        title="Overview"
        badgeLabel="Live"
        subtitle="Service charge, owners & building finances"
        icon={LayoutDashboard}
        open={open}
        onToggle={toggleOpen}
      />

      {open && (
        <div className="space-y-3 animate-fade-in">
          {/* ---- The two numbers that decide whether this month needs action ---- */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              tone="success"
              label="Service charge / month"
              icon={CircleDollarSign}
              value={formatCurrency(metrics.monthlyServiceCharge)}
              sub={t("Sum of every active flat")}
            />
            <MetricCard
              tone="danger"
              label="Outstanding"
              icon={TriangleAlert}
              value={formatCurrency(metrics.outstanding)}
              sub={t(metrics.unpaidCount === 1 ? "{0} unpaid invoice" : "{0} unpaid invoices")
                .replace("{0}", String(metrics.unpaidCount))}
            />
          </div>

          {/* ---- Collection, in one line, with the lens for the Service charge tile ---- */}
          <Card className="flex items-center gap-2.5 p-3.5">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden />
            <span className="min-w-0 flex-1 text-[13px] font-bold text-heading">
              {metrics.invoiceCount
                ? t("Collection: {0}% ({1} of {2} invoices settled)")
                    .replace("{0}", String(metrics.collectionPct))
                    .replace("{1}", String(metrics.settledCount))
                    .replace("{2}", String(metrics.invoiceCount))
                : t("No service-charge invoices raised yet.")}
            </span>
            <div className="flex shrink-0 rounded-full border border-success/30 bg-success/10 p-0.5 text-[10px] font-bold">
              {(["all", "unpaid"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLens(key)}
                  aria-pressed={lens === key}
                  className={cn(
                    "rounded-full px-2 py-1 transition",
                    lens === key ? "bg-success text-btn-ink" : "text-success",
                  )}
                >
                  {t(key === "all" ? "All" : "Unpaid")}
                </button>
              ))}
            </div>
          </Card>

          {/* ---- The launcher ---- */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {tiles.map((item) => {
              const meta = tileMeta[item.key];
              return (
                <HubTile
                  key={item.key}
                  label={item.label}
                  sub={meta?.sub}
                  icon={item.icon}
                  tone={meta?.tone ?? "neutral"}
                  // The lens only ever changes what the Service charge tile reports.
                  badge={item.key === "invoices" && lens === "unpaid" ? metrics.unpaidCount : item.badge}
                  locked={item.locked}
                  onClick={() => onNavigate(item.key)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ---- Kept below the hub: the only screen that says what the plan covers ---- */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-heading">{t("Your plan")}</h3>
        {/* One key, with the plan name slotted in: Bangla puts the name elsewhere in the
            clause, so splitting the sentence around <strong> would fix English word order
            onto Bangla words. The name loses its bold; the sentence stays grammatical. */}
        <p className="mt-2 text-sm text-muted">
          {t("This building runs on the {0} plan. Every owner you create here is covered by it — they never see a price or a payment screen, and they are not capped at the free limits. The plan also covers software maintenance and support, app updates, help with content changes, and custom features built for your building. It does not cover building or property maintenance.")
            .replace("{0}", t("Whole Building"))}
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
  const t = useT();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = owners.filter((o) => {
    const flatLabels = (o.flats || []).map((f) => f.unit_label || "").join(" ");
    const hay = `${o.name || ""} ${o.email || ""} ${o.phone || ""} ${o.unit_label || ""} ${flatLabels}`.toLowerCase();
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
        // Deliberately no figures. This said "(2 properties, 2 tenants)" while the live
        // free_tier row allows 1/1 — a hardcoded limit in prose drifts the moment the plan does.
        "Their login keeps working and nothing is deleted — but they leave your building, and their plan drops back to the free limits. Their login ID stays reserved to them, so the next owner of that flat gets a numbered variant of it.",
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

  // Deliberately a modal rather than window.prompt. For an owner whose login is a generated
  // identifier this is the ONLY way back into their account, so it has to show them which login
  // the password belongs to — and a prompt cannot mask what is being typed, cannot display the
  // ID beside it, and is blocked outright in the Android WebView on some versions.
  const [resetting, setResetting] = useState<BuildingOwner | null>(null);

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
                <th className="p-4">{t("Owner")}</th>
                <th className="p-4">{t("Flat")}</th>
                <th className="p-4">{t("Service charge")}</th>
                <th className="p-4">{t("Joined")}</th>
                <th className="p-4">{t("Status")}</th>
                <th className="p-4 text-right">{t("Actions")}</th>
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
                  <td className="p-4 text-fg">
                    {(o.flats?.filter((f) => f.is_active).map((f) => f.unit_label).filter(Boolean).join(", "))
                      || o.unit_label || "—"}
                  </td>
                  <td className="p-4 text-fg">
                    {/* The sum across their flats — one number per person is what the column meant
                        before an owner could hold several. */}
                    {formatCurrency(
                      o.flats?.length
                        ? o.flats.filter((f) => f.is_active).reduce((sum, f) => sum + Number(f.default_service_charge || 0), 0)
                        : Number(o.default_service_charge || 0),
                    )}
                  </td>
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
                        onClick={() => setResetting(o)}
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

      <ResetPasswordModal
        owner={resetting}
        onClose={() => setResetting(null)}
        onDone={async (ownerId, password) => {
          await act(ownerId, { action: "password", password }, "Password reset. Give it to them out of band.");
          setResetting(null);
        }}
      />
    </div>
  );
}

/* ============================================================ RESET PASSWORD */

function ResetPasswordModal({
  owner,
  onClose,
  onDone,
}: {
  owner: BuildingOwner | null;
  onClose: () => void;
  onDone: (ownerId: string, password: string) => Promise<void>;
}) {
  const t = useT();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setPassword(""); setConfirm(""); }, [owner?.owner_id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (password !== confirm) { toast.error("The two passwords do not match."); return; }
    try {
      setSaving(true);
      await onDone(owner!.owner_id, password);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={!!owner}
      onClose={onClose}
      title="Reset password"
      subtitle={owner?.name || "This owner"}
    >
      <form onSubmit={submit} className="space-y-4">
        {/* Shown because the admin has to relay both halves, and for a generated login this is
            the only place the ID is visible next to the password it belongs to. */}
        <div className="rounded-xl border border-line/[0.08] bg-overlay/[0.02] p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted">{t("Login ID")}</p>
          <p className="mt-1 font-mono text-sm break-all text-heading">{owner?.email || "—"}</p>
        </div>
        <Field label="New password" required hint="At least 8 characters.">
          <PasswordInput required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Confirm password" required>
          <PasswordInput required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <p className="text-xs text-muted">
          {t("Nothing is emailed — a building login has no inbox. Send the new password to them yourself.")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Set password</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ============================================================ FLATS */
// An owner may hold several flats in the building under ONE login — the point of the whole
// feature. These helpers are shared by the create form and the edit form so the two can never
// disagree about what a valid flat list looks like.
//
// THE FIRST FLAT IS SPECIAL ON CREATE ONLY: the login identifier is built from it and then frozen.
// Adding a fourth flat, or removing the one the identifier came from, never changes how the person
// signs in — see app/api/admin/building/owners/[id]/route.ts.

interface FlatDraft {
  unitLabel: string;
  defaultServiceCharge: string;
}

const blankFlat = (): FlatDraft => ({ unitLabel: "", defaultServiceCharge: "" });

/** Returns an error message, or null when the list is fine. */
function validateFlats(flats: FlatDraft[], opts: { requireFirst: boolean }): string | null {
  if (!flats.length) return "Add at least one flat.";
  if (opts.requireFirst && !flats[0].unitLabel.trim()) {
    return "The first flat needs a number — the login is built from it.";
  }
  if (flats.some((f, i) => i > 0 && !f.unitLabel.trim())) return "Every flat needs a number.";
  const seen = new Set<string>();
  for (const f of flats) {
    const key = f.unitLabel.trim().toLowerCase();
    if (key && seen.has(key)) return `${f.unitLabel} is listed twice.`;
    seen.add(key);
  }
  return null;
}

function FlatRows({
  flats, setFlats, requireFirst, firstIsLogin,
}: {
  flats: FlatDraft[];
  setFlats: (f: FlatDraft[]) => void;
  requireFirst: boolean;
  /** True on create for a building that issues identifiers — the first row feeds the login. */
  firstIsLogin: boolean;
}) {
  const t = useT();
  const set = (i: number, patch: Partial<FlatDraft>) =>
    setFlats(flats.map((f, x) => (x === i ? { ...f, ...patch } : f)));

  return (
    <div className="space-y-3 rounded-xl border border-line/[0.08] bg-overlay/[0.02] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-heading">{t("Flats")}</p>
          <p className="text-xs text-muted">
            {t("One login covers all of them. Each flat is billed its own service charge.")}
          </p>
        </div>
        <Button type="button" size="sm" variant="secondary" icon={Plus}
          onClick={() => setFlats([...flats, blankFlat()])}>
          {t("Add flat")}
        </Button>
      </div>

      {flats.map((f, i) => (
        <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field
            label={i === 0 && firstIsLogin ? "Flat number" : "Flat / unit"}
            required={i === 0 ? requireFirst : true}
            hint={i === 0 && firstIsLogin ? "Part of their login. It never changes, even if this flat does." : undefined}
          >
            <TextInput
              required={i === 0 ? requireFirst : true}
              value={f.unitLabel}
              placeholder="3B"
              onChange={(e) => set(i, { unitLabel: e.target.value })}
            />
          </Field>
          <Field label="Monthly service charge" hint={i === 0 ? "Pre-fills each invoice; editable per month." : undefined}>
            <TextInput type="number" min="0" step="0.01" value={f.defaultServiceCharge}
              onChange={(e) => set(i, { defaultServiceCharge: e.target.value })} />
          </Field>
          {flats.length > 1 ? (
            <Button type="button" size="sm" variant="ghost" icon={Trash2}
              onClick={() => setFlats(flats.filter((_, x) => x !== i))}>
              {t("Remove")}
            </Button>
          ) : (
            <span />
          )}
        </div>
      ))}
    </div>
  );
}

/* ============================================================ CREATE / EDIT OWNER */

function CreateOwnerModal({
  open,
  building,
  onClose,
  onCreated,
}: {
  open: boolean;
  building: Building | null;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const t = useT();
  const empty = { name: "", email: "", phone: "", password: "" };
  const [form, setForm] = useState(empty);
  // An owner may hold several flats under ONE login. The FIRST one is special: it is what the
  // login identifier is built from, and that identifier is frozen at creation — adding or removing
  // flats later never changes how they sign in.
  const [flats, setFlats] = useState<FlatDraft[]>([blankFlat()]);
  const [saving, setSaving] = useState(false);
  const [issued, setIssued] = useState<{ name: string; loginId: string } | null>(null);

  // A house number on the building is what switches this form from "type their email" to
  // "their login is generated". A building that predates the feature simply never turns it on.
  const houseNo = building?.house_no || "";
  const generatesLogins = !!houseNo;
  const preview = generatesLogins ? memberOwnerLoginId(houseNo, flats[0].unitLabel, form.phone) : null;

  function close() {
    setIssued(null);
    setFlats([blankFlat()]);
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    let email = "";
    if (!generatesLogins) {
      const parsedEmail = validateEmail(form.email, { required: true });
      if (!parsedEmail.ok) { toast.error(parsedEmail.error); return; }
      email = parsedEmail.value;
    }
    const parsedPhone = validatePhone(form.phone, { required: generatesLogins });
    if (!parsedPhone.ok) { toast.error(parsedPhone.error); return; }
    if (preview && !preview.ok) { toast.error(preview.error); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    const flatError = validateFlats(flats, { requireFirst: generatesLogins });
    if (flatError) { toast.error(flatError); return; }

    try {
      setSaving(true);
      const res = await rentMasterFetch<{ data?: any; warnings?: string[] }>("/api/admin/building/owners", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          email,
          phone: parsedPhone.value,
          flats: flats.map((f) => ({
            unitLabel: f.unitLabel,
            defaultServiceCharge: Number(f.defaultServiceCharge || 0),
          })),
        }),
      });
      const name = form.name;
      setForm(empty);
      setFlats([blankFlat()]);
      await onCreated();

      // A property that could not be created is worth saying out loud — the owner can still make
      // it themselves, but nobody would know to.
      (res?.warnings || []).forEach((w: string) => toast.warning(w));

      // A generated login has to be copied off the screen and passed on by hand, so the modal
      // holds it instead of closing behind a toast that fades.
      if (generatesLogins && res?.data?.email) {
        setIssued({ name, loginId: res.data.email });
      } else {
        onClose();
        toast.success("Owner created. Give them the password out of band.");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (issued) {
    return (
      <Modal open={open} onClose={close} title="Owner created" subtitle="Pass these on — nothing was emailed.">
        <div className="space-y-4">
          <div className="rounded-xl border border-line/[0.08] bg-overlay/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted">{t("Login ID for {0}").replace("{0}", issued.name)}</p>
            <p className="mt-1 font-mono text-sm break-all text-heading">{issued.loginId}</p>
          </div>
          <p className="text-sm text-muted">
            {t("This is what they sign in with, together with the password you set. It has no inbox — if they forget the password, reset it from their row on the roster.")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => {
              navigator.clipboard?.writeText(issued.loginId);
              toast.success("Copied.");
            }}>Copy login ID</Button>
            <Button onClick={close}>Done</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={close} title="Add an owner"
      subtitle="They get an ordinary owner login, covered by this building's plan.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" required>
          <TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {!generatesLogins && (
            <EmailField label="Email" required value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          )}
          <PhoneField label="Phone" required={generatesLogins} value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })} />
        </div>

        <FlatRows
          flats={flats}
          setFlats={setFlats}
          requireFirst={generatesLogins}
          firstIsLogin={generatesLogins}
        />
        {preview?.ok && (
          <div className="rounded-lg border border-line/[0.08] bg-overlay/[0.02] px-3 py-2 text-sm">
            <span className="text-muted">{t("Login")}: </span>
            <span className="font-mono break-all text-heading">{preview.value}</span>
            <span className="block text-xs text-muted">{t("Confirmed when the account is created.")}</span>
          </div>
        )}
        <Field label="Temporary password" required hint="At least 8 characters. Send it to them separately.">
          <PasswordInput required minLength={8} value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <Button type="submit" loading={saving} className="w-full">Create owner</Button>
      </form>
    </Modal>
  );
}

/**
 * Managing an existing owner's flats.
 *
 * Each action is its OWN request against /owners/[id]/flats — add, save, remove. Deliberately not
 * an array diffed on save: a diff is how a flat with a year of invoices behind it gets deleted
 * because it was missing from a payload. Adding and removing are different decisions with
 * different consequences, so they are different buttons.
 *
 * Removing a flat never touches the property behind it. The tenant, their rent invoices and the
 * receipts all stay in the owner's own dashboard — the server says so in its response and this
 * surfaces that message rather than inventing its own.
 */
function OwnerFlatsEditor({
  ownerId, flats, onChanged,
}: {
  ownerId: string;
  flats: BuildingOwnerFlat[];
  onChanged: () => Promise<void>;
}) {
  const t = useT();
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState<FlatDraft | null>(null);
  const [edits, setEdits] = useState<Record<string, FlatDraft>>({});

  const draftFor = (fl: BuildingOwnerFlat): FlatDraft =>
    edits[fl.id] ?? { unitLabel: fl.unit_label || "", defaultServiceCharge: String(fl.default_service_charge ?? "") };

  async function call(id: string, run: () => Promise<any>) {
    try {
      setBusy(id);
      const res = await run();
      (res?.warnings || []).forEach((w: string) => toast.warning(w));
      if (res?.message) toast.success(res.message);
      await onChanged();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-line/[0.08] bg-overlay/[0.02] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-heading">{t("Flats")}</p>
          <p className="text-xs text-muted">
            {t("One login covers all of them. Each flat is billed its own service charge.")}
          </p>
        </div>
        {!adding && (
          <Button type="button" size="sm" variant="secondary" icon={Plus} onClick={() => setAdding(blankFlat())}>
            {t("Add flat")}
          </Button>
        )}
      </div>

      {flats.length === 0 && !adding && (
        <p className="text-xs text-subtle">{t("No flats yet. Add one so this owner can be billed.")}</p>
      )}

      {flats.map((fl) => {
        const d = draftFor(fl);
        const dirty = d.unitLabel !== (fl.unit_label || "") ||
          Number(d.defaultServiceCharge || 0) !== Number(fl.default_service_charge || 0);
        return (
          <div key={fl.id} className={`grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end ${fl.is_active ? "" : "opacity-60"}`}>
            <Field label="Flat / unit">
              <TextInput value={d.unitLabel}
                onChange={(e) => setEdits({ ...edits, [fl.id]: { ...d, unitLabel: e.target.value } })} />
            </Field>
            <Field label="Monthly service charge">
              <TextInput type="number" min="0" step="0.01" value={d.defaultServiceCharge}
                onChange={(e) => setEdits({ ...edits, [fl.id]: { ...d, defaultServiceCharge: e.target.value } })} />
            </Field>
            <div className="flex flex-wrap gap-2">
              {dirty && (
                <Button type="button" size="sm" loading={busy === fl.id}
                  onClick={() => call(fl.id, async () => {
                    const r = await rentMasterFetch(`/api/admin/building/owners/${ownerId}/flats/${fl.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({
                        unitLabel: d.unitLabel,
                        defaultServiceCharge: Number(d.defaultServiceCharge || 0),
                      }),
                    });
                    setEdits((x) => { const n = { ...x }; delete n[fl.id]; return n; });
                    return r;
                  })}>
                  {t("Save")}
                </Button>
              )}
              {/* Deactivate stops the flat being billed and keeps every invoice behind it. It is
                  what an admin almost always means by "remove", so it is the plain button. */}
              <Button type="button" size="sm" variant="secondary" loading={busy === fl.id}
                onClick={() => call(fl.id, () => rentMasterFetch(`/api/admin/building/owners/${ownerId}/flats/${fl.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({ isActive: !fl.is_active }),
                }))}>
                {t(fl.is_active ? "Deactivate" : "Reactivate")}
              </Button>
              <Button type="button" size="sm" variant="danger" icon={Trash2} loading={busy === fl.id}
                onClick={async () => {
                  const ok = await confirmDialog({
                    title: `Remove ${fl.unit_label || "this flat"}?`,
                    message: "The flat stops being billed. Its property, tenant and rent history stay in the owner's own dashboard.",
                    confirmLabel: "Remove",
                    danger: true,
                  });
                  if (!ok) return;
                  void call(fl.id, () => rentMasterFetch(`/api/admin/building/owners/${ownerId}/flats/${fl.id}`, { method: "DELETE" }));
                }}>
                {t("Remove")}
              </Button>
            </div>
          </div>
        );
      })}

      {adding && (
        <div className="grid gap-3 border-t border-line/[0.06] pt-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Flat / unit" required>
            <TextInput autoFocus value={adding.unitLabel} placeholder="4A"
              onChange={(e) => setAdding({ ...adding, unitLabel: e.target.value })} />
          </Field>
          <Field label="Monthly service charge">
            <TextInput type="number" min="0" step="0.01" value={adding.defaultServiceCharge}
              onChange={(e) => setAdding({ ...adding, defaultServiceCharge: e.target.value })} />
          </Field>
          <div className="flex gap-2">
            <Button type="button" size="sm" loading={busy === "new"}
              onClick={() => {
                if (!adding.unitLabel.trim()) { toast.error("The flat needs a number."); return; }
                void call("new", async () => {
                  const r = await rentMasterFetch(`/api/admin/building/owners/${ownerId}/flats`, {
                    method: "POST",
                    body: JSON.stringify({
                      flats: [{ unitLabel: adding.unitLabel, defaultServiceCharge: Number(adding.defaultServiceCharge || 0) }],
                    }),
                  });
                  setAdding(null);
                  return r;
                });
              }}>
              {t("Add")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(null)}>{t("Cancel")}</Button>
          </div>
        </div>
      )}
    </div>
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
  const t = useT();
  const [form, setForm] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!owner) return;
    setForm({ name: owner.name || "", phone: owner.phone || "" });
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
        // Flats are managed by their own requests below, not folded into this payload.
        body: JSON.stringify({ name: form.name, phone: parsedPhone.value }),
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
        <Button type="submit" loading={saving} className="w-full">Save changes</Button>
      </form>

      {/* Outside the form on purpose: each flat action is its own request and must not be swept
          up by the name/phone submit. */}
      {owner && (
        <div className="mt-4">
          <OwnerFlatsEditor ownerId={owner.owner_id} flats={owner.flats || []} onChanged={onSaved} />
        </div>
      )}
    </Modal>
  );
}

/* ============================================================ SETTINGS */

function SettingsTab({
  building, onSaved, signatureUrl, onSignatureSaved,
}: {
  building: Building | null;
  onSaved: () => Promise<void>;
  signatureUrl: string | null;
  onSignatureSaved: (url: string) => void;
}) {
  const t = useT();
  const [form, setForm] = useState({
    name: "", houseNo: "", address: "", city: "", signatoryName: "", signatoryTitle: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!building) return;
    setForm({
      name: building.name || "",
      houseNo: building.house_no || "",
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
          <Building2 className="h-4 w-4 text-primary" /> {t("Building details")}
        </h3>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Building name" required>
            <TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field
            label="House number"
            hint="Once set, every NEW owner you add gets a login built from it instead of an email address. Logins already issued keep the number they were created with."
          >
            <TextInput value={form.houseNo} placeholder="12/A"
              onChange={(e) => setForm({ ...form, houseNo: e.target.value })} />
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

      {/* Its own card, not a field inside the form above: the upload is a separate API call and
          does not belong behind "Save building". It sits next to the TYPED signatory fields it
          complements. */}
      <SignatureCard
        signatureUrl={signatureUrl}
        onSaved={onSignatureSaved}
        subtitle="Printed on receipts, and on notices you choose to send signed."
      />

      <AppSettingsCard />
    </div>
  );
}
