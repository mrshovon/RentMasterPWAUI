#!/usr/bin/env node
// =====================================================================================
// Converts the legal documents in ../legal/*.md into a TypeScript module the app renders.
//
// Run: npm run build:legal   (after editing any of the four .md files)
//
// WHY GENERATE rather than hand-maintain a copy: the markdown in ../legal/ is the authored,
// reviewed source of truth. A second hand-written copy inside the app would drift from it, and
// "the published policy no longer matches the agreed text" is the one failure mode these
// documents cannot have.
//
// WHY PRE-PARSE rather than ship a markdown renderer: this app has no markdown library and
// adding one to render four static documents is a poor trade. Parsing here means the runtime
// component is a simple switch over block types.
//
// WHY IT MATTERS FOR i18n: scripts/check-i18n.mjs only inspects single-line JSX text. Prose held
// in a generated TS data structure and rendered via {expr} is correctly invisible to it — whereas
// 20k words of raw JSX would demand hundreds of bn.ts keys for text that is already translated.
//
// The generated file is committed. The source .md files live in the PARENT folder, outside this
// git repo, so a fresh clone of this repo alone can render the documents but cannot regenerate
// them — that is deliberate and fine.
// =====================================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.resolve(ROOT, '..', 'legal');
const OUT = path.join(ROOT, 'content', 'legal', 'generated.ts');

const DOCS = [
  { key: 'privacyEn', file: 'PRIVACY_POLICY.en.md' },
  { key: 'privacyBn', file: 'PRIVACY_POLICY.bn.md' },
  { key: 'termsEn', file: 'TERMS_AND_CONDITIONS.en.md' },
  { key: 'termsBn', file: 'TERMS_AND_CONDITIONS.bn.md' },
];

/** Split a line of markdown into inline runs: plain text, bold, links and inline code. */
function parseInline(text) {
  const out = [];
  // Ordered so the first alternative wins: links before bold, so [**x**](y) stays a link.
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ t: 'text', v: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ t: 'link', v: m[1], href: m[2] });
    else if (m[3] !== undefined) out.push({ t: 'bold', v: m[3] });
    else out.push({ t: 'code', v: m[4] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: 'text', v: text.slice(last) });
  return out.length ? out : [{ t: 'text', v: text }];
}

const isTableDivider = (line) => /^\|[\s:|-]+\|$/.test(line.trim());
const splitRow = (line) =>
  line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

/** Parse a whole document into a flat list of blocks. */
function parse(md) {
  // Markdown hard-wraps paragraphs; join them back so text reflows to the reader's width.
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let para = [];

  const flushPara = () => {
    if (!para.length) return;
    blocks.push({ type: 'p', runs: parseInline(para.join(' ')) });
    para = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { flushPara(); continue; }

    if (/^---+$/.test(trimmed)) { flushPara(); blocks.push({ type: 'hr' }); continue; }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushPara();
      blocks.push({ type: 'h', level: heading[1].length, runs: parseInline(heading[2]) });
      continue;
    }

    // A table is a header row, a divider, then body rows.
    if (trimmed.startsWith('|') && isTableDivider(lines[i + 1] || '')) {
      flushPara();
      const head = splitRow(trimmed);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      i--;
      blocks.push({
        type: 'table',
        head: head.map(parseInline),
        rows: rows.map((r) => r.map(parseInline)),
      });
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.*)$/);
    const numbered = trimmed.match(/^\d+\.\s+(.*)$/);
    if (bullet || numbered) {
      flushPara();
      const ordered = !!numbered;
      const items = [];
      while (i < lines.length) {
        const cur = lines[i];
        const curTrim = cur.trim();
        const b = curTrim.match(ordered ? /^\d+\.\s+(.*)$/ : /^[-*]\s+(.*)$/);
        if (b) {
          items.push(b[1]);
        } else if (curTrim && /^\s{2,}\S/.test(cur) && items.length) {
          // Continuation of the previous item (markdown hard-wrap inside a bullet).
          items[items.length - 1] += ' ' + curTrim;
        } else {
          break;
        }
        i++;
      }
      i--;
      blocks.push({ type: 'list', ordered, items: items.map(parseInline) });
      continue;
    }

    para.push(trimmed);
  }
  flushPara();
  return blocks;
}

/** The document title is the single H1; drop it from the body so the page can render it itself. */
function extract(md) {
  const blocks = parse(md);
  const titleIdx = blocks.findIndex((b) => b.type === 'h' && b.level === 1);
  const title = titleIdx >= 0 ? blocks[titleIdx].runs.map((r) => r.v).join('') : '';
  if (titleIdx >= 0) blocks.splice(titleIdx, 1);
  return { title, blocks };
}

const missing = DOCS.filter((d) => !fs.existsSync(path.join(SRC, d.file)));
if (missing.length) {
  console.error(`Missing source documents in ${SRC}:`);
  for (const d of missing) console.error(`  - ${d.file}`);
  process.exit(1);
}

const parsed = {};
let version = '';
for (const doc of DOCS) {
  const md = fs.readFileSync(path.join(SRC, doc.file), 'utf8');
  parsed[doc.key] = extract(md);
  // The effective date doubles as the document version. Taken from the English Terms so all four
  // agree on one value, and it must be a real date rather than the [EFFECTIVE DATE] placeholder.
  if (doc.key === 'termsEn') {
    const m = md.match(/\*\*Effective date:\*\*\s*(.+)/);
    const raw = (m?.[1] || '').trim();
    version = /^\[.*\]$/.test(raw) ? '' : raw;
  }
}

const banner = `// GENERATED FILE — DO NOT EDIT BY HAND.
// Produced by scripts/build-legal.mjs from the markdown in the parent folder's legal/ directory.
// Edit those .md files and re-run \`npm run build:legal\`.
`;

const body = `${banner}
export type LegalRun =
  | { t: "text"; v: string }
  | { t: "bold"; v: string }
  | { t: "code"; v: string }
  | { t: "link"; v: string; href: string };

export type LegalBlock =
  | { type: "h"; level: number; runs: LegalRun[] }
  | { type: "p"; runs: LegalRun[] }
  | { type: "list"; ordered: boolean; items: LegalRun[][] }
  | { type: "table"; head: LegalRun[][]; rows: LegalRun[][][] }
  | { type: "hr" };

export interface LegalDoc { title: string; blocks: LegalBlock[] }

/**
 * The published edition of these documents, taken from the "Effective date" line of the English
 * Terms. Empty while that line still holds the [EFFECTIVE DATE] placeholder — the signup form
 * falls back to the backend's value, so consent is still recorded against something real.
 */
export const LEGAL_VERSION = ${JSON.stringify(version)};

export const LEGAL_DOCS = ${JSON.stringify(parsed, null, 2)} as unknown as {
  privacyEn: LegalDoc; privacyBn: LegalDoc; termsEn: LegalDoc; termsBn: LegalDoc;
};
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, body, 'utf8');

const stats = DOCS.map((d) => `${d.key}: ${parsed[d.key].blocks.length} blocks`).join(', ');
console.log(`Wrote ${path.relative(ROOT, OUT)} (${stats})`);
console.log(`LEGAL_VERSION = ${version || '(placeholder — set the Effective date in the .md files)'}`);
