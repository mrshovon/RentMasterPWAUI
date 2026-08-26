"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Printer, MessageCircle, ImageDown } from "lucide-react";
import html2canvas from "html2canvas";
import { Modal, Button } from "./ui";
import { toast } from "./toast";
import { normalizeWhatsappPhone, openWhatsapp } from "../lib/whatsapp";
import { isNativeApp } from "../lib/platform";
import { blobToBase64, saveAndOpen } from "../lib/native-file";
import { useT } from "../lib/i18n";

// Renders a prebuilt receipt HTML string in an isolated iframe, with download, print, a WhatsApp
// text deep-link, and an image (PNG) share/download. wa.me links can only carry text, so the
// "snapshot" is shared as a PNG via the Web Share API (share sheet -> WhatsApp attaches the image).
// NOTE: WhatsApp's share target silently drops the accompanying text/caption whenever a file is
// attached, so on the image path we copy the message to the clipboard instead (paste as caption).
//
// ⚠️ EVERY export here is browser-only and DEAD inside the Android app: the WebView ignores
// <a download>, blocks blob: navigation, has no window.print(), and does not expose
// navigator.share — none of which throw, so the buttons silently did nothing. Anything that
// hands the user a file therefore branches on isNativeApp() and goes through lib/native-file.ts
// (Filesystem + FileOpener) instead. Keep that branch when adding a new export.
export function ReceiptModal({
  open, onClose, html, phone, message, fileName, title,
  noPhoneToast = "This tenant has no valid phone number for WhatsApp.",
  noPhoneHint = "No valid WhatsApp number on file for this tenant.",
  hideWhatsapp = false,
}: {
  open: boolean;
  onClose: () => void;
  html: string;
  phone?: string | null;     // tenant phone for the WhatsApp target (raw; normalized here)
  message?: string;          // resolved WhatsApp message body (from the owner's template)
  fileName?: string;         // base name for saved files, e.g. "rent-receipt-2026-07"
  /** Heading on the modal. Defaults to "Rent receipt"; a building service charge is not rent. */
  title?: string;
  // Whole sentences rather than an interpolated noun: a building service charge is addressed to a
  // flat owner, not a tenant, and splicing the word in would fragment the string for translation.
  /** Toast when WhatsApp is pressed with no usable number. */
  noPhoneToast?: string;
  /** Standing hint under the buttons when there is no usable number. */
  noPhoneHint?: string;
  /** Drop the WhatsApp button entirely. For a receipt the reader is printing for THEMSELVES —
   *  a flat owner's copy of their own service charge — where there is no counterparty to send it
   *  to, so the button could only ever be disabled. Default false; every existing caller is a
   *  sharing surface and is unaffected. */
  hideWhatsapp?: boolean;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [rasterizing, setRasterizing] = useState(false);
  const t = useT();
  // Resolved after mount: isNativeApp() reads window/navigator, so calling it during render
  // would disagree with the server-rendered HTML and trip hydration.
  const [native, setNative] = useState(false);
  useEffect(() => { setNative(isNativeApp()); }, []);

  const waPhone = normalizeWhatsappPhone(phone);
  const waText = message || "Please find your rent receipt attached.";
  const baseName = fileName?.trim()
    || `rent-receipt-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}`;

  /** Save the receipt as a PNG through the native plugins, then let the system open it. */
  async function saveImageNatively() {
    setRasterizing(true);
    try {
      const blob = await renderPng();
      if (!blob) return; // renderPng already explained why
      const where = await saveAndOpen({
        base64: await blobToBase64(blob),
        fileName: `${baseName}.png`,
        mimeType: "image/png",
      });
      // Interpolated, so it can never be an exact dictionary key. The location word is the
      // only translatable part; the filename is the user’s own.
      toast.success(`${t("Receipt saved to")} ${t(where)} — ${baseName}.png`);
    } catch (e: any) {
      toast.error(e?.message || "Could not save the receipt to this device.");
    } finally {
      setRasterizing(false);
    }
  }

  function printReceipt() {
    // The WebView has no print support at all, so in the app this saves the image instead —
    // the system image viewer's own menu carries Print.
    if (native) { void saveImageNatively(); return; }
    const win = iframeRef.current?.contentWindow;
    if (!win || typeof win.print !== "function") {
      toast.error("Printing isn't available here — use Download instead.");
      return;
    }
    win.focus();
    win.print();
  }

  function downloadReceipt() {
    // Native: an .html file usually has no handler on Android, so FileOpener would throw
    // "no app found" — one dead button traded for another. A PNG always opens.
    if (native) { void saveImageNatively(); return; }
    try {
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      toast.error(e?.message || "Could not download the receipt.");
    }
  }

  async function shareReceipt() {
    const nav = navigator as unknown as {
      share?: (d: unknown) => Promise<void>;
      canShare?: (d: unknown) => boolean;
    };
    try {
      const file = new File([new Blob([html], { type: "text/html" })], `${baseName}.html`, { type: "text/html" });
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share!({ files: [file], title: "Rent Receipt" });
      } else if (nav.share) {
        await nav.share({ title: "Rent Receipt", text: "Please find the rent receipt." });
      } else {
        toast.info("Sharing isn't supported on this device — use Download or Print instead.");
      }
    } catch (e: any) {
      // AbortError is the user dismissing the share sheet — everything else is a real failure
      // and used to vanish here, which is how this whole modal ended up looking broken.
      if (e?.name !== "AbortError") {
        toast.error(e?.message || "Could not share the receipt.");
      }
    }
  }

  // Rasterize the receipt (inside the iframe) to a PNG blob for image sharing / download.
  async function renderPng(): Promise<Blob | null> {
    const doc = iframeRef.current?.contentDocument;
    const target = doc?.querySelector(".receipt") as HTMLElement | null;
    if (!doc || !target) {
      toast.error("Receipt isn't ready yet — try again in a moment.");
      return null;
    }
    const canvas = await html2canvas(target, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) toast.error("Could not turn the receipt into an image on this device.");
    return blob;
  }

  // Share the PNG snapshot. WhatsApp drops the caption when a file is attached, so the message is
  // copied to the clipboard for the owner to paste. Falls back to a download on desktop/unsupported.
  async function shareImage() {
    // In the app there is no Web Share and no <a download>; save the PNG and open it — the
    // image viewer provides its own Share and Print.
    if (native) { void saveImageNatively(); return; }
    try {
      setRasterizing(true);
      const blob = await renderPng();
      if (!blob) return;
      const file = new File([blob], `${baseName}.png`, { type: "image/png" });
      const nav = navigator as unknown as {
        share?: (d: unknown) => Promise<void>;
        canShare?: (d: unknown) => boolean;
      };
      // Best-effort: put the message on the clipboard so it can be pasted as the caption.
      // Never let a blocked clipboard (non-secure context / permissions) abort the share.
      let copied = false;
      try { await navigator.clipboard?.writeText(waText); copied = true; } catch { /* clipboard blocked */ }
      if (nav.canShare && nav.canShare({ files: [file] })) {
        // Include text only where the platform will honor it (WhatsApp won't, but email/others do).
        const payload = nav.canShare({ files: [file], text: waText })
          ? { files: [file], title: "Rent Receipt", text: waText }
          : { files: [file], title: "Rent Receipt" };
        await nav.share!(payload);
        if (copied) toast.info("Message copied — long-press to paste it as the caption in WhatsApp.");
      } else {
        // Desktop / unsupported: download the image so the owner can attach it manually.
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${baseName}.png`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast.info(copied
          ? "Image downloaded and message copied — attach the image in WhatsApp and paste the message."
          : "Image downloaded — attach it in WhatsApp, or use the WhatsApp button for the message.");
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        toast.error(e?.message || "Could not generate the receipt image.");
      }
    } finally {
      setRasterizing(false);
    }
  }

  function sendWhatsapp() {
    if (!waPhone) {
      toast.error(t(noPhoneToast));
      return;
    }
    openWhatsapp(waPhone, waText);
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title={title || "Rent receipt"}
      subtitle={hideWhatsapp
        ? (native ? "Save the receipt as an image." : "Send as an image, or download / print.")
        : native
          ? "Share to WhatsApp, or save the receipt as an image."
          : "Share to WhatsApp, send as an image, or download / print."}>
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-line/[0.08] bg-white">
          <iframe ref={iframeRef} srcDoc={html} title={title || "Rent receipt"} className="h-[52vh] w-full" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {!hideWhatsapp && (
            <Button icon={MessageCircle} variant="success" onClick={sendWhatsapp} disabled={!waPhone}>
              {t("WhatsApp")}
            </Button>
          )}
          {/* Spans the row on its own when WhatsApp is gone, so the 2-column grid does not leave
              a hole beside it. */}
          <Button icon={ImageDown} onClick={shareImage} loading={rasterizing}
            className={hideWhatsapp ? "col-span-2" : undefined}>
            {native ? t("Save image") : t("Share image")}
          </Button>
          <Button icon={Download} variant="secondary" onClick={downloadReceipt} loading={native && rasterizing}>
            {t("Download")}
          </Button>
          {/* The WebView cannot print, so in the app this button saves the image instead —
              the system viewer that opens it has Print in its own menu. */}
          <Button icon={Printer} variant="secondary" onClick={printReceipt} loading={native && rasterizing}>
            {native ? t("Save & print") : t("Print")}
          </Button>
        </div>
        {/* Browser only: Android has no default handler for a .html file, so offering it in the
            app would just produce a "no app can open this" error. */}
        {!native && (
          <button onClick={shareReceipt}
            className="w-full text-center text-xs font-medium text-subtle transition hover:text-fg">
            {t("Share as HTML file instead")}
          </button>
        )}
        {!hideWhatsapp && !waPhone && phone !== undefined && (
          <p className="text-center text-[11px] text-subtle">
            {t(noPhoneHint)}
          </p>
        )}
      </div>
    </Modal>
  );
}
