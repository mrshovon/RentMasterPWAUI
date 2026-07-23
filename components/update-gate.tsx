"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Sparkles, CheckCircle2, RefreshCw } from "lucide-react";
import { Modal, Button } from "./ui";
import { toast } from "./toast";
import { isNativeApp } from "../lib/platform";
import { checkForUpdate, startUpgrade, type ReleaseInfo } from "../lib/updates";

// Mounted once at the app root (next to Toaster/ConfirmHost). Inside the native app it checks
// GitHub Releases for a newer version and, if found, shows a popup with the changelog as
// bullet points plus Upgrade / Cancel.
//
// It re-checks whenever the app returns to the foreground. Checking only at mount meant an app
// that was already running when a release shipped would never notice it — a WebView shell is
// rarely torn down, so "on mount" can mean "once, days ago".
//
// Cancel does NOT suppress the prompt: it reappears next launch until the user upgrades.

/** Don't re-hit the network more than once a minute on rapid app switching. */
const RECHECK_THROTTLE_MS = 60_000;

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
  const lastCheck = useRef(0);
  const dismissed = useRef(false); // reset when the app is relaunched, not persisted

  const run = useCallback(async () => {
    if (Date.now() - lastCheck.current < RECHECK_THROTTLE_MS) return;
    lastCheck.current = Date.now();
    const { hasUpdate, latest, reason, current, versionSource } = await checkForUpdate();
    console.info(`[updates] installed=${current} (${versionSource}) latest=${latest?.version ?? "?"} -> ${reason}`);
    if (!hasUpdate || !latest) return;
    setRelease(latest);
    if (!dismissed.current) setOpen(true);
  }, []);

  useEffect(() => {
    if (!isNativeApp()) return; // update popup is native-only
    let cancelled = false;
    let remove: (() => void) | undefined;

    void run();

    // Re-check on resume.
    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive && !cancelled) {
            dismissed.current = false; // a fresh foreground may show a newer release
            void run();
          }
        });
        remove = () => { void handle.remove(); };
      } catch {
        /* no bridge: the mount-time check above still ran */
      }
    })();

    return () => { cancelled = true; remove?.(); };
  }, [run]);

  function cancel() {
    if (busy) return; // don't let the modal close mid-download
    dismissed.current = true;
    setOpen(false);
  }

  async function upgrade() {
    try {
      setBusy(true);
      setPercent(0);
      await startUpgrade(release, setPercent);
      // The Android installer has taken over; leave the modal up behind it so the user lands
      // somewhere sensible if they back out of the system prompt.
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
        <div className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Sparkles className="h-4 w-4 text-primary" />
          What&apos;s new in v{release.version}
        </div>

        <div className="max-h-64 space-y-3 overflow-y-auto rounded-xl border border-line/[0.06] bg-overlay/[0.02] p-4 text-sm leading-relaxed text-fg">
          {paragraphs.map((p, i) => <p key={`p${i}`}>{p}</p>)}
          {bullets.length > 0 && (
            <ul className="space-y-2">
              {bullets.map((b, i) => (
                <li key={`b${i}`} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          {bullets.length === 0 && paragraphs.length === 0 && <p>Bug fixes and improvements.</p>}
        </div>

        {busy && (
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-overlay/[0.06]">
              <div className="h-full rounded-full bg-primary transition-all duration-200"
                style={{ width: `${percent}%` }} />
            </div>
            <p className="text-xs text-muted">
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

/**
 * On-demand update check that REPORTS what it found.
 *
 * Both of the bugs that shipped this week hid in the same place: every failure path returned
 * null and rendered nothing, so "no popup" was indistinguishable from "no update", a broken
 * version lookup, or a rate-limited API. This states all of it out loud.
 */
export function UpdateCheckButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  const [native, setNative] = useState(false);

  useEffect(() => { setNative(isNativeApp()); }, []);
  if (!native) return null;

  async function run() {
    setBusy(true);
    try {
      const { hasUpdate, current, latest, reason, versionSource } = await checkForUpdate();
      if (reason === "check-failed") {
        toast.error(`Couldn't reach the update server. Installed v${current}.`);
      } else if (hasUpdate) {
        toast.success(`Update available: v${latest?.version} (you have v${current}). Reopen the app to install.`);
      } else {
        toast.info(`You're on the latest version (v${current}, via ${versionSource}).`);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant="ghost" icon={RefreshCw} loading={busy} onClick={run} className={className}>
      Check for updates
    </Button>
  );
}
