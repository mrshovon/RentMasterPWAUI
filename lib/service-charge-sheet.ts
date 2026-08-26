import { translate as tr } from "./i18n";
import { formatMonth } from "./format";

// =====================================================================================
// ✂️ SERVICE CHARGE CUTTING SHEET — one A4 page of paired slips, printed and cut up.
//
// The building admin issues a month's service charges and then has to hand every flat owner a
// paper receipt. Doing that from the per-invoice modal is one modal per owner; a forty-flat
// building is forty modals. This is the whole month on one sheet: each row is ONE owner, their
// building copy on the left and their resident copy on the right, with dashed rules to cut along.
//
// WHY THIS IS NOT buildReceiptHtml(). Two reasons, both structural:
//   1. That template ALWAYS prints a PAID / PARTIAL / DUE word and a LATE flag. These slips are
//      handed over BEFORE any money changes hands — stamping DUE on all forty would be wrong on
//      the ones already settled and meaningless on the rest.
//   2. Its card is a fixed 780px scaled with `zoom:.45`, i.e. 351px. Two of those fill an A4 row
//      with nothing left for a gutter, and one is far too tall to fit four rows on a page.
// So this is a SIBLING file, which is the pattern lib/building-print.ts already set against the
// same receipt template rather than trying to generalise it.
//
// Strings go through tr(): this document leaves the app and lands in a resident's hands, which is
// the worst possible place for the language to revert to English. lib/ is inside the i18n check's
// scope, unlike the building console components that call this.
//
// The root element is `.sheet` because components/print-modal.tsx hard-codes that selector for
// its native rasterise path. Do not rename it without changing that too.
// =====================================================================================

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

const money = (n: number) =>
  "৳" + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

export interface ServiceChargeSlip {
  /** The invoice's human reference, e.g. 41. Null on a row that somehow has none. */
  invoiceNo?: number | null;
  ownerName: string;
  unitLabel?: string | null;
  serviceCharge: number;
  extraCharge?: number;
  extraChargeRemarks?: string | null;
  discount?: number;
  total: number;
}

export interface ServiceChargeSheetOptions {
  building: { name: string; address?: string | null; city?: string | null };
  /** The building admin's signature image. Omit it and each slip prints the rule alone. */
  signatureUrl?: string | null;
  /** "YYYY-MM". */
  month: string;
  rows: ServiceChargeSlip[];
}

/** Owners per A4 page. Each is one row of two slips, so this is 8 slips a page. */
const ROWS_PER_PAGE = 4;

// A4 portrait at a 10mm margin leaves 190mm x 277mm. Four rows plus their cut gaps fit that
// height, which is what fixes the slip's internal sizing: everything below is tuned to it, so
// changing ROWS_PER_PAGE means re-checking `.slip` padding and font sizes against real paper.
const CSS = `
*{box-sizing:border-box}
body{margin:0;background:#eef1f5;padding:16px;font-family:"Segoe UI",Roboto,Arial,sans-serif;color:#111}
.sheet{max-width:820px;margin:0 auto;background:#fff;padding:10mm;box-shadow:0 1px 6px rgba(0,0,0,.12)}
.page{}
/* One owner. The dashed rule under it is the horizontal cut line; the last row on a page does
   not need one because the paper edge is already there. */
/* min-height is what makes this cuttable. Left to size themselves the four rows bunch at the top
   of the page with ~90mm of dead paper below, so the three cut lines land at irregular intervals
   and the last slip is nowhere near the bottom edge. At 62mm each they divide the printable
   height evenly, so the cuts are at predictable spacings — which is the whole point of the sheet.
   4 x 62mm = 248mm, inside the ~261mm left by the @page margin plus the sheet's own padding. */
.slip-row{display:flex;gap:6mm;padding:3mm 0;min-height:62mm;border-bottom:1px dashed #9aa3ad;
  page-break-inside:avoid;break-inside:avoid}
.slip-row:last-child{border-bottom:0}
/* Two copies of the same slip. The left one carries the vertical cut line, so the gutter has a
   rule down its middle rather than two rules with a gap between them. */
.slip{flex:1 1 0;min-width:0;padding:0 4mm;border-right:1px dashed #9aa3ad;
  display:flex;flex-direction:column}
.slip:last-child{border-right:0}
.s-head{display:flex;justify-content:space-between;align-items:baseline;gap:6px}
.bname{font-size:12.5px;font-weight:800;letter-spacing:.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.copy{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#444;white-space:nowrap}
.baddr{font-size:8.5px;color:#666;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.doctitle{text-align:center;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;
  border-top:1px solid #111;border-bottom:1px solid #111;padding:2px 0;margin:3px 0 4px}
.line{display:flex;justify-content:space-between;font-size:10px;padding:1px 0}
.line .l{color:#555}
.line .v{font-weight:600;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60%}
.total{display:flex;justify-content:space-between;align-items:center;border:1.5px solid #111;
  padding:2px 6px;margin-top:3px;font-size:11.5px;font-weight:800}
/* margin-top:auto pushes the signature to the FOOT of the slip rather than leaving it tucked
   under the total with blank space below — a signature line needs room above it to sign in. */
.foot{display:flex;justify-content:flex-end;margin-top:auto;padding-top:6px}
.sign{text-align:center;min-width:44%}
.sign img{max-height:22px;max-width:100%;object-fit:contain;display:block;margin:0 auto 1px}
.sign .rule{border-top:1px solid #111}
.sign .role{font-size:7.5px;color:#444;margin-top:1px}
@page{size:A4 portrait;margin:10mm}
@media print{
  body{background:#fff;padding:0}
  /* The sheet keeps its own inner padding in print: the @page margin alone is not enough,
     because the browser's Margins dropdown ("None") overrides it and the slips would then print
     hard against the paper edge with nothing to cut. Same belt-and-braces as lib/receipt.ts. */
  .sheet{max-width:none;width:auto;margin:0;padding:8mm;box-shadow:none}
  .page{page-break-after:always;break-after:page}
  .page:last-child{page-break-after:auto;break-after:auto}
}
`;

/** One half of a row. `copyLabel` is the only thing that differs between the two. */
function slipHtml(o: ServiceChargeSheetOptions, r: ServiceChargeSlip, copyLabel: string): string {
  const addressLine = [o.building.address, o.building.city].filter(Boolean).join(", ");

  const line = (label: string, value: string) =>
    `<div class="line"><span class="l">${esc(label)}</span><span class="v">${esc(value)}</span></div>`;

  // Extra and discount appear only when they are non-zero. On a compact slip a row of zeroes is
  // noise, and the total is what the resident reads — but an unexplained total is worse, so a
  // real extra charge always earns its line.
  const extra = Number(r.extraCharge || 0);
  const discount = Number(r.discount || 0);

  const sigImg = o.signatureUrl ? `<img src="${esc(o.signatureUrl)}" alt="">` : "";

  return `<div class="slip">
  <div class="s-head">
    <div class="bname">${esc(o.building.name)}</div>
    <div class="copy">${esc(copyLabel)}</div>
  </div>
  ${addressLine ? `<div class="baddr">${esc(addressLine)}</div>` : ""}
  <div class="doctitle">${esc(tr("Service Charge Receipt"))}</div>
  ${line(tr("Month") + ":", formatMonth(o.month))}
  ${r.invoiceNo ? line(tr("Receipt") + ":", `#${r.invoiceNo}`) : ""}
  ${r.unitLabel ? line(tr("Flat") + ":", r.unitLabel) : ""}
  ${line(tr("Flat Owner") + ":", r.ownerName)}
  ${line(tr("Service Charge") + ":", money(r.serviceCharge))}
  ${extra > 0 ? line((r.extraChargeRemarks || tr("Extra Charge")) + ":", money(extra)) : ""}
  ${discount > 0 ? line(tr("Discount") + ":", "− " + money(discount)) : ""}
  <div class="total"><span>${esc(tr("Total"))}</span><span>${esc(money(r.total))}</span></div>
  <div class="foot">
    <div class="sign">${sigImg}<div class="rule"></div><div class="role">${esc(tr("Authorised Signature"))}</div></div>
  </div>
</div>`;
}

/**
 * The whole month as one printable A4 document.
 *
 * Deliberately carries NO payment status, balance or paid date: these slips are printed in
 * advance and handed out, so anything asserting whether the money has arrived would be wrong on
 * roughly half of them the moment they leave the printer.
 */
export function buildServiceChargeSheetHtml(o: ServiceChargeSheetOptions): string {
  // Chunked into explicit pages rather than left to flow, so `page-break-after` can put exactly
  // four owners on each sheet. Left to itself the browser would fit as many as the height allowed
  // and the count would drift with the font, which makes a stack of them impossible to cut evenly.
  const pages: ServiceChargeSlip[][] = [];
  for (let i = 0; i < o.rows.length; i += ROWS_PER_PAGE) {
    pages.push(o.rows.slice(i, i + ROWS_PER_PAGE));
  }

  const body = pages
    .map(
      (page) =>
        `<div class="page">` +
        page
          .map(
            (r) =>
              `<div class="slip-row">` +
              slipHtml(o, r, tr("Building Copy")) +
              slipHtml(o, r, tr("Resident Copy")) +
              `</div>`
          )
          .join("") +
        `</div>`
    )
    .join("");

  const title = `${tr("Service Charge Receipts")} — ${formatMonth(o.month)}`;

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><style>${CSS}</style></head><body>
<div class="sheet">${body}</div>
</body></html>`;
}
