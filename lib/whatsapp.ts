// Helpers for sharing a rent receipt over WhatsApp.

import { BD_COUNTRY_CODE, BD_PHONE_LEN, validatePhone } from "./validate";
import { translate } from "./i18n";

// Turn a stored phone into the digits-only, country-coded form wa.me expects (no "+", no spaces).
// Returns null when the number isn't one WhatsApp could reach.
//
// The parsing lives in lib/validate.ts so this and the input validation can never disagree about
// what "01712345678" means. Rows written before that validation existed may be in any shape, so
// a number that won't parse still gets the old lenient digits-only treatment rather than
// silently losing the owner their share button.
export function normalizeWhatsappPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  const parsed = validatePhone(phone);
  if (parsed.ok && parsed.value) {
    // Local BD form -> country code + national number. International is already "+<digits>".
    return parsed.value.startsWith("0") && parsed.value.length === BD_PHONE_LEN
      ? BD_COUNTRY_CODE + parsed.value.slice(1)
      : parsed.value.replace(/\D/g, "");
  }

  // Legacy fallback for pre-validation rows.
  let digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0") && digits.length === BD_PHONE_LEN) {
    digits = BD_COUNTRY_CODE + digits.slice(1);
  }
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
  // An owner's own template is prose they wrote and is never rewritten — the same rule as
  // lib/notice-i18n.ts. Only OUR default sentence is translated, so a Bangla-speaking owner who
  // has not customised anything still sends their tenant a Bangla message.
  const base = (template && template.trim())
    ? template
    : translate("Hello {tenant}, please find your rent receipt for {month}. Amount: {amount} ({status}).");
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
