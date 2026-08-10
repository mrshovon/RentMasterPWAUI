// =============================================================================
// Notice text localisation.
//
// A notice row's title/content is free text in the DB, so it can't go through `t()` blindly —
// but only SOME of it is actually free. Two sources write into `notices`:
//
//   1. The owner (or super-admin), typing whatever they want. Untranslatable, and left alone.
//   2. Bari360's own backend, emitting a fixed set of strings — 'Rent reminder' when a
//      scheduled reminder fires (rent-master-pwa/lib/reminders.ts) and 'Rent payment marked as
//      sent' when a tenant flags an invoice (app/api/admin/billing/[id]/route.ts).
//
// Group 2 is a closed set the app authored itself, so it can and should read in the user's
// language. Fixed strings need nothing but a bn.ts entry; the one body that interpolates values
// gets a template below, because `t()` is exact-match and a name/month/amount never matches.
//
// Everything falls through to the original string, so an owner's Bangla or English prose, and
// any new backend string not yet listed here, renders exactly as written.
// =============================================================================

/**
 * Backend-generated bodies that carry values. `re` captures the variable parts; `en` is the
 * dictionary key with `{0}`, `{1}`… where those parts go back in.
 *
 * Keep `en` character-identical to the backend's template, minus the interpolations — it is the
 * bn.ts lookup key. If the backend wording changes, change it in both places.
 */
const TEMPLATES: { re: RegExp; en: string }[] = [
  {
    // "Aminul marked the rent for 2026-07 (৳16,500) as sent. Please verify…"
    re: /^(.+) marked the rent for (.+) \(৳(.+)\) as sent\. Please verify the payment and confirm receipt\.$/,
    en: "{0} marked the rent for {1} (৳{2}) as sent. Please verify the payment and confirm receipt.",
  },
  // ---- subscription lifecycle (rent-master-pwa/app/api/cron/subscriptions/route.ts) ----
  // Keep these character-identical to messageFor() in that route. The titles need nothing here —
  // they are fixed strings and resolve through the exact-match path — but every body interpolates
  // a tier name, a day count or the free limits, so none of them can be a dictionary key.
  {
    // "Your Premium plan expires in 7 days. Renew now to keep everything as it is."
    re: /^Your (.+) plan expires in (\d+) days?\. Renew now to keep everything as it is\.$/,
    en: "Your {0} plan expires in {1} days. Renew now to keep everything as it is.",
  },
  {
    // "Your Premium plan has expired. You have 6 days left to renew before…"
    re: /^Your (.+) plan has expired\. You have (\d+) days? left to renew before your account moves to the free plan\.$/,
    en: "Your {0} plan has expired. You have {1} days left to renew before your account moves to the free plan.",
  },
  {
    // "Your Premium plan has ended and you are now on the free plan — 2 properties and 2 tenants…"
    re: /^Your (.+) plan has ended and you are now on the free plan — (\d+) propert(?:y|ies) and (\d+) tenants?\. Nothing has been deleted; anything beyond those limits is view-only until you choose a plan\.$/,
    en: "Your {0} plan has ended and you are now on the free plan — {1} properties and {2} tenants. Nothing has been deleted; anything beyond those limits is view-only until you choose a plan.",
  },
];

/**
 * Localise one notice title or body.
 *
 * @param text  the raw DB value
 * @param t     the translator from `useT()`
 */
export function translateNoticeText(text: string, t: (s: string) => string): string {
  if (!text) return text;

  // Fixed strings ('Rent reminder', 'Rent payment marked as sent') resolve here.
  const exact = t(text);
  if (exact !== text) return exact;

  for (const { re, en } of TEMPLATES) {
    const match = text.match(re);
    if (!match) continue;
    const translated = t(en);
    // No bn.ts entry for this template yet — the original reads better than a string with
    // literal {0} placeholders in it.
    if (translated === en) return text;
    // Values are spliced back verbatim: names stay as typed and amounts keep Western digits,
    // per the digit rule documented at the top of lib/locales/bn.ts.
    return translated.replace(/\{(\d+)\}/g, (ph, i) => match[Number(i) + 1] ?? ph);
  }

  // Owner-authored prose. Not ours to rewrite.
  return text;
}
