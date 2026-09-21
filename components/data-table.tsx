"use client";

import { Fragment, ReactNode, useState } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";
import { useT } from "../lib/i18n";
import { Button, Card, Spinner } from "./ui";

// =============================================================================
// One row definition, two presentations.
//
// Every list in this app was a <table> in an overflow-x-auto with a hard min-w,
// which on a phone means reading it by dragging sideways — worst case nine
// columns at 900px on a 390px screen. Below the breakpoint each row is now a
// CARD: a headline, a meta line and a status chip, expanding on tap to reveal
// the remaining fields and the row's actions. At and above it, the table is
// unchanged.
//
// WHY A CONFIG AND NOT TWO BITS OF MARKUP. Both places that hand-wrote a phone
// alternative (owner Tenants, tenant Rent & ledger) had already DRIFTED: one
// dropped a hover transition, the other moved a control into the header row and
// relabelled it. Two out of two. The config exists because a <td> takes its
// meaning from the <th> above it while a card has nothing above it, so the label
// has to travel WITH the value — and that is the only thing worth centralising.
// The cell bodies stay bespoke JSX; this is not a size optimisation.
//
// DELIBERATELY NOT HERE: sorting, pagination, selection, virtualisation, sticky
// headers. No table in this app does any of them — filtering happens at the call
// site and an already-filtered array arrives as `rows`. Keep it that way; a
// hand-rolled table is still a perfectly good answer for anything that fights
// this API.
// =============================================================================

export type ActionTone = "neutral" | "primary" | "success" | "warning" | "danger";

export interface Column<T> {
  /** Lowercase slug. Not copy — check-i18n's isProse() rejects it, so it needs no bn.ts entry. */
  key: string;
  /**
   * The column heading, and the label shown beside the value on a phone.
   *
   * Named `label` ON PURPOSE: it is on check-i18n's TRANSLATING_PROPS list, so a literal here is
   * caught by the obj-prop rule and must have a bn.ts entry. Calling it `header` would make every
   * table label in the app invisible to the checker.
   *
   * ⚠️ It must be a plain string literal. `label={x ? "A" : "B"}` matches neither the obj-prop rule
   * nor the t-call rule, so it would ship English with a green build.
   */
  label: string;
  cell: (row: T) => ReactNode;
  /**
   * Where this column appears on the COLLAPSED card. Anything without a slot is in the expanded
   * panel. Several columns may carry "meta"; they are joined with a drawn dot.
   *
   * ⚠️ HARD RULE: a slotted cell must be DISPLAY-ONLY. Slots render inside the card's header
   * <button>, so anything interactive there is invalid HTML and a broken tap target. Badge is a
   * <span> and is safe. If a cell contains a control, either give it no slot or split it — the
   * tenant ledger's Total does the latter: the figure is meta, "View charge breakdown" is an action.
   */
  slot?: "title" | "meta" | "badge";
  align?: "right";
  /** Desktop <td> extras — truncate widths, font-mono, whitespace-nowrap. */
  className?: string;
  /** Noise on a phone (an internal # column). Renders on desktop only, not even when expanded. */
  desktopOnly?: boolean;
}

export interface RowAction {
  /** TRANSLATING_PROP. Becomes title + aria-label on desktop and the visible button text on a phone. */
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  tone?: ActionTone;
  /** Implies disabled, and swaps the icon for a spinner. Wire to usePendingAction's isPending(key). */
  loading?: boolean;
  disabled?: boolean;
  /**
   * Why it is disabled. TRANSLATING_PROP. Appended to the desktop tooltip, and printed as a line
   * of real text on the card — a `title` attribute explains nothing on a touchscreen, which is
   * exactly where three greyed-out buttons need explaining.
   */
  hint?: string;
  /** Set (true OR false) to mark this a toggle: it gains a pressed ring and aria-pressed. */
  active?: boolean;
  /** A trailing count, so a label never has to be built by concatenation. */
  count?: number;
}

interface Props<T> {
  rows: T[];
  /** ⚠️ Must match the `key` the hand-written table used, or rows remount and lose focus/scroll. */
  rowKey: (row: T) => string;
  columns: Column<T>[];
  actions?: {
    /** The actions column heading: "Actions", "Mark as", "Payment", "Details". */
    label: string;
    items?: (row: T) => (RowAction | null | false | undefined)[];
    /** Escape hatch for an action that is a bespoke component rather than a button. */
    render?: (row: T) => ReactNode;
  };
  /**
   * An extra panel shown when the row is expanded — free-form, for content that is not
   * label/value pairs (the admin log's stack traces). Its presence also makes the DESKTOP
   * table expandable, which is how the Logs tab keeps the behaviour it already had.
   */
  detail?: (row: T) => ReactNode;
  /** Optional heading strip above the table. */
  title?: string;
  /** Per-row styling, applied to BOTH the <tr> and the card (e.g. opacity-60 for a disabled row). */
  rowClassName?: (row: T) => string | undefined;
  /** Desktop min-width, exactly as today. A full static class — never interpolated. */
  minWidth?: string;
  /**
   * Where cards give way to the table. Tailwind classes are looked up in a static map below:
   * a class name built by template literal is not in the JIT's scan output and silently
   * produces no CSS at all.
   */
  breakpoint?: "md" | "lg";
}

// Static, because Tailwind only emits classes it can see as literals.
const SHOW_TABLE: Record<"md" | "lg", string> = {
  md: "hidden md:block",
  lg: "hidden lg:block",
};
const SHOW_CARDS: Record<"md" | "lg", string> = {
  md: "space-y-3 md:hidden",
  lg: "space-y-3 lg:hidden",
};

// One vocabulary for row actions, replacing three that had drifted apart: IconBtn's
// indigo/amber/emerald/rose, StatusButton's rose/amber/emerald, and Button's variants. These are
// the HubTone names components/ui.tsx asks new code to use, since the old colour words stopped
// describing the rendered colour after the rebrand.
const ICON_TONE: Record<ActionTone, string> = {
  neutral: "text-muted hover:bg-overlay/[0.06] hover:text-heading",
  primary: "text-primary hover:bg-primary/10",
  success: "text-success hover:bg-success/10",
  warning: "text-warning hover:bg-warning/10",
  danger: "text-danger hover:bg-danger/10",
};

// Button has no amber variant, so `warning` is a secondary button tinted with the warning token.
const BUTTON_VARIANT: Record<ActionTone, "primary" | "secondary" | "danger" | "success"> = {
  neutral: "secondary",
  primary: "primary",
  success: "success",
  warning: "secondary",
  danger: "danger",
};

function liveActions<T>(row: T, items?: (row: T) => (RowAction | null | false | undefined)[]) {
  return (items?.(row) ?? []).filter(Boolean) as RowAction[];
}

/** The tooltip: the label, plus the reason when there is one. */
function tooltip(a: RowAction, tr: (s: string) => string) {
  return a.hint ? `${tr(a.label)} — ${tr(a.hint)}` : tr(a.label);
}

function DesktopAction({ action: a, tr }: { action: RowAction; tr: (s: string) => string }) {
  const label = tooltip(a, tr);
  return (
    <button
      type="button"
      title={label}
      // Both, always. IconBtn and StatusButton carried only `title`, which no screen reader
      // announces — sixteen tables' worth of unlabelled icon buttons fixed in one place.
      aria-label={label}
      aria-pressed={a.active === undefined ? undefined : a.active}
      onClick={a.onClick}
      disabled={a.disabled || a.loading}
      className={cn(
        "rounded-lg p-1.5 transition disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
        ICON_TONE[a.tone ?? "neutral"],
        // A toggle that is off reads as available-but-not-chosen, not as disabled.
        a.active === false && "text-faint",
        a.active && "bg-overlay/[0.06] ring-1 ring-line/10",
      )}
    >
      {a.loading ? <Spinner className="h-4 w-4" /> : <a.icon className="h-4 w-4" />}
    </button>
  );
}

function CardAction({ action: a, tr }: { action: RowAction; tr: (s: string) => string }) {
  return (
    <Button
      size="sm"
      variant={BUTTON_VARIANT[a.tone ?? "neutral"]}
      icon={a.icon}
      onClick={a.onClick}
      disabled={a.disabled}
      loading={a.loading}
      aria-pressed={a.active === undefined ? undefined : a.active}
      className={cn(
        a.tone === "warning" && "text-warning",
        a.active && "ring-1 ring-line/20",
      )}
    >
      {/* Button self-translates string children, so this is already correct in both variants —
          except that AdminDataTable must NOT translate, hence tr() here and a plain node. */}
      {a.count === undefined ? tr(a.label) : `${tr(a.label)} (${a.count})`}
    </Button>
  );
}

/**
 * The shared implementation. Not exported: the translating and verbatim variants are two named
 * exports below, so which one a call site uses is visible in its import line.
 */
function Table<T>({
  rows, rowKey, columns, actions, detail, title, rowClassName, minWidth, breakpoint = "md",
  translate,
}: Props<T> & { translate: boolean }) {
  const t = useT();
  const tr = translate ? t : (s: string) => s;

  // Multi-open, not the single-open accordion the admin log uses: on a phone people compare rows,
  // and closing an unrelated card under the reader's thumb also jumps the scroll position.
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const slotted = (s: Column<T>["slot"]) => columns.filter((c) => c.slot === s);
  const titleCols = slotted("title");
  const metaCols = slotted("meta");
  const badgeCols = slotted("badge");
  // Everything with no slot is what the card hides until it is opened.
  const restCols = columns.filter((c) => !c.slot && !c.desktopOnly);

  const colCount = columns.length + (actions ? 1 : 0);

  return (
    <>
      {/* ---------------------------------------------------------------- desktop */}
      <Card className={cn("overflow-hidden", SHOW_TABLE[breakpoint])}>
        {title && (
          <div className="border-b border-line/[0.06] px-4 py-3 text-sm font-bold text-heading">
            {tr(title)}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className={cn("w-full text-left text-sm", minWidth)}>
            <thead className="border-b border-line/[0.06] bg-overlay/[0.02] text-[11px] uppercase tracking-wider text-muted">
              <tr>
                {detail && <th scope="col" className="w-8 p-4" />}
                {columns.map((c) => (
                  <th key={c.key} scope="col" className={cn("p-4", c.align === "right" && "text-right")}>
                    {tr(c.label)}
                  </th>
                ))}
                {actions && <th scope="col" className="p-4 text-right">{tr(actions.label)}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/[0.04]">
              {rows.map((row) => {
                const id = rowKey(row);
                const isOpen = open.has(id);
                return (
                  <Fragment key={id}>
                    <tr
                      className={cn("hover:bg-overlay/[0.02]", detail && "cursor-pointer", rowClassName?.(row))}
                      onClick={detail ? () => toggle(id) : undefined}
                    >
                      {detail && (
                        <td className="p-4 text-muted">
                          <ChevronDown
                            className={cn("h-4 w-4 transition-transform", !isOpen && "-rotate-90")}
                            aria-hidden
                          />
                        </td>
                      )}
                      {columns.map((c) => (
                        <td
                          key={c.key}
                          className={cn("p-4", c.align === "right" && "text-right", c.className)}
                        >
                          {c.cell(row)}
                        </td>
                      ))}
                      {actions && (
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            {liveActions(row, actions.items).map((a) => (
                              <DesktopAction key={a.label} action={a} tr={tr} />
                            ))}
                            {actions.render?.(row)}
                          </div>
                        </td>
                      )}
                    </tr>
                    {detail && isOpen && (
                      <tr className="bg-overlay/[0.02]">
                        <td colSpan={colCount + 1} className="p-4">{detail(row)}</td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ------------------------------------------------------------------ phone */}
      <div className={SHOW_CARDS[breakpoint]}>
        {title && <div className="px-1 text-sm font-bold text-heading">{tr(title)}</div>}
        {rows.map((row) => {
          const id = rowKey(row);
          const isOpen = open.has(id);
          const rowActions = liveActions(row, actions?.items);
          // No chevron, no button, no dead affordance when there is nothing behind it.
          const expandable =
            restCols.length > 0 || rowActions.length > 0 || !!actions?.render || !!detail;
          const reasons = Array.from(
            new Set(rowActions.filter((a) => a.disabled && a.hint).map((a) => a.hint as string)),
          );

          const head = (
            <>
              <span className="min-w-0 flex-1">
                {/* No `truncate` here: a title cell is often two lines (a name over a phone
                    number) and clipping is the cell's own call, not this wrapper's. */}
                {titleCols.map((c) => (
                  <span key={c.key} className="block min-w-0 font-semibold text-heading">
                    {c.cell(row)}
                  </span>
                ))}
                {metaCols.length > 0 && (
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                    {metaCols.map((c, i) => (
                      <Fragment key={c.key}>
                        {/* A drawn dot, not a · character: a punctuation-only text node is copy as
                            far as check-i18n is concerned, and there is nothing here to translate. */}
                        {i > 0 && <span className="h-1 w-1 shrink-0 rounded-full bg-faint" aria-hidden />}
                        <span className="min-w-0">{c.cell(row)}</span>
                      </Fragment>
                    ))}
                  </span>
                )}
                {badgeCols.length > 0 && (
                  <span className="mt-2 flex flex-wrap items-center gap-1.5">
                    {badgeCols.map((c) => (
                      <span key={c.key}>{c.cell(row)}</span>
                    ))}
                  </span>
                )}
              </span>
              {expandable && (
                <ChevronDown
                  className={cn("h-5 w-5 shrink-0 text-faint transition-transform", !isOpen && "-rotate-90")}
                  aria-hidden
                />
              )}
            </>
          );

          return (
            <Card key={id} className={cn("overflow-hidden", rowClassName?.(row))}>
              {expandable ? (
                // The whole header is the button, per SectionBanner: a 44px-tall target beats a
                // 20px chevron on a phone. It needs no aria-label — its accessible name is its own
                // content, which is why this feature ships without inventing any new copy.
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 p-4 text-left transition active:scale-[0.99]"
                >
                  {head}
                </button>
              ) : (
                <div className="flex w-full items-center gap-3 p-4 text-left">{head}</div>
              )}

              {/* Rendered only while open rather than kept mounted for aria-controls: a 200-row
                  table would otherwise build every panel up front, and aria-expanded on a button
                  whose disclosure immediately follows it is well supported without it. */}
              {expandable && isOpen && (
                <div className="animate-fade-in space-y-3 border-t border-line/[0.06] p-4">
                  {restCols.length > 0 && (
                    <dl className="space-y-2">
                      {restCols.map((c) => (
                        <div key={c.key} className="flex items-baseline justify-between gap-3">
                          <dt className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted">
                            {tr(c.label)}
                          </dt>
                          <dd className="min-w-0 text-right text-sm text-fg">{c.cell(row)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {detail && <div>{detail(row)}</div>}

                  {(rowActions.length > 0 || actions?.render) && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {rowActions.map((a) => (
                        <CardAction key={a.label} action={a} tr={tr} />
                      ))}
                      {actions?.render?.(row)}
                    </div>
                  )}

                  {reasons.map((r) => (
                    <p key={r} className="text-xs text-subtle">{tr(r)}</p>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}

/**
 * The table for every customer-facing screen. Translates its own labels, hints and action names.
 *
 * ⚠️ Cell renderers must stay PURE. Both trees are always mounted (CSS picks one), so a cell that
 * fetches, subscribes or portals would do it twice.
 * ⚠️ Never wrap `columns` or `actions.items` in useMemo, and never memo this component: they close
 * over per-row pending state (usePendingAction's isPending) and a stale closure freezes the spinner.
 */
export function DataTable<T>(props: Props<T>) {
  return <Table {...props} translate />;
}

/**
 * The same table, rendering every label VERBATIM. For the super-admin console only.
 *
 * WHY THIS EXISTS. app/admin/page.tsx is English by standing decision (see the top of
 * lib/locales/bn.ts) and is on check-i18n's EXCLUDE list — but it renders DashboardShell, which
 * puts a language toggle in its header unconditionally (components/shell.tsx:222). So the console
 * is inside the LanguageProvider and only stays English because its markup never calls t().
 *
 * Route its column labels through a translating component and they hit real dictionary entries:
 * 13 of its 20 headings already have Bangla (Owner, Status, Actions, Plan, Amount, Subject…) and 7
 * do not (Building, Age, When, Level, Source, Who, Owed). An operator who has ever tapped the
 * Bangla pill would get a half-translated console — and nothing would catch it, because the file
 * is excluded from the checker.
 *
 * A separate export rather than a `verbatim` boolean: an import line is visible in review, one
 * flag among ten props is not.
 */
export function AdminDataTable<T>(props: Props<T>) {
  return <Table {...props} translate={false} />;
}
