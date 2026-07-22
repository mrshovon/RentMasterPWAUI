"use client";

import { useEffect, useState } from "react";
import { Download, Sparkles, CheckCircle2 } from "lucide-react";
import { Modal, Button } from "./ui";
import { toast } from "./toast";
import { isNativeApp } from "../lib/platform";
import { checkForUpdate, startUpgrade, type ReleaseInfo } from "../lib/updates";

// Mounted once at the app root (next to Toaster/ConfirmHost). On launch, inside the native
// app only, it checks GitHub Releases for a newer version and, if found, shows a popup with
// the changelog as bullet points plus Upgrade / Cancel.
//
// Cancel does NOT suppress the prompt: it reappears on the next launch until the user
// upgrades. (An earlier version remembered the dismissal per release in localStorage.)

/** Split release notes into markdown-ish bullets and plain paragraphs. */
function parseNotes(notes: string): { bullets: string[]; paragraphs: string[] } {
  const bullets: string[] = [];
  const paragraphs: string[] = [];
  for (const raw of (notes || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^[-*•]\s+(.*)$/);
    if (m) bullets.push(m[1].trim());
    else paragraphs.push(line);
  }
  return { bullets, paragraphs };
}

export function UpdateGate() {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (!isNativeApp()) return; // update popup is native-only
    let cancelled = false;
    (async () => {
      const { hasUpdate, latest } = await checkForUpdate();
      if (cancelled || !hasUpdate || !latest) return;
      setRelease(latest);
      setOpen(true);
    })();
    return () => { cancelled = true; };
  }, []);

  function cancel() {
    if (busy) return; // don't let the modal close mid-download
    setOpen(false);
  }

  async function upgrade() {
    try {
      setBusy(true);
      setPercent(0);
      await startUpgrade(release, setPercent);
      // The Android installer has taken over at this point; leave the modal up behind it so
      // the user lands somewhere sensible if they back out of the system prompt.
    } catch {
      toast.error("Could not download the update. Opening the download page instead.");
      setBusy(false);
    }
  }

  if (!release) return null;
  const { bullets, paragraphs } = parseNotes(release.notes);

  return (
    <Modal open={open} onClose={cancel} title="Update available"
      subtitle={`Version ${release.version} is ready to install`}>
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          What&apos;s new in v{release.version}
        </div>

        <div className="max-h-64 space-y-3 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm leading-relaxed text-slate-300">
          {paragraphs.map((p, i) => <p key={`p${i}`}>{p}</p>)}
          {bullets.length > 0 && (
            <ul className="space-y-2">
              {bullets.map((b, i) => (
                <li key={`b${i}`} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          {bullets.length === 0 && paragraphs.length === 0 && <p>Bug fixes and improvements.</p>}
        </div>

        {busy && (
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-indigo-500 transition-all duration-200"
                style={{ width: `${percent}%` }} />
            </div>
            <p className="text-xs text-slate-400">
              {percent < 100
                ? `Downloading… ${percent}%`
                : "Starting the installer — confirm the install when Android asks."}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" disabled={busy} onClick={cancel}>
            Cancel
          </Button>
          <Button icon={Download} className="flex-1" loading={busy} onClick={upgrade}>
            Upgrade
          </Button>
        </div>
      </div>
    </Modal>
  );
}
