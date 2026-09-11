"use client";

import { ReactNode, useState } from "react";
import { Bell, LogOut, MoreHorizontal, X, Crown, type LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";
import { PushToggle } from "./push-toggle";
import { DownloadAndroid } from "./download-android";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { LegalLinks } from "./legal-links";
import { Wordmark } from "./ui";
import { useT } from "../lib/i18n";

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  /**
   * Paid add-on the account hasn't unlocked. Marks the item with a crown; the tab itself stays
   * reachable and explains the feature, so this is a price tag, not a barrier.
   * Mutually exclusive with `badge` in practice — a locked tab has no unread anything.
   */
  locked?: boolean;
}

interface ShellProps {
  /**
   * Which portal this shell is hosting. Currently unread: the wordmark used to be tinted with a
   * per-role gradient, and is now one flat brand ink in every portal (the role is already stated
   * by `roleLabel` directly underneath it). Kept because all four call sites pass it and it is
   * the natural hook for any future per-portal chrome.
   */
  brand: "owner" | "tenant" | "admin" | "building";
  roleLabel: string;
  sessionName?: string;
  sessionId?: string;
  nav: NavItem[];
  active: string;
  onNavigate: (key: string) => void;
  onLogout: () => void;
  children: ReactNode;
  sidebarTop?: ReactNode;
}

export function DashboardShell({
  roleLabel,
  sessionName,
  sessionId,
  nav,
  active,
  onNavigate,
  onLogout,
  children,
  sidebarTop,
}: ShellProps) {
  const activeTab = nav.find((n) => n.key === active);
  // The bell is DERIVED from nav rather than passed in: all four portals already carry a
  // "notices" item, and owner/tenant already put their unread count on its badge. So the header
  // gets a working bell in every console without a prop, and a portal that ever drops the tab
  // loses the bell automatically instead of leaving a button that navigates nowhere.
  const notices = nav.find((n) => n.key === "notices");
  // Same trick for the lock-up: clicking the brand goes home. Derived, not a prop, so it names
  // the tab the way that portal names it — the tenant calls it Home, everyone else Overview —
  // and a portal that ever drops the tab loses the affordance instead of keeping a dead logo.
  const home = nav.find((n) => n.key === "overview");

  const [moreOpen, setMoreOpen] = useState(false);
  const t = useT();

  // Hoisted so the clickable and non-clickable forms below cannot drift apart.
  const mobileBrand = (
    <>
      <Wordmark className="h-6" />
      <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-subtle">
        {t(roleLabel)}
      </span>
    </>
  );

  // Mobile bottom bar: keep it to a single non-scrolling row. Up to 5 items fit as equal tabs;
  // beyond that, show the first 4 + a "More" button that opens a sheet with the rest.
  const PRIMARY = 4;
  const hasMore = nav.length > 5;
  const primaryItems = hasMore ? nav.slice(0, PRIMARY) : nav.slice(0, 5);
  const overflowItems = hasMore ? nav.slice(PRIMARY) : [];
  const activeInOverflow = overflowItems.some((i) => i.key === active);
  const columns = hasMore ? 5 : primaryItems.length;

  function go(key: string) {
    onNavigate(key);
    setMoreOpen(false);
  }

  return (
    <div className="flex min-h-screen">
      {/* ---------------- Desktop sidebar ---------------- */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line/[0.08] bg-surface/60 p-5 backdrop-blur-xl md:flex">
        {/* Top band — brand + optional slot. Fixed height. */}
        <div className="shrink-0 space-y-6">
          <div className="space-y-1.5">
            {home ? (
              <button
                type="button"
                onClick={() => onNavigate(home.key)}
                aria-label={t(home.label)}
                title={t(home.label)}
                className="inline-flex shrink-0 items-center rounded-lg transition active:scale-95"
              >
                <Wordmark className="h-7" />
              </button>
            ) : (
              <Wordmark className="h-7" />
            )}
            <div className="text-[10px] uppercase tracking-widest text-subtle">
              {t(roleLabel)}
            </div>
          </div>

          {sidebarTop && <div>{sidebarTop}</div>}
        </div>

        {/* Nav band — scrolls when the list is taller than the viewport, so the sign-out row
            below is never covered or cut off no matter how many items there are. */}
        <nav className="-mr-2 mt-6 flex-1 space-y-1 overflow-y-auto pr-2">
          {nav.map((item) => {
            const isActive = item.key === active;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all",
                  isActive
                    ? "bg-primary text-btn-ink shadow-lg shadow-primary/20"
                    : "text-muted hover:bg-overlay/[0.05] hover:text-heading"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="flex-1 text-left">{t(item.label)}</span>
                {item.locked && (
                  <Crown
                    className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-btn-ink" : "text-warning")}
                    aria-label={t("Paid add-on")}
                  />
                )}
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      isActive ? "bg-black/20 text-btn-ink" : "bg-overlay/[0.1] text-fg"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom band — always visible. Theme/language live in the top header at every
            width, so they are deliberately absent here. */}
        <div className="shrink-0 space-y-1 pt-4">
          <div className="flex items-center gap-1">
            <button
              onClick={onLogout}
              className="flex flex-1 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-muted transition hover:bg-danger/10 hover:text-danger"
            >
              <LogOut className="h-[18px] w-[18px]" />
              {t("Sign out")}
            </button>
            {/* Icon-only, with a tooltip. Sits in this action row rather than as its own nav
                row, where a bare icon would read as an unlabelled item next to text ones.
                Renders only in a browser (hidden inside the installed Android app). */}
            <DownloadAndroid variant="icon" />
          </div>
          <div className="flex justify-center pt-1">
            <LegalLinks />
          </div>
        </div>
      </aside>

      {/* ---------------- Main column ---------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar — every width. A floating rounded card rather than a full-bleed bar: it is the
            same lock-up + controls as before, restyled to match the rest of the surfaces below it.
            On mobile it carries the brand, the role and sign out (there is no sidebar); on desktop
            the sidebar already provides both, so those collapse and the bar names the section.

            The mockup this came from shows only the language pill and the bell. The theme toggle
            and the mobile sign-out stay anyway — with no sidebar on a phone, dropping them is the
            difference between "not in the design" and "unreachable". */}
        <header className="sticky top-0 z-30 bg-bg/70 px-3 pt-3 backdrop-blur-xl md:px-8 lg:px-10">
          <div className="card-surface flex items-center justify-between gap-2 rounded-[22px] px-3 py-2.5">
            {/* Mobile: the lock-up with the role beneath it. The section name is deliberately not
                here — it is already on screen in the PageHeader below and on the active tab. */}
            {/* The whole cluster is the button, not just the mark: with no sidebar on a phone
                this is the only way home, and the role caption under it is part of the lock-up.
                items-start is load-bearing — a flex-col stretches its children by default, and a
                stretched Wordmark silently renders centred (see its note in ui.tsx). */}
            {home ? (
              <button
                type="button"
                onClick={() => onNavigate(home.key)}
                aria-label={t(home.label)}
                title={t(home.label)}
                className="flex min-w-0 flex-col items-start text-left transition active:scale-95 md:hidden"
              >
                {mobileBrand}
              </button>
            ) : (
              <div className="flex min-w-0 flex-col md:hidden">{mobileBrand}</div>
            )}
            {/* Desktop: name the current section, so the bar isn't a lone cluster of buttons.
                There is no sidebar on mobile, which is why that trade-off differs by width. */}
            <span className="hidden font-display text-base font-extrabold text-heading md:block">
              {t(activeTab?.label ?? roleLabel)}
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              <LanguageToggle variant="pill" />
              <ThemeToggle variant="icon" />
              {notices && (
                <button
                  onClick={() => onNavigate(notices.key)}
                  aria-label={t(notices.label)}
                  title={t(notices.label)}
                  className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-btn-ink shadow-lg shadow-primary/25 transition active:scale-95"
                >
                  <Bell className="h-4 w-4" />
                  {/* Amber, not danger: --danger (#B91C1C) on --primary (#E0473B) is two shades of
                      the same red and the dot disappears. The ring punches it out of the button. */}
                  {typeof notices.badge === "number" && notices.badge > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-warning ring-2 ring-surface" />
                  )}
                </button>
              )}
              <button
                onClick={onLogout}
                className="rounded-lg p-2 text-muted transition hover:text-danger md:hidden"
                aria-label={t("Sign out")}
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-4 md:px-8 md:pb-10 lg:px-10">
          <div className="mx-auto w-full max-w-6xl animate-slide-up">
            <PushToggle />
            {/* Mobile-only download affordance (desktop uses the sidebar row). Browser-only. */}
            <div className="mb-3 flex justify-end md:hidden">
              <DownloadAndroid variant="icon" />
            </div>
            {children}
          </div>
        </main>
      </div>

      {/* ---------------- Mobile "More" sheet ---------------- */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            aria-label={t("Close menu")}
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-scrim/70 backdrop-blur-sm"
          />
          <div
            className="absolute inset-x-0 bottom-0 animate-slide-up rounded-t-2xl border-t border-line/[0.1] bg-surface/95 px-4 pt-3 backdrop-blur-xl"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-overlay/20" />
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-fg">{t("More")}</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-overlay/[0.06] hover:text-heading"
                aria-label={t("Close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 pb-2">
              {overflowItems.map((item) => {
                const isActive = item.key === active;
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => go(item.key)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[11px] font-semibold transition-colors",
                      isActive
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-line/[0.08] bg-overlay/[0.02] text-fg hover:bg-overlay/[0.05]"
                    )}
                  >
                    <span className="relative">
                      <Icon className="h-5 w-5" />
                      {item.locked && (
                        <Crown className="absolute -right-2.5 -top-1.5 h-3 w-3 text-warning" aria-label={t("Paid add-on")} />
                      )}
                      {typeof item.badge === "number" && item.badge > 0 && (
                        <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                          {item.badge}
                        </span>
                      )}
                    </span>
                    <span className="max-w-full truncate">{t(item.label)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Mobile bottom nav ---------------- */}
      {/* One non-scrolling row: up to 5 equal tabs, or 4 + "More" when there are more items.
          Its own safe-area padding keeps the tappable row above the phone's gesture/system bar. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid border-t border-line/[0.08] bg-surface/90 backdrop-blur-xl md:hidden"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {primaryItems.map((item) => {
          const isActive = item.key === active;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
                isActive ? "text-primary" : "text-subtle"
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {item.locked && (
                  <Crown className="absolute -right-2.5 -top-1.5 h-3 w-3 text-warning" aria-label={t("Paid add-on")} />
                )}
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate px-1">{t(item.label)}</span>
              {isActive && (
                <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}

        {hasMore && (
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
              activeInOverflow || moreOpen ? "text-primary" : "text-subtle"
            )}
            aria-label={t("More")}
            aria-expanded={moreOpen}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>{t("More")}</span>
            {activeInOverflow && (
              <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        )}
      </nav>
    </div>
  );
}
