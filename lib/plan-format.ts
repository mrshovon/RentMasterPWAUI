// =====================================================================================
// 💳 PLAN PRESENTATION — how a tier's price reads, in one place.
//
// These three lived inside app/owner/page.tsx, which is the only screen that had ever shown a
// price. The public /plans page shows the SAME tiers to someone who has not signed up, and the
// two must not be able to disagree about what a plan costs — a public page quoting a different
// figure from the one an owner is charged is the worst kind of drift.
//
// discountedPrice() in particular is a FIX, not a formatter: owners were once shown the
// undiscounted price on a discounted plan because only the admin console applied the percentage.
// A second hand-written copy on the marketing page would reintroduce exactly that bug.
//
// Typed against the fields rather than against SubscriptionTier, because the public route
// deliberately returns a narrower shape (PublicPlan) than the owner route does. Both satisfy this.
// =====================================================================================

/** The subset of a tier these helpers actually read. Satisfied by SubscriptionTier and PublicPlan. */
export interface PricedTier {
  price: number | string;
  billing_interval: string;
  duration_days?: number | null;
  discount_percent?: number | null;
}

/**
 * A tier with a "custom" billing interval is a contact-us / enterprise plan — no self-service
 * price, set up by the admin after the customer gets in touch. The Whole Building plan is one.
 *
 * Keyed on the interval rather than on the `whole_building` slug on purpose: a second bespoke
 * plan should behave the same way without a code change.
 */
export const isContactTier = (t: PricedTier): boolean => t.billing_interval === "custom";

/** Price after the admin-set discount. */
export const discountedPrice = (t: PricedTier): number => {
  const d = Number(t.discount_percent || 0);
  return d > 0 ? Number(t.price) * (1 - d / 100) : Number(t.price);
};

/** How long the plan runs, for the "৳500 / month" suffix. A 'days' plan states its own length. */
export const tenureLabel = (t: PricedTier): string => {
  if (t.billing_interval === "days") {
    const n = Number(t.duration_days || 0);
    return n === 1 ? "day" : `${n} days`;
  }
  return t.billing_interval;
};
