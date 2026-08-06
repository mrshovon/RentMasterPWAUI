"use client";

import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { isBrowser } from "../lib/platform";
import { fetchLatestRelease } from "../lib/updates";
import { LATEST_APK_URL } from "../lib/app-config";

// A "Download Android app" affordance. Renders ONLY in a browser (hidden inside the
// installed native app). Clicking it downloads the APK directly.
//
// The href is the STATIC latest-asset URL, which GitHub redirects to the current release
// and serves as an attachment. That means the link works on first paint and never depends
// on the releases API — which is capped at 60 req/hour per IP and shared by everyone behind
// the same NAT. The API is used only to enrich the label with a version and size, and the
// button is fully functional whether or not that call succeeds.
export function DownloadAndroid({ variant = "link" }: { variant?: "link" | "sidebar" | "icon" }) {
  const [mounted, setMounted] = useState(false);
  const [meta, setMeta] = useState<{ version: string; size: number | null } | null>(null);

  // Only decide visibility after mount (SSR can't know the platform) to avoid hydration flicker.
  useEffect(() => {
    setMounted(true);
    let cancelled = false;
    fetchLatestRelease().then((r) => {
      if (!cancelled && r) setMeta({ version: r.version, size: r.apkSize });
    });
    return () => { cancelled = true; };
  }, []);

  if (!mounted || !isBrowser()) return null;

  const sidebar = variant === "sidebar";
  const size = meta?.size ? ` · ${(meta.size / 1024 / 1024).toFixed(1)} MB` : "";
  const label = meta
    ? `Download v${meta.version}${size}`
    : sidebar
      ? "Download Android app"
      : "Download the Android app";

  // Icon-only affordance. The label still has to reach the user somehow, so it becomes an
  // accessible name plus a visible tooltip on hover AND focus — hover alone would leave the
  // control unlabelled for keyboard and touch users. `title` is kept as the last-resort
  // fallback for anything that renders the tooltip element oddly.
  if (variant === "icon") {
    const tip = meta ? `Download Android app · v${meta.version}${size}` : "Download Android app";
    return (
      <span className="group relative inline-flex">
        <a
          href={LATEST_APK_URL}
          download
          aria-label={tip}
          title={tip}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-success/10 hover:text-success focus-visible:bg-success/10 focus-visible:text-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/40"
        >
          <Smartphone className="h-[18px] w-[18px]" />
        </a>
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-heading px-2.5 py-1.5 text-xs font-semibold text-bg shadow-lg group-hover:block group-focus-within:block"
        >
          {tip}
        </span>
      </span>
    );
  }

  return (
    <a
      href={LATEST_APK_URL}
      download
      className={
        sidebar
          ? "flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted transition hover:bg-success/10 hover:text-success"
          : "inline-flex items-center gap-2 text-xs font-semibold text-muted transition hover:text-success"
      }
    >
      <Smartphone className={sidebar ? "h-[18px] w-[18px]" : "h-4 w-4"} />
      {label}
    </a>
  );
}
