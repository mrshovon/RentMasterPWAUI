"use client";

import { useRef } from "react";
import { Download, Printer, Share2 } from "lucide-react";
import { Modal, Button } from "./ui";
import { toast } from "./toast";

// Renders a prebuilt receipt HTML string in an isolated iframe, with download,
// print (prints on half an A4 — A5 landscape) and share actions.
export function ReceiptModal({
  open, onClose, html,
}: {
  open: boolean; onClose: () => void; html: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Rent receipt"
      subtitle="Preview below — prints in the top corner of an A4 (half width).">
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white">
          <iframe ref={iframeRef} srcDoc={html} title="Rent receipt" className="h-[52vh] w-full" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button icon={Download} variant="secondary" onClick={downloadReceipt}>Download</Button>
          <Button icon={Printer} variant="secondary" onClick={printReceipt}>Print</Button>
          <Button icon={Share2} onClick={shareReceipt}>Share</Button>
        </div>
      </div>
    </Modal>
  );
}
