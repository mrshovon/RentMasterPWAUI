"use client";

import { useState } from "react";
import { Printer, FileText, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { rentMasterFetch } from "../lib/api-service";
import { toast } from "./toast";
import { formatCurrency } from "../lib/format";
import { buildPeriodStatementHtml, buildOwnerStatementHtml } from "../lib/building-print";
import {
  BuildingOwner, BuildingPeriodReport, BuildingOwnerReport,
} from "../types/api";
import { PrintModal } from "./print-modal";
import { Card, StatCard, Button, Field, TextInput, Select, PageHeader } from "./ui";
import { useT } from "../lib/i18n";

// =====================================================================================
// 🏢 BUILDING ADMIN — PRINTABLE REPORTS
//
// Two documents, both built in the browser by lib/building-print.ts from JSON the server
// aggregates: a period income & expense statement, and one owner's service-charge account.
//
// The figures come from account_transactions and building_service_invoices — the real ledgers.
// The amenity and income-source lists are NOT read here: those hold indicative defaults, and
// treating them as money would double-count against the transactions that actually happened.
//
// Translated, like the rest of the building console. The PRINTED documents were always
// translated (lib/building-print.ts); this screen caught up when the console stopped being
// English-only — it renders DashboardShell, which offers a Bangla toggle that did nothing.
//
// ✍️ Both documents carry the building's AUTHORISED SIGNATURE. The server's report payload
// deliberately does not include it — the signature lives on the admin's auth user_metadata, not
// on the buildings row (ADD_BUILDINGS.sql:46) — so the page loads it once and passes it down,
// exactly as it does for the invoices and notices tabs. Without it these two printed on a bare
// rule while every other building document was signed.
// =====================================================================================

/** First and last day of the current calendar month, in local time. */
function thisMonthRange(): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = now.getFullYear();
  const m = now.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  return { from: `${y}-${pad(m + 1)}-01`, to: `${y}-${pad(m + 1)}-${pad(last)}` };
}

export function BuildingReportsTab({
  owners,
  signatureUrl,
}: {
  owners: BuildingOwner[];
  /** The building admin's signature image, loaded once by app/building/page.tsx. */
  signatureUrl?: string | null;
}) {
  const initial = thisMonthRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [report, setReport] = useState<BuildingPeriodReport | null>(null);
  const [loadingPeriod, setLoadingPeriod] = useState(false);

  const [ownerId, setOwnerId] = useState("");
  const [loadingOwner, setLoadingOwner] = useState(false);

  const t = useT();
  const [printing, setPrinting] = useState<{ html: string; name: string; title: string } | null>(null);

  async function runPeriod() {
    if (from > to) { toast.error(t("The start date is after the end date.")); return; }
    try {
      setLoadingPeriod(true);
      const res = await rentMasterFetch<BuildingPeriodReport>(
        `/api/admin/building/reports?kind=income_expense&from=${from}&to=${to}`
      );
      setReport(res);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingPeriod(false);
    }
  }

  function printPeriod() {
    if (!report) return;
    setPrinting({
      title: t("Income & expense statement"),
      name: `income-expense-${report.period.from}-to-${report.period.to}`,
      html: buildPeriodStatementHtml({
        building: { ...report.building, signatureUrl },
        period: report.period,
        income: report.income,
        expense: report.expense,
        net: report.net,
      }),
    });
  }

  async function printOwnerStatement() {
    if (!ownerId) { toast.error(t("Choose an owner.")); return; }
    try {
      setLoadingOwner(true);
      const res = await rentMasterFetch<BuildingOwnerReport>(
        `/api/admin/building/reports?kind=owner_statement&ownerId=${encodeURIComponent(ownerId)}`
      );
      setPrinting({
        title: t("Service charge statement"),
        name: `service-charge-${(res.owner.unitLabel || res.owner.name || "owner").replace(/[^\w.-]+/g, "-")}`,
        html: buildOwnerStatementHtml({
          building: { ...res.building, signatureUrl },
          owner: res.owner,
          invoices: res.invoices,
          totals: res.totals,
        }),
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingOwner(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle={signatureUrl ? "Printable statements on your building's letterhead, with your signature." : "Printable statements on your building's letterhead. Add a signature in Settings to sign them."}
      />

      {/* ---------------- income & expense ---------------- */}
      <Card className="p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-heading">
          <FileText className="h-4 w-4 text-primary" /> {t("Income & expense statement")}
        </h3>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="From">
            <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To">
            <TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <div className="flex items-end">
            <Button className="w-full" loading={loadingPeriod} onClick={runPeriod}>Preview</Button>
          </div>
        </div>

        {report && (
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Income" value={formatCurrency(report.income.total)} icon={TrendingUp} accent="emerald" />
              <StatCard label="Expenses" value={formatCurrency(report.expense.total)} icon={TrendingDown} accent="rose" />
              <StatCard
                label={report.net >= 0 ? "Surplus" : "Deficit"}
                value={formatCurrency(Math.abs(report.net))}
                sub={t("{0} entries").replace("{0}", String(report.entryCount))}
                icon={Scale}
                accent="indigo"
              />
            </div>

            {report.entryCount === 0 ? (
              <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">
                {t("Nothing was recorded in this period. The statement will still print, showing zero.")}
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <CategoryList title="Income" lines={report.income.lines} />
                <CategoryList title="Expenses" lines={report.expense.lines} />
              </div>
            )}

            <Button icon={Printer} onClick={printPeriod}>Print statement</Button>
          </div>
        )}
      </Card>

      {/* ---------------- owner statement ---------------- */}
      <Card className="p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-heading">
          <FileText className="h-4 w-4 text-primary" /> {t("Owner service-charge statement")}
        </h3>
        <p className="mb-4 text-sm text-muted">
          {t("Every invoice issued to one owner, what was received against each, and a running balance. The whole account is shown — a date filter would hide the opening balance, which is the number a statement exists to explain.")}
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field label="Owner">
              <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
                <option value="">{t("Choose an owner…")}</option>
                {owners.map((o) => (
                  <option key={o.owner_id} value={o.owner_id}>
                    {`${o.name || o.email}${o.unit_label ? ` — ${o.unit_label}` : ""}`}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex items-end">
            <Button className="w-full" icon={Printer} loading={loadingOwner} onClick={printOwnerStatement}>
              Print
            </Button>
          </div>
        </div>
      </Card>

      <PrintModal
        open={!!printing}
        onClose={() => setPrinting(null)}
        html={printing?.html || ""}
        title={printing?.title || t("Statement")}
        fileName={printing?.name}
      />
    </div>
  );
}

function CategoryList({ title, lines }: { title: string; lines: { category: string; amount: number }[] }) {
  const t = useT();
  return (
    <div className="rounded-xl bg-surface-2 p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t(title)}</div>
      {lines.length === 0 ? (
        <div className="text-sm text-subtle">{t("Nothing recorded.")}</div>
      ) : (
        <div className="space-y-1">
          {lines.map((l) => (
            <div key={l.category} className="flex justify-between text-sm">
              <span className="text-fg">{l.category}</span>
              <span className="font-medium text-heading">{formatCurrency(l.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
