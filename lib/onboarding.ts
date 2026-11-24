"use client";

import { useEffect, useState } from "react";

// =============================================================================
// FIRST-USE GUIDANCE — device-local only.
//
// The checklist's PROGRESS is derived from data already on screen (properties, tenants, invoices,
// pay-to details), so there is nothing to keep in sync with a server and no extra DB reads. The
// only thing worth remembering is the user's decision to hide the card. That lives in localStorage,
// exactly like the Overview collapse state — a preference of this browser, not of the account.
// =============================================================================

export type OnboardingRole = "owner" | "tenant" | "building";

const keyFor = (role: OnboardingRole) => `rentmaster-onboarding:${role}:dismissed`;

export function isOnboardingDismissed(role: OnboardingRole): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(keyFor(role)) === "1";
  } catch {
    return false;
  }
}

export function setOnboardingDismissed(role: OnboardingRole, dismissed = true): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(role), dismissed ? "1" : "0");
  } catch {
    /* private mode / storage disabled — the card simply reappears next time */
  }
}

export function useOnboardingDismiss(role: OnboardingRole) {
  const [dismissed, setDismissed] = useState(false);
  // Read in an effect, not during render: SSR HTML must match the first client paint.
  useEffect(() => { setDismissed(isOnboardingDismissed(role)); }, [role]);

  function dismiss() {
    setOnboardingDismissed(role, true);
    setDismissed(true);
  }
  function showAgain() {
    setOnboardingDismissed(role, false);
    setDismissed(false);
  }
  return { dismissed, dismiss, showAgain };
}
