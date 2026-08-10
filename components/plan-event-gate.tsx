"use client";

import { useState } from "react";
import { AlertTriangle, Clock, Gem } from "lucide-react";
import { Modal, Button } from "./ui";
import { rentMasterFetch } from "../lib/api-service";
import { useT } from "../lib/i18n";
import type { PendingPlanEvent } from "../types/api";

// =============================================================================
// PLAN LIFECYCLE MODAL — shown once, when a plan warns, expires, or ends.
//
// The gap it fills: before this, a subscription could warn, lapse and downgrade with the app
// never saying so. The only signal was the banner on the Plan tab, which the owner had to go
// looking for — and the moment it matters most is the one where they are least likely to look,
// because from their side nothing announced itself. They just found things quietly stopped
// working.
//
// The `downgraded` case is NOT dismissable by clicking away, and that is deliberate. Their limits
// have actually changed and some of their own properties are now view-only; discovering that by
// bumping into it is exactly the experience this replaces. The two warnings are dismissable —
// they are information, not a change of state, and an undismissable wall for "expires in 10 days"
// would be a nuisance every morning.
//
// Either way, dismissing writes `seen_at` server-side (plan_events), so it is once per event and
// not once per device. Renewing produces a new event with a new `ref`, so the next expiry says so
// again.
// =============================================================================

const ICONS = {
  expiring_soon: Clock,
  grace_started: AlertTriangle,
  downgraded: Gem,
} as const;

export function PlanEventGate({
  event,
  freeLimits,
  onDismissed,
  onChoosePlan,
}: {
  event: PendingPlanEvent | null;
  freeLimits: { maxProperties: number; maxTenants: number };
  /** Clears it locally so the modal closes without waiting for the next plan refresh. */
  onDismissed: () => void;
  /** Takes the owner to the Plan tab. */
  onChoosePlan: () => void;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);

  if (!event) return null;

  const tier = event.tierName || t("your plan");
  const Icon = ICONS[event.event] ?? Gem;
  const blocking = event.event === "downgraded";

  const copy = {
    expiring_soon: {
      title: t("Your plan expires soon"),
      body: t("Renew now to keep everything exactly as it is — your properties, tenants and any paid modules stay untouched."),
    },
    grace_started: {
      title: t("Your plan has expired"),
      body: t("You can still manage everything for a few more days. After that your account moves to the free plan."),
    },
    downgraded: {
      title: t("Your plan has ended"),
      body: t("Nothing has been deleted. Anything beyond the free limits is still here — it is just view-only until you choose a plan again."),
    },
  }[event.event];

  async function acknowledge(then?: () => void) {
    setBusy(true);
    try {
      await rentMasterFetch("/api/admin/subscription/ack", {
        method: "POST",
        role: "owner",
        body: JSON.stringify({ eventId: event!.id }),
      });
    } catch {
      // Dismiss anyway. Trapping someone behind a modal because a bookkeeping write failed is a
      // far worse outcome than showing it once more on their next visit.
    } finally {
      setBusy(false);
      onDismissed();
      then?.();
    }
  }

  return (
    <Modal
      open
      onClose={blocking ? () => {} : () => void acknowledge()}
      title={copy.title}
      subtitle={tier}
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm leading-relaxed text-fg">{copy.body}</p>
        </div>

        {blocking && (
          <div className="rounded-xl border border-line/[0.12] bg-overlay/[0.03] p-4 text-sm text-subtle">
            <p className="font-semibold text-heading">{t("You are now on the free plan")}</p>
            <p className="mt-1">
              {freeLimits.maxProperties} {t("properties")} · {freeLimits.maxTenants} {t("tenants")}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            loading={busy}
            onClick={() => void acknowledge(onChoosePlan)}
            className="sm:flex-1"
          >
            {blocking ? t("Choose a plan") : t("Renew my plan")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => void acknowledge()}
            disabled={busy}
            className="sm:flex-1"
          >
            {blocking ? t("Continue on free") : t("Not now")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
