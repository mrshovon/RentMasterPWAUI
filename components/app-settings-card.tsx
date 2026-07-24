"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, CheckCircle2, Smartphone } from "lucide-react";
import { Card, Button } from "./ui";
import { PushTestButton } from "./push-toggle";
import { UpdateCheckButton } from "./update-gate";
import { ensurePushSubscription, getPushPermission, type PushPermission } from "../lib/push";
import { getSessionToken } from "../lib/api-service";
import { isNativeApp } from "../lib/platform";
import { APP_VERSION } from "../lib/app-config";

// =============================================================================
// "App & notifications" — the home for the per-device actions that used to float
// above every dashboard page (update check + push self-test). Rendered from the
// Settings tab of all three dashboards (owner, tenant, admin).
// =============================================================================

export function AppSettingsCard() {
  const [permission, setPermission] = useState<PushPermission>("unsupported");
  const [native, setNative] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Inside the native app notifications go through FCM, not Web Push — the OS owns the
    // permission and lib/native-push.ts owns the registration, so there is nothing to grant here.
    if (isNativeApp()) {
      setNative(true);
      setPermission("granted");
      return;
    }
    setPermission(getPushPermission());
  }, []);

  async function enable() {
    setBusy(true);
    // The permission prompt must happen inside this click gesture.
    await ensurePushSubscription(getSessionToken() ?? undefined);
    setPermission(getPushPermission());
    setBusy(false);
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2 text-primary"><Smartphone className="h-4 w-4" /></div>
        <div>
          <h3 className="text-sm font-bold text-heading">App &amp; notifications</h3>
          <p className="text-xs text-subtle">
            Settings for this device only — they don&apos;t affect your other phones or browsers.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* --- Notification status --- */}
        {permission === "unsupported" ? (
          <p className="text-sm text-muted">
            This browser can&apos;t receive push notifications. Install the Android app or use Chrome
            to get rent, invoice and maintenance alerts.
          </p>
        ) : permission === "denied" ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-line/[0.06] bg-overlay/[0.02] px-4 py-3 text-xs text-muted">
            <BellOff className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
            <span>
              Notifications are blocked for this app. Re-enable them in your browser or system
              settings, then reload this page.
            </span>
          </div>
        ) : permission === "granted" ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" />
            Notifications are on for this device.
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3">
            <p className="text-xs text-fg">
              Turn on notifications for invoices, payments and maintenance updates.
            </p>
            <Button size="sm" variant="secondary" icon={Bell} loading={busy} onClick={enable}>
              Enable notifications
            </Button>
          </div>
        )}

        {/* --- Per-device actions. UpdateCheckButton renders nothing outside the native app. --- */}
        <div className="flex flex-wrap items-center gap-2 border-t border-line/[0.06] pt-4">
          <PushTestButton />
          <UpdateCheckButton />
        </div>

        <p className="text-[11px] text-subtle">
          {native
            ? "Android app — updates install from the in-app prompt."
            : `Web app v${APP_VERSION} — it updates automatically when you reload.`}
        </p>
      </div>
    </Card>
  );
}
