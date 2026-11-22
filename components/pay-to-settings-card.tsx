"use client";

import { useEffect, useState } from "react";
import { QrCode, Wallet } from "lucide-react";
import { Card, Button, Field, TextArea, Select } from "./ui";
import { toast } from "./toast";
import { useT } from "../lib/i18n";
import { rentMasterFetch, uploadFile } from "../lib/api-service";
import type { Building, ClaimMethod, PayToConfig } from "../types/api";
import { CLAIM_METHODS, METHOD_LABELS } from "./pay-bill-modal";

// =====================================================================================
// PAY-TO SETUP — one card, two owners of the data.
//
//   kind='owner'    -> auth user_metadata.rent_pay_to, via /api/admin/owner/settings
//   kind='building' -> buildings.service_charge_* columns, via PATCH /api/admin/building
//
// `defaultMethod` is what a payer sees preselected. It is a convenience, never a restriction:
// the payer's modal always lets them choose a different method.
// =====================================================================================

const EMPTY: PayToConfig = {
  account: "", qrUrl: "", instructions: "", methods: [...CLAIM_METHODS], defaultMethod: "p2p_qr",
};

export function PayToSettingsCard({
  kind, building, onSaved,
}: {
  kind: "owner" | "building";
  building?: Building | null;
  onSaved?: () => void | Promise<void>;
}) {
  const t = useT();
  const [form, setForm] = useState<PayToConfig>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (kind === "owner") {
      (async () => {
        try {
          const res = await rentMasterFetch<{ rentPayTo?: PayToConfig }>("/api/admin/owner/settings");
          setForm({ ...EMPTY, ...(res.rentPayTo || {}) });
        } catch { /* keep defaults */ }
      })();
    } else if (building?.serviceChargePayTo) {
      setForm({ ...EMPTY, ...building.serviceChargePayTo });
    }
  }, [kind, building]);

  async function pickQr(file: File | undefined) {
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadFile(file, { folder: "pay-to" });
      setForm((f) => ({ ...f, qrUrl: url }));
      toast.success(t("QR uploaded — remember to Save."));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }

  function toggleMethod(m: ClaimMethod) {
    setForm((f) => {
      const has = f.methods.includes(m);
      const methods = has ? f.methods.filter((x) => x !== m) : [...f.methods, m];
      return {
        ...f,
        methods,
        defaultMethod: methods.includes(f.defaultMethod) ? f.defaultMethod : (methods[0] || "p2p_qr"),
      };
    });
  }

  async function save() {
    try {
      setSaving(true);
      const payload = {
        ...form,
        account: form.account?.trim() || null,
        instructions: form.instructions?.trim() || null,
        qrUrl: form.qrUrl?.trim() || null,
      };
      if (kind === "owner") {
        await rentMasterFetch("/api/admin/owner/settings", {
          method: "POST", body: JSON.stringify({ rentPayTo: payload }),
        });
      } else {
        await rentMasterFetch("/api/admin/building", {
          method: "PATCH", body: JSON.stringify({ serviceChargePayTo: payload }),
        });
      }
      toast.success(t("Payment details saved."));
      await onSaved?.();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const title = kind === "owner" ? t("Payment details for tenants") : t("Payment details for flat owners");
  const subtitle = kind === "owner"
    ? t("Where your tenants should send rent. They choose how they paid when they mark it sent.")
    : t("Where flat owners should send service charge. They choose how they paid when they mark it sent.");

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2 text-primary"><Wallet className="h-4 w-4" /></div>
        <div>
          <h3 className="text-sm font-bold text-heading">{title}</h3>
          <p className="text-xs text-subtle">{subtitle}</p>
        </div>
      </div>

      <div className="space-y-4">
        <Field label="Account details" hint="Account name, number, branch — anything the payer needs. Shown as-is.">
          <TextArea rows={3} value={form.account || ""} onChange={(e) => setForm({ ...form, account: e.target.value })} />
        </Field>

        <div className="space-y-2">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-muted">
            {t("QR code")}
          </span>
          <div className="flex flex-wrap items-start gap-4">
            {form.qrUrl ? (
              <img src={form.qrUrl} alt={t("Payment QR code")}
                className="h-32 w-32 rounded-xl bg-white object-contain p-2" />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-dashed border-line/20 text-subtle">
                <QrCode className="h-7 w-7" />
              </div>
            )}
            <div className="space-y-2">
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-line/[0.08] bg-overlay/[0.03] px-3 py-2 text-xs font-semibold text-fg hover:border-primary/40">
                {t("Upload QR image")}
                <input type="file" accept="image/*" className="hidden" disabled={uploading}
                  onChange={(e) => pickQr(e.target.files?.[0])} />
              </label>
              {form.qrUrl && (
                <Button type="button" size="sm" variant="secondary" onClick={() => setForm({ ...form, qrUrl: null })}>
                  {t("Remove QR")}
                </Button>
              )}
              <p className="text-[11px] text-subtle">{t("PNG or JPG. Uploaded, then saved with the rest.")}</p>
            </div>
          </div>
        </div>

        <Field label="Instructions" hint="Optional — e.g. 'Send with Bangla QR from any app, then tell us the reference'.">
          <TextArea rows={2} value={form.instructions || ""} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
        </Field>

        <div className="space-y-2">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-muted">
            {t("Payment methods you accept")}
          </span>
          <div className="flex flex-wrap gap-2">
            {CLAIM_METHODS.map((m) => (
              <label key={m}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  form.methods.includes(m)
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-line/[0.08] bg-overlay/[0.02] text-muted"
                }`}>
                <input type="checkbox" className="sr-only" checked={form.methods.includes(m)}
                  onChange={() => toggleMethod(m)} />
                {t(METHOD_LABELS[m])}
              </label>
            ))}
          </div>
        </div>

        <Field label="Default payment method"
          hint="Preselected for the payer. They can still choose any of the methods above.">
          <Select value={form.defaultMethod} onChange={(e) => setForm({ ...form, defaultMethod: e.target.value as ClaimMethod })}>
            {form.methods.map((m) => <option key={m} value={m}>{t(METHOD_LABELS[m])}</option>)}
          </Select>
        </Field>

        <Button onClick={save} loading={saving || uploading}>{t("Save payment details")}</Button>
      </div>
    </Card>
  );
}
