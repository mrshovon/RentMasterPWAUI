"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Info, Sparkles } from "lucide-react";
import { apiPublicPlans } from "../../lib/api-service";
import { isContactTier, discountedPrice, tenureLabel } from "../../lib/plan-format";
import { PLAN_ADDONS, addonsOnTier } from "../../lib/addons";
import { formatCurrency } from "../../lib/format";
import { useT } from "../../lib/i18n";
import { ThemeToggle } from "../../components/theme-toggle";
import { LanguageToggle } from "../../components/language-toggle";
import { PlanContactModal } from "../../components/plan-contact-modal";
import { Card, Badge, Button } from "../../components/ui";
import type { PublicPlan } from "../../types/api";

// =====================================================================================
// 💳 PLANS & PRICING — the public page.
//
// Until this existed there was nowhere to see what the product costs: app/page.tsx is a login
// gateway, and both tier reads were gated behind an account. A prospect could not learn a single
// price without signing up first.
//
// Deliberately does NOT call useSessionGuard, and deliberately does not redirect a signed-in
// visitor the way app/page.tsx does — this is a page someone lands on from an ad or a shared
// link. Same shape as /privacy, /terms and /reset-password.
//
// PRICES COME FROM THE LIVE TIERS, not from hand-written marketing copy, and the price helpers
// are the SAME ones the owner Plan tab uses (lib/plan-format.ts). A public page quoting a figure
// an owner is not actually charged is the one thing a pricing page must never do.
//
// The card layout mirrors app/owner/page.tsx's "Available plans" grid on purpose: someone who
// signs up should recognise the plan they were shown. What differs is the call to action — there
// is no account to switch, so every button leads to signup or to a conversation.
// =====================================================================================

export default function PlansPage() {
  const t = useT();
  const [plans, setPlans] = useState<PublicPlan[] | null>(null);
  const [contactTier, setContactTier] = useState<PublicPlan | null>(null);

  useEffect(() => {
    // Never rejects — the helper returns [] on any failure, and the empty state below is a
    // better public face than an error boundary.
    apiPublicPlans().then(setPlans);
  }, []);

  // Contact tiers last, then cheapest first — identical to the owner grid's ordering.
  const sorted = useMemo(
    () =>
      [...(plans || [])].sort(
        (a, b) => (isContactTier(a) ? 1 : 0) - (isContactTier(b) ? 1 : 0) || Number(a.price) - Number(b.price)
      ),
    [plans]
  );

  return (
    <main className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 border-b border-line/[0.06] bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("Back")}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle variant="icon" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <span className="inline-block rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
            {t("Plans & pricing")}
          </span>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-heading sm:text-4xl">
            {t("Start free. Pay only when your portfolio grows.")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {t("Every plan includes the full dashboard — properties, tenants, rent invoices, receipts, maintenance and notices. Plans differ in how many properties and tenants you can manage, and which extra modules are bundled.")}
          </p>
        </div>

        {plans === null ? (
          <Card className="p-8 text-center text-sm text-muted">{t("Loading…")}</Card>
        ) : sorted.length === 0 ? (
          // The route fails empty rather than 500, so this covers both "nothing published yet"
          // and "we could not reach the server" — and in either case the reader can still talk
          // to us, which is the only thing that matters on a pricing page.
          <Card className="p-8 text-center">
            <p className="text-sm text-muted">
              {t("Pricing is not available right now. Please get in touch and we will send it to you.")}
            </p>
            <Button className="mt-4" onClick={() => setContactTier({} as PublicPlan)}>
              Contact us
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sorted.map((tier) => {
              const contact = isContactTier(tier);
              const unlimitedP = tier.max_properties_allowed === -1;
              const unlimitedT = tier.max_tenants_allowed === -1;
              const price = Number(tier.price || 0);

              return (
                <Card key={tier.id} className={`p-6 ${contact ? "border-accent/30" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-base font-black text-heading">{tier.name}</div>
                    {contact ? <Badge tone="cyan">Custom</Badge> : price === 0 ? <Badge tone="emerald">Free</Badge> : null}
                  </div>

                  <div className="mt-1 text-2xl font-black text-heading">
                    {contact ? t("Contact us") : price > 0 ? formatCurrency(discountedPrice(tier)) : t("Free")}
                    {!contact && price > 0 && (
                      <span className="text-sm font-medium text-muted"> / {t(tenureLabel(tier))}</span>
                    )}
                  </div>

                  {!contact && price > 0 && Number(tier.discount_percent || 0) > 0 && (
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="text-subtle line-through">{formatCurrency(price)}</span>
                      <Badge tone="emerald">Save {Number(tier.discount_percent)}%</Badge>
                    </div>
                  )}

                  {tier.description && <p className="mt-2 text-xs text-muted">{tier.description}</p>}

                  <ul className="mt-4 space-y-1.5 text-sm text-fg">
                    {contact ? (
                      <>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />{t("Custom build for your entire building")}</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />{t("Unlimited properties & tenants")}</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />{t("1 year free maintenance included")}</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />{t("Monthly or yearly contract from year 2")}</li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />
                          {unlimitedP ? t("Unlimited properties") : `${t("Up to")} ${tier.max_properties_allowed} ${t("properties")}`}</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />
                          {unlimitedT ? t("Unlimited tenants") : `${t("Up to")} ${tier.max_tenants_allowed} ${t("tenants")}`}</li>
                        {PLAN_ADDONS.filter((a) => addonsOnTier(tier).includes(a.key)).map((a) => (
                          <li key={a.key} className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success" />{t(a.label)} {t("included")}
                          </li>
                        ))}
                        {tier.is_recurring === false && (
                          <li className="flex items-center gap-2 text-muted">
                            <Info className="h-4 w-4 text-subtle" />{t("One-time plan — can't be renewed")}
                          </li>
                        )}
                      </>
                    )}
                  </ul>

                  <div className="mt-5">
                    {contact ? (
                      <Button className="w-full" variant="secondary" onClick={() => setContactTier(tier)}>
                        Contact us
                      </Button>
                    ) : (
                      // Straight into the signup modal on the entry page — ?signup=1 opens it.
                      <Link href="/?signup=1" className="block">
                        <Button className="w-full" icon={Sparkles}>
                          {price > 0 ? "Sign up" : "Start free"}
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <p className="mt-6 text-xs leading-relaxed text-subtle">
          {t("Paid plans are activated after we confirm your payment. The free plan never expires. Prices are in Bangladeshi Taka and include any discount currently offered.")}
        </p>

        <nav className="mt-14 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line/[0.06] pt-6 text-xs text-subtle">
          <Link href="/privacy" className="transition hover:text-primary">{t("Privacy Policy")}</Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms" className="transition hover:text-primary">{t("Terms & Conditions")}</Link>
          <span aria-hidden="true">·</span>
          <Link href="/" className="transition hover:text-primary">{t("Sign in")}</Link>
        </nav>
      </div>

      <PlanContactModal
        open={!!contactTier}
        tierId={contactTier?.id}
        tierName={contactTier?.name}
        onClose={() => setContactTier(null)}
      />
    </main>
  );
}
