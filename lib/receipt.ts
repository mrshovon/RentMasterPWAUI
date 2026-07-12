// Builds a self-contained, printable "MONEY RECEIPT" (inline CSS so it renders
// identically inside an <iframe> preview and a print window). Matches the
// reference design: bordered card, status word top-left, centered underlined
// title, landlord name + address, dotted label/value rows, boxed total, italic
// note, and a signature block bottom-right.

export interface ReceiptOptions {
  copyLabel: string;                 // "Owner Copy" | "Tenant Copy"
  ownerName?: string | null;         // landlord — header title + signature name
  propertyAddress?: string | null;   // header address line
  refNo?: string | null;             // bottom-left "Ref: ..."
  billingMonth: string;              // "YYYY-MM" -> "June 2026"
  tenantName: string;
  houseRent: number;
  serviceCharge: number;
  extraCharge: number;
  discount?: number;
  total: number;
  paymentStatus?: string;            // 'paid' | 'unpaid' | 'sent'
  paidAt?: string | null;            // ISO timestamp of payment
  dueDay?: number | null;            // tenant's rent due day-of-month
  note?: string | null;              // owner's free-text note
  signatureUrl?: string | null;
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function ordinal(d: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = d % 100;
  return d + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function buildReceiptHtml(o: ReceiptOptions): string {
  const money = (n: number) => "৳" + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

  const [y, m] = (o.billingMonth || "").split("-");
  const monthLabel = MONTHS[parseInt(m, 10) - 1] ? `${MONTHS[parseInt(m, 10) - 1]} ${y}` : o.billingMonth;

  const dueDate = o.dueDay && y && m ? new Date(Number(y), Number(m) - 1, o.dueDay) : null;
  const paid = o.paidAt ? new Date(o.paidAt) : null;
  const late = !!(paid && dueDate && paid.getTime() > dueDate.getTime());
  const isPaid = (o.paymentStatus || "paid") === "paid";

  // Receipt date (payment date if paid, else today), DD/MM/YYYY.
  const dt = paid || new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;

  const statusHtml = isPaid
    ? `<span class="status paid">PAID</span>${late ? ` <span class="status late">LATE</span>` : ""}`
    : `<span class="status due">DUE</span>`;
  const totalLabel = isPaid ? "Total Paid" : "Total Due";

  const row = (label: string, value: string, bold = false) =>
    `<div class="row"><div class="lbl">${label}</div><div class="val${bold ? " b" : ""}">${value}</div></div>`;

  let rowsHtml =
    row("Date:", dateStr) +
    row("Month:", esc(monthLabel)) +
    row("Tenant Name:", esc(o.tenantName || "Tenant"), true) +
    row("House Rent:", money(o.houseRent)) +
    row("Service Charge:", money(o.serviceCharge)) +
    row("Extra Charge:", money(o.extraCharge));
  if (Number(o.discount) > 0) rowsHtml += row("Discount:", "−" + money(o.discount || 0));

  const fixedNote = o.dueDay
    ? `Note: Please pay the rent by or on the ${ordinal(o.dueDay)} of the month.`
    : `Note: Please pay the rent by or on the due date of the month.`;
  const notesHtml =
    (o.note ? `<div class="note-line">${esc(o.note)}</div>` : "") +
    `<div class="note-line">${esc(fixedNote)}</div>`;

  const sigImg = o.signatureUrl
    ? `<img class="sig-img" src="${esc(o.signatureUrl)}" alt="Signature" />`
    : "";

  return (
`<!doctype html><html><head><meta charset="utf-8"><title>Money Receipt</title><style>
*{box-sizing:border-box}
body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#eef2f6;color:#111;padding:16px}
.receipt{max-width:780px;margin:0 auto;background:#fff;border:3px solid #000;padding:24px 28px;position:relative}
.head{display:grid;grid-template-columns:1fr auto 1fr;align-items:start;gap:8px}
.status{font-weight:700;font-size:17px}
.status.paid{color:#16a34a}.status.due,.status.late{color:#dc2626}
.title{text-align:center;font-weight:800;font-size:26px;text-decoration:underline;letter-spacing:1px}
.copy{text-align:right;font-weight:700;font-size:13px;color:#111}
.oname{text-align:center;font-weight:800;font-size:20px;margin-top:10px}
.addr{text-align:center;font-size:13px;margin-top:4px}
.divider{border-top:3px solid #000;margin:12px 0 2px}
.row{display:flex;justify-content:space-between;align-items:center;padding:7px 2px;border-bottom:2px dotted #bcbcbc;font-size:15px}
.val.b{font-weight:700}
.total-box{display:flex;justify-content:space-between;align-items:center;border:3px solid #000;padding:10px 16px;margin-top:12px}
.t-lbl{font-weight:800;font-size:19px}.t-val{font-weight:800;font-size:22px}
.notes{margin-top:8px}
.note-line{font-style:italic;font-size:12px;margin-top:2px}
.bottom{display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px}
.ref{color:#8a8a8a;font-size:12px}
.sign{text-align:center;min-width:200px}
.sig-img{max-height:44px;max-width:160px;object-fit:contain;display:block;margin:0 auto 4px}
.sig-line{border-top:1.5px solid #000;width:190px;margin:0 auto}
.sig-name{font-weight:700;font-size:14px;margin-top:6px}
.sig-role{font-size:12px;margin-top:2px}
@page{size:A4 portrait;margin:12mm}
@media print{body{background:#fff;padding:0}.receipt{zoom:.45;margin:0;max-width:none;width:780px;padding:24px 28px}}
</style></head><body><div class="receipt">
<div class="head"><div>${statusHtml}</div><div class="title">MONEY RECEIPT</div><div class="copy">${esc(o.copyLabel)}</div></div>
<div class="oname">${esc(o.ownerName || "Owner")}</div>
<div class="addr">${esc(o.propertyAddress || "")}</div>
<div class="divider"></div>
${rowsHtml}
<div class="total-box"><div class="t-lbl">${totalLabel}:</div><div class="t-val">${money(o.total)}</div></div>
<div class="notes">${notesHtml}</div>
<div class="bottom">
<div class="ref">Ref: ${esc(o.refNo || "")}</div>
<div class="sign">${sigImg}<div class="sig-line"></div><div class="sig-name">${esc(o.ownerName || "Owner")}</div><div class="sig-role">Landlord's Signature</div></div>
</div>
</div></body></html>`
  );
}
