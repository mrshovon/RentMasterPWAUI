"use client";

import { useEffect, useState } from "react";
import { Modal, Button } from "./ui";
import { useT } from "../lib/i18n";

// =============================================================================
// Promise-based confirm dialog — a styled replacement for window.confirm().
// Call `await confirmDialog({ title, message, danger })` anywhere; it resolves
// true/false. Render <ConfirmHost /> once at the app root (see app/layout.tsx).
//
// Like the toaster, translation happens HERE rather than at every call site, so callers keep
// passing plain English. Anything absent from the dictionary — including every string from the
// untranslated admin console — falls through to English, which is exactly what we want.
// =============================================================================

export interface ConfirmChoice {
  value: string;
  label: string;
  /** One line under the label saying what this option actually does. */
  hint?: string;
}

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** Turns the dialog into a CHOICE: a radio list, resolving to the picked `value` instead of
   *  `true`. For a confirm where the destructive answer is not the only answer — deleting a
   *  building admin can either take its flat owners with it or leave them standing, and a yes/no
   *  dialog can only ask that by being asked twice. Read through confirmChoice(), never
   *  confirmDialog(). */
  choices?: ConfirmChoice[];
  /** Which choice starts selected. Defaults to the first — put the SAFE option there. */
  defaultChoice?: string;
}

type Resolver = (v: boolean | string) => void;
let request: ((opts: ConfirmOptions, resolve: Resolver) => void) | null = null;

/** Open the host, retrying briefly if it has not mounted yet. */
function ask(opts: ConfirmOptions, resolve: Resolver, onGiveUp: () => void) {
  // The host mounts at the app root, but if a call somehow lands before it's
  // registered, retry briefly rather than ever falling back to a browser dialog.
  const open = (attempt = 0) => {
    if (request) { request(opts, resolve); return; }
    if (attempt > 50) { onGiveUp(); return; } // ~5s safety net
    setTimeout(() => open(attempt + 1), 100);
  };
  open();
}

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    ask({ ...opts, choices: undefined }, (v) => resolve(v === true), () => resolve(false));
  });
}

/**
 * A confirm with named options. Resolves to the chosen `value`, or null if it was cancelled —
 * so `if (!choice) return;` reads the same way `if (!ok) return;` does at every other call site.
 */
export function confirmChoice(opts: ConfirmOptions & { choices: ConfirmChoice[] }): Promise<string | null> {
  return new Promise((resolve) => {
    ask(opts, (v) => resolve(typeof v === "string" ? v : null), () => resolve(null));
  });
}

export function ConfirmHost() {
  const [state, setState] = useState<{ opts: ConfirmOptions; resolve: Resolver } | null>(null);
  const [picked, setPicked] = useState<string>("");
  const t = useT();

  useEffect(() => {
    request = (opts, resolve) => {
      // Reset the selection on every open, to the caller's safe default.
      setPicked(opts.defaultChoice || opts.choices?.[0]?.value || "");
      setState({ opts, resolve });
    };
    return () => { request = null; };
  }, []);

  const settle = (value: boolean | string) => {
    state?.resolve(value);
    setState(null);
  };

  const opts = state?.opts;
  const choices = opts?.choices;

  return (
    <Modal open={!!state} onClose={() => settle(false)} title={t(opts?.title || "")} size="md">
      <div className="space-y-6">
        {opts?.message && <p className="text-sm leading-relaxed text-fg">{t(opts.message)}</p>}

        {choices && (
          <div className="space-y-2">
            {choices.map((c) => (
              <label
                key={c.value}
                className={
                  "flex cursor-pointer gap-3 rounded-xl border p-3 transition " +
                  (picked === c.value
                    ? "border-primary/50 bg-primary/[0.06]"
                    : "border-line/[0.12] hover:border-line/[0.2]")
                }
              >
                <input
                  type="radio"
                  className="mt-1 accent-current"
                  checked={picked === c.value}
                  onChange={() => setPicked(c.value)}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-heading">{t(c.label)}</span>
                  {c.hint && <span className="mt-0.5 block text-xs text-muted">{t(c.hint)}</span>}
                </span>
              </label>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => settle(false)}>
            {t(opts?.cancelLabel || "Cancel")}
          </Button>
          <Button
            variant={opts?.danger ? "danger" : "primary"}
            disabled={!!choices && !picked}
            onClick={() => settle(choices ? picked : true)}
          >
            {t(opts?.confirmLabel || "Confirm")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
