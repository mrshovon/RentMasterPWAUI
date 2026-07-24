"use client";

import { Languages } from "lucide-react";
import { cn } from "../lib/cn";
import { useLanguage } from "../lib/i18n";

// =============================================================================
// LANGUAGE TOGGLE — English ⇄ বাংলা. Deliberately mirrors ThemeToggle's two variants so it
// drops in beside it (sidebar row on desktop, icon in the mobile top bar) with no layout work.
//
// The label always names the language you'd switch TO, and is shown in that language — a user
// who can't read the current UI language can still find their way out.
// =============================================================================

export function LanguageToggle({
  className,
  variant = "sidebar",
}: {
  className?: string;
  variant?: "sidebar" | "icon";
}) {
  const { lang, setLang, t } = useLanguage();

  const isBangla = lang === "bn";
  const next = isBangla ? "en" : "bn";
  const label = isBangla ? t("Switch to English") : t("Switch to Bangla");
  // Never translated: this is the name of the target language in its own script.
  const shortName = isBangla ? "English" : "বাংলা";

  if (variant === "icon") {
    return (
      <button
        onClick={() => setLang(next)}
        aria-label={label}
        title={label}
        className={cn(
          "rounded-lg px-2 py-2 text-xs font-bold text-muted transition hover:bg-overlay/[0.06] hover:text-heading",
          className,
        )}
      >
        {shortName}
      </button>
    );
  }

  return (
    <button
      onClick={() => setLang(next)}
      aria-label={label}
      title={label}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-muted transition hover:bg-overlay/[0.06] hover:text-heading",
        className,
      )}
    >
      <Languages className="h-[18px] w-[18px]" />
      {shortName}
    </button>
  );
}
