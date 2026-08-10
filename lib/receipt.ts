import { translate as tr } from "./i18n";
import { formatMonth } from "./format";

// Builds a self-contained, printable "MONEY RECEIPT" (inline CSS so it renders
// identically inside an <iframe> preview and a print window). Matches the
// reference design: bordered card, status word top-left, centered underlined
// title, landlord name + address, dotted label/value rows, boxed total, italic
// note, and a signature block bottom-right.

export interface ReceiptOptions {
  copyLabel: string;                 // "Owner Copy" | "Tenant Copy"
  // The name in the header. Falls back to the owner's account name, but a property can override
  // it (properties.receipt_name) so a building or business name goes on its receipts instead.
  // Deliberately NOT repeated in the signature block, which shows only the rule and its caption.
  ownerName?: string | null;
  propertyAddress?: string | null;   // header address line
  refNo?: string | null;             // bottom-left "Ref: ..."
  billingMonth: string;              // "YYYY-MM" -> "June 2026"
  tenantName: string;
  houseRent: number;
  serviceCharge: number;
  extraCharge: number;
  discount?: number;
  total: number;
  paymentStatus?: string;            // 'paid' | 'partial' | 'unpaid' | 'sent'
  paidAt?: string | null;            // ISO timestamp of the LAST payment
  dueDay?: number | null;            // tenant's rent due day-of-month
  // Installments, oldest first. Rent is often paid in parts, and the receipt has to show each
  // part with its own date so a tenant can prove what they paid and when.
  payments?: { paidOn: string; amount: number }[];
  amountPaid?: number;               // total received so far
  note?: string | null;              // owner's free-text note
  signatureUrl?: string | null;
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

// Month names come from lib/format.ts via formatMonth(), NOT from a local array. This file used
// to carry its own hardcoded English list, which is why a receipt shared by a Bangla-speaking
// owner still said "June 2026" — and a receipt is the one artefact that leaves the app entirely
// and lands in a tenant's hands, so it is the worst place for the language to revert.

function ordinal(d: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = d % 100;
  return d + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function buildReceiptHtml(o: ReceiptOptions): string {
  const money = (n: number) => "৳" + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

  const [y, m] = (o.billingMonth || "").split("-");
  const monthLabel = formatMonth(o.billingMonth) ;

  // Dates are compared as CALENDAR DAYS, not timestamps: paying on the due day is on time, which
  // is what the note printed further down actually promises ("by or on the 5th"). Comparing
  // timestamps made any payment after midnight on the due day read as late, and mixed a UTC
  // paid_at against a local-midnight due date.
  const pad = (n: number) => String(n).padStart(2, "0");
  const dayKey = (d: Date) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

  const paid = o.paidAt ? new Date(o.paidAt) : null;
  // A due day of 31 in a 30-day month means "the last day" — new Date(y, m, 0) is that day.
  const dueDayClamped = o.dueDay && y && m
    ? Math.min(o.dueDay, new Date(Number(y), Number(m), 0).getDate())
    : null;
  const dueKey = dueDayClamped ? Number(y) * 10000 + Number(m) * 100 + dueDayClamped : null;

  const installments = (o.payments || []).map((p) => {
    const d = new Date(`${String(p.paidOn).slice(0, 10)}T12:00:00.000Z`);
    return { date: d, key: dayKey(d), amount: Number(p.amount || 0) };
  });

  const isPaid = (o.paymentStatus || "paid") === "paid";
  const isPartial = o.paymentStatus === "partial";
  const amountPaid = Number(o.amountPaid ?? (isPaid ? o.total : 0));
  const balance = Math.max(0, Number(o.total || 0) - amountPaid);

  // Late when a payment landed after the due date, OR money is still owed once the due date has
  // passed — an invoice sitting half-paid weeks later is late whatever the installments say.
  const latePayment = !!(dueKey && installments.some((p) => p.key > dueKey));
  const overdueBalance = !!(dueKey && balance > 0 && dayKey(new Date()) > dueKey);
  // Falls back to the single paid_at for receipts built before the payment log existed.
  const legacyLate = !!(dueKey && !installments.length && paid && dayKey(paid) > dueKey);
  const late = latePayment || overdueBalance || legacyLate;

  const fmtDay = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  // Receipt date (last payment if there is one, else today), DD/MM/YYYY.
  const dateStr = fmtDay(paid || new Date());

  const statusWord = isPaid
    ? `<span class="status paid">${esc(tr("PAID"))}</span>`
    : isPartial
      ? `<span class="status partial">${esc(tr("PARTIAL"))}</span>`
      : `<span class="status due">${esc(tr("DUE"))}</span>`;
  const statusHtml = `${statusWord}${late ? ` <span class="status late">${esc(tr("LATE"))}</span>` : ""}`;
  const totalLabel = isPaid ? tr("Total Paid") : tr("Total Due");

  // A payment history is only worth printing when there is more than one payment. A rent
  // settled in one go — on time or late — says everything it needs to through the Date row
  // and the status word; itemising a list of one adds nothing.
  const showPayments = installments.length > 1;

  const row = (label: string, value: string, bold = false, red = false) =>
    `<div class="row${red ? " r" : ""}"><div class="lbl">${label}</div><div class="val${bold ? " b" : ""}">${value}</div></div>`;

  // Either the itemised payment history, or the plain "Date:" line it replaces.
  const paymentRowsHtml = showPayments
    ? installments
        .map((p, i) =>
          row(
            `${ordinal(i + 1)} ${tr("Payment")}:`,
            `${fmtDay(p.date)} — ${money(p.amount)}`,
            false,
            !!(dueKey && p.key > dueKey) // red: this one arrived after the due date
          )
        )
        .join("")
    : row(`${tr("Date")}:`, dateStr);

  // Outside the branch above: what is still owed is not payment history, and a single
  // part-payment needs it printed just as much as several do.
  const balanceRowHtml = balance > 0 ? row(`${tr("Balance Due")}:`, money(balance), true, overdueBalance) : "";

  let rowsHtml =
    paymentRowsHtml +
    balanceRowHtml +
    row(`${tr("Month")}:`, esc(monthLabel)) +
    row(`${tr("Tenant Name")}:`, esc(o.tenantName || tr("Tenant")), true) +
    row(`${tr("House Rent")}:`, money(o.houseRent)) +
    row(`${tr("Service Charge")}:`, money(o.serviceCharge)) +
    row(`${tr("Extra Charge")}:`, money(o.extraCharge));
  if (Number(o.discount) > 0) rowsHtml += row(`${tr("Discount")}:`, "−" + money(o.discount || 0));

  // Interpolated, so it cannot be an exact-match dictionary key: the day is spliced into a
  // translated template instead, the same technique lib/notice-i18n.ts uses for backend strings.
  const fixedNote = o.dueDay
    ? tr("Note: Please pay the rent by or on the {0} of the month.").replace("{0}", ordinal(o.dueDay))
    : tr("Note: Please pay the rent by or on the due date of the month.");
  const notesHtml =
    (o.note ? `<div class="note-line">${esc(o.note)}</div>` : "") +
    `<div class="note-line">${esc(fixedNote)}</div>`;

  const sigImg = o.signatureUrl
    ? `<img class="sig-img" src="${esc(o.signatureUrl)}" alt="Signature" />`
    : "";

  return (
`<!doctype html><html><head><meta charset="utf-8"><title>${esc(tr("Money Receipt"))}</title><style>
*{box-sizing:border-box}
body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#eef2f6;color:#111;padding:16px}
.receipt{max-width:780px;margin:0 auto;background:#fff;border:3px solid #000;padding:24px 28px;position:relative}
.head{display:grid;grid-template-columns:1fr auto 1fr;align-items:start;gap:8px}
.status{font-weight:700;font-size:17px}
.status.paid{color:#16a34a}.status.partial{color:#b45309}.status.due,.status.late{color:#dc2626}
.title{text-align:center;font-weight:800;font-size:26px;text-decoration:underline;letter-spacing:1px}
.copy{text-align:right;font-weight:700;font-size:13px;color:#111}
.oname{text-align:center;font-weight:800;font-size:20px;margin-top:10px}
.addr{text-align:center;font-size:13px;margin-top:4px}
.divider{border-top:3px solid #000;margin:12px 0 2px}
.row{display:flex;justify-content:space-between;align-items:center;padding:7px 2px;border-bottom:2px dotted #bcbcbc;font-size:15px}
.val.b{font-weight:700}
.row.r,.row.r .val{color:#dc2626;font-weight:700}
.total-box{display:flex;justify-content:space-between;align-items:center;border:3px solid #000;padding:10px 16px;margin-top:12px}
.t-lbl{font-weight:800;font-size:19px}.t-val{font-weight:800;font-size:22px}
.notes{margin-top:8px}
.note-line{font-style:italic;font-size:12px;margin-top:2px}
.bottom{display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px}
.ref{color:#8a8a8a;font-size:12px}
.sign{text-align:center;min-width:200px}
.sig-img{max-height:44px;max-width:160px;object-fit:contain;display:block;margin:0 auto 4px}
.sig-line{border-top:1.5px solid #000;width:190px;margin:0 auto}
.sig-role{font-size:12px;margin-top:6px}
@page{size:A4 portrait;margin:12mm}
@media print{body{background:#fff;padding:0}.receipt{zoom:.45;margin:0;max-width:none;width:780px;padding:24px 28px}}
</style></head><body><div class="receipt">
<div class="head"><div>${statusHtml}</div><div class="title">${esc(tr("MONEY RECEIPT"))}</div><div class="copy">${esc(o.copyLabel)}</div></div>
<div class="oname">${esc(o.ownerName || tr("Owner"))}</div>
<div class="addr">${esc(o.propertyAddress || "")}</div>
<div class="divider"></div>
${rowsHtml}
<div class="total-box"><div class="t-lbl">${totalLabel}:</div><div class="t-val">${money(o.total)}</div></div>
<div class="notes">${notesHtml}</div>
<div class="bottom">
<div class="ref">${esc(tr("Ref"))}: ${esc(o.refNo || "")}</div>
<div class="sign">${sigImg}<div class="sig-line"></div><div class="sig-role">${esc(tr("Landlord’s Signature"))}</div></div>
</div>
</div></body></html>`
  );
}
