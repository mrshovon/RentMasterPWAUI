// Small formatting helpers shared across the dashboards.

/** ৳12,500 style currency. */
export function formatCurrency(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return `৳${n.toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
}

/** "2026-06" -> "June 2026". Falls back to the raw string if unparseable. */
export function formatMonth(month: string | null | undefined): string {
  if (!month) return "—";
  const [year, m] = month.split("-");
  const idx = parseInt(m, 10) - 1;
  const names = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  if (Number.isNaN(idx) || !names[idx] || !year) return month;
  return `${names[idx]} ${year}`;
}

/** ISO timestamp -> "7 Jul 2026". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
