"use client";

import { ReactNode, useState } from "react";
import { LogOut, MoreHorizontal, X, Crown, type LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";
import { PushToggle } from "./push-toggle";
import { DownloadAndroid } from "./download-android";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { LegalLinks } from "./legal-links";
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
  brand,
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
  const accent =
    brand === "owner"
      ? "from-primary to-accent"
      : brand === "admin"
        ? "from-warning to-danger"
        : brand === "building"
          ? "from-accent to-primary"
          : "from-success to-accent";

  const activeTab = nav.find((n) => n.key === active);

  const [moreOpen, setMoreOpen] = useState(false);
  const t = useT();

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
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Bari360"
              className="h-9 w-9 rounded-xl object-cover shadow-lg shadow-primary/20" />
            <div>
              <div className={cn("bg-gradient-to-r bg-clip-text text-sm font-black tracking-widest text-transparent", accent)}>
                BARI360
              </div>
              <div className="text-[10px] uppercase tracking-widest text-subtle">
                {roleLabel}
              </div>
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
                <span className="flex-1 text-left">{item.label}</span>
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
        {/* Top bar — every width. On mobile it carries the brand and sign out (there is no
            sidebar); on desktop the sidebar already provides both, so those collapse and the
            bar exists to keep theme/language reachable without opening a menu. */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line/[0.08] bg-surface/80 px-4 py-3 backdrop-blur-xl md:px-8 lg:px-10">
          <div className="flex items-center gap-2 md:hidden">
            <img src="/logo.png" alt="Bari360" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-sm font-bold text-fg">
              {activeTab?.label ?? "Bari360"}
            </span>
          </div>
          {/* Desktop: name the current section, so the bar isn't a lone cluster of buttons. */}
          <span className="hidden text-sm font-bold text-fg md:block">
            {activeTab?.label ?? roleLabel}
          </span>
          <div className="flex items-center gap-1">
            <LanguageToggle variant="icon" />
            <ThemeToggle variant="icon" />
            <button
              onClick={onLogout}
              className="rounded-lg p-2 text-muted hover:text-danger md:hidden"
              aria-label={t("Sign out")}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10 lg:px-10">
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
                    <span className="max-w-full truncate">{item.label}</span>
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
              <span className="max-w-full truncate px-1">{item.label}</span>
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
