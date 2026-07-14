"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, CreditCard, Wrench, Bell, Plus, TriangleAlert,
  Megaphone, ReceiptText, CircleDollarSign, Send, Upload, X, CheckCircle2,
  Home, MapPin, Phone, User, Wallet, CalendarClock, Info, Building2, Users,
  FileText, Download, History, Receipt, type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { rentMasterFetch, uploadFile, DEMO_TENANT_ID, ApiError } from "../../lib/api-service";
import { toast } from "../../components/toast";
import { buildReceiptHtml } from "../../lib/receipt";
import { ReceiptModal } from "../../components/receipt-modal";
import { useSessionGuard } from "../../lib/use-session";
import { useTabState } from "../../lib/use-tab";
import { BillingLedger, MaintenanceLog, Notice, PaymentStatus, PriorityLevel, TenantProfile, Document, ServiceChargeBreakdown, RentRevision } from "../../types/api";
import { formatCurrency, formatMonth, formatDate, ordinalDay } from "../../lib/format";
import { DashboardShell, NavItem } from "../../components/shell";
import { AttachmentStrip } from "../../components/attachments";
import {
  Card, StatCard, Badge, Button, Modal, Field, TextInput, TextArea, Select,
  PageHeader, EmptyState, Alert, FullScreenLoader,
} from "../../components/ui";

const statusTone: Record<PaymentStatus, "emerald" | "amber" | "rose"> = {
  paid: "emerald", sent: "amber", unpaid: "rose",
};
const priorityTone: Record<PriorityLevel, "slate" | "amber" | "rose"> = {
  low: "slate", medium: "amber", high: "rose", urgent: "rose",
};

export default function TenantDashboard() {
  const { session, checkingSession, logout } = useSessionGuard("tenant");
  const tenantId = session?.userId || DEMO_TENANT_ID;

  const [tab, setTab] = useTabState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [ledgers, setLedgers] = useState<BillingLedger[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceChargeBreakdown | null>(null);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [rentRevisions, setRentRevisions] = useState<RentRevision[]>([]);
  const [rentHistoryOpen, setRentHistoryOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [breakdown, setBreakdown] = useState<BillingLedger | null>(null);
  const [receiptHtml, setReceiptHtml] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [b, m, n, p] = await Promise.allSettled([
          rentMasterFetch(`/api/admin/billing/tenant/${tenantId}`, { role: "tenant" }),
          rentMasterFetch("/api/admin/maintenance", { role: "tenant" }),
          rentMasterFetch("/api/admin/notices", { role: "tenant" }),
          rentMasterFetch("/api/admin/tenants/me", { role: "tenant" }),
        ]);
        // The owner has cut this tenant's access (unassigned, no override). Tenant JWTs carry no
        // revocation, so this mount check is what actually ends an already-signed-in session.
        if (p.status === "rejected" && (p.reason as ApiError)?.code === "LOGIN_BLOCKED") {
          toast.error((p.reason as ApiError).message);
          logout();
          return;
        }

        if (b.status === "fulfilled") setLedgers(b.value.data || []);
        if (m.status === "fulfilled") setLogs(m.value.data || []);
        if (n.status === "fulfilled") setNotices(n.value.data || []);
        if (p.status === "fulfilled") setProfile(p.value.data || null);
        const err = [b, m, n, p].find((r) => r.status === "rejected");
        if (err && err.status === "rejected") setError((err.reason as Error).message);
        // Documents fetched separately — a missing table shouldn't surface a dashboard error.
        try {
          const docsRes = await rentMasterFetch("/api/admin/documents", { role: "tenant" });
          setDocuments(docsRes.data || []);
        } catch { /* documents feature not provisioned yet */ }
        try {
          const revRes = await rentMasterFetch("/api/admin/rent-revisions", { role: "tenant" });
          setRentRevisions(revRes.data || []);
        } catch { /* ignore */ }
      } finally {
        setLoading(false);
      }
    })();
  }, [tenantId]);

  // Load the property's service charge component breakdown once we know the property.
  const propertyIdForCharges = profile?.property?.id;
  useEffect(() => {
    if (!propertyIdForCharges) return;
    (async () => {
      try {
        const res = await rentMasterFetch(
          `/api/admin/service-charge?propertyId=${encodeURIComponent(propertyIdForCharges)}`,
          { role: "tenant" }
        );
        setServiceBreakdown(res.data || null);
      } catch { setServiceBreakdown(null); }
    })();
  }, [propertyIdForCharges]);

  const metrics = useMemo(() => {
    const dueLedger = ledgers.find((l) => l.payment_status !== "paid");
    const openTickets = logs.filter((l) => l.resolution_status !== "resolved").length;
    const totalPaid = ledgers.filter((l) => l.payment_status === "paid")
      .reduce((s, l) => s + Number(l.total_payable), 0);
    return { dueLedger, openTickets, totalPaid };
  }, [ledgers, logs]);

  const nav: NavItem[] = [
    { key: "overview", label: "Home", icon: LayoutDashboard },
    { key: "billing", label: "Rent", icon: CreditCard },
    { key: "maintenance", label: "Requests", icon: Wrench, badge: metrics.openTickets },
    { key: "notices", label: "Notices", icon: Bell, badge: notices.length },
    { key: "documents", label: "Documents", icon: FileText, badge: documents.length },
  ];

  const propertyId = ledgers[0]?.property_id;

  // Tenant flags a bill as paid ("sent") — optimistic, backend notifies the owner.
  async function markRentAsSent(id: string) {
    const prev = ledgers;
    setLedgers((ls) => ls.map((l) => (l.id === id ? { ...l, payment_status: "sent" } : l)));
    try {
      await rentMasterFetch(`/api/admin/billing/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus: "sent" }),
        role: "tenant",
      });
      toast.success("Rent marked as sent — your owner has been notified.");
    } catch (e: any) {
      setLedgers(prev); // rollback
      toast.error(`Could not update payment status: ${e.message}`);
    }
  }

  // Build a "Tenant Copy" receipt for a paid invoice and open the preview.
  function openTenantReceipt(l: BillingLedger) {
    setReceiptHtml(buildReceiptHtml({
      copyLabel: "Tenant Copy",
      ownerName: profile?.owner?.name || "Owner",
      propertyAddress: profile?.property?.address || null,
      refNo: l.property_id || profile?.property?.id,
      billingMonth: l.billing_month,
      tenantName: l.tenants?.name || profile?.tenant.name || "Tenant",
      houseRent: l.rent_amount,
      serviceCharge: l.service_charge,
      extraCharge: l.extra_charge,
      discount: l.discount,
      total: l.total_payable,
      paymentStatus: l.payment_status,
      paidAt: l.paid_at,
      dueDay: profile?.tenant.due_date,
      note: l.extra_charge_remarks,
      signatureUrl: profile?.owner?.signature_url,
    }));
  }

  if (checkingSession || loading)
    return <FullScreenLoader label="Loading your home…" sub="Fetching rent, requests & notices" />;

  return (
    <DashboardShell
      brand="tenant"
      roleLabel="Resident Hub"
      sessionName={session?.name}
      sessionId={session?.userId}
      nav={nav}
      active={tab}
      onNavigate={setTab}
      onLogout={logout}
      sidebarTop={profile ? <PropertySidebarCard profile={profile} /> : undefined}
    >
      {error && <div className="mb-6"><Alert>{error}</Alert></div>}

      {tab === "overview" && (
        <div className="space-y-8">
          <PageHeader title={`Welcome back${session?.name ? `, ${session.name}` : ""}`}
            subtitle="Here's the current status of your suite." />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Amount due" accent={metrics.dueLedger ? "rose" : "emerald"} icon={CircleDollarSign}
              value={formatCurrency(metrics.dueLedger?.total_payable ?? 0)}
              sub={metrics.dueLedger ? `${formatMonth(metrics.dueLedger.billing_month)} · ${metrics.dueLedger.payment_status}` : "All settled 🎉"} />
            <StatCard label="Open requests" accent="amber" icon={Wrench}
              value={metrics.openTickets} sub="In progress" />
            <StatCard label="Notices" accent="indigo" icon={Bell}
              value={notices.length} sub="From management" />
          </div>

          {profile && (
            <ResidenceCard
              profile={profile}
              onServiceBreakdown={() => setServiceModalOpen(true)}
              onRentHistory={() => setRentHistoryOpen(true)}
            />
          )}

          {metrics.dueLedger && (
            <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-bold text-slate-200">Rent for {formatMonth(metrics.dueLedger.billing_month)}</div>
                <div className="mt-1 text-xs text-slate-400">
                  Rent {formatCurrency(metrics.dueLedger.rent_amount)} · Service {formatCurrency(metrics.dueLedger.service_charge)}
                  {Number(metrics.dueLedger.extra_charge) > 0 && ` · Extra ${formatCurrency(metrics.dueLedger.extra_charge)}`}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 text-right">
                <div className="text-2xl font-black text-emerald-400">{formatCurrency(metrics.dueLedger.total_payable)}</div>
                <Badge tone={statusTone[metrics.dueLedger.payment_status]}>{metrics.dueLedger.payment_status}</Badge>
                <button type="button" onClick={() => setBreakdown(metrics.dueLedger!)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 transition hover:underline">
                  <Info className="h-3 w-3" /> Charge breakdown
                </button>
              </div>
            </Card>
          )}

          <Card className="space-y-3 p-6">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200">Latest notice</h3>
            </div>
            {notices[0] ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                <h4 className="font-bold text-indigo-400">{notices[0].title}</h4>
                <p className="mt-1 text-sm text-slate-300">{notices[0].content}</p>
                <p className="mt-2 font-mono text-[10px] text-slate-500">{formatDate(notices[0].created_at)}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No announcements right now.</p>
            )}
          </Card>
        </div>
      )}

      {tab === "billing" && (
        <div className="space-y-6">
          <PageHeader title="Rent & ledger" subtitle="Your complete billing history." />
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Amount due" accent="rose"
              value={formatCurrency(metrics.dueLedger?.total_payable ?? 0)} />
            <StatCard label="Total paid" accent="emerald" value={formatCurrency(metrics.totalPaid)} />
          </div>
          {ledgers.length === 0 ? (
            <EmptyState icon={ReceiptText} title="No invoices yet" hint="Your rent invoices will appear here once your owner generates them." />
          ) : (
            <>
              <Card className="hidden overflow-hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="p-4">Month</th><th className="p-4">Rent</th>
                        <th className="p-4">Service + Extra</th><th className="p-4">Total</th><th className="p-4">Status</th>
                        <th className="p-4 text-right">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {ledgers.map((l) => (
                        <tr key={l.id} className="hover:bg-white/[0.02]">
                          <td className="p-4 font-semibold text-slate-100">{formatMonth(l.billing_month)}</td>
                          <td className="p-4 text-slate-300">{formatCurrency(l.rent_amount)}</td>
                          <td className="p-4 text-slate-300">{formatCurrency(Number(l.service_charge) + Number(l.extra_charge))}</td>
                          <td className="p-4 font-bold text-emerald-400">
                            <button type="button" onClick={() => setBreakdown(l)}
                              className="inline-flex items-center gap-1.5 transition hover:text-emerald-300" title="View charge breakdown">
                              {formatCurrency(l.total_payable)}
                              <Info className="h-3.5 w-3.5 text-slate-500" />
                            </button>
                          </td>
                          <td className="p-4"><Badge tone={statusTone[l.payment_status]}>{l.payment_status}</Badge></td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {l.payment_status === "paid" && (
                                <button title="Download receipt" onClick={() => openTenantReceipt(l)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-slate-700/80">
                                  <Receipt className="h-3.5 w-3.5" /> Receipt
                                </button>
                              )}
                              <BillPaymentAction ledger={l} onSend={markRentAsSent} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
              <div className="space-y-3 md:hidden">
                {ledgers.map((l) => (
                  <Card key={l.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-100">{formatMonth(l.billing_month)}</span>
                      <Badge tone={statusTone[l.payment_status]}>{l.payment_status}</Badge>
                    </div>
                    <div className="mt-2 flex items-end justify-between">
                      <span className="text-xs text-slate-400">
                        Rent {formatCurrency(l.rent_amount)} + {formatCurrency(Number(l.service_charge) + Number(l.extra_charge))}
                      </span>
                      <button type="button" onClick={() => setBreakdown(l)}
                        className="inline-flex items-center gap-1 text-lg font-black text-emerald-400" title="View charge breakdown">
                        {formatCurrency(l.total_payable)}
                        <Info className="h-3.5 w-3.5 text-slate-500" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-2">
                      {l.payment_status === "paid" && (
                        <button title="Download receipt" onClick={() => openTenantReceipt(l)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-100">
                          <Receipt className="h-3.5 w-3.5" /> Receipt
                        </button>
                      )}
                      <BillPaymentAction ledger={l} onSend={markRentAsSent} />
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "maintenance" && (
        <div className="space-y-6">
          <PageHeader title="Maintenance" subtitle="Report issues and track their progress."
            action={<Button icon={Plus} onClick={() => setTicketOpen(true)} disabled={!propertyId}>New request</Button>} />
          {!propertyId && (
            <Alert>We couldn't determine your unit yet — once you have a billing record you can file tickets.</Alert>
          )}
          {logs.length === 0 ? (
            <EmptyState icon={Wrench} title="No requests filed" hint="Report a maintenance issue and your owner will be notified."
              action={<Button icon={Plus} onClick={() => setTicketOpen(true)} disabled={!propertyId}>New request</Button>} />
          ) : (
            <div className="grid gap-4">
              {logs.map((m) => (
                <Card key={m.id} className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400"><TriangleAlert className="h-4 w-4" /></div>
                      <h3 className="font-bold text-slate-100">{m.issue_title}</h3>
                    </div>
                    <Badge tone={priorityTone[m.priority_level]}>{m.priority_level}</Badge>
                  </div>
                  {m.issue_description && <p className="text-sm leading-relaxed text-slate-400">{m.issue_description}</p>}
                  <AttachmentStrip raw={m.attachment_file_url} />
                  {m.resolution_remarks && (
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-slate-300">
                      <span className="font-semibold text-slate-400">Owner update: </span>{m.resolution_remarks}
                    </div>
                  )}
                  <div className="flex items-center gap-2 border-t border-white/[0.06] pt-3 text-xs text-slate-500">
                    <span>{formatDate(m.created_at)}</span>
                    <Badge
                      tone={m.resolution_status === "resolved" ? "emerald" : m.resolution_status === "in_progress" ? "cyan" : "amber"}
                      className="ml-auto">
                      {m.resolution_status.replace("_", " ")}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "notices" && (
        <div className="space-y-6">
          <PageHeader title="Notices" subtitle="Announcements from your property owner." />
          {notices.length === 0 ? (
            <EmptyState icon={Bell} title="Inbox empty" hint="You'll see building updates and reminders here." />
          ) : (
            <div className="space-y-4">
              {notices.map((n) => (
                <Card key={n.id} className="space-y-2 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-indigo-400">{n.title}</h3>
                    <span className="shrink-0 font-mono text-[10px] text-slate-500">{formatDate(n.created_at)}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300">{n.content}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "documents" && (
        <div className="space-y-6">
          <PageHeader title="Documents" subtitle="Files your owner has shared with you — view or download." />
          {documents.length === 0 ? (
            <EmptyState icon={FileText} title="No documents yet"
              hint="When your owner shares a deed, agreement or receipt, it will appear here." />
          ) : (
            <div className="grid gap-3">
              {documents.map((d) => (
                <Card key={d.id} className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-slate-100">{d.title}</div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      {d.doc_type ?? "document"} · {formatDate(d.created_at)}
                    </div>
                  </div>
                  <a href={d.file_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-slate-700/80">
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <TicketModal
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
        propertyId={propertyId}
        tenantId={tenantId}
        onCreated={(m) => setLogs((x) => [m, ...x])}
      />
      <BillBreakdownModal ledger={breakdown} onClose={() => setBreakdown(null)} />
      <ServiceChargeBreakdownModal
        open={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        breakdown={serviceBreakdown}
        serviceCharge={profile?.tenant.service_charge}
      />
      <RentHistoryModal
        open={rentHistoryOpen}
        onClose={() => setRentHistoryOpen(false)}
        revisions={rentRevisions}
        currentRent={profile?.tenant.monthly_rent}
      />
      <ReceiptModal open={!!receiptHtml} onClose={() => setReceiptHtml(null)} html={receiptHtml || ""} />
    </DashboardShell>
  );
}

/* ============================================================ RESIDENCE CARDS */
// Compact property card pinned to the top of the desktop sidebar.
function PropertySidebarCard({ profile }: { profile: TenantProfile }) {
  const p = profile.property;
  if (!p) return null;
  return (
    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-emerald-500/[0.08] to-cyan-500/[0.04] p-3.5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
          <Home className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-bold text-slate-100">{p.name}</div>
          <div className="truncate text-[10px] text-slate-500">Flat {p.flat_no}</div>
        </div>
      </div>
      <div className="mt-2.5 flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-400">
        <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
        <span className="line-clamp-2">{p.address}</span>
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.06] pt-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Monthly rent</span>
        <span className="text-xs font-bold text-emerald-400">{formatCurrency(profile.tenant.monthly_rent)}</span>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon, label, value, strong, action,
}: {
  icon: LucideIcon; label: string; value: string; strong?: boolean;
  action?: { icon: LucideIcon; title: string; onClick: () => void };
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
        <div className={cn("text-sm text-slate-200", strong && "font-bold text-emerald-400")}>{value}</div>
      </div>
      {action && (
        <button type="button" onClick={action.onClick} title={action.title}
          className="mt-0.5 rounded-md p-1 text-indigo-400 transition hover:bg-white/[0.06]">
          <action.icon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// Full property + rent + owner details shown on the overview tab (visible on mobile too).
function ResidenceCard({
  profile, onServiceBreakdown, onRentHistory,
}: {
  profile: TenantProfile;
  onServiceBreakdown: () => void;
  onRentHistory: () => void;
}) {
  const { tenant, property, owner } = profile;
  const ownerName = owner?.name || "Your property owner";
  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-emerald-400" />
        <h3 className="text-sm font-bold text-slate-200">Your residence</h3>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Property</div>
          <div className="text-sm font-semibold text-slate-100">{property?.name ?? "—"}</div>
          <InfoRow icon={Home} label="Flat / Unit" value={property?.flat_no ?? "—"} />
          <InfoRow icon={MapPin} label="Address" value={property?.address ?? "—"} />
        </div>
        <div className="space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Rent terms</div>
          <InfoRow icon={Wallet} label="Monthly rent" value={formatCurrency(tenant.monthly_rent)} strong
            action={{ icon: History, title: "Rent revision history", onClick: onRentHistory }} />
          <InfoRow icon={ReceiptText} label="Service charge" value={formatCurrency(tenant.service_charge)}
            action={{ icon: Info, title: "View service charge breakdown", onClick: onServiceBreakdown }} />
          <InfoRow icon={CreditCard} label="Advance held" value={formatCurrency(tenant.advance_amount)} />
          <InfoRow icon={CalendarClock} label="Rent due" value={`${ordinalDay(tenant.due_date)} of each month`} />
        </div>
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Your details</div>
            <InfoRow icon={User} label="Name" value={tenant.name} />
            <InfoRow icon={Phone} label="Number" value={tenant.phone} />
            <InfoRow icon={Users} label="Household" value={`${tenant.family_members} member${tenant.family_members === 1 ? "" : "s"}`} />
            {tenant.rented_date && <InfoRow icon={CalendarClock} label="Resident since" value={formatDate(tenant.rented_date)} />}
          </div>
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Owner contact</div>
            <InfoRow icon={User} label="Owner" value={ownerName} />
            {owner?.phone && <InfoRow icon={Phone} label="Number" value={owner.phone} />}
          </div>
        </div>
      </div>
    </Card>
  );
}

function BreakRow({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "emerald" }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={strong ? "text-sm font-bold text-slate-100" : "text-sm text-slate-400"}>{label}</span>
      <span className={
        strong ? "text-base font-black text-emerald-400"
          : tone === "emerald" ? "text-sm font-semibold text-emerald-400"
            : "text-sm font-semibold text-slate-200"
      }>{value}</span>
    </div>
  );
}

// Itemised breakdown of a single invoice's charges.
function BillBreakdownModal({ ledger, onClose }: { ledger: BillingLedger | null; onClose: () => void }) {
  return (
    <Modal open={!!ledger} onClose={onClose} title="Charge breakdown"
      subtitle={ledger ? `Invoice for ${formatMonth(ledger.billing_month)}` : undefined}>
      {ledger && (
        <div className="space-y-1">
          <BreakRow label="Base rent" value={formatCurrency(ledger.rent_amount)} />
          <BreakRow label="Service charge" value={formatCurrency(ledger.service_charge)} />
          {Number(ledger.extra_charge) > 0 && (
            <BreakRow
              label={ledger.extra_charge_remarks ? `Extra charge · ${ledger.extra_charge_remarks}` : "Extra charge"}
              value={formatCurrency(ledger.extra_charge)} />
          )}
          {Number(ledger.discount) > 0 && (
            <BreakRow label="Discount" value={`− ${formatCurrency(ledger.discount)}`} tone="emerald" />
          )}
          <div className="my-3 border-t border-white/[0.08]" />
          <BreakRow label="Total payable" value={formatCurrency(ledger.total_payable)} strong />
          <div className="flex items-center justify-between pt-3">
            <span className="text-xs text-slate-500">Status</span>
            <Badge tone={statusTone[ledger.payment_status]}>{ledger.payment_status}</Badge>
          </div>
        </div>
      )}
    </Modal>
  );
}

const SERVICE_CHARGE_ITEMS: { key: keyof ServiceChargeBreakdown; label: string }[] = [
  { key: "caretaker", label: "Caretaker" },
  { key: "security_guard", label: "Security guard" },
  { key: "lift_maintenance", label: "Lift maintenance" },
  { key: "water", label: "Water" },
  { key: "common_electricity", label: "Common electricity" },
  { key: "common_gas", label: "Common gas" },
  { key: "dust_collectors", label: "Dust collectors" },
];

// Component breakdown of the monthly service charge, loaded from service_charge_breakdowns.
function ServiceChargeBreakdownModal({
  open, onClose, breakdown, serviceCharge,
}: {
  open: boolean; onClose: () => void;
  breakdown: ServiceChargeBreakdown | null;
  serviceCharge?: number;
}) {
  const items = breakdown
    ? SERVICE_CHARGE_ITEMS
        .map((it) => ({ ...it, amount: Number(breakdown[it.key] || 0) }))
        .filter((it) => it.amount > 0)
    : [];
  const total = items.reduce((s, it) => s + it.amount, 0);

  return (
    <Modal open={open} onClose={onClose} title="Service charge breakdown"
      subtitle="What your monthly service charge covers.">
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">
          Your owner hasn&apos;t published a service charge breakdown for your unit yet.
        </p>
      ) : (
        <div className="space-y-1">
          {items.map((it) => (
            <BreakRow key={it.key} label={it.label} value={formatCurrency(it.amount)} />
          ))}
          <div className="my-3 border-t border-white/[0.08]" />
          <BreakRow label="Total service charge" value={formatCurrency(total)} strong />
          {typeof serviceCharge === "number" && Math.abs(serviceCharge - total) > 0.01 && (
            <p className="pt-2 text-[11px] text-slate-500">
              Your billed service charge is {formatCurrency(serviceCharge)}.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

// Read-only rent revision trail for the tenant (owner makes the revisions).
function RentHistoryModal({
  open, onClose, revisions, currentRent,
}: {
  open: boolean; onClose: () => void;
  revisions: RentRevision[];
  currentRent?: number;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Rent revision history"
      subtitle="Every change to your rent, most recent first.">
      {typeof currentRent === "number" && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
          <span className="text-sm font-semibold text-slate-300">Current rent</span>
          <span className="text-lg font-black text-emerald-400">{formatCurrency(currentRent)}</span>
        </div>
      )}
      {revisions.length === 0 ? (
        <p className="text-sm text-slate-400">No rent revisions yet — your rent has stayed the same since you moved in.</p>
      ) : (
        <div className="space-y-2">
          {revisions.map((r) => {
            const increased = Number(r.new_rent) >= Number(r.old_rent);
            return (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <span className="text-xs text-slate-400">{formatDate(r.changed_at)}</span>
                <span className="text-sm">
                  <span className="text-slate-400">{formatCurrency(r.old_rent)}</span>
                  <span className="mx-1.5 text-slate-500">→</span>
                  <span className={cn("font-bold", increased ? "text-rose-400" : "text-emerald-400")}>
                    {formatCurrency(r.new_rent)}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

// Per-bill payment control for the tenant: mark unpaid rent as "sent",
// or show the confirmation state once the owner has acted.
function BillPaymentAction({
  ledger, onSend,
}: { ledger: BillingLedger; onSend: (id: string) => void }) {
  if (ledger.payment_status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed
      </span>
    );
  }
  if (ledger.payment_status === "sent") {
    return <span className="text-xs text-amber-400">Awaiting owner confirmation</span>;
  }
  return (
    <Button variant="secondary" icon={Send} onClick={() => onSend(ledger.id)}>
      I&apos;ve sent it
    </Button>
  );
}

function TicketModal({
  open, onClose, propertyId, tenantId, onCreated,
}: {
  open: boolean; onClose: () => void; propertyId?: string; tenantId: string;
  onCreated: (m: MaintenanceLog) => void;
}) {
  const empty = { issueTitle: "", issueDescription: "", priorityLevel: "medium" };
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
    if (!propertyId) return;
    try {
      setSaving(true);
      // Upload every selected image in parallel, then attach their URLs to the ticket.
      const attachmentFileUrls = items.length
        ? await Promise.all(items.map((it) => uploadFile(it.file, { role: "tenant", folder: "maintenance" })))
        : [];

      const res = await rentMasterFetch("/api/admin/maintenance", {
        method: "POST", role: "tenant",
        body: JSON.stringify({
          propertyId, tenantId, issueTitle: form.issueTitle,
          issueDescription: form.issueDescription, priorityLevel: form.priorityLevel,
          attachmentFileUrls, estimatedCost: 0,
        }),
      });
      if (res.success) { onCreated(res.data); reset(); onClose(); toast.success("Maintenance request submitted."); }
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Report an issue" subtitle="Your owner will be notified immediately.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Issue title" required>
          <TextInput required placeholder="e.g. Washroom pipe leakage" value={form.issueTitle}
            onChange={(e) => setForm({ ...form, issueTitle: e.target.value })} />
        </Field>
        <Field label="Description" required>
          <TextArea required rows={4} placeholder="Describe the problem in detail…" value={form.issueDescription}
            onChange={(e) => setForm({ ...form, issueDescription: e.target.value })} />
        </Field>
        <Field label="Priority">
          <Select value={form.priorityLevel} onChange={(e) => setForm({ ...form, priorityLevel: e.target.value })}>
            <option value="low">Low — standard wear</option>
            <option value="medium">Medium — needs attention</option>
            <option value="high">High — damaging</option>
            <option value="urgent">Urgent — critical failure</option>
          </Select>
        </Field>
        <Field label="Photos of the issue" hint="Optional — attach one or more images (max 8MB each).">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {items.map((it) => (
              <div key={it.key} className="relative aspect-square overflow-hidden rounded-xl border border-white/[0.08]">
                <img src={it.preview} alt="Attachment preview" className="h-full w-full object-cover" />
                <button type="button" onClick={() => removeItem(it.key)}
                  className="absolute right-1 top-1 rounded-lg bg-black/60 p-1 text-white transition hover:bg-black/80">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] text-center text-[11px] text-slate-400 transition hover:border-indigo-400/40 hover:text-slate-300">
              <Upload className="h-5 w-5" />
              <span>{items.length ? "Add more" : "Add photo"}</span>
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }} />
            </label>
          </div>
        </Field>
        <Button type="submit" loading={saving} className="w-full">
          {saving ? "Submitting…" : "Submit request"}
        </Button>
      </form>
    </Modal>
  );
}
