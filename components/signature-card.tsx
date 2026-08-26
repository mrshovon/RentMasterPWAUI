"use client";

import { useState } from "react";
import { PenLine, Upload } from "lucide-react";
import { rentMasterFetch, uploadFile } from "../lib/api-service";
import { toast } from "./toast";
import { useT } from "../lib/i18n";
import { Card } from "./ui";
import { SignaturePad } from "./signature-pad";

// =====================================================================================
// ✍️ AUTHORISED SIGNATURE — draw it, or upload the image that goes on printed documents.
//
// A SIBLING of the owner dashboard's SignatureModal (app/owner/page.tsx), not a replacement for
// it. That one is a modal opened from the Billing tab header and is live in the rent flow;
// lifting it out to be shared would have been a refactor of a working screen for no gain. What
// IS shared is everything that matters — the same uploads route, the same folder, the same
// /api/admin/owner/signature endpoint, which keys off the bearer token and so already accepts a
// building admin (PLAN_GOVERNED_ROLES includes building_admin) — and now components/signature-pad
// as well, which is the part that would genuinely have been duplicated.
//
// Draw is the DEFAULT tab: uploading requires already owning a scanned transparent PNG, which is
// exactly the thing most people do not have, and it is why signatures went unset.
//
// Upload still uploads on pick rather than behind a submit button, like ImageField in
// staff-tab.tsx: there is one field there and a "Save" for a single file is a step with nothing
// to decide. Drawing has its own Save, because a drawing has a natural end and a stray first
// stroke must not be committed.
// =====================================================================================

/** Mirrors the server's own ceiling — app/api/admin/uploads/route.ts rejects anything larger with
 *  a 413, and the middleware caps this path at the same figure. Checked here so the user finds
 *  out before waiting for a big upload to fail. (A drawn PNG is a few KB and never approaches it.) */
const MAX_BYTES = 8 * 1024 * 1024;

type Mode = "draw" | "upload";

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
  const [mode, setMode] = useState<Mode>("draw");

  /** The one save path, shared by both tabs: storage upload, then the metadata write. */
  async function store(file: File) {
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
    await store(file);
  }

  const tab = (value: Mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      className={
        "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition " +
        (mode === value ? "bg-primary text-btn-ink shadow-sm" : "text-muted hover:text-fg")
      }
    >
      {t(label)}
    </button>
  );

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

      <div className="mb-4 flex gap-1 rounded-xl bg-overlay/[0.04] p-1">
        {tab("draw", "Draw")}
        {tab("upload", "Upload")}
      </div>

      {mode === "draw" ? (
        <SignaturePad
          onSave={store}
          saving={busy}
          saveLabel={signatureUrl ? "Replace signature" : "Save signature"}
        />
      ) : (
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
      )}
    </Card>
  );
}
