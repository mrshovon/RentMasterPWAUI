"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { Badge, Button, Card } from "./ui";
import { cn } from "../lib/cn";
import { useT } from "../lib/i18n";

// =============================================================================
// A small, non-blocking "get started" card for the Home hub.
//
// Steps are computed from data the dashboard already has — nothing is manually ticked and nothing
// extra is fetched. Labels arrive already translated from the caller (t() at the call site keeps
// check-i18n honest); only this component's own chrome translates itself.
// =============================================================================

export interface OnboardingStepView {
  label: string;
  help: string;
  actionLabel: string;
  done: boolean;
  onGo: () => void;
}

export function OnboardingChecklist({
  title, subtitle, steps, onDismiss,
}: {
  title: string;
  subtitle: string;
  steps: OnboardingStepView[];
  onDismiss: () => void;
}) {
  const t = useT();
  const done = steps.filter((s) => s.done).length;
  const complete = done === steps.length;

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          {complete ? <CheckCircle2 className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-heading">{title}</h3>
            <Badge tone={complete ? "emerald" : "indigo"}>
              {done}/{steps.length}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-subtle">{subtitle}</p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
          {t("Hide")}
        </Button>
      </div>

      {!complete && (
        <>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-overlay/[0.06]">
            <div className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(done / steps.length) * 100}%` }} />
          </div>
          <div className="mt-4 space-y-2">
            {steps.map((s, i) => (
              <div key={i}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-line/[0.06] bg-overlay/[0.02] px-3 py-2.5">
                <span className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  s.done ? "bg-success/15 text-success" : "bg-overlay/[0.06] text-subtle",
                )}>
                  {s.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className={cn("text-sm font-semibold", s.done ? "text-muted line-through" : "text-heading")}>
                    {s.label}
                  </div>
                  <div className="text-xs text-subtle">{s.help}</div>
                </div>
                {!s.done && (
                  <Button size="sm" variant="secondary" onClick={s.onGo}>
                    {s.actionLabel}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
