"use client";

import { useEffect, useState } from "react";
import { Download, Sparkles } from "lucide-react";
import { Modal, Button } from "./ui";
import { isNativeApp } from "../lib/platform";
import { checkForUpdate, startUpgrade, type ReleaseInfo } from "../lib/updates";

// Mounted once at the app root (next to Toaster/ConfirmHost). On launch, inside the
// native app only, it checks GitHub Releases for a newer version and, if found, shows
// a popup with the changelog and Upgrade/Later. "Later" is remembered per-version so
// the user isn't nagged every launch for a version they already dismissed.
const DISMISS_KEY = "rentmaster_update_dismissed";

export function UpdateGate() {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isNativeApp()) return; // update popup is native-only
    let cancelled = false;
    (async () => {
      const { hasUpdate, latest } = await checkForUpdate();
      if (cancelled || !hasUpdate || !latest) return;
      let dismissed: string | null = null;
      try { dismissed = localStorage.getItem(DISMISS_KEY); } catch { /* ignore */ }
      if (dismissed === latest.version) return; // already said "Later" for this version
      setRelease(latest);
      setOpen(true);
    })();
    return () => { cancelled = true; };
  }, []);

  function later() {
    try { if (release) localStorage.setItem(DISMISS_KEY, release.version); } catch { /* ignore */ }
    setOpen(false);
  }

  async function upgrade() {
    try {
      setBusy(true);
      await startUpgrade(release);
    } finally {
      setBusy(false);
    }
  }

  if (!release) return null;

  return (
    <Modal open={open} onClose={later} title="Update available"
      subtitle={`A new version (v${release.version}) is ready`}>
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          What&apos;s new in v{release.version}
        </div>
        <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm leading-relaxed text-slate-300">
          {release.notes?.trim() || "Bug fixes and improvements."}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={later}>Later</Button>
          <Button icon={Download} className="flex-1" loading={busy} onClick={upgrade}>Upgrade</Button>
        </div>
      </div>
    </Modal>
  );
}
