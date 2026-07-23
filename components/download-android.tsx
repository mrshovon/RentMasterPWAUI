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
export function DownloadAndroid({ variant = "link" }: { variant?: "link" | "sidebar" }) {
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
