"use client";

import { BookOpen, ExternalLink, X } from "lucide-react";
import { Button, Card } from "./ui";
import { useT } from "../lib/i18n";
import { useHelpCardDismiss, type OnboardingRole } from "../lib/onboarding";

// =============================================================================
// A tiny, dismissible pointer to the bilingual /help guide, shown on each role's
// Home screen. It opens in a new tab so the dashboard the user was in stays put.
// The hide choice is per device, exactly like the onboarding checklist.
// =============================================================================

export function HelpCard({ role, description }: { role: OnboardingRole; description: string }) {
  const t = useT();
  const { dismissed, dismiss } = useHelpCardDismiss(role);
  if (dismissed) return null;

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-heading">{t("Need a hand?")}</h3>
          <p className="mt-0.5 text-xs text-subtle">{description}</p>
        </div>
        <button type="button" onClick={dismiss} aria-label={t("Hide")}
          className="rounded-lg p-1 text-subtle transition hover:bg-overlay/[0.05] hover:text-fg">
          <X className="h-4 w-4" />
        </button>
      </div>
      <Button size="sm" variant="secondary" icon={ExternalLink} className="mt-3"
        onClick={() => window.open(`/help#${role}`, "_blank", "noopener,noreferrer")}>
        {t("Open help guides")}
      </Button>
    </Card>
  );
}
