"use client";

import { ReactNode } from "react";
import { LogOut, type LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";
import { PushToggle } from "./push-toggle";
import { DownloadAndroid } from "./download-android";

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface ShellProps {
  brand: "owner" | "tenant" | "admin";
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
      ? "from-indigo-400 to-cyan-400"
      : brand === "admin"
        ? "from-amber-400 to-rose-400"
        : "from-emerald-400 to-cyan-400";

  const activeTab = nav.find((n) => n.key === active);

  return (
    <div className="flex min-h-screen">
      {/* ---------------- Desktop sidebar ---------------- */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-white/[0.06] bg-slate-950/60 p-5 backdrop-blur-xl md:flex">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 text-sm font-black tracking-tighter text-slate-950 shadow-lg shadow-indigo-500/20">
              RM
            </div>
            <div>
              <div className={cn("bg-gradient-to-r bg-clip-text text-sm font-black tracking-widest text-transparent", accent)}>
                RENTMASTER
              </div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                {roleLabel}
              </div>
            </div>
          </div>

          {sidebarTop && <div>{sidebarTop}</div>}

          <nav className="space-y-1">
            {nav.map((item) => {
              const isActive = item.key === active;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {typeof item.badge === "number" && item.badge > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-300"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-1">
          {/* Renders only in a browser (hidden inside the installed Android app). */}
          <DownloadAndroid variant="sidebar" />
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ---------------- Main column ---------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-slate-950/80 px-4 py-3 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 text-xs font-black text-slate-950">
              RM
            </div>
            <span className="text-sm font-bold text-slate-200">
              {activeTab?.label ?? "RentMaster"}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="rounded-lg p-2 text-slate-400 hover:text-rose-400"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10 lg:px-10">
          <div className="mx-auto w-full max-w-6xl animate-slide-up">
            <PushToggle />
            {/* Mobile-only download affordance (desktop uses the sidebar row). Browser-only. */}
            <div className="mb-3 flex justify-end md:hidden">
              <DownloadAndroid variant="link" />
            </div>
            {children}
          </div>
        </main>
      </div>

      {/* ---------------- Mobile bottom nav ---------------- */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-slate-950/90 backdrop-blur-xl md:hidden">
        {/* Scrolls rather than shrinks: past ~6 items, flex-1 would crush each tab to a
            few dozen pixels. Fixed-width items + horizontal scroll keeps them tappable. */}
        <div className="mx-auto flex max-w-lg items-stretch justify-start overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {nav.map((item) => {
            const isActive = item.key === active;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={cn(
                  "relative flex min-w-[4.5rem] shrink-0 grow flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
                  isActive ? "text-indigo-400" : "text-slate-500"
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {typeof item.badge === "number" && item.badge > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </span>
                <span className="max-w-[64px] truncate">{item.label}</span>
                {isActive && (
                  <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-indigo-400" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
