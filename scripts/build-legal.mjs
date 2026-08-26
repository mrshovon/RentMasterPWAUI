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
// The parser lives in lib/ because it is no longer build-only: an admin can edit these documents
// from the console, and the saved markdown is parsed in the BROWSER by the same functions. Two
// parsers producing what the public reads as our Terms is exactly the drift to avoid.
import { extract, effectiveDateFrom } from '../lib/legal-markdown.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.resolve(ROOT, '..', 'legal');
const OUT = path.join(ROOT, 'content', 'legal', 'generated.ts');

const DOCS = [
  { key: 'privacyEn', file: 'PRIVACY_POLICY.en.md' },
  { key: 'privacyBn', file: 'PRIVACY_POLICY.bn.md' },
  { key: 'termsEn', file: 'TERMS_AND_CONDITIONS.en.md' },
  { key: 'termsBn', file: 'TERMS_AND_CONDITIONS.bn.md' },
];

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
  if (doc.key === 'termsEn') version = effectiveDateFrom(md);
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
