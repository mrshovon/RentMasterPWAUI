// Small formatting helpers shared across the dashboards.
//
// The date helpers can't be hooks — they're called from render bodies, event handlers and the
// receipt builder alike — so they default to the language the i18n provider mirrors outside
// React (getCurrentLang). That means existing call sites translate with no edit, while a caller
// that needs a specific language can still pass one explicitly.
//
// Digits stay Western in both languages by decision (৳16,500, not ৳১৬,৫০০), so only month words
// change. formatCurrency is therefore language-independent.

import { getCurrentLang, type Lang } from "./i18n";

const MONTHS: Record<Lang, string[]> = {
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
  bn: [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
  ],
};

const MONTHS_SHORT: Record<Lang, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  bn: MONTHS.bn, // Bangla month names are already short; abbreviating them reads oddly.
};

/** ৳12,500 style currency. */
export function formatCurrency(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return `৳${n.toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
}

/** "2026-06" -> "June 2026" / "জুন 2026". Falls back to the raw string if unparseable. */
export function formatMonth(month: string | null | undefined, lang: Lang = getCurrentLang()): string {
  if (!month) return "—";
  const [year, m] = month.split("-");
  const idx = parseInt(m, 10) - 1;
  const names = MONTHS[lang] ?? MONTHS.en;
  if (Number.isNaN(idx) || !names[idx] || !year) return month;
  return `${names[idx]} ${year}`;
}

/** ISO timestamp -> "7 Jul 2026" / "7 জুলাই 2026". */
export function formatDate(iso: string | null | undefined, lang: Lang = getCurrentLang()): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  if (lang === "bn") {
    // Built by hand rather than via toLocaleDateString("bn-BD"), which also converts the
    // digits to Bengali numerals — and the decision was to keep numbers Western.
    return `${d.getDate()} ${MONTHS_SHORT.bn[d.getMonth()]} ${d.getFullYear()}`;
  }
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** ISO timestamp -> "7 Jul 2026, 14:30". For windows where the time of day matters. */
export function formatDateTime(iso: string | null | undefined, lang: Lang = getCurrentLang()): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (lang === "bn") {
    return `${d.getDate()} ${MONTHS_SHORT.bn[d.getMonth()]} ${d.getFullYear()}, ${time}`;
  }
  return `${formatDate(iso, lang)}, ${time}`;
}

/** Day-of-month with ordinal suffix: 5 -> "5th". */
export function ordinalDay(day: number | null | undefined): string {
  const d = Number(day ?? 0);
  if (!d) return "—";
  const s = ["th", "st", "nd", "rd"];
  const v = d % 100;
  return `${d}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

/**
 * Attachment URLs are stored in a single text column: a lone URL as a plain string,
 * or several as a JSON array. Returns a normalised list for either shape (and legacy rows).
 */
export function parseAttachments(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const s = String(raw).trim();
  if (!s) return [];
  if (s.startsWith("[")) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) return arr.filter((u) => typeof u === "string" && u.trim() !== "");
    } catch {
      /* fall through — treat as a single plain URL */
    }
  }
  return [s];
}

/** The auto-generated temp passcode is the last 4 digits of the phone. */
export function tempPasscode(phone: string | null | undefined): string {
  if (!phone) return "————";
  return phone.toString().trim().slice(-4).padStart(4, "•");
}
