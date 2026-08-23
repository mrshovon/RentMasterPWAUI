"use client";

import Link from "next/link";
import { useT } from "../lib/i18n";

// =====================================================================================
// ⚖️ PRIVACY / TERMS LINKS — one component for every slot that shows them.
//
// Used in four places, because no single one of them covers everybody:
//   • the login page brand panel  — desktop only (the panel is `hidden … lg:flex`)
//   • the login page mobile row   — phones, where the brand panel does not render at all
//   • the Settings version footer — signed-in owners, tenants and admins
//   • the sidebar band            — desktop, next to Sign out
//
// One component so the wording, order and styling cannot drift between them.
// =====================================================================================

export function LegalLinks({ className = "" }: { className?: string }) {
  const t = useT();

  return (
    <span className={`inline-flex items-center gap-2 text-[11px] text-faint ${className}`}>
      <Link href="/privacy" className="transition hover:text-primary">
        {t("Privacy")}
      </Link>
      <span aria-hidden="true">·</span>
      <Link href="/terms" className="transition hover:text-primary">
        {t("Terms")}
      </Link>
    </span>
  );
}
