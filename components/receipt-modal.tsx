"use client";

import { useRef, useState } from "react";
import { Download, Printer, Share2, MessageCircle, ImageDown } from "lucide-react";
import html2canvas from "html2canvas";
import { Modal, Button } from "./ui";
import { toast } from "./toast";
import { normalizeWhatsappPhone, openWhatsapp } from "../lib/whatsapp";

// Renders a prebuilt receipt HTML string in an isolated iframe, with download, print, a WhatsApp
// text deep-link, and an image (PNG) share/download. wa.me links can only carry text, so the
// "snapshot" is shared as a PNG via the Web Share API (share sheet -> WhatsApp attaches the image).
// NOTE: WhatsApp's share target silently drops the accompanying text/caption whenever a file is
// attached, so on the image path we copy the message to the clipboard instead (paste as caption).
export function ReceiptModal({
  open, onClose, html, phone, message,
}: {
  open: boolean;
  onClose: () => void;
  html: string;
  phone?: string | null;     // tenant phone for the WhatsApp target (raw; normalized here)
  message?: string;          // resolved WhatsApp message body (from the owner's template)
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [rasterizing, setRasterizing] = useState(false);

  const waPhone = normalizeWhatsappPhone(phone);
  const waText = message || "Please find your rent receipt attached.";

  function printReceipt() {
    const win = iframeRef.current?.contentWindow;
    if (win) { win.focus(); win.print(); }
  }

  function downloadReceipt() {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rent-receipt.html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function shareReceipt() {
    const nav = navigator as unknown as {
      share?: (d: unknown) => Promise<void>;
      canShare?: (d: unknown) => boolean;
    };
    try {
      const file = new File([new Blob([html], { type: "text/html" })], "rent-receipt.html", { type: "text/html" });
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share!({ files: [file], title: "Rent Receipt" });
      } else if (nav.share) {
        await nav.share({ title: "Rent Receipt", text: "Please find the rent receipt." });
      } else {
        toast.info("Sharing isn't supported on this device — use Download or Print instead.");
      }
    } catch { /* user cancelled or share unavailable */ }
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
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  }

  // Share the PNG snapshot. WhatsApp drops the caption when a file is attached, so the message is
  // copied to the clipboard for the owner to paste. Falls back to a download on desktop/unsupported.
  async function shareImage() {
    try {
      setRasterizing(true);
      const blob = await renderPng();
      if (!blob) return;
      const file = new File([blob], "rent-receipt.png", { type: "image/png" });
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
        a.href = url; a.download = "rent-receipt.png";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast.info(copied
          ? "Image downloaded and message copied — attach the image in WhatsApp and paste the message."
          : "Image downloaded — attach it in WhatsApp, or use the WhatsApp button for the message.");
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") toast.error("Could not generate the receipt image.");
    } finally {
      setRasterizing(false);
    }
  }

  function sendWhatsapp() {
    if (!waPhone) {
      toast.error("This tenant has no valid phone number for WhatsApp.");
      return;
    }
    openWhatsapp(waPhone, waText);
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Rent receipt"
      subtitle="Share to WhatsApp, send as an image, or download / print.">
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white">
          <iframe ref={iframeRef} srcDoc={html} title="Rent receipt" className="h-[52vh] w-full" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button icon={MessageCircle} variant="success" onClick={sendWhatsapp} disabled={!waPhone}>
            WhatsApp
          </Button>
          <Button icon={ImageDown} onClick={shareImage} loading={rasterizing}>
            Share image
          </Button>
          <Button icon={Download} variant="secondary" onClick={downloadReceipt}>Download</Button>
          <Button icon={Printer} variant="secondary" onClick={printReceipt}>Print</Button>
        </div>
        <button onClick={shareReceipt}
          className="w-full text-center text-xs font-medium text-slate-500 transition hover:text-slate-300">
          Share as HTML file instead
        </button>
        {!waPhone && phone !== undefined && (
          <p className="text-center text-[11px] text-slate-500">
            No valid WhatsApp number on file for this tenant.
          </p>
        )}
      </div>
    </Modal>
  );
}
