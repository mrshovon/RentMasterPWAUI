// Helpers for sharing a rent receipt over WhatsApp.

// Default country calling code for local numbers with no prefix. This build targets Bangladesh
// (৳ currency, "01XXXXXXXXX" mobile numbers), so a bare 11-digit "0…" number maps to +880.
const DEFAULT_CC = "880";

// Turn a stored phone into the digits-only, country-coded form wa.me expects (no "+", no spaces).
// Returns null when there aren't enough digits to be a real number.
export function normalizeWhatsappPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;

  // 00-prefixed international form -> drop the 00.
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Local BD mobile "01XXXXXXXXX" (11 digits, leading 0) -> replace the 0 with the country code.
  else if (digits.startsWith("0") && digits.length === 11) digits = DEFAULT_CC + digits.slice(1);
  // Already country-coded (e.g. 8801XXXXXXXXX) or another international number -> leave as-is.

  return digits.length >= 10 ? digits : null;
}

export interface ReceiptMessageContext {
  tenant: string;
  month: string;   // human label, e.g. "June 2026"
  amount: string;  // formatted, e.g. "৳12,000"
  status: string;  // "paid" | "unpaid" | "sent"
  property: string;
}

// Substitute the owner's template placeholders. Falls back to a sensible default sentence when the
// owner hasn't set a template yet.
export function resolveReceiptMessage(template: string | null | undefined, ctx: ReceiptMessageContext): string {
  const base = (template && template.trim())
    ? template
    : "Hello {tenant}, please find your rent receipt for {month}. Amount: {amount} ({status}).";
  return base
    .replace(/\{tenant\}/g, ctx.tenant)
    .replace(/\{month\}/g, ctx.month)
    .replace(/\{amount\}/g, ctx.amount)
    .replace(/\{status\}/g, ctx.status)
    .replace(/\{property\}/g, ctx.property);
}

// Open a WhatsApp chat to the given (normalized) number, prefilled with the message text.
export function openWhatsapp(normalizedPhone: string, text: string) {
  const url = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
