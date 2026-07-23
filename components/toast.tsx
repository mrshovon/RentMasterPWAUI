"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, TriangleAlert, X } from "lucide-react";

// =============================================================================
// Lightweight toast system. A module-level pub/sub lets ANY file (component or
// plain function) fire a toast via `import { toast }` — no context threading.
// Render <Toaster /> once at the app root (see app/layout.tsx).
// =============================================================================

export type ToastType = "success" | "error" | "info" | "warning";
export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

type Listener = (t: ToastItem) => void;
let listeners: Listener[] = [];
let counter = 0;

function emit(type: ToastType, message: string) {
  const item: ToastItem = { id: ++counter, type, message: String(message ?? "") };
  listeners.forEach((l) => l(item));
}

export const toast = {
  success: (m: string) => emit("success", m),
  error: (m: string) => emit("error", m),
  info: (m: string) => emit("info", m),
  warning: (m: string) => emit("warning", m),
};

const TONE: Record<ToastType, { icon: typeof CheckCircle2; ring: string; text: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: "border-success/30", text: "text-success", iconColor: "text-success" },
  error: { icon: XCircle, ring: "border-danger/30", text: "text-danger", iconColor: "text-danger" },
  warning: { icon: TriangleAlert, ring: "border-warning/30", text: "text-warning", iconColor: "text-warning" },
  info: { icon: Info, ring: "border-primary/30", text: "text-primary", iconColor: "text-primary" },
};

const AUTO_DISMISS_MS = 4500;

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener: Listener = (t) => {
      setItems((prev) => [...prev, t]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id));
      }, AUTO_DISMISS_MS);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const dismiss = (id: number) => setItems((prev) => prev.filter((x) => x.id !== id));

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end">
      {items.map((t) => {
        const tone = TONE[t.type];
        const Icon = tone.icon;
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-xl border ${tone.ring} bg-surface/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone.iconColor}`} />
            <p className={`flex-1 text-sm leading-snug ${tone.text}`}>{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-md p-0.5 text-subtle transition hover:text-fg"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
