#!/usr/bin/env node
// =============================================================================
// i18n coverage check — `npm run check-i18n`
//
// WHY THIS EXISTS: in this app the English string IS the dictionary key, and a miss returns its
// own argument (lib/i18n.tsx). That is what lets the locale grow incrementally without ever
// breaking the UI — and it is also why a gap is completely invisible. A typo'd key, a new button,
// a forgotten placeholder: all of them render perfectly good English to someone who asked for
// Bangla, with no error, no warning, and nothing in the console. The only way to find them was to
// click through every screen.
//
// So this script finds them instead. Two independent classes of gap:
//
//   DICT — the string DOES reach t() (directly, or through a self-translating prop on a UI
//          primitive) but has no entry in lib/locales/bn.ts. Fix: add the entry.
//   CODE — the string never reaches t() at all: raw JSX text, an <option> label, a placeholder on
//          a bare <input>. Fix: wrap it, or route it through a primitive that translates.
//
// The super-admin console is out of scope by standing decision (see lib/locales/bn.ts).
//
// Exits non-zero when anything is found, so it can gate a build.
// =============================================================================

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

/** Files whose user-facing text must be fully translatable. */
const INCLUDE_DIRS = ["app", "components", "lib"];
const EXCLUDE = [
  "app/admin/page.tsx",     // super-admin console — intentionally English
  // The building-admin console is an operator tool, English by the same standing decision as the
  // super-admin console above. The OWNER-facing view of the same service charges is
  // components/service-charge-tab.tsx, which is in scope and fully translated.
  "app/building/page.tsx",
  "components/building-invoices-tab.tsx",
  "components/building-spaces-tab.tsx",
  "components/building-setup-tab.tsx",
  "components/building-notices-tab.tsx",
  "components/building-reports-tab.tsx",
  "components/building-plan-tab.tsx",
  "app/global-error.tsx",   // runs with the LanguageProvider gone; English by necessity
  "app/sw.ts",              // service worker: no React context at all
];

// Props that the primitives in components/ui.tsx translate for their caller.
const TRANSLATING_PROPS = [
  "title", "subtitle", "label", "hint", "sub", "error",
  "placeholder", "message", "confirmLabel", "cancelLabel", "roleLabel",
];

// Components that translate their own string children.
const TRANSLATING_CHILDREN = ["Button", "Badge"];

// A literal worth translating: has a letter, is not an identifier/class-string/url.
function isProse(s) {
  if (!s || s.length < 2) return false;
  if (!/[A-Za-z]/.test(s)) return false;
  if (/^[a-z0-9_-]+$/.test(s)) return false;             // slug / key / css token
  if (/^[\w.-]+@[\w.-]+$/.test(s)) return false;         // sample email
  if (/^(https?:)?\/\//.test(s)) return false;           // url
  if (/^[\d\s+()-]+$/.test(s)) return false;             // sample phone
  if (/^[A-Z]{1,4}-?[A-Z0-9]*$/.test(s)) return false;   // G-XXXX, GTM-, UNIT-
  if (/^(px|rem|em|auto|none|flex|grid)$/.test(s)) return false;
  return /[A-Za-z]{2,}/.test(s);
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(p);
  }
  return out;
}

// ---- the dictionary -------------------------------------------------------
const bnSource = readFileSync(join(ROOT, "lib/locales/bn.ts"), "utf8");
const bnKeys = new Set();
// Keys are either "quoted strings" or bare identifiers, both followed by a colon.
for (const m of bnSource.matchAll(/^\s*"((?:[^"\\\n]|\\.)*)"\s*:/gm)) {
  bnKeys.add(m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\"));
}
for (const m of bnSource.matchAll(/^\s*([A-Za-z][A-Za-z0-9_]*)\s*:/gm)) {
  if (m[1] !== "export" && m[1] !== "const") bnKeys.add(m[1]);
}

// ---- scan -----------------------------------------------------------------
const files = INCLUDE_DIRS.flatMap((d) => walk(join(ROOT, d)))
  .map((f) => relative(ROOT, f).replace(/\\/g, "/"))
  .filter((f) => !EXCLUDE.includes(f))
  .sort();

const dictGaps = new Map();  // string -> Set(file)
const codeGaps = [];         // { file, line, kind, text }

const add = (map, key, file) => {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(file);
};

for (const file of files) {
  const src = readFileSync(join(ROOT, file), "utf8");
  const lines = src.split(/\r?\n/);

  // --- strings that DO reach t() → dictionary coverage ---
  const reaching = new Set();

  for (const m of src.matchAll(/\bt\(\s*"((?:[^"\\\n]|\\.)*)"\s*\)/g)) reaching.add(m[1]);
  for (const m of src.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'\s*\)/g)) reaching.add(m[1]);

  // The non-React translator, used by lib/receipt.ts and lib/whatsapp.ts — code that builds a
  // document rather than a tree. Missed by the `t(` patterns above because it is imported under a
  // different name, which is exactly how the receipt stayed English while everything around it
  // was translated.
  //
  // Gated on the file actually importing it, because `tr(`/`translate(` are short enough to occur
  // inside unrelated string literals (lib/native-push.ts has an `addListener("…` that matched).
  if (/import\s*\{[^}]*\btranslate\b[^}]*\}\s*from\s*["'][^"']*i18n["']/.test(src)) {
    for (const m of src.matchAll(/\b(?:tr|translate)\(\s*"((?:[^"\\\n]|\\.)*)"/g)) reaching.add(m[1]);
  }

  const propRe = new RegExp(`\\b(?:${TRANSLATING_PROPS.join("|")})=\\{?"((?:[^"\\\\\\n]|\\\\.)*)"`, "g");
  for (const m of src.matchAll(propRe)) reaching.add(m[1]);

  // `toast.success("…")`, `confirmDialog({ title: "…", message: "…" })`
  for (const m of src.matchAll(/\btoast\.\w+\(\s*"((?:[^"\\\n]|\\.)*)"/g)) reaching.add(m[1]);
  // `\s*` deliberately does NOT span lines here: `console.error("…", err)` two lines above a
  // quoted string would otherwise pair up and capture a block of code as a "translatable string".
  const objPropRe = new RegExp(`\\b(?:${TRANSLATING_PROPS.join("|")}):[ \\t]*"((?:[^"\\\\\\n]|\\\\.)*)"`, "g");
  for (const m of src.matchAll(objPropRe)) reaching.add(m[1]);

  // `<Button …>Add property</Button>` — children of a self-translating component.
  const childRe = new RegExp(`<(?:${TRANSLATING_CHILDREN.join("|")})\\b[^>]*>\\s*([^<>{}\\n][^<>{}]*?)\\s*</(?:${TRANSLATING_CHILDREN.join("|")})>`, "g");
  for (const m of src.matchAll(childRe)) reaching.add(m[1].trim());

  for (const s of reaching) {
    if (isProse(s) && !bnKeys.has(s)) add(dictGaps, s, file);
  }

  // --- strings that never reach t() at all ---
  lines.forEach((line, i) => {
    const at = { file, line: i + 1 };

    // placeholder / aria-label on a BARE element (our primitives translate their own).
    for (const m of line.matchAll(/\b(placeholder|aria-label)="((?:[^"\\\n]|\\.)*)"/g)) {
      if (/<(input|textarea|select)\b/i.test(line) && isProse(m[2])) {
        codeGaps.push({ ...at, kind: m[1], text: m[2] });
      }
    }

    // <option>Label</option>
    for (const m of line.matchAll(/<option\b[^>]*>\s*([^<>{}][^<>{}]*?)\s*<\/option>/g)) {
      if (isProse(m[1])) codeGaps.push({ ...at, kind: "option", text: m[1].trim() });
    }

    // Raw JSX text in a plain element: <h3 …>Available plans</h3>, <th …>Flat</th>, <span>…</span>
    for (const m of line.matchAll(/<(h[1-6]|th|td|p|span|div|label|strong|li)\b[^>]*>\s*([^<>{}][^<>{}]*?)\s*<\/\1>/g)) {
      if (isProse(m[2])) codeGaps.push({ ...at, kind: `<${m[1]}>`, text: m[2].trim() });
    }
  });
}

// ---- report ---------------------------------------------------------------
const dictList = [...dictGaps.entries()].sort((a, b) => a[0].localeCompare(b[0]));

if (dictList.length) {
  console.log(`\n── ${dictList.length} string(s) reach t() but have no bn.ts entry ──\n`);
  for (const [text, where] of dictList) {
    console.log(`  ${JSON.stringify(text)}`);
    console.log(`      ${[...where].join(", ")}`);
  }
}

if (codeGaps.length) {
  const byFile = new Map();
  for (const g of codeGaps) {
    if (!byFile.has(g.file)) byFile.set(g.file, []);
    byFile.get(g.file).push(g);
  }
  console.log(`\n── ${codeGaps.length} literal(s) never reach t() ──\n`);
  for (const [file, gaps] of [...byFile.entries()].sort()) {
    console.log(`  ${file}`);
    for (const g of gaps) console.log(`      ${g.line}: ${g.kind} ${JSON.stringify(g.text)}`);
  }
}

const total = dictList.length + codeGaps.length;
console.log(
  total === 0
    ? "\n✓ i18n: every user-facing string in scope is translatable and translated.\n"
    : `\n✗ i18n: ${dictList.length} missing translation(s), ${codeGaps.length} untranslatable literal(s).\n`,
);
process.exit(total === 0 ? 0 : 1);
