"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CreditCard, ExternalLink, Printer, RefreshCw, ShieldAlert, Clock, CheckCircle2,
  FileText, Wallet, AlertTriangle,
} from "lucide-react";
import { rentMasterFetch } from "../lib/api-service";
import { toast } from "./toast";
import { formatCurrency, formatDate } from "../lib/format";
import { buildPlanInvoiceHtml, buildPlanReceiptHtml } from "../lib/building-print";
import { PrintModal } from "./print-modal";
import {
  Building, BuildingPlanInvoice, BuildingPlanPayment, BuildingPlanRequest, BuildingPlanResponse,
  BuildingPlanState,
} from "../types/api";
import {
  Card, Badge, Button, Modal, Field, TextInput, TextArea, Select, PageHeader, EmptyState, StatCard,
} from "./ui";
import { useT } from "../lib/i18n";

// =====================================================================================
// 🏢💳 BUILDING ADMIN — PLAN
//
// The building's side of its own contract: what it owes, how to pay it, what it has paid, and
// how to ask us for another year.
//
// Three ways money moves, all of which end in the same place (a building_plan_payments row):
//   1. we collect it offline and record it here;
//   2. the building follows the payment link on the invoice;
//   3. the building tells us it has paid, and we confirm that claim.
// (2) and (3) are the same button pair on the invoice card. A claim is NOT a payment until an
// admin confirms it — the term must never move on an unverified transfer.
//
// This tab stays reachable when the plan is LOCKED. It is where the bill and the pay button
// live, so gating it behind the lock it exists to lift would be a closed loop — the same
// standing exception the backend route makes.
//
// Translated, like the rest of the app. This console was English-only by a standing decision
// that was overturned once it became clear DashboardShell shows a language toggle here — so a
// building admin was offered a Bangla switch that changed nothing. See scripts/check-i18n.mjs.
// =====================================================================================

const METHODS = [
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "bank", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

const REQUEST_STATUS_TONE: Record<string, "amber" | "emerald" | "rose" | "indigo" | "slate"> = {
  new: "amber",
  in_progress: "indigo",
  quoted: "indigo",
  closed: "emerald",
  rejected: "rose",
};

const REQUEST_STATUS_LABEL: Record<string, string> = {
  new: "Received",
  in_progress: "Being reviewed",
  quoted: "Quote sent",
  closed: "Done",
  rejected: "Declined",
};

/** Statuses that mean the request is still with us — the backend refuses a second one. */
const OPEN_STATUSES = ["new", "in_progress", "quoted"];

export function BuildingPlanTab({ building }: { building: Building | null }) {
  const t = useT();
  const [data, setData] = useState<BuildingPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [renewOpen, setRenewOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [printing, setPrinting] = useState<{ html: string; name: string; title: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await rentMasterFetch<{ data: BuildingPlanResponse }>("/api/admin/building/plan");
      setData(res.data || null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const state = data?.state || null;
  const invoices = data?.invoices || [];
  const payments = data?.payments || [];
  const requests = data?.requests || [];

  const currentInvoice = useMemo(
    () => invoices.find((i) => i.id === data?.currentInvoiceId) || null,
    [invoices, data?.currentInvoiceId]
  );

  const openRenewal = requests.find((r) => r.kind === "renewal" && OPEN_STATUSES.includes(r.status)) || null;
  const openClaim = requests.find((r) => r.kind === "payment_claim" && OPEN_STATUSES.includes(r.status)) || null;

  const invoiceByIdRef = useMemo(() => {
    const m = new Map<string, BuildingPlanInvoice>();
    invoices.forEach((i) => m.set(i.id, i));
    return m;
  }, [invoices]);

  function printInvoice(inv: BuildingPlanInvoice) {
    const html = buildPlanInvoiceHtml({
      buildingName: building?.name || "Your building",
      buildingAddress: [building?.address, building?.city].filter(Boolean).join(", ") || null,
      invoiceNo: inv.invoice_no,
      kind: inv.kind,
      issuedOn: inv.issued_at,
      dueOn: inv.due_on,
      periodStart: inv.period_start,
      periodEnd: inv.period_end,
      items: (inv.items || []).map((i) => ({ label: i.label, amount: Number(i.amount || 0) })),
      subtotal: Number(inv.subtotal || 0),
      discount: Number(inv.discount || 0),
      total: Number(inv.total_payable || 0),
      amountPaid: Number(inv.amount_paid || 0),
      terms: inv.terms,
    });
    setPrinting({ html, name: `plan-invoice-${inv.invoice_no}`, title: `Invoice #${inv.invoice_no}` });
  }

  function printReceipt(pay: BuildingPlanPayment) {
    const inv = invoiceByIdRef.get(pay.invoice_id) || null;
    const html = buildPlanReceiptHtml({
      buildingName: building?.name || "Your building",
      receiptNo: pay.payment_no,
      paidOn: pay.paid_on,
      amount: Number(pay.amount || 0),
      method: METHODS.find((m) => m.value === pay.method)?.label || pay.method,
      reference: pay.reference,
      invoiceNo: inv?.invoice_no ?? null,
      periodStart: inv?.period_start ?? null,
      periodEnd: inv?.period_end ?? null,
      note: pay.note,
    });
    setPrinting({ html, name: `plan-receipt-${pay.payment_no}`, title: `Receipt #${pay.payment_no}` });
  }

  if (loading) {
    return <Card className="p-8 text-center text-sm text-muted">Loading your plan…</Card>;
  }

  // A building that predates this feature has no contract row. Saying so plainly beats inventing
  // a status, and it tells them exactly who to ask.
  if (!data?.subscription || !state) {
    return (
      <div className="space-y-5">
        <PageHeader title="Plan" subtitle="Your Whole Building software subscription and support contract." />
        <EmptyState
          icon={CreditCard}
          title="No billing contract on file"
          hint="Your plan is running without a recorded term. Contact support if you need an invoice or a receipt."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Plan"
        subtitle="Your Whole Building software subscription and support contract — invoices and receipts."
        action={
          <Button variant="secondary" icon={RefreshCw} onClick={() => void load()}>Refresh</Button>
        }
      />

      <PlanStatusCards state={state} termMonths={data.subscription.term_months} />

      {/* The bill they are being asked to settle. */}
      {currentInvoice ? (
        <InvoiceCard
          invoice={currentInvoice}
          onPrint={() => printInvoice(currentInvoice)}
          onClaim={() => setClaimOpen(true)}
          claimPending={!!openClaim}
        />
      ) : (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <div className="text-sm font-bold text-heading">{t("Nothing outstanding")}</div>
            <div className="text-xs text-muted">
              {t("You have no unpaid invoice right now.")}
              {state.expiryDate
                ? ` ${t("Your plan runs to {0}.").replace("{0}", formatDate(state.expiryDate))}`
                : ""}
            </div>
          </div>
          <Button
            icon={RefreshCw}
            onClick={() => setRenewOpen(true)}
            disabled={!!openRenewal}
          >
            {openRenewal ? "Renewal requested" : "Request renewal"}
          </Button>
        </Card>
      )}

      {/* Asking for another year, or for maintenance and extra modules to be added. */}
      <RequestsCard
        requests={requests}
        openRenewal={openRenewal}
        onRequest={() => setRenewOpen(true)}
      />

      <PastInvoicesCard invoices={invoices} onPrint={printInvoice} />

      <ReceiptsCard payments={payments} invoices={invoiceByIdRef} onPrint={printReceipt} />

      <RenewalModal open={renewOpen} onClose={() => setRenewOpen(false)} onSaved={load} />
      <ClaimModal
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        onSaved={load}
        suggestedAmount={currentInvoice ? Number(currentInvoice.balance ?? currentInvoice.total_payable) : 0}
      />
      <PrintModal
        open={!!printing}
        onClose={() => setPrinting(null)}
        html={printing?.html || ""}
        title={printing?.title || ""}
        fileName={printing?.name || "document"}
      />
    </div>
  );
}

// -------------------------------------------------------------------------------------
// The banner. Exported because app/building/page.tsx renders it above EVERY tab — someone
// whose building is about to lock should not have to open the Plan tab to find that out.
// -------------------------------------------------------------------------------------

export function BuildingPlanBanner({ state, onOpen }: { state: BuildingPlanState | null; onOpen: () => void }) {
  const t = useT();
  if (!state) return null;

  let tone: "rose" | "amber" | null = null;
  let icon = AlertTriangle;
  let msg = "";

  // Counted sentences carry BOTH English forms as their own dictionary keys and fill {0} after
  // the lookup. The old `day${n === 1 ? "" : "s"}` concatenation is untranslatable by
  // construction: Bangla has no -s plural and puts the number elsewhere in the clause, so a
  // sentence assembled from fragments can never come out as one grammatical Bangla sentence.
  if (state.status === "locked") {
    tone = "rose";
    icon = ShieldAlert;
    msg = t(
      state.lockReason === "revoked"
        ? "Your plan has been suspended. Contact support to restore access."
        : "Your plan has lapsed. You and your flat owners are read-only until it is renewed.");
  } else if (state.unpaidWindow) {
    tone = "amber";
    icon = Clock;
    const by = state.payBy ? t(" (by {0})").replace("{0}", formatDate(state.payBy)) : "";
    msg = t(state.daysToPay === 1
      ? "Payment is due. {0} day left{1} before you and your flat owners are locked."
      : "Payment is due. {0} days left{1} before you and your flat owners are locked.")
      .replace("{0}", String(state.daysToPay)).replace("{1}", by);
  } else if (state.status === "grace") {
    tone = "amber";
    icon = Clock;
    msg = t(state.daysLeftInGrace === 1
      ? "Your plan has expired. {0} day of grace left to renew before management is locked."
      : "Your plan has expired. {0} days of grace left to renew before management is locked.")
      .replace("{0}", String(state.daysLeftInGrace));
  } else if (state.warnExpiringSoon) {
    tone = "amber";
    icon = Clock;
    msg = t(state.daysUntilExpiry === 1
      ? "Your plan expires in {0} day. Request a renewal to avoid interruption."
      : "Your plan expires in {0} days. Request a renewal to avoid interruption.")
      .replace("{0}", String(state.daysUntilExpiry));
  }

  if (!tone) return null;

  const Icon = icon;
  const skin =
    tone === "rose"
      ? "border-danger/30 bg-danger/[0.07] text-danger"
      : "border-warning/30 bg-warning/[0.07] text-warning";

  return (
    <div className={`mb-4 flex flex-wrap items-center gap-3 rounded-xl border p-4 ${skin}`}>
      <Icon className="h-5 w-5 shrink-0" />
      <span className="min-w-0 flex-1 text-sm font-semibold">{msg}</span>
      <Button size="sm" variant="secondary" onClick={onOpen}>
        {t(state.status === "locked" ? "Renew now" : "View plan")}
      </Button>
    </div>
  );
}

// -------------------------------------------------------------------------------------

function PlanStatusCards({ state, termMonths }: { state: BuildingPlanState; termMonths: number }) {
  const status = state.status === "locked"
    ? { label: state.lockReason === "revoked" ? "Suspended" : "Lapsed", accent: "rose" as const }
    : state.status === "grace"
      ? { label: "In grace", accent: "amber" as const }
      : state.unpaidWindow
        ? { label: "Awaiting payment", accent: "amber" as const }
        : state.warnExpiringSoon
          ? { label: "Expiring soon", accent: "amber" as const }
          : { label: "Active", accent: "emerald" as const };

  // One number, chosen to be the one that matters right now: pay-by while unpaid, grace while in
  // grace, otherwise time left on the term. Showing all three at once would bury the live one.
  const counter = state.unpaidWindow
    ? { label: "Days to pay", value: state.daysToPay ?? 0, sub: state.payBy ? `By ${formatDate(state.payBy)}` : undefined }
    : state.status === "grace"
      ? { label: "Grace left", value: state.daysLeftInGrace ?? 0, sub: "Renew to restore full access" }
      : { label: "Days remaining", value: Math.max(0, state.daysUntilExpiry ?? 0), sub: undefined };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label="Status" value={status.label} icon={CheckCircle2} accent={status.accent} sub={`${termMonths}-month term`} />
      <StatCard label={counter.label} value={String(counter.value)} icon={Clock} accent="cyan" sub={counter.sub} />
      <StatCard
        label="Expires"
        value={state.expiryDate ? formatDate(state.expiryDate) : "—"}
        icon={CreditCard}
        accent="indigo"
        sub={state.expiryDate ? undefined : "Starts when your first payment is recorded"}
      />
    </div>
  );
}

function InvoiceCard({
  invoice, onPrint, onClaim, claimPending,
}: {
  invoice: BuildingPlanInvoice;
  onPrint: () => void;
  onClaim: () => void;
  claimPending: boolean;
}) {
  const t = useT();
  const balance = Number(invoice.balance ?? Math.max(0, Number(invoice.total_payable) - Number(invoice.amount_paid)));

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/[0.06] p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-heading">{t("Invoice #{0}").replace("{0}", String(invoice.invoice_no))}</span>
            <Badge tone={invoice.payment_status === "partial" ? "amber" : "rose"}>
              {t(invoice.payment_status === "partial" ? "Partly paid" : "Unpaid")}
            </Badge>
            <Badge tone="indigo">{invoice.kind === "initial" ? "First term" : "Renewal"}</Badge>
          </div>
          <div className="mt-1 text-xs text-muted">
            {invoice.period_start && invoice.period_end
              ? `${formatDate(invoice.period_start)} – ${formatDate(invoice.period_end)}`
              : `${invoice.term_months} months`}
            {invoice.due_on ? ` · Due by ${formatDate(invoice.due_on)}` : ""}
          </div>
        </div>
        <Button variant="secondary" size="sm" icon={Printer} onClick={onPrint}>Print</Button>
      </div>

      <div className="divide-y divide-line/[0.04]">
        {(invoice.items || []).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
            <span className="min-w-0 break-words text-fg">{item.label}</span>
            <span className="shrink-0 font-semibold text-heading">{formatCurrency(Number(item.amount || 0))}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1 border-t border-line/[0.06] px-5 py-4 text-sm">
        <Row label="Subtotal" value={formatCurrency(Number(invoice.subtotal || 0))} />
        {Number(invoice.discount || 0) > 0 && (
          <Row label="Discount" value={`- ${formatCurrency(Number(invoice.discount))}`} />
        )}
        <Row label="Total payable" value={formatCurrency(Number(invoice.total_payable || 0))} strong />
        {Number(invoice.amount_paid || 0) > 0 && (
          <>
            <Row label="Received" value={formatCurrency(Number(invoice.amount_paid))} />
            <Row label="Balance due" value={formatCurrency(balance)} strong />
          </>
        )}
      </div>

      {invoice.terms && (
        <div className="border-t border-line/[0.06] px-5 py-4">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">{t("Terms")}</div>
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-fg">{invoice.terms}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-line/[0.06] bg-overlay/[0.02] p-4">
        {invoice.payment_url && (
          <a href={invoice.payment_url} target="_blank" rel="noopener noreferrer">
            <Button icon={ExternalLink}>Pay online</Button>
          </a>
        )}
        <Button variant="secondary" icon={Wallet} onClick={onClaim} disabled={claimPending}>
          {claimPending ? "Awaiting our confirmation" : "I have paid"}
        </Button>
      </div>
    </Card>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const t = useT();
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? "font-semibold text-heading" : "text-muted"}>{t(label)}</span>
      <span className={strong ? "font-extrabold text-heading" : "text-fg"}>{value}</span>
    </div>
  );
}

function RequestsCard({
  requests, openRenewal, onRequest,
}: {
  requests: BuildingPlanRequest[];
  openRenewal: BuildingPlanRequest | null;
  onRequest: () => void;
}) {
  const t = useT();
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/[0.06] p-5">
        <div>
          <div className="text-sm font-bold text-heading">{t("Requests")}</div>
          <div className="text-xs text-muted">
            {t("Ask us for another year, or to add maintenance & support or extra modules.")}
          </div>
        </div>
        <Button icon={RefreshCw} onClick={onRequest} disabled={!!openRenewal}>
          {openRenewal ? "Renewal requested" : "Request renewal"}
        </Button>
      </div>

      {requests.length === 0 ? (
        <div className="p-5 text-sm text-muted">{t("Nothing requested yet.")}</div>
      ) : (
        <div className="divide-y divide-line/[0.04]">
          {requests.map((r) => (
            <div key={r.id} className="px-5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-heading">
                  {r.kind === "renewal" ? "Renewal request" : "Payment claim"} #{r.request_no}
                </span>
                <Badge tone={REQUEST_STATUS_TONE[r.status] || "slate"}>
                  {REQUEST_STATUS_LABEL[r.status] || r.status}
                </Badge>
                <span className="text-xs text-muted">{formatDate(r.created_at)}</span>
              </div>
              {r.kind === "payment_claim" && (
                <div className="mt-1 text-xs text-muted">
                  {formatCurrency(Number(r.claim_amount || 0))} · {r.claim_method} · {r.claim_reference}
                </div>
              )}
              {r.message && <p className="mt-1 whitespace-pre-wrap text-xs text-fg">{r.message}</p>}
              {/* Our reply. Shown to them on purpose — a declined request with no reason is a
                  dead end, and this is the only channel they have. */}
              {r.admin_notes && (
                <p className="mt-2 rounded-lg bg-overlay/[0.03] p-2 text-xs text-fg">
                  <span className="font-semibold">{t("Our reply")}: </span>{r.admin_notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function PastInvoicesCard({
  invoices, onPrint,
}: {
  invoices: BuildingPlanInvoice[];
  onPrint: (i: BuildingPlanInvoice) => void;
}) {
  const t = useT();
  const settled = invoices.filter((i) => i.payment_status === "paid" || i.status === "void");
  if (!settled.length) return null;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line/[0.06] p-5 text-sm font-bold text-heading">{t("Past invoices")}</div>
      <div className="divide-y divide-line/[0.04]">
        {settled.map((inv) => (
          <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-heading">#{inv.invoice_no}</span>
                <Badge tone={inv.status === "void" ? "slate" : "emerald"}>
                  {inv.status === "void" ? "Void" : "Paid"}
                </Badge>
              </div>
              <div className="text-xs text-muted">
                {inv.period_start && inv.period_end
                  ? `${formatDate(inv.period_start)} – ${formatDate(inv.period_end)}`
                  : `${inv.term_months} months`}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm font-bold text-heading">{formatCurrency(Number(inv.total_payable || 0))}</span>
              <Button variant="ghost" size="sm" icon={Printer} onClick={() => onPrint(inv)}>Print</Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ReceiptsCard({
  payments, invoices, onPrint,
}: {
  payments: BuildingPlanPayment[];
  invoices: Map<string, BuildingPlanInvoice>;
  onPrint: (p: BuildingPlanPayment) => void;
}) {
  const t = useT();
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line/[0.06] p-5">
        <div className="text-sm font-bold text-heading">{t("Receipts")}</div>
        <div className="text-xs text-muted">{t("Every payment we have recorded against your plan.")}</div>
      </div>

      {payments.length === 0 ? (
        <div className="p-5 text-sm text-muted">{t("No payments recorded yet.")}</div>
      ) : (
        <div className="divide-y divide-line/[0.04]">
          {payments.map((p) => {
            const inv = invoices.get(p.invoice_id);
            return (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-heading">{t("Receipt #{0}").replace("{0}", String(p.payment_no))}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted">
                    <span>{formatDate(p.paid_on)}</span>
                    <span>{t(METHODS.find((m) => m.value === p.method)?.label || p.method)}</span>
                    {p.reference && <span className="min-w-0 break-words">{p.reference}</span>}
                    {inv && <span>{t("Invoice #{0}").replace("{0}", String(inv.invoice_no))}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-extrabold text-success">{formatCurrency(Number(p.amount || 0))}</span>
                  <Button variant="ghost" size="sm" icon={Printer} onClick={() => onPrint(p)}>Receipt</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// -------------------------------------------------------------------------------------
// Modals.
// -------------------------------------------------------------------------------------

function RenewalModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => Promise<void> }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) setMessage(""); }, [open]);

  async function submit() {
    if (!message.trim()) { toast.error("Tell us what you need."); return; }
    try {
      setBusy(true);
      await rentMasterFetch("/api/admin/building/plan/requests", {
        method: "POST",
        body: JSON.stringify({ kind: "renewal", message: message.trim() }),
      });
      toast.success("Request sent. We will get back to you with a quote.");
      onClose();
      await onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Request a renewal" subtitle="We will reply with an itemised quote.">
      <div className="space-y-4">
        <Field
          label="What do you need?"
          required
          hint="Tell us the term you want, and whether to include maintenance & support or any extra modules."
        >
          <TextArea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Renew for another year, and add maintenance & support."
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={busy} onClick={submit}>Send request</Button>
        </div>
      </div>
    </Modal>
  );
}

function ClaimModal({
  open, onClose, onSaved, suggestedAmount,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
  suggestedAmount: number;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Pre-filled with the balance, because paying the exact amount owed is the overwhelming case
    // and retyping it is how a digit goes missing.
    setAmount(suggestedAmount > 0 ? String(suggestedAmount) : "");
    setMethod("bank");
    setReference("");
    setMessage("");
  }, [open, suggestedAmount]);

  async function submit() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) { toast.error("Enter the amount you paid."); return; }
    if (!reference.trim()) { toast.error("Enter the transaction id or bank reference."); return; }
    try {
      setBusy(true);
      await rentMasterFetch("/api/admin/building/plan/requests", {
        method: "POST",
        body: JSON.stringify({
          kind: "payment_claim",
          amount: n,
          method,
          reference: reference.trim(),
          message: message.trim(),
        }),
      });
      toast.success("Thank you. We will confirm your payment shortly.");
      onClose();
      await onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tell us you have paid"
      subtitle="We will check it against our records and confirm."
    >
      <div className="space-y-4">
        <Field label="Amount paid" required>
          <TextInput type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="How you paid" required>
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
        </Field>
        <Field
          label="Transaction id or bank reference"
          required
          hint="Without this we have nothing to match against our statement."
        >
          <TextInput value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. 8N7A6D5C4B" />
        </Field>
        <Field label="Anything we should know?">
          <TextArea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={busy} onClick={submit}>Submit</Button>
        </div>
      </div>
    </Modal>
  );
}
