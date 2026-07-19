"use client";

import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { isBrowser } from "../lib/platform";
import { fetchLatestRelease } from "../lib/updates";
import { RELEASES_PAGE } from "../lib/app-config";

// A "Download Android app" affordance. Renders ONLY in a browser (hidden inside the
// installed native app). Points at the latest APK asset, falling back to the releases
// page. Two visual variants: a sidebar row (for the dashboard shell) and a link (login).
export function DownloadAndroid({ variant = "link" }: { variant?: "link" | "sidebar" }) {
  const [mounted, setMounted] = useState(false);
  const [href, setHref] = useState(RELEASES_PAGE);

  // Only decide visibility after mount (SSR can't know the platform) to avoid hydration flicker.
  useEffect(() => {
    setMounted(true);
    fetchLatestRelease().then((r) => {
      if (r?.apkUrl) setHref(r.apkUrl);
    });
  }, []);

  if (!mounted || !isBrowser()) return null;

  if (variant === "sidebar") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-emerald-500/10 hover:text-emerald-400"
      >
        <Smartphone className="h-[18px] w-[18px]" />
        Download Android app
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-emerald-400"
    >
      <Smartphone className="h-4 w-4" />
      Download the Android app
    </a>
  );
}
