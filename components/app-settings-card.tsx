"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, CheckCircle2, Play, Smartphone } from "lucide-react";
import { Card, Button } from "./ui";
import { PushTestButton } from "./push-toggle";
import { UpdateCheckButton } from "./update-gate";
import { toast } from "./toast";
import { ensurePushSubscription, getPushPermission, type PushPermission } from "../lib/push";
import { getSessionToken, rentMasterFetch } from "../lib/api-service";
import { isNativeApp } from "../lib/platform";
import { APP_VERSION } from "../lib/app-config";
import { useT } from "../lib/i18n";
import {
  DEFAULT_NOTIFICATION_SOUND,
  getStoredSound,
  playTone,
  storeSound,
  type NotificationSound,
} from "../lib/notification-sound";

// =============================================================================
// "App & notifications" — the home for the per-device actions that used to float
// above every dashboard page (update check + push self-test). Rendered from the
// Settings tab of all three dashboards (owner, tenant, admin).
// =============================================================================

const SOUND_OPTIONS: { value: NotificationSound; label: string }[] = [
  { value: "custom", label: "Bari360 tone" },
  { value: "default", label: "Device tone" },
  { value: "off", label: "Silent" },
];

export function AppSettingsCard() {
  const [permission, setPermission] = useState<PushPermission>("unsupported");
  const [native, setNative] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sound, setSound] = useState<NotificationSound>(DEFAULT_NOTIFICATION_SOUND);
  const t = useT();

  useEffect(() => {
    // Inside the native app notifications go through FCM, not Web Push — the OS owns the
    // permission and lib/native-push.ts owns the registration, so there is nothing to grant here.
    if (isNativeApp()) {
      setNative(true);
      setPermission("granted");
    } else {
      setPermission(getPushPermission());
    }

    // Show the last known choice immediately, then correct it from the server. The stored copy is
    // what the tone player reads, so it has to exist on this device regardless.
    setSound(getStoredSound());
    (async () => {
      try {
        const res = await rentMasterFetch<{ data: { sound: NotificationSound } }>("/api/notifications/preferences");
        if (res?.data?.sound) { setSound(res.data.sound); storeSound(res.data.sound); }
      } catch { /* keep the stored value — a failed read must not reset anyone's choice */ }
    })();
  }, []);

  async function pickSound(next: NotificationSound) {
    const previous = sound;
    setSound(next);          // optimistic: the control must not lag behind the tap
    storeSound(next);
    if (next === "custom") playTone();   // also doubles as the autoplay unlock gesture
    try {
      await rentMasterFetch("/api/notifications/preferences", {
        method: "PUT",
        body: JSON.stringify({ sound: next }),
      });
    } catch (e: any) {
      setSound(previous);
      storeSound(previous);
      toast.error(e?.message || "Could not save your notification sound.");
    }
  }

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
          <h3 className="text-sm font-bold text-heading">{t("App & notifications")}</h3>
          <p className="text-xs text-subtle">
            {t("Settings for this device only — they do not affect your other phones or browsers.")}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* --- Notification status --- */}
        {permission === "unsupported" ? (
          <p className="text-sm text-muted">
            {t("This browser cannot receive push notifications. Install the Android app or use Chrome to get rent, invoice and maintenance alerts.")}
          </p>
        ) : permission === "denied" ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-line/[0.06] bg-overlay/[0.02] px-4 py-3 text-xs text-muted">
            <BellOff className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
            <span>
              {t("Notifications are blocked for this app. Re-enable them in your browser or system settings, then reload this page.")}
            </span>
          </div>
        ) : permission === "granted" ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" />
            {t("Notifications are on for this device.")}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3">
            <p className="text-xs text-fg">
              {t("Turn on notifications for invoices, payments and maintenance updates.")}
            </p>
            <Button size="sm" variant="secondary" icon={Bell} loading={busy} onClick={enable}>
              {t("Enable notifications")}
            </Button>
          </div>
        )}

        {/* --- Notification sound. Hidden when there are no notifications to sound. --- */}
        {permission === "granted" && (
          <div className="border-t border-line/[0.06] pt-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-heading">{t("Notification sound")}</div>
                <p className="text-[11px] text-subtle">{t("Applies to all your devices, not just this one.")}</p>
              </div>
              <button
                type="button"
                onClick={playTone}
                aria-label={t("Play the Bari360 tone")}
                className="rounded-lg p-1.5 text-muted transition hover:bg-overlay/[0.06] hover:text-heading"
              >
                <Play className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-1 rounded-xl border border-line/[0.08] bg-overlay/[0.02] p-1">
              {SOUND_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => void pickSound(option.value)}
                  className={
                    "flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition " +
                    (sound === option.value
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted hover:bg-overlay/[0.06] hover:text-heading")
                  }
                >
                  {t(option.label)}
                </button>
              ))}
            </div>
            {!native && sound === "custom" && (
              // Said out loud because it cannot be fixed: the Web Push API has no way to attach a
              // sound to a notification the browser draws. Better an honest sentence than a
              // setting people think is broken.
              <p className="mt-2 text-[11px] text-subtle">
                {t("On the web the Bari360 tone plays while the app is open. When it is closed your browser uses its own sound. Install the Android app for the tone every time.")}
              </p>
            )}
          </div>
        )}

        {/* --- Per-device actions. UpdateCheckButton renders nothing outside the native app. --- */}
        <div className="flex flex-wrap items-center gap-2 border-t border-line/[0.06] pt-4">
          <PushTestButton />
          <UpdateCheckButton />
        </div>

        <p className="text-[11px] text-subtle">
          {native
            ? t("Android app — updates install from the in-app prompt.")
            : `${t("Web app")} v${APP_VERSION} — ${t("it updates automatically when you reload.")}`}
        </p>
      </div>
    </Card>
  );
}
