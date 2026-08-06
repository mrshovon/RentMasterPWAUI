import { SubscriptionTier } from "../types/api";

// =============================================================================
// PAID ADD-ON MODULES — the single list the UI reads.
//
// Mirrors FEATURE_KEYS / FEATURE_LABELS / TIER_COLUMN in the backend's
// lib/features.ts. Adding a third module means adding it in both places and
// nothing else: the plan form, the plan cards and the owner's plan list are all
// driven off this array.
//
// Deliberately no icons here — those live in the components, so this file stays
// free of presentation imports and can be used from anywhere.
// =============================================================================

export type AddonKey = "staff" | "accounts";

export interface AddonDef {
  key: AddonKey;
  label: string;
  /** The subscription_tiers column that bundles it into a plan. */
  tierField: "staff_included" | "accounts_included";
}

export const PLAN_ADDONS: AddonDef[] = [
  { key: "staff", label: "Staff management", tierField: "staff_included" },
  { key: "accounts", label: "Accounts & bookkeeping", tierField: "accounts_included" },
];

// The Free baseline can never bundle a paid module: its id is also the fallback the backend
// uses for an owner with no plan at all, so anything bundled here would reach every one of
// them. See lib/features.ts (tierIncludes) — the API rejects it too; this is just so the form
// can explain itself instead of letting the admin save something that silently does nothing.
export const FREE_TIER_ID = "free_tier";

/** Which modules a tier currently bundles. */
export function addonsOnTier(tier: Partial<SubscriptionTier> | null | undefined): AddonKey[] {
  if (!tier) return [];
  return PLAN_ADDONS.filter((a) => !!(tier as any)[a.tierField]).map((a) => a.key);
}

/** "Staff management and Accounts & bookkeeping" */
export function addonLabels(keys: AddonKey[]): string {
  const names = PLAN_ADDONS.filter((a) => keys.includes(a.key)).map((a) => a.label);
  if (names.length <= 1) return names[0] || "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
