"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Printer } from "lucide-react";
import html2canvas from "html2canvas";
import { Modal, Button } from "./ui";
import { toast } from "./toast";
import { isNativeApp } from "../lib/platform";
import { blobToBase64, saveAndOpen } from "../lib/native-file";
import { useT } from "../lib/i18n";

// Renders a prebuilt A4 document (from lib/building-print.ts) in an isolated iframe, with print
// and download.
//
// A SIBLING of components/receipt-modal.tsx rather than a generalisation of it. That one is a
// one-tenant sharing surface — WhatsApp deep link, PNG snapshot, "Tenant Copy" wording — none of
// which belongs on a multi-page building statement, and reshaping a component that is live in the
// rent flow to carry both was the larger risk. What IS shared is the part that matters: the
// native-file fallback below, imported from the same lib/native-file.ts.
//
// ⚠️ EVERY export here is browser-only and DEAD inside the Android app: the WebView has no
// window.print(), ignores <a download>, and blocks blob: navigation — none of which throw, so
// the buttons silently do nothing. Both paths therefore branch on isNativeApp() and save a PNG
// through the Filesystem plugin instead; the system image viewer's own menu carries Print.
export function PrintModal({
  open,
  onClose,
  html,
  title,
  subtitle,
  fileName,
}: {
  open: boolean;
  onClose: () => void;
  /** A complete, self-contained HTML document string. */
  html: string;
  title: string;
  subtitle?: string;
  /** Base name for saved files, e.g. "service-charge-statement-2026-08". */
  fileName?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [busy, setBusy] = useState(false);
  const t = useT();

  // Resolved after mount: isNativeApp() reads window/navigator, so calling it during render would
  // disagree with the server-rendered HTML and trip hydration.
  const [native, setNative] = useState(false);
  useEffect(() => { setNative(isNativeApp()); }, []);

  const baseName =
    fileName?.trim() || `document-${new Date().toISOString().slice(0, 10)}`;

  async function saveImageNatively() {
    setBusy(true);
    try {
      const doc = iframeRef.current?.contentDocument;
      const target = doc?.querySelector(".sheet") as HTMLElement | null;
      if (!doc || !target) {
        toast.error("The document isn't ready yet — try again in a moment.");
        return;
      }
      const canvas = await html2canvas(target, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) {
        toast.error("Could not turn the document into an image on this device.");
        return;
      }
      const where = await saveAndOpen({
        base64: await blobToBase64(blob),
        fileName: `${baseName}.png`,
        mimeType: "image/png",
      });
      // Interpolated, so it can never be an exact dictionary key — only the location word is
      // translatable, the filename is the user's own.
      toast.success(`${t("Saved to")} ${t(where)} — ${baseName}.png`);
    } catch (e: any) {
      toast.error(e?.message || "Could not save the document to this device.");
    } finally {
      setBusy(false);
    }
  }

  function printDoc() {
    if (native) { void saveImageNatively(); return; }
    const win = iframeRef.current?.contentWindow;
    if (!win || typeof win.print !== "function") {
      toast.error("Printing isn't available here — use Download instead.");
      return;
    }
    win.focus();
    win.print();
  }

  function downloadDoc() {
    // Native: an .html file usually has no handler on Android, so opening it would throw
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
      toast.error(e?.message || "Could not download the document.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={title}
      subtitle={subtitle || (native ? "Save it to this device to print." : "Print it, or download a copy.")}
    >
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-line/[0.08] bg-white">
          <iframe ref={iframeRef} srcDoc={html} title={title} className="h-[58vh] w-full" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button icon={Printer} onClick={printDoc} loading={native && busy}>
            {native ? t("Save & print") : t("Print")}
          </Button>
          <Button icon={Download} variant="secondary" onClick={downloadDoc} loading={native && busy}>
            {t("Download")}
          </Button>
        </div>
        {!native && (
          <p className="text-center text-[11px] text-subtle">
            {t("Your browser's print dialog can also save this as a PDF.")}
          </p>
        )}
      </div>
    </Modal>
  );
}
