"use client";

import Link from "next/link";
import type { LegalBlock, LegalDoc, LegalRun } from "../content/legal/generated";

// =====================================================================================
// 📄 LEGAL DOCUMENT RENDERER
//
// Renders the pre-parsed blocks produced by scripts/build-legal.mjs. There is no markdown
// library in this project and no @tailwindcss/typography (so no `prose` class) — this is a
// plain switch over the handful of block types the documents actually use.
//
// The text itself is NOT translated at render time: the Bangla documents are separate authored
// files, chosen by the page. That is deliberate — legal text is translated by a person, not by
// a key lookup, and the English edition is the authoritative one either way.
// =====================================================================================

/**
 * The source markdown cross-links between documents by filename (./PRIVACY_POLICY.en.md).
 * Those are correct on disk and meaningless in the browser, so rewrite them to app routes.
 * Anything else is passed through untouched.
 */
function resolveHref(href: string): string {
  if (/PRIVACY_POLICY\.(en|bn)\.md$/i.test(href)) return "/privacy";
  if (/TERMS_AND_CONDITIONS\.(en|bn)\.md$/i.test(href)) return "/terms";
  return href;
}

function Runs({ runs }: { runs: LegalRun[] }) {
  return (
    <>
      {runs.map((run, i) => {
        if (run.t === "bold") return <strong key={i} className="font-semibold text-heading">{run.v}</strong>;
        if (run.t === "code") {
          return (
            <code key={i} className="rounded bg-overlay/[0.06] px-1 py-0.5 font-mono text-[0.9em] text-fg">
              {run.v}
            </code>
          );
        }
        if (run.t === "link") {
          const href = resolveHref(run.href);
          // Internal routes go through next/link so the two documents can reference each other
          // without a full page load; anything external opens safely in a new tab.
          return href.startsWith("/") ? (
            <Link key={i} href={href} className="text-primary underline underline-offset-2 hover:opacity-80">
              {run.v}
            </Link>
          ) : (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              {run.v}
            </a>
          );
        }
        return <span key={i}>{run.v}</span>;
      })}
    </>
  );
}

const HEADING_CLASS: Record<number, string> = {
  1: "mt-10 text-2xl font-black tracking-tight text-heading",
  2: "mt-10 text-xl font-black tracking-tight text-heading",
  3: "mt-8 text-base font-bold text-heading",
  4: "mt-6 text-sm font-bold text-heading",
};

function Block({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case "h": {
      // The document's single `#` is pulled out and rendered as the page <h1>, so a `##` section
      // is the next level down: h2. Clamped so the sequence never skips a level, which is what a
      // screen reader uses to build the document outline.
      const Tag = (`h${Math.min(Math.max(block.level, 2), 6)}`) as "h2";
      return (
        <Tag className={HEADING_CLASS[block.level] ?? HEADING_CLASS[4]}>
          <Runs runs={block.runs} />
        </Tag>
      );
    }

    case "p":
      return (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          <Runs runs={block.runs} />
        </p>
      );

    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag
          className={`mt-4 space-y-2 pl-5 text-sm leading-relaxed text-muted ${
            block.ordered ? "list-decimal" : "list-disc"
          }`}
        >
          {block.items.map((item, i) => (
            <li key={i} className="pl-1">
              <Runs runs={item} />
            </li>
          ))}
        </Tag>
      );
    }

    case "table":
      // Wide tables scroll inside their own container rather than making the page scroll
      // sideways — the data-storage inventory is five columns and will not fit a phone.
      return (
        <div className="mt-5 overflow-x-auto rounded-xl border border-line/[0.12]">
          <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-overlay/[0.04]">
                {block.head.map((cell, i) => (
                  <th key={i} className="border-b border-line/[0.12] px-3 py-2.5 font-bold text-heading">
                    <Runs runs={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="align-top">
                  {row.map((cell, c) => (
                    <td key={c} className="border-b border-line/[0.06] px-3 py-2.5 leading-relaxed text-muted">
                      <Runs runs={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "hr":
      return <hr className="mt-8 border-line/[0.12]" />;

    default:
      return null;
  }
}

export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <article>
      <h1 className="text-3xl font-black leading-tight tracking-tight text-heading">{doc.title}</h1>
      {doc.blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </article>
  );
}
