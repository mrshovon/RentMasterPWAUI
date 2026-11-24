"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LegalDocument } from "../../components/legal-document";
import { LanguageToggle } from "../../components/language-toggle";
import { ThemeToggle } from "../../components/theme-toggle";
import { LEGAL_DOCS, type LegalDoc } from "../../content/legal/generated";
import { cn } from "../../lib/cn";
import { getStoredSession } from "../../lib/api-service";
import { useLang, useT } from "../../lib/i18n";
import { useTabState } from "../../lib/use-tab";

// Public, bilingual, and deliberately built on the SAME generated pipeline as the legal pages:
// the guides are authored as markdown in legal/ and parsed by lib/legal-markdown.mjs at build time.
// No session guard and no override fetch — these are short guides, not documents anyone edits from
// the console, so the compiled copy is the only source and it is always available.
const ROLES = [
  { key: "owner", label: "Owner", en: LEGAL_DOCS.helpOwnerEn, bn: LEGAL_DOCS.helpOwnerBn },
  { key: "tenant", label: "Tenant", en: LEGAL_DOCS.helpTenantEn, bn: LEGAL_DOCS.helpTenantBn },
  { key: "building", label: "Building admin", en: LEGAL_DOCS.helpBuildingEn, bn: LEGAL_DOCS.helpBuildingBn },
] as const;

type RoleKey = typeof ROLES[number]["key"];

export default function HelpPage() {
  const t = useT();
  const lang = useLang();
  const [role, setRole] = useTabState("owner");

  // Preselect the reader's role from a stored session, but NEVER override an explicit #hash —
  // someone sharing a link to the tenant guide must land on the tenant guide.
  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash) return;
    let storedRole: string | undefined;
    try { storedRole = getStoredSession()?.role; } catch { /* signed out */ }
    if (storedRole === "owner" || storedRole === "tenant" || storedRole === "building") {
      setRole(storedRole as RoleKey);
    }
  }, [setRole]);

  const current = ROLES.find((r) => r.key === role) || ROLES[0];
  const doc: LegalDoc = lang === "bn" ? current.bn : current.en;

  return (
    <main className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 border-b border-line/[0.06] bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            {t("Back")}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle variant="icon" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6">
        <h1 className="text-2xl font-bold text-heading">{t("Help")}</h1>
        <p className="mt-1 text-sm text-muted">{t("Short guides for each role. Choose yours below.")}</p>

        <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label={t("Choose your role")}>
          {ROLES.map((r) => (
            <button key={r.key} type="button" role="tab" aria-selected={role === r.key}
              onClick={() => setRole(r.key)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                role === r.key
                  ? "bg-primary text-bg"
                  : "border border-line/[0.08] bg-overlay/[0.03] text-fg hover:border-primary/40",
              )}>
              {t(r.label)}
            </button>
          ))}
        </div>

        <div className="mt-8">
          <LegalDocument doc={doc} />
        </div>

        <nav className="mt-14 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line/[0.06] pt-6 text-xs text-subtle">
          <Link href="/privacy" className="transition hover:text-primary">{t("Privacy Policy")}</Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms" className="transition hover:text-primary">{t("Terms & Conditions")}</Link>
          <span aria-hidden="true">·</span>
          <Link href="/about" className="transition hover:text-primary">{t("About us")}</Link>
          <span aria-hidden="true">·</span>
          <Link href="/help" className="font-semibold text-primary">{t("Help")}</Link>
          <span aria-hidden="true">·</span>
          <Link href="/" className="transition hover:text-primary">{t("Sign in")}</Link>
        </nav>
      </div>
    </main>
  );
}
