// =====================================================================================
// 📄 THE LEGAL MARKDOWN PARSER — one implementation, two callers.
//
// This used to live inside scripts/build-legal.mjs, which ran only at build time. Now that an
// admin can edit the Terms and the Privacy Policy from the console, the same markdown has to be
// parsed AT RUNTIME as well, in the browser, so the saved text renders exactly like the compiled
// text it replaces. Two copies of a parser that turns a legal document into what the public sees
// is precisely the drift these documents cannot have.
//
// WHY .mjs RATHER THAN .ts: scripts/build-legal.mjs is a plain Node script run by `npm run
// build:legal` with no TypeScript toolchain in front of it, so it cannot import a .ts module.
// A .mjs file with a hand-written .d.ts beside it is importable from both sides — the script gets
// it as ordinary ESM, the app gets it fully typed through Next's bundler.
//
// ⚠️ The generated content/legal/generated.ts is committed and is the FALLBACK the public pages
// render when nothing has been saved. Any change to the functions below changes both the compiled
// documents and the live ones, so re-run `npm run build:legal` and diff generated.ts after
// touching this file — an empty diff is the proof that nothing moved underneath the published text.
// =====================================================================================

/** @typedef {{ t: 'text'|'bold'|'code'|'link', v: string, href?: string }} LegalRun */

/**
 * Split a line of markdown into inline runs: plain text, bold, links and inline code.
 * @param {string} text
 * @returns {LegalRun[]}
 */
export function parseInline(text) {
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

/**
 * Parse a whole document into a flat list of blocks.
 * @param {string} md
 */
export function parse(md) {
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

/**
 * The document title is the single H1; drop it from the body so the page can render it itself.
 * @param {string} md
 */
export function extract(md) {
  const blocks = parse(md);
  const titleIdx = blocks.findIndex((b) => b.type === 'h' && b.level === 1);
  const title = titleIdx >= 0 ? blocks[titleIdx].runs.map((r) => r.v).join('') : '';
  if (titleIdx >= 0) blocks.splice(titleIdx, 1);
  return { title, blocks };
}

/**
 * The published edition, read out of a document's "**Effective date:**" line.
 *
 * Returns '' while the line still holds the `[EFFECTIVE DATE]` placeholder — a bracketed
 * placeholder is not a version, and recording consent against the literal string
 * "[EFFECTIVE DATE]" would be worse than falling back to the server's value.
 *
 * @param {string} md
 * @returns {string}
 */
export function effectiveDateFrom(md) {
  const m = md.match(/\*\*Effective date:\*\*\s*(.+)/);
  const raw = (m?.[1] || '').trim();
  return /^\[.*\]$/.test(raw) ? '' : raw;
}
