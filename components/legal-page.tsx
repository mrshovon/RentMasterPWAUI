"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LegalDocument } from "./legal-document";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { useLang, useT } from "../lib/i18n";
import { apiLegalDoc } from "../lib/api-service";
import { extract } from "../lib/legal-markdown.mjs";
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
//
// ✍️ THE COMPILED DOCUMENT IS THE FALLBACK, NOT THE ONLY SOURCE. An admin can now edit both
// documents from the console; the saved markdown is fetched here and parsed by the SAME functions
// that produced the compiled version (lib/legal-markdown.mjs), so an edited document renders
// identically to a built one.
//
// The compiled text renders FIRST and is replaced only once an override actually arrives. That
// ordering is the safety property: there is no loading state, no flash of an empty page, and a
// backend that is down or a settings row that never existed both leave the published policy fully
// readable — which is what Google Play requires of the privacy URL and what anyone deciding
// whether to sign up needs.
// =====================================================================================

export function LegalPage({
  en, bn, doc: docName,
}: {
  en: LegalDoc;
  bn: LegalDoc;
  /** Which document this page is, so the override can be looked up. */
  doc: "privacy" | "terms";
}) {
  const lang = useLang();
  const t = useT();
  const compiled = lang === "bn" ? bn : en;

  // Keyed by language: switching the toggle must not show the Bangla page with English overrides
  // still on screen. Null means "nothing saved" — render the compiled edition.
  const [override, setOverride] = useState<Record<string, LegalDoc | null>>({});

  useEffect(() => {
    let cancelled = false;
    // Re-fetched per language rather than cached across both, because only one is ever on screen
    // and these documents run to tens of kilobytes.
    apiLegalDoc(docName, lang === "bn" ? "bn" : "en").then((markdown) => {
      if (cancelled) return;
      // extract() drops the H1 into `title`, exactly as the build script does, so a saved
      // document keeps the same heading structure as a compiled one.
      setOverride((prev) => ({ ...prev, [lang]: markdown ? (extract(markdown) as LegalDoc) : null }));
    });
    return () => { cancelled = true; };
  }, [docName, lang]);

  const doc = override[lang] ?? compiled;

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
