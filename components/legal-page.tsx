"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LegalDocument } from "./legal-document";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { useLang, useT } from "../lib/i18n";
import type { LegalDoc } from "../content/legal/generated";

// =====================================================================================
// 📄 PUBLIC LEGAL PAGE SHELL — shared by /privacy and /terms.
//
// Deliberately does NOT call useSessionGuard: these pages must be readable signed out. Google
// Play requires a publicly reachable privacy policy URL, and someone deciding whether to sign up
// has to be able to read the terms first. app/reset-password is the same shape.
//
// Language follows the app-wide rentmaster-lang toggle, so a Bangla user gets the Bangla edition
// of the document rather than a translated English one.
// =====================================================================================

export function LegalPage({ en, bn }: { en: LegalDoc; bn: LegalDoc }) {
  const lang = useLang();
  const t = useT();
  const doc = lang === "bn" ? bn : en;

  return (
    <main className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 border-b border-line/[0.06] bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
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

      <div className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6">
        <LegalDocument doc={doc} />

        <nav className="mt-14 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line/[0.06] pt-6 text-xs text-subtle">
          <Link href="/privacy" className="transition hover:text-primary">
            {t("Privacy Policy")}
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms" className="transition hover:text-primary">
            {t("Terms & Conditions")}
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/" className="transition hover:text-primary">
            {t("Sign in")}
          </Link>
        </nav>
      </div>
    </main>
  );
}
