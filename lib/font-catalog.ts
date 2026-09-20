import { CUSTOM_FAMILIES, isSafeFontUrl, type FontFormat } from "./font-validate";

// =====================================================================================
// THE FONT CATALOGUE — every typeface a super-admin may choose, and the code that turns a
// choice into a CSS font stack. This file is the authority; the backend
// (rent-master-pwa/lib/app-settings.ts) keeps only the ids, so it can refuse one that is
// not offered without also having to know what a font is.
//
// ⚠️ PROPERTY NAMING. Do NOT rename `name` to `label` (or `title`, `hint`, `sub`,
// `message`, `placeholder`, `error`). scripts/check-i18n.mjs treats those as translating
// props in ANY scanned file under lib/, and every family name here would become a missing
// Bangla key. They are proper nouns — "Inter" is "Inter" in both languages.
//
// ⚠️ `spec` IS NOT DERIVED FROM `family`, AND MUST NOT BE. Google's css2 endpoint answers
// 400 with NO CSS AT ALL when you ask for a weight a family does not have — it does not
// round down. This app uses font-black (900) in 29 places and font-extrabold (800) in 22,
// so a generated `:wght@100..900` against, say, Manrope (which stops at 800) would return
// nothing and the font would silently never load. Each spec below is the family's real axis,
// copied from its Google Fonts page. Adding a family means looking that up, not guessing.
// =====================================================================================

/**
 * Whether public/fonts/shadhinata-2.woff2 is actually in the repo.
 *
 * Shadhinata 2.0 is not on Google Fonts and has no canonical, licence-clear download, so the
 * file has to be added by hand — see public/fonts/README.md. Until it is, the picker shows the
 * option as unavailable rather than letting an admin select a face that would 404 and fall
 * through to the next family with no error anywhere. FLIP THIS TO `true` in the same commit
 * that adds the file.
 */
export const SHADHINATA_INSTALLED = false;

export type FontScript = "latin" | "bengali";

export interface FontEntry {
  /** Stable slug. This, and only this, is what app_settings stores. */
  id: string;
  /** What the admin sees in the picker. A proper noun — never translated. */
  name: string;
  /** The exact CSS family name written into the stack. */
  family: string;
  script: FontScript;
  /** Verbatim `family=` fragment for the css2 URL. Empty for a self-hosted face. */
  spec: string;
  /** false ⇒ font-black renders at this family's heaviest available cut instead of 900. */
  hasBlack: boolean;
  /** true ⇒ no network request; its @font-face is in app/globals.css. */
  selfHosted?: boolean;
  /** true ⇒ offered but not selectable: the file it needs is not in the repo yet. */
  unavailable?: boolean;
}

// ---------------------------------------------------------------- Latin
// None of these carry Bengali glyphs, which is the point: that absence is what makes the
// per-glyph fallback to the Bangla face below happen on its own, with no :lang() rules.
export const LATIN_FONTS: FontEntry[] = [
  { id: "inter", name: "Inter", family: "Inter", script: "latin", spec: "Inter:wght@100..900", hasBlack: true },
  { id: "roboto", name: "Roboto", family: "Roboto", script: "latin", spec: "Roboto:wght@100..900", hasBlack: true },
  { id: "open-sans", name: "Open Sans", family: "Open Sans", script: "latin", spec: "Open+Sans:wght@300..800", hasBlack: false },
  { id: "lato", name: "Lato", family: "Lato", script: "latin", spec: "Lato:wght@100;300;400;700;900", hasBlack: true },
  { id: "montserrat", name: "Montserrat", family: "Montserrat", script: "latin", spec: "Montserrat:wght@100..900", hasBlack: true },
  { id: "poppins", name: "Poppins", family: "Poppins", script: "latin", spec: "Poppins:wght@100;200;300;400;500;600;700;800;900", hasBlack: true },
  { id: "nunito-sans", name: "Nunito Sans", family: "Nunito Sans", script: "latin", spec: "Nunito+Sans:wght@200..1000", hasBlack: true },
  { id: "work-sans", name: "Work Sans", family: "Work Sans", script: "latin", spec: "Work+Sans:wght@100..900", hasBlack: true },
  { id: "source-sans-3", name: "Source Sans 3", family: "Source Sans 3", script: "latin", spec: "Source+Sans+3:wght@200..900", hasBlack: true },
  { id: "dm-sans", name: "DM Sans", family: "DM Sans", script: "latin", spec: "DM+Sans:wght@100..1000", hasBlack: true },
  { id: "figtree", name: "Figtree", family: "Figtree", script: "latin", spec: "Figtree:wght@300..900", hasBlack: true },
  { id: "outfit", name: "Outfit", family: "Outfit", script: "latin", spec: "Outfit:wght@100..900", hasBlack: true },
  { id: "rubik", name: "Rubik", family: "Rubik", script: "latin", spec: "Rubik:wght@300..900", hasBlack: true },
  { id: "public-sans", name: "Public Sans", family: "Public Sans", script: "latin", spec: "Public+Sans:wght@100..900", hasBlack: true },
  { id: "plus-jakarta-sans", name: "Plus Jakarta Sans", family: "Plus Jakarta Sans", script: "latin", spec: "Plus+Jakarta+Sans:wght@200..800", hasBlack: false },
  { id: "manrope", name: "Manrope", family: "Manrope", script: "latin", spec: "Manrope:wght@200..800", hasBlack: false },
  { id: "merriweather", name: "Merriweather", family: "Merriweather", script: "latin", spec: "Merriweather:wght@300..900", hasBlack: true },
  { id: "lora", name: "Lora", family: "Lora", script: "latin", spec: "Lora:wght@400..700", hasBlack: false },
];

// ---------------------------------------------------------------- Bengali
// This slot is never cosmetic-only. ৳ is U+09F3, inside the Bengali block, so whatever sits
// here renders the currency symbol on EVERY money figure in the app — including the English
// UI, where the digits beside it come from the Latin face (lib/format.ts keeps digits
// Western in both languages by decision). Pick for metric compatibility, not just looks.
export const BANGLA_FONTS: FontEntry[] = [
  // The one face we ship ourselves. See public/fonts/README.md.
  { id: "shadhinata-2", name: "Shadhinata 2.0", family: "Shadhinata 2.0", script: "bengali", spec: "", hasBlack: false, selfHosted: true, unavailable: !SHADHINATA_INSTALLED },
  { id: "noto-sans-bengali", name: "Noto Sans Bengali", family: "Noto Sans Bengali", script: "bengali", spec: "Noto+Sans+Bengali:wght@100..900", hasBlack: true },
  { id: "noto-serif-bengali", name: "Noto Serif Bengali", family: "Noto Serif Bengali", script: "bengali", spec: "Noto+Serif+Bengali:wght@100..900", hasBlack: true },
  { id: "hind-siliguri", name: "Hind Siliguri", family: "Hind Siliguri", script: "bengali", spec: "Hind+Siliguri:wght@300;400;500;600;700", hasBlack: false },
  { id: "anek-bangla", name: "Anek Bangla", family: "Anek Bangla", script: "bengali", spec: "Anek+Bangla:wght@100..800", hasBlack: false },
  { id: "baloo-da-2", name: "Baloo Da 2", family: "Baloo Da 2", script: "bengali", spec: "Baloo+Da+2:wght@400..800", hasBlack: false },
  { id: "tiro-bangla", name: "Tiro Bangla", family: "Tiro Bangla", script: "bengali", spec: "Tiro+Bangla:ital@0;1", hasBlack: false },
  { id: "atma", name: "Atma", family: "Atma", script: "bengali", spec: "Atma:wght@300;400;500;600;700", hasBlack: false },
  { id: "mina", name: "Mina", family: "Mina", script: "bengali", spec: "Mina:wght@400;700", hasBlack: false },
];

/**
 * Resolve an id, FAILING CLOSED. An id this build does not know — an older frontend against a
 * newer catalogue, a hand-edited settings row — is "unset", never a family name we then try
 * to load. Drift between the two repos can make a font unavailable; it cannot make one unsafe.
 */
export function findFont(id: string, script: FontScript): FontEntry | null {
  const list = script === "latin" ? LATIN_FONTS : BANGLA_FONTS;
  const hit = list.find((f) => f.id === id);
  // An entry whose file is not in the repo resolves to nothing, so a config saved before the
  // file was removed cannot put a family in the stack that has no @font-face behind it.
  return hit && !hit.unavailable ? hit : null;
}

// ---------------------------------------------------------------- building CSS

/** The shape the API hands us for one slot. Mirrors FontSlot in the backend. */
export interface CustomFontView { url: string; format: FontFormat; originalName: string }
export interface FontSlotView {
  latinId: string;
  banglaId: string;
  customLatin: CustomFontView | null;
  customBangla: CustomFontView | null;
}
export interface FontConfigView { body: FontSlotView; heading: FontSlotView; updatedAt: string }

export const EMPTY_SLOT: FontSlotView = { latinId: "", banglaId: "", customLatin: null, customBangla: null };
export const EMPTY_FONT_CONFIG: FontConfigView = {
  body: { ...EMPTY_SLOT },
  heading: { ...EMPTY_SLOT },
  updatedAt: "",
};

/** Which of the four fixed family names a custom face in this position is declared under. */
export function customFamilyFor(slot: "body" | "heading", script: FontScript): string {
  if (slot === "body") return script === "latin" ? CUSTOM_FAMILIES[0] : CUSTOM_FAMILIES[1];
  return script === "latin" ? CUSTOM_FAMILIES[2] : CUSTOM_FAMILIES[3];
}

/**
 * The families for one slot, in cascade order: custom Latin, curated Latin, custom Bangla,
 * curated Bangla. Returns "" when nothing is set, which is what keeps the CSS `var()`
 * fallback — i.e. the app's original stack — in charge by default.
 *
 * Only the Latin families need to come first: the browser walks the list per GLYPH, so a
 * Bengali character skips every Latin face that cannot draw it and lands on the Bangla one.
 */
export function buildStack(slot: FontSlotView, which: "body" | "heading"): string {
  const families: string[] = [];
  const push = (f: string | undefined) => {
    if (f && !families.includes(f)) families.push(f);
  };

  if (slot.customLatin) push(customFamilyFor(which, "latin"));
  push(findFont(slot.latinId, "latin")?.family);
  if (slot.customBangla) push(customFamilyFor(which, "bengali"));
  push(findFont(slot.banglaId, "bengali")?.family);

  return families.map((f) => `"${f}"`).join(", ");
}

/**
 * One css2 request covering every Google family in the config, or "" when none is selected.
 *
 * Built only from `spec` values that are in this file — never from anything that arrived over
 * the wire — so the URL is a fixed shape with a fixed set of possible contents.
 */
export function buildGoogleHref(config: FontConfigView): string {
  const specs = new Set<string>();
  for (const slot of [config.body, config.heading]) {
    for (const [id, script] of [[slot.latinId, "latin"], [slot.banglaId, "bengali"]] as const) {
      const entry = findFont(id, script);
      if (entry && !entry.selfHosted && entry.spec) specs.add(entry.spec);
    }
  }
  if (specs.size === 0) return "";
  return `https://fonts.googleapis.com/css2?${[...specs].map((s) => `family=${s}`).join("&")}&display=swap`;
}

/** The custom @font-face rules the config needs, as {name, url, format} triples. */
export function customFaces(config: FontConfigView): { n: string; u: string; t: FontFormat }[] {
  const out: { n: string; u: string; t: FontFormat }[] = [];
  for (const [which, slot] of [["body", config.body], ["heading", config.heading]] as const) {
    for (const [script, face] of [["latin", slot.customLatin], ["bengali", slot.customBangla]] as const) {
      // Re-validated HERE, at the last point before it becomes CSS, rather than trusting the
      // route that saved it. Same belt-and-braces as the id checks in analytics-gate.tsx.
      if (face && isSafeFontUrl(face.url)) {
        out.push({ n: customFamilyFor(which, script), u: face.url, t: face.format });
      }
    }
  }
  return out;
}

/** True when this config asks for nothing — i.e. the app renders exactly as it shipped. */
export function isDefaultConfig(c: FontConfigView): boolean {
  return buildStack(c.body, "body") === "" && buildStack(c.heading, "heading") === "";
}
