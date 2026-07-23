"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "../lib/cn";

// =============================================================================
// THEME TOGGLE — flips between the soothing light default and the softened dark.
//
// The actual data-theme is set on <html> by an inline script in app/layout.tsx
// BEFORE paint (no flash). This component just reads the current value, lets the
// user flip it, persists the choice, and keeps the PWA theme-color meta in sync.
// =============================================================================

const STORAGE_KEY = "rentmaster-theme";
type Theme = "light" | "dark";

// Kept in sync with the --bg tokens in globals.css so the browser/PWA chrome matches.
const THEME_COLOR: Record<Theme, string> = {
  light: "#f6f8fb",
  dark: "#0f141e",
};

function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* private mode — the choice just won't persist */
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[theme]);
}

export function ThemeToggle({ className, variant = "sidebar" }: { className?: string; variant?: "sidebar" | "icon" }) {
  // Start from a stable value for SSR, then sync to the real theme after mount.
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => { setTheme(currentTheme()); }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";
  const Icon = isDark ? Sun : Moon;

  if (variant === "icon") {
    return (
      <button
        onClick={toggle}
        aria-label={label}
        title={label}
        className={cn("rounded-lg p-2 text-muted transition hover:bg-overlay/[0.06] hover:text-heading", className)}
      >
        <Icon className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-muted transition hover:bg-overlay/[0.06] hover:text-heading",
        className
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
      {isDark ? "Light theme" : "Dark theme"}
    </button>
  );
}
