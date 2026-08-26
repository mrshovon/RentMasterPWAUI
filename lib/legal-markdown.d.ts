// Types for lib/legal-markdown.mjs. Hand-written because the implementation has to stay plain
// ESM — scripts/build-legal.mjs runs under bare Node with no TypeScript in front of it.
//
// The shapes below are the SAME ones content/legal/generated.ts declares. They are re-declared
// rather than imported from there because generated.ts is produced BY the script that imports
// this module, and a build step must not depend on its own output.

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

export function parseInline(text: string): LegalRun[];
export function parse(md: string): LegalBlock[];
export function extract(md: string): { title: string; blocks: LegalBlock[] };
/** '' when the Effective date line is still a [PLACEHOLDER]. */
export function effectiveDateFrom(md: string): string;
