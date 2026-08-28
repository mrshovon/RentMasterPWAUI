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
// So this script finds them instead. Three classes of gap:
//
//   DICT   — the string DOES reach t() (directly, or through a self-translating prop on a UI
//            primitive) but has no entry in lib/locales/bn.ts. Fix: add the entry.
//   CODE   — the string never reaches t() at all: raw JSX text, an <option> label, a placeholder
//            on a bare <input>. Fix: wrap it, or route it through a primitive that translates.
//   CONFIG — the checker's own assumptions have drifted from the code. Fix one or the other.
//
// -----------------------------------------------------------------------------------------
// WHY THERE IS A SCANNER NOW (and still no parser)
//
// v1 was a bag of independent line-by-line regexes. It passed green while ~25 English strings sat
// in the owner Plan tab, because its only raw-text rule needed the open tag, the text and the
// close tag on ONE line with no `<`, `>`, `{` or `}` between them — which is not the shape real
// copy has. Every miss was a SCOPING question ("which brace is this in", "who is this literal's
// parent"), and scoping is the one thing independent regexes cannot do.
//
// The answer is not an AST. It is ~150 lines of bracket-and-quote matching that every rule shares:
// maskComments → scanTags → elementBody → codeMask. The script still has no grammar, and rules are
// still regexes — they just run against text that has been scoped first.
//
// The single most important decision here is codeMask(): blanking every tag's full byte span,
// attributes included, BEFORE looking for literals in child expressions. That is what makes
// className, variant="secondary", href and icon names unreachable by construction rather than by
// an ever-growing denylist.
//
// Files on the EXCLUDE list are out of scope by standing decision (see lib/locales/bn.ts).
//
// Flags: --strict (warn → error) · --only=rule,rule · --full (no truncation)
//        --emit-keys (paste-ready bn.ts lines) · --list-ignored
//
// Exits non-zero when anything at error tier is found, so it can gate a build.
// =============================================================================

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const ARGV = process.argv.slice(2);
const FLAG = (name) => ARGV.includes(`--${name}`);
const OPT = (name) => {
  const hit = ARGV.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3).split(",").map((s) => s.trim()).filter(Boolean) : null;
};
const STRICT = FLAG("strict");
const FULL = FLAG("full");
const EMIT_KEYS = FLAG("emit-keys");
const LIST_IGNORED = FLAG("list-ignored");
const ONLY = OPT("only");

/** Files whose user-facing text must be fully translatable. */
const INCLUDE_DIRS = ["app", "components", "lib"];
const EXCLUDE = [
  "app/admin/page.tsx",     // super-admin console — intentionally English
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

// Text attributes the BROWSER shows. On an intrinsic element nothing translates them for us.
const DOM_TEXT_ATTRS = ["placeholder", "aria-label", "title", "alt"];

// Lowercase HTML tags whose text content is copy. Deliberately a whitelist: it cannot collide
// with a TypeScript generic or a component name, which keeps the scan conservative.
const HTML_TEXT_TAGS = new Set(
  "h1 h2 h3 h4 h5 h6 p span div label strong em b small a li td th option summary figcaption dt dd blockquote"
    .split(" "));

// Identifiers that are followed by `<` in TYPE position, never JSX.
const TYPE_GENERICS = /^(Record|Promise|Array|Partial|Pick|Omit|Readonly|Ref|Dispatch|SetStateAction|Awaited|ReturnType|Map|Set|Exclude|Extract|NonNullable)$/;

// Permanently English by decision — a key for these would only ever map to itself.
const PROPER_NOUNS = new Set([
  "Bari360", "BARI360", "bKash", "Nagad", "WhatsApp", "Google", "Android", "iOS",
  "PDF", "SMS", "QR", "Supabase", "Vercel", "Brevo",
]);

const RULES = {
  "t-call":   { tier: "error", blurb: "literal in a t() call with no bn.ts entry" },
  "prop":     { tier: "error", blurb: "translating prop with no bn.ts entry" },
  "obj-prop": { tier: "error", blurb: "translating object property with no bn.ts entry" },
  "child":    { tier: "error", blurb: "Button/Badge child with no bn.ts entry" },
  "indirect": { tier: "error", blurb: "value passed to t() with no bn.ts entry" },
  "jsx-text": { tier: "error", blurb: "raw JSX text that never reaches t()" },
  "attr":     { tier: "error", blurb: "browser-visible attribute on a bare element" },
  "config":   { tier: "error", blurb: "the checker's assumptions have drifted from the code" },
  "jsx-expr": { tier: "warn",  blurb: "string literal in a JSX expression" },
  "tpl-sink": { tier: "warn",  blurb: "sentence built by string concatenation" },
  "raw-prop": { tier: "warn",  blurb: "a translating prop rendered without t()" },
};

// ---------------------------------------------------------------- text helpers

const ENTITIES = {
  apos: "'", rsquo: "’", lsquo: "‘", quot: '"', amp: "&", nbsp: " ",
  mdash: "—", ndash: "–", hellip: "…", times: "×", lt: "<", gt: ">",
};
// JSX writes &apos; where the dictionary holds a real apostrophe. Without this the checker
// reports a phantom missing key and the "fix" it implies would corrupt bn.ts.
const decodeEntities = (s) =>
  s.replace(/&(#?\w+);/g, (m, e) =>
    e[0] === "#"
      ? String.fromCodePoint(Number(e.slice(1).replace(/^x/i, "0x")))
      : (ENTITIES[e] ?? m));

// Multi-line JSX text collapses in the browser, so the key must be the collapsed form.
const normalizeText = (s) => s.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim();

const clean = (s) => normalizeText(decodeEntities(s));

/** A literal worth translating: has a letter, is not an identifier/class-string/url. */
function isProse(s) {
  if (!s || s.length < 2) return false;
  if (!/[A-Za-z]/.test(s)) return false;
  if (PROPER_NOUNS.has(s)) return false;
  if (/^[a-z0-9_-]+$/.test(s)) return false;             // slug / key / css token
  if (/^[\w.-]+@[\w.-]+$/.test(s)) return false;         // sample email
  if (/^(https?:)?\/\//.test(s)) return false;           // url
  if (/^\.{0,2}\//.test(s)) return false;                // ./lib/x — import path
  if (/^[\d\s+()-]+$/.test(s)) return false;             // sample phone
  if (/^[A-Z]{1,4}-?[A-Z0-9]*$/.test(s)) return false;   // G-XXXX, GTM-, UNIT-
  if (/^(px|rem|em|auto|none|flex|grid)$/.test(s)) return false;
  if (/^[a-z]{2}(-[A-Z]{2})?$/.test(s)) return false;    // en-GB — BCP-47 tag
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return false;       // #f6f8fb
  if (/^[0-9]+X{3,}$/i.test(s)) return false;            // 01XXXXXXXXX — a masked sample number
  if (/^[\w.+-]+\/[\w.+-]+(;.*)?$/.test(s)) return false; // text/html;charset=utf-8
  if (/\.(ts|tsx|js|mjs|json|png|svg|webp|html|css)$/.test(s)) return false;
  // Tailwind residue: hyphenated, lowercase, no sentence punctuation.
  if (/^[.#]?[\w-]+(\s+[.#]?[\w-]+)*$/.test(s) && /-/.test(s) && !/[A-Z]/.test(s)) return false;
  return /[A-Za-z]{2,}/.test(s);
}

/**
 * Replace comment BODIES with spaces, preserving every byte offset and newline so line numbers
 * stay exact. Needed now that rules span lines: this codebase writes long prose comments that
 * would otherwise be reported as untranslated UI text.
 */
function maskComments(src) {
  const out = src.split("");
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      i++;
      while (i < n && src[i] !== q) {
        if (src[i] === "\\") i++;
        i++;
      }
      i++;
      continue;
    }
    if (c === "/" && src[i + 1] === "/") {
      while (i < n && src[i] !== "\n") { out[i] = " "; i++; }
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? n : end + 2;
      for (let k = i; k < stop; k++) if (out[k] !== "\n") out[k] = " ";
      i = stop;
      continue;
    }
    i++;
  }
  return out.join("");
}

/**
 * Every JSX tag, with its full byte span.
 *
 * Two things make this more than a regex. The tag's closing `>` is found by walking forward while
 * skipping quoted strings and balanced braces — so `<Button onClick={() => f(x)}>` no longer ends
 * at the arrow function's `>`. And a `<` only opens a tag at depth 0 when the previous non-space
 * character is not an identifier character, which is what keeps `Record<K, V>` and `useState<T>()`
 * out of the element stack.
 */
function scanTags(masked) {
  const tags = [];
  let depth = 0;
  let i = 0;
  const n = masked.length;
  while (i < n) {
    const c = masked[i];
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      i++;
      while (i < n && masked[i] !== q) { if (masked[i] === "\\") i++; i++; }
      i++;
      continue;
    }
    if (c !== "<") { i++; continue; }

    const isClose = masked[i + 1] === "/";
    const nameStart = i + (isClose ? 2 : 1);
    const nameMatch = /^[A-Za-z][\w.]*/.exec(masked.slice(nameStart, nameStart + 60));
    const name = nameMatch ? nameMatch[0] : "";
    const isFragment = masked[nameStart] === ">";
    if (!name && !isFragment) { i++; continue; }

    if (depth === 0) {
      let p = i - 1;
      while (p >= 0 && /\s/.test(masked[p])) p--;
      if (p >= 0 && /[A-Za-z0-9_$)\]]/.test(masked[p])) { i++; continue; }
      if (TYPE_GENERICS.test(name)) { i++; continue; }
    }

    // Walk to the tag's own '>', skipping strings and balanced braces.
    let j = nameStart + name.length;
    let brace = 0;
    let selfClose = false;
    while (j < n) {
      const d = masked[j];
      if (d === '"' || d === "'" || d === "`") {
        const q = d;
        j++;
        while (j < n && masked[j] !== q) { if (masked[j] === "\\") j++; j++; }
        j++;
        continue;
      }
      if (d === "{") { brace++; j++; continue; }
      if (d === "}") { brace--; j++; continue; }
      if (brace === 0 && d === ">") { selfClose = !isClose && masked[j - 1] === "/"; break; }
      if (brace === 0 && d === "<") break; // not a tag after all
      j++;
    }
    if (j >= n || masked[j] !== ">") { i++; continue; }

    tags.push({ name, isClose, isSelfClose: selfClose, start: i, end: j + 1 });
    if (!selfClose) depth += isClose ? -1 : 1;
    if (depth < 0) depth = 0;
    i = j + 1;
  }
  return tags;
}

/** Index of the tag that closes tags[k], or -1. */
function matchingClose(tags, k) {
  if (tags[k].isSelfClose || tags[k].isClose) return -1;
  let d = 0;
  for (let x = k; x < tags.length; x++) {
    const tg = tags[x];
    if (tg.isSelfClose) continue;
    d += tg.isClose ? -1 : 1;
    if (d === 0) return x;
  }
  return -1;
}

/**
 * The direct text runs and direct child expressions of the element opening at tags[k].
 * Nested elements are skipped, not descended into — otherwise a <div> would re-report
 * everything its <p> children already reported.
 */
function elementBody(masked, tags, k, startAt) {
  const closeIdx = matchingClose(tags, k);
  if (closeIdx === -1) return null;
  const from = tags[k].end;
  const to = tags[closeIdx].start;

  const byStart = startAt;
  const runs = [];
  const exprs = [];
  const shape = [];
  let buf = "";
  let i = from;

  while (i < to) {
    const tg = byStart.get(i);
    if (tg && !tg.isClose) {
      if (buf.trim()) { runs.push(buf); shape.push(buf); }
      buf = "";
      shape.push("<…/>");
      const ci = matchingClose(tags, tags.indexOf(tg));
      i = ci === -1 ? tg.end : tags[ci].end;
      continue;
    }
    const c = masked[i];
    if (c === "{") {
      if (buf.trim()) { runs.push(buf); shape.push(buf); }
      buf = "";
      let d = 0;
      let j = i;
      while (j < to) {
        const e = masked[j];
        if (e === '"' || e === "'" || e === "`") {
          const q = e;
          j++;
          while (j < to && masked[j] !== q) { if (masked[j] === "\\") j++; j++; }
          j++;
          continue;
        }
        if (e === "{") d++;
        else if (e === "}") { d--; if (d === 0) { j++; break; } }
        j++;
      }
      exprs.push([i + 1, j - 1]);
      shape.push("{…}");
      i = j;
      continue;
    }
    buf += c;
    i++;
  }
  if (buf.trim()) { runs.push(buf); shape.push(buf); }

  return {
    text: clean(runs.join(" ")),
    shape: normalizeText(shape.join(" ")),
    exprs,
    hasOnlyExpr: shape.length === 1 && shape[0] === "{…}",
  };
}

/** `masked` with every tag's bytes blanked, so attribute values are unreachable to later rules. */
function codeMask(masked, tags) {
  const out = masked.split("");
  for (const tg of tags) {
    for (let k = tg.start; k < tg.end; k++) if (out[k] !== "\n") out[k] = " ";
  }
  return out.join("");
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

const findings = [];
const dictGaps = new Map();  // string -> Set(file)
let suppressed = 0;
const ignoredNotes = [];

const IGNORE_LINE = /(?:\/\/|\/\*|\{\/\*)\s*i18n-ignore(?!-)\b(?::\s*(.*?))?\s*(?:\*\/\}?)?\s*$/;
const IGNORE_NEXT = /(?:\/\/|\/\*|\{\/\*)\s*i18n-ignore-next\b(?::\s*(.*?))?/;
const IGNORE_FILE = /i18n-ignore-file\b/;

const report = (f) => {
  if (ONLY && !ONLY.includes(f.rule)) return;
  findings.push(f);
};

for (const file of files) {
  const src = readFileSync(join(ROOT, file), "utf8");
  const rawLines = src.split(/\r?\n/);
  if (IGNORE_FILE.test(rawLines.slice(0, 20).join("\n"))) continue;

  // Ignore markers are read from the RAW source: masking comments would erase them.
  const ignored = new Set();
  rawLines.forEach((l, i) => {
    const m1 = IGNORE_LINE.exec(l);
    if (m1) { ignored.add(i + 1); ignoredNotes.push(`${file}:${i + 1} ${m1[1] || "(no reason given)"}`); }
    const m2 = IGNORE_NEXT.exec(l);
    if (m2) {
      let j = i + 1;
      while (j < rawLines.length && !rawLines[j].trim()) j++;
      ignored.add(j + 1);
      ignoredNotes.push(`${file}:${j + 1} ${m2[1] || "(no reason given)"}`);
    }
  });

  const masked = maskComments(src);
  const nlAt = [];
  for (let i = 0; i < masked.length; i++) if (masked[i] === "\n") nlAt.push(i);
  const lineOf = (off) => {
    let lo = 0, hi = nlAt.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (nlAt[mid] < off) lo = mid + 1; else hi = mid; }
    return lo + 1;
  };

  const tags = /\.tsx$/.test(file) ? scanTags(masked) : [];
  const byStart = new Map(tags.map((t) => [t.start, t]));
  const cmask = codeMask(masked, tags);

  const flag = (rule, off, text, note) => {
    const line = lineOf(off);
    if (ignored.has(line)) { suppressed++; return; }
    report({ file, line, rule, cls: RULES[rule].tier === "warn" ? "WARN" : "CODE", text, note });
  };

  // --- strings that DO reach t() → dictionary coverage ---
  const reaching = new Set();
  const addReach = (s, off) => { if (s) reaching.add(clean(s)); void off; };

  // Every literal inside a t() / tr() / translate() ARGUMENT SPAN, not just a lone `t("x")`.
  // This is what makes `t(cond ? "one" : "many")` checkable — the shape counted sentences must
  // use, since Bangla has no -s plural and a sentence glued together from fragments cannot be
  // translated at all.
  const tCallRe = /\b(?:t|tr|translate)\(/g;
  const trAllowed = /import\s*\{[^}]*\btranslate\b[^}]*\}\s*from\s*["'][^"']*i18n["']/.test(src);
  for (const m of masked.matchAll(tCallRe)) {
    if (!trAllowed && /^(?:tr|translate)$/.test(m[0].slice(0, -1))) continue;
    let j = m.index + m[0].length;
    let d = 1;
    const start = j;
    while (j < masked.length && d > 0) {
      const c = masked[j];
      if (c === '"' || c === "'" || c === "`") {
        const q = c;
        j++;
        while (j < masked.length && masked[j] !== q) { if (masked[j] === "\\") j++; j++; }
      } else if (c === "(") d++;
      else if (c === ")") d--;
      j++;
    }
    const span = masked.slice(start, j - 1);
    for (const s of span.matchAll(/"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'/g)) {
      addReach((s[1] ?? s[2] ?? "").replace(/\\'/g, "'").replace(/\\"/g, '"'));
    }
  }

  const propRe = new RegExp(`\\b(?:${TRANSLATING_PROPS.join("|")})=\\{?"((?:[^"\\\\\\n]|\\\\.)*)"`, "g");
  for (const m of masked.matchAll(propRe)) addReach(m[1]);

  for (const m of masked.matchAll(/\btoast\.\w+\(\s*"((?:[^"\\\n]|\\.)*)"/g)) addReach(m[1]);

  // One newline is allowed after the `prop:` anchor — a long confirmDialog message is routinely
  // written on its own line. `\s*` is still refused: without the anchor it would pair a quoted
  // string with unrelated code several lines above.
  const objPropRe = new RegExp(
    `\\b(?:${TRANSLATING_PROPS.join("|")}):[ \\t]*(?:\\r?\\n[ \\t]*)?"((?:[^"\\\\\\n]|\\\\.)*)"`, "g");
  for (const m of masked.matchAll(objPropRe)) addReach(m[1]);

  // Values reaching t() through an identifier: `t(METHOD_LABEL[m])`, `t(d)` over a const array.
  for (const m of masked.matchAll(/\b(?:t|tr|translate)\(\s*([A-Za-z_$][\w$]*)\s*(?=[.[)])/g)) {
    const decl = new RegExp(`\\b(?:const|let)\\s+${m[1]}\\b[^=]*=\\s*([{\\[])`).exec(masked);
    if (!decl) continue;
    let j = decl.index + decl[0].length - 1;
    const open = masked[j], close = open === "{" ? "}" : "]";
    let d = 0;
    const from = j;
    while (j < masked.length) {
      const c = masked[j];
      if (c === '"' || c === "'" || c === "`") {
        const q = c; j++;
        while (j < masked.length && masked[j] !== q) { if (masked[j] === "\\") j++; j++; }
      } else if (c === open) d++;
      else if (c === close) { d--; if (d === 0) { j++; break; } }
      j++;
    }
    for (const s of masked.slice(from, j).matchAll(/"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'/g)) {
      addReach(s[1] ?? s[2] ?? "");
    }
  }

  // --- element walk: JSX text, bare-element attributes, Button/Badge children ---
  for (let k = 0; k < tags.length; k++) {
    const tg = tags[k];
    if (tg.isClose) continue;

    // Browser-visible attributes. Our primitives translate their own; an intrinsic element
    // does not, so a literal there never reaches the dictionary.
    const attrSlice = masked.slice(tg.start, tg.end);
    const bare = /^[a-z]/.test(tg.name);
    for (const m of attrSlice.matchAll(/\b([\w-]+)=\{?"((?:[^"\\\n]|\\.)*)"/g)) {
      const [, prop, val] = m;
      if (!isProse(clean(val))) continue;
      if (bare && DOM_TEXT_ATTRS.includes(prop)) {
        flag("attr", tg.start + m.index, clean(val));
      }
    }

    if (tg.isSelfClose) continue;
    const body = elementBody(masked, tags, k, byStart);
    if (!body) continue;

    if (TRANSLATING_CHILDREN.includes(tg.name)) {
      // ui.tsx translates children only when they are a bare string — an array is left alone.
      if (body.text && !body.shape.includes("{…}") && !body.shape.includes("<…/>")) {
        addReach(body.text);
      } else if (body.hasOnlyExpr) {
        // A lone expression child still reaches t() at runtime, so its literals need keys.
        const [a, b] = body.exprs[0];
        for (const s of masked.slice(a, b).matchAll(/"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'/g)) {
          addReach(s[1] ?? s[2] ?? "");
        }
      }
      continue;
    }

    if (HTML_TEXT_TAGS.has(tg.name) && isProse(body.text)) {
      flag("jsx-text", tg.start, body.shape);
    }
  }

  // --- warn tier: sentences assembled by concatenation ---
  const TPL_SINK = new RegExp(
    `(?:\\btoast\\.\\w+\\(|\\b(?:${TRANSLATING_PROPS.join("|")})\\s*[:=]\\s*\\{?)\\s*\``, "g");
  for (const m of masked.matchAll(TPL_SINK)) {
    let j = m.index + m[0].length;
    let statics = "";
    while (j < masked.length && masked[j] !== "`") {
      if (masked[j] === "\\") { j += 2; continue; }
      if (masked[j] === "$" && masked[j + 1] === "{") {
        let d = 0;
        while (j < masked.length) {
          if (masked[j] === "{") d++;
          else if (masked[j] === "}") { d--; if (d === 0) { j++; break; } }
          j++;
        }
        statics += " {…} ";
        continue;
      }
      statics += masked[j];
      j++;
    }
    const txt = normalizeText(statics);
    if (isProse(txt.replace(/\{…\}/g, "").trim())) {
      flag("tpl-sink", m.index, txt,
        "restructure into a placeholder key: t(\"… {0} …\").replace(\"{0}\", n)");
    }
  }

  // --- CONFIG: does a translating prop actually get translated anywhere? ---
  if (file === "components/ui.tsx") {
    const uiSources = ["components/ui.tsx", "components/shell.tsx", "components/confirm.tsx"]
      .map((p) => { try { return readFileSync(join(ROOT, p), "utf8"); } catch { return ""; } })
      .join("\n");
    for (const prop of TRANSLATING_PROPS) {
      const used = new RegExp(`\\bt\\(\\s*[^)\\n]*\\b${prop}\\b`).test(uiSources);
      if (!used) {
        report({
          file: "scripts/check-i18n.mjs", line: 0, rule: "config", cls: "CONFIG",
          text: `TRANSLATING_PROPS lists "${prop}" but no primitive calls t() on it — every caller's value ships in English.`,
        });
      }
    }
  }

  for (const s of reaching) {
    if (isProse(s) && !bnKeys.has(s)) {
      if (!dictGaps.has(s)) dictGaps.set(s, new Set());
      dictGaps.get(s).add(file);
    }
  }
}

// ---- report ---------------------------------------------------------------
const dictList = [...dictGaps.entries()].sort((a, b) => a[0].localeCompare(b[0]));
const isErr = (f) => RULES[f.rule].tier === "error" || STRICT;
const errs = findings.filter(isErr);
const warns = findings.filter((f) => !isErr(f));
const cut = (s) => (FULL || s.length <= 72 ? s : s.slice(0, 71) + "…");

console.log(`\n── i18n check ── ${files.length} files scanned, ${EXCLUDE.length} excluded ──\n`);

const cfg = errs.filter((f) => f.rule === "config");
if (cfg.length) {
  console.log("  CONFIG · the checker's own assumptions");
  for (const f of cfg) console.log(`      ${f.text}`);
  console.log("");
}

if (dictList.length) {
  console.log(`  DICT · reaches t(), no bn.ts entry — ${dictList.length} string(s)\n`);
  for (const [text, where] of dictList.slice(0, FULL ? 1e9 : 40)) {
    console.log(`      ${cut(JSON.stringify(text))}`);
    console.log(`          ${[...where].join(", ")}`);
  }
  if (!FULL && dictList.length > 40) console.log(`      … and ${dictList.length - 40} more (--full)`);
  console.log("");
}

const codeErrs = errs.filter((f) => f.rule !== "config");
if (codeErrs.length) {
  const byFile = new Map();
  for (const g of codeErrs) {
    if (!byFile.has(g.file)) byFile.set(g.file, []);
    byFile.get(g.file).push(g);
  }
  const ordered = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length);
  console.log(`  CODE · never reaches t() — ${codeErrs.length} literal(s) in ${ordered.length} file(s)\n`);
  for (const [file, gaps] of ordered.slice(0, FULL ? 1e9 : 12)) {
    console.log(`      ${file}  ${".".repeat(Math.max(2, 52 - file.length))} ${gaps.length}`);
    for (const g of gaps.slice(0, FULL ? 1e9 : 20)) {
      console.log(`         ${String(g.line).padStart(5)}  ${g.rule.padEnd(9)} ${cut(JSON.stringify(g.text))}`);
    }
    if (!FULL && gaps.length > 20) console.log(`                … and ${gaps.length - 20} more`);
  }
  if (!FULL && ordered.length > 12) console.log(`      … ${ordered.length - 12} more files (--full)`);
  console.log("");
}

if (warns.length) {
  const byRule = new Map();
  for (const w of warns) byRule.set(w.rule, (byRule.get(w.rule) || 0) + 1);
  console.log("  WARNINGS — not blocking (--strict to fail on these)\n");
  for (const [rule, n] of [...byRule.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`      ${rule.padEnd(10)} ${String(n).padStart(4)}   ${RULES[rule].blurb}`);
  }
  console.log("      (--only=<rule> to list one)\n");
}

if (EMIT_KEYS && dictList.length) {
  console.log("  Paste into lib/locales/bn.ts:\n");
  for (const [text] of dictList) console.log(`  ${JSON.stringify(text)}: "",`);
  console.log("");
}

if (LIST_IGNORED && ignoredNotes.length) {
  console.log("  Suppressed by i18n-ignore:\n");
  for (const n of ignoredNotes) console.log(`      ${n}`);
  console.log("");
}

const errTotal = dictList.length + codeErrs.length + cfg.length;
const parts = [
  `${dictList.length} missing translation(s)`,
  `${codeErrs.length} untranslatable literal(s)`,
  `${warns.length} warning(s)`,
];
if (suppressed) parts.push(`${suppressed} suppressed`);
console.log(
  errTotal === 0
    ? `── ✓ i18n: every user-facing string in scope is translatable and translated. ${warns.length ? `(${warns.length} warning(s))` : ""}\n`
    : `── ✗ ${parts.join(" · ")}\n`,
);
process.exit(errTotal === 0 ? 0 : 1);
