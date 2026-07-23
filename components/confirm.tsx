"use client";

import { useEffect, useState } from "react";
import { Modal, Button } from "./ui";

// =============================================================================
// Promise-based confirm dialog — a styled replacement for window.confirm().
// Call `await confirmDialog({ title, message, danger })` anywhere; it resolves
// true/false. Render <ConfirmHost /> once at the app root (see app/layout.tsx).
// =============================================================================

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type Resolver = (v: boolean) => void;
let request: ((opts: ConfirmOptions, resolve: Resolver) => void) | null = null;

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    // The host mounts at the app root, but if a call somehow lands before it's
    // registered, retry briefly rather than ever falling back to a browser dialog.
    const open = (attempt = 0) => {
      if (request) { request(opts, resolve); return; }
      if (attempt > 50) { resolve(false); return; } // ~5s safety net
      setTimeout(() => open(attempt + 1), 100);
    };
    open();
  });
}

export function ConfirmHost() {
  const [state, setState] = useState<{ opts: ConfirmOptions; resolve: Resolver } | null>(null);

  useEffect(() => {
    request = (opts, resolve) => setState({ opts, resolve });
    return () => { request = null; };
  }, []);

  const settle = (value: boolean) => {
    state?.resolve(value);
    setState(null);
  };

  const opts = state?.opts;

  return (
    <Modal open={!!state} onClose={() => settle(false)} title={opts?.title || ""} size="md">
      <div className="space-y-6">
        {opts?.message && <p className="text-sm leading-relaxed text-fg">{opts.message}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => settle(false)}>
            {opts?.cancelLabel || "Cancel"}
          </Button>
          <Button variant={opts?.danger ? "danger" : "primary"} onClick={() => settle(true)}>
            {opts?.confirmLabel || "Confirm"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
