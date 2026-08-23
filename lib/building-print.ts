import { translate as tr } from "./i18n";
import { formatMonth } from "./format";

// =====================================================================================
// 🖨️ BUILDING DOCUMENTS — printable, self-contained HTML.
//
// Same technique as lib/receipt.ts, and for the same reasons: each function returns a COMPLETE
// html document as a string, with every rule inlined, so it renders identically in the preview
// iframe and in the print window, and so nothing can be lost to a stylesheet that did not load.
//
// Unlike the receipt (one card, scaled down with `zoom`), these are real A4 documents that may
// run to several pages, so the sheet flows naturally and `thead` repeats across page breaks.
//
// Strings go through tr() — these documents leave the app and land in an owner's hands, which
// is the worst possible place for the language to revert to English. See lib/locales/bn.ts.
// =====================================================================================

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

const money = (n: number) =>
  "৳" + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

/** ISO date -> "14 Aug 2026". Deliberately not formatDate(): a printed document wants an
 *  unambiguous day-month-year, not a locale short form that could read as month-first. */
function printDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(String(iso).slice(0, 10) + "T12:00:00.000Z");
  if (Number.isNaN(d.getTime())) return String(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getUTCDate()} ${tr(months[d.getUTCMonth()])} ${d.getUTCFullYear()}`;
}

export interface BuildingHeader {
  name: string;
  address?: string | null;
  city?: string | null;
  letterheadUrl?: string | null;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
}

const CSS = `
*{box-sizing:border-box}
body{margin:0;background:#eef1f5;padding:24px;font-family:"Segoe UI",Roboto,Arial,sans-serif;color:#111}
.sheet{max-width:820px;margin:0 auto;padding:32px 36px;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.12)}
.lh{text-align:center;border-bottom:2px solid #111;padding-bottom:14px;margin-bottom:18px}
.lh img{max-height:96px;max-width:100%;object-fit:contain}
.lh .bname{font-size:26px;font-weight:800;letter-spacing:.4px}
.lh .baddr{font-size:13px;color:#444;margin-top:4px}
.meta{display:flex;justify-content:space-between;font-size:13px;color:#333;margin-bottom:18px}
.doctitle{text-align:center;font-size:19px;font-weight:800;letter-spacing:1px;text-transform:uppercase;
  text-decoration:underline;text-underline-offset:5px;margin:6px 0 18px}
.sub{font-size:13px;color:#444;margin-bottom:14px}
.sub b{color:#111}
table{width:100%;border-collapse:collapse;margin-bottom:18px;font-size:13.5px}
thead{display:table-header-group}
th{text-align:left;background:#f2f4f7;border:1px solid #cfd4da;padding:8px 10px;font-weight:700}
td{border:1px solid #cfd4da;padding:8px 10px;vertical-align:top}
td.n,th.n{text-align:right;white-space:nowrap}
tr.sum td{font-weight:800;background:#f8f9fb}
tr.net td{font-weight:800;background:#111;color:#fff;border-color:#111}
.section{font-size:14px;font-weight:800;margin:18px 0 8px;text-transform:uppercase;letter-spacing:.6px}
.body-text{font-size:14.5px;line-height:1.75;white-space:pre-wrap;margin:0 0 18px}
.empty{font-size:13px;color:#777;font-style:italic;padding:10px 0}
.sign{margin-top:46px;display:flex;justify-content:flex-end}
.sign .box{text-align:center;min-width:230px}
.sign .line{border-top:1.5px solid #111;margin-bottom:6px}
.sign .who{font-size:13.5px;font-weight:700}
.sign .role{font-size:12px;color:#444}
.foot{margin-top:26px;padding-top:10px;border-top:1px solid #dcdfe4;font-size:11px;color:#888;
  display:flex;justify-content:space-between}
@page{size:A4 portrait;margin:14mm}
@media print{
  body{background:#fff;padding:0}
  .sheet{max-width:none;width:auto;margin:0;padding:0;box-shadow:none}
  tr{page-break-inside:avoid}
}
`;

/** Header, signature block and footer are identical on all three documents, so they live here
 *  once. A document that omitted the signature would not be usable as a physical record. */
function shell(o: {
  building: BuildingHeader;
  docTitle: string;
  metaLeft?: string;
  metaRight?: string;
  bodyHtml: string;
  signatureCaption?: string;
}): string {
  const addressLine = [o.building.address, o.building.city].filter(Boolean).join(", ");

  // An uploaded letterhead replaces the typed header entirely — the point of one is that it
  // already carries the name, logo and address in the building's own layout.
  const header = o.building.letterheadUrl
    ? `<img src="${esc(o.building.letterheadUrl)}" alt="">`
    : `<div class="bname">${esc(o.building.name)}</div>` +
      (addressLine ? `<div class="baddr">${esc(addressLine)}</div>` : "");

  const signatory = o.building.signatoryName
    ? `<div class="who">${esc(o.building.signatoryName)}</div>` +
      (o.building.signatoryTitle ? `<div class="role">${esc(o.building.signatoryTitle)}</div>` : "")
    : `<div class="role">${esc(o.signatureCaption || tr("Authorised Signature"))}</div>`;

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.docTitle)}</title><style>${CSS}</style></head><body>
<div class="sheet">
  <div class="lh">${header}</div>
  ${o.metaLeft || o.metaRight
      ? `<div class="meta"><div>${o.metaLeft || ""}</div><div>${o.metaRight || ""}</div></div>`
      : ""}
  <div class="doctitle">${esc(o.docTitle)}</div>
  ${o.bodyHtml}
  <div class="sign"><div class="box"><div class="line"></div>${signatory}</div></div>
  <div class="foot">
    <span>${esc(o.building.name)}</span>
    <span>${esc(tr("Generated on"))} ${esc(printDate(new Date().toISOString()))}</span>
  </div>
</div></body></html>`;
}

/* ---------------------------------------------------------------- income & expense */

export interface PeriodStatementOptions {
  building: BuildingHeader;
  period: { from: string; to: string };
  income: { total: number; lines: { category: string; amount: number }[] };
  expense: { total: number; lines: { category: string; amount: number }[] };
  net: number;
}

export function buildPeriodStatementHtml(o: PeriodStatementOptions): string {
  const table = (
    heading: string,
    lines: { category: string; amount: number }[],
    total: number
  ) => `
<div class="section">${esc(tr(heading))}</div>
<table>
  <thead><tr><th>${esc(tr("Category"))}</th><th class="n">${esc(tr("Amount"))}</th></tr></thead>
  <tbody>
    ${lines.length
      ? lines
          .map(
            (l) =>
              `<tr><td>${esc(tr(l.category))}</td><td class="n">${esc(money(l.amount))}</td></tr>`
          )
          .join("")
      : `<tr><td colspan="2" class="empty">${esc(tr("Nothing recorded in this period."))}</td></tr>`}
    <tr class="sum"><td>${esc(tr("Total"))}</td><td class="n">${esc(money(total))}</td></tr>
  </tbody>
</table>`;

  const netLabel = o.net >= 0 ? tr("Surplus") : tr("Deficit");

  const body = `
<div class="sub">
  <b>${esc(tr("Period"))}:</b> ${esc(printDate(o.period.from))} &ndash; ${esc(printDate(o.period.to))}
</div>
${table("Income", o.income.lines, o.income.total)}
${table("Expenses", o.expense.lines, o.expense.total)}
<table>
  <tbody>
    <tr class="net"><td>${esc(netLabel)}</td><td class="n">${esc(money(Math.abs(o.net)))}</td></tr>
  </tbody>
</table>`;

  return shell({
    building: o.building,
    docTitle: tr("Income & Expense Statement"),
    metaRight: `${esc(tr("Issued"))}: ${esc(printDate(new Date().toISOString()))}`,
    bodyHtml: body,
  });
}

/* ---------------------------------------------------------------- owner statement */

export interface OwnerStatementInvoice {
  billing_month: string;
  total_payable: number;
  amount_paid: number;
  payment_status: string;
}

export interface OwnerStatementOptions {
  building: BuildingHeader;
  owner: { name?: string | null; unitLabel?: string | null; email?: string | null };
  invoices: OwnerStatementInvoice[];
  totals: { billed: number; received: number; due: number };
}

export function buildOwnerStatementHtml(o: OwnerStatementOptions): string {
  // A running balance is the whole reason a statement beats a list of invoices: it answers
  // "what do I owe right now" without the reader adding anything up.
  let running = 0;
  const rows = o.invoices
    .map((i) => {
      const payable = Number(i.total_payable || 0);
      const paid = Number(i.amount_paid || 0);
      running += payable - paid;
      return `<tr>
<td>${esc(formatMonth(i.billing_month))}</td>
<td class="n">${esc(money(payable))}</td>
<td class="n">${esc(money(paid))}</td>
<td class="n">${esc(money(running))}</td>
</tr>`;
    })
    .join("");

  const body = `
<div class="sub">
  <b>${esc(tr("Owner"))}:</b> ${esc(o.owner.name || "—")}
  ${o.owner.unitLabel ? ` &nbsp;·&nbsp; <b>${esc(tr("Flat"))}:</b> ${esc(o.owner.unitLabel)}` : ""}
</div>
<table>
  <thead><tr>
    <th>${esc(tr("Month"))}</th>
    <th class="n">${esc(tr("Payable"))}</th>
    <th class="n">${esc(tr("Received"))}</th>
    <th class="n">${esc(tr("Balance"))}</th>
  </tr></thead>
  <tbody>
    ${rows || `<tr><td colspan="4" class="empty">${esc(tr("No invoices have been issued yet."))}</td></tr>`}
    <tr class="sum">
      <td>${esc(tr("Total"))}</td>
      <td class="n">${esc(money(o.totals.billed))}</td>
      <td class="n">${esc(money(o.totals.received))}</td>
      <td class="n">${esc(money(o.totals.due))}</td>
    </tr>
  </tbody>
</table>
<div class="sub">${esc(tr("Balance shown is the amount outstanding after each month's invoice."))}</div>`;

  return shell({
    building: o.building,
    docTitle: tr("Service Charge Statement"),
    metaRight: `${esc(tr("Issued"))}: ${esc(printDate(new Date().toISOString()))}`,
    bodyHtml: body,
  });
}

/* ---------------------------------------------------------------- notice letter */

export interface NoticeLetterOptions {
  building: BuildingHeader;
  title: string;
  content: string;
  issuedOn: string;
  referenceNo?: string | null;
  noticeNo?: number | null;
  audienceLabel?: string | null;
}

export function buildNoticeLetterHtml(o: NoticeLetterOptions): string {
  // A physical notice needs something a reader can quote back. The typed reference wins; the
  // identity column is the fallback so there is ALWAYS one.
  const ref = o.referenceNo || (o.noticeNo != null ? `#${o.noticeNo}` : "");

  const body = `
${o.audienceLabel ? `<div class="sub"><b>${esc(tr("To"))}:</b> ${esc(o.audienceLabel)}</div>` : ""}
<p class="body-text">${esc(o.content)}</p>`;

  return shell({
    building: o.building,
    docTitle: o.title,
    metaLeft: ref ? `${esc(tr("Ref"))}: ${esc(ref)}` : "",
    metaRight: `${esc(tr("Date"))}: ${esc(printDate(o.issuedOn))}`,
    bodyHtml: body,
  });
}
