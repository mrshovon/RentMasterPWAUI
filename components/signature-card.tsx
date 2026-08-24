"use client";

import { useState } from "react";
import { PenLine, Upload } from "lucide-react";
import { rentMasterFetch, uploadFile } from "../lib/api-service";
import { toast } from "./toast";
import { useT } from "../lib/i18n";
import { Card } from "./ui";

// =====================================================================================
// ✍️ AUTHORISED SIGNATURE — upload the image that goes on printed documents.
//
// A SIBLING of the owner dashboard's SignatureModal (app/owner/page.tsx), not a replacement for
// it. That one is a modal opened from the Billing tab header and is live in the rent flow;
// lifting it out to be shared would have been a refactor of a working screen for no gain. What
// IS shared is everything that matters — the same uploads route, the same folder, the same
// /api/admin/owner/signature endpoint, which keys off the bearer token and so already accepts a
// building admin (PLAN_GOVERNED_ROLES includes building_admin).
//
// Uploads on pick rather than behind a submit button, like ImageField in staff-tab.tsx: there is
// one field here, and a "Save" for a single file is a step with nothing to decide.
// =====================================================================================

/** Mirrors the server's own ceiling — app/api/admin/uploads/route.ts rejects anything larger with
 *  a 413, and the middleware caps this path at the same figure. Checked here so the user finds
 *  out before waiting for a big upload to fail. */
const MAX_BYTES = 8 * 1024 * 1024;

export function SignatureCard({
  signatureUrl,
  onSaved,
  subtitle,
}: {
  signatureUrl: string | null;
  /** Called with the new public URL so the page can update state without refetching. */
  onSaved: (url: string) => void;
  subtitle?: string;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Cleared immediately so the SAME file can be picked again after a failure — without this,
    // onChange never fires a second time and the retry looks like a dead control.
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.warning("Please choose an image (a transparent PNG works best).");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.warning("Image must be under 8MB.");
      return;
    }

    try {
      setBusy(true);
      const url = await uploadFile(file, { folder: "signatures" });
      await rentMasterFetch("/api/admin/owner/signature", {
        method: "POST",
        body: JSON.stringify({ signatureUrl: url }),
      });
      onSaved(url);
      toast.success("Signature saved.");
    } catch (err: any) {
      toast.error(err?.message || "Could not save the signature.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-heading">
        <PenLine className="h-4 w-4 text-primary" /> {t("Authorised signature")}
      </h3>
      <p className="mb-4 text-xs text-muted">
        {t(subtitle || "Printed above the signature line on receipts.")}
      </p>

      {signatureUrl && (
        <div className="mb-4 rounded-xl border border-line/[0.08] bg-white p-4 text-center">
          <img src={signatureUrl} alt={t("Signature")} className="mx-auto max-h-24 object-contain" />
        </div>
      )}

      <label
        className={
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border " +
          "border-dashed border-line/[0.12] bg-overlay/[0.02] px-4 py-6 text-center text-sm " +
          "text-muted transition hover:border-primary/40 hover:text-fg " +
          (busy ? "pointer-events-none opacity-60" : "")
        }
      >
        <Upload className="h-5 w-5" />
        <span>
          {busy
            ? t("Uploading…")
            : signatureUrl
              ? t("Replace signature image")
              : t("Upload signature image")}
        </span>
        <span className="text-[11px] text-subtle">{t("Transparent PNG recommended")}</span>
        <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={pick} />
      </label>
    </Card>
  );
}
