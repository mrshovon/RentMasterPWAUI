"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, Undo2 } from "lucide-react";
import { useT } from "../lib/i18n";
import { Button } from "./ui";

// =====================================================================================
// ✍️ SIGN HERE — draw a signature instead of uploading a scan of one.
//
// Every signature in this app was an uploaded image file, which meant a user without a scanned
// transparent PNG had no signature at all and every receipt they issued printed on a bare rule.
// This produces the SAME artefact: a transparent PNG File, handed to the caller to push through
// the existing uploadFile(folder: "signatures") -> POST /api/admin/owner/signature path. Nothing
// server-side knows the difference, which is why a drawn signature shows up on rent receipts,
// service-charge receipts, notices and statements with no other change.
//
// FIVE THINGS HERE ARE LOAD-BEARING. None is decoration:
//
// 1. `touch-action: none` on the canvas. Without it the Capacitor WebView (and mobile Chrome)
//    treats a finger drag as a scroll, the pad receives pointercancel a few pixels in, and
//    signing looks broken on exactly the devices most people will sign on.
// 2. The backing store is sized to CSS pixels x devicePixelRatio. A canvas left at its attribute
//    size is stretched by the browser, and the stroke comes out soft and blocky on every phone.
// 3. Strokes are kept as POINTS, not just painted. Redrawing from them is what makes Undo
//    possible at all, and it is also how a resize (rotate the phone) keeps the signature instead
//    of clearing the canvas — resizing a canvas always wipes it.
// 4. The export is CROPPED to the ink. lib/receipt.ts and lib/building-print.ts render the image
//    at max-height 56px inside a ~200px box, so an uncropped 600px-wide canvas with a small
//    signature in the middle would print as an unreadable speck.
// 5. The export canvas is never filled. A transparent PNG is what the receipt slot expects
//    (app/api/admin/uploads/route.ts:16-19); a white rectangle would sit as a visible box on a
//    letterhead.
// =====================================================================================

interface Point { x: number; y: number }

/** CSS pixels. Tall enough for a real signature, short enough to sit in a modal on a phone. */
const PAD_HEIGHT = 190;
/** Ink. Not pure black — matches the #111 the printed documents use for text. */
const INK = "#111111";
const LINE_WIDTH = 2.4;
/** Upscale on export, so the PNG survives being printed rather than just displayed. */
const EXPORT_SCALE = 3;
/** Breathing room around the cropped ink, in CSS pixels. */
const CROP_PADDING = 8;

export function SignaturePad({
  onSave,
  saving = false,
  saveLabel = "Save signature",
}: {
  /** Called with a transparent PNG. The caller uploads it — this component knows nothing about
   *  the network, so it can be dropped into any surface that needs a signature. */
  onSave: (file: File) => void | Promise<void>;
  saving?: boolean;
  saveLabel?: string;
}) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // The drawn strokes, in CSS pixels. A ref rather than state: they change on every pointermove,
  // and re-rendering React sixty times a second to draw a line would drop points on a slow phone.
  const strokes = useRef<Point[][]>([]);
  // Mirrors "are there any strokes" for the buttons only, so they enable/disable without the
  // points themselves driving a render.
  const [hasInk, setHasInk] = useState(false);
  const drawing = useRef(false);

  /** Repaint everything from `strokes`. Called after a resize, an undo and a clear. */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const ratio = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(ratio, ratio);

    ctx.strokeStyle = INK;
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokes.current) {
      if (!stroke.length) continue;
      // A single tap is a dot, which a lineTo of zero length would not paint.
      if (stroke.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke[0].x, stroke[0].y, LINE_WIDTH / 2, 0, Math.PI * 2);
        ctx.fillStyle = INK;
        ctx.fill();
        continue;
      }
      // Quadratic curves through the midpoints, not straight segments between raw points: a
      // finger produces coarse, jittery samples and polylines make a signature look shaky.
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length - 1; i++) {
        const mid = { x: (stroke[i].x + stroke[i + 1].x) / 2, y: (stroke[i].y + stroke[i + 1].y) / 2 };
        ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, mid.x, mid.y);
      }
      ctx.lineTo(stroke[stroke.length - 1].x, stroke[stroke.length - 1].y);
      ctx.stroke();
    }
  }, []);

  /** Match the backing store to the element's real size, then repaint. */
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const width = wrap.clientWidth;
    if (!width) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(PAD_HEIGHT * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${PAD_HEIGHT}px`;
    redraw();
  }, [redraw]);

  useEffect(() => {
    resize();
    // Covers a rotation, a keyboard opening, and the modal animating to its final width — the
    // last of which is why this cannot be a one-off measurement on mount.
    const observer = new ResizeObserver(resize);
    if (wrapRef.current) observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, [resize]);

  function pointFrom(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    // Pointer capture keeps the stroke alive when a finger slides past the pad's edge, which
    // otherwise ends the stroke mid-letter on a narrow phone. It also guarantees the matching
    // pointerup lands here even if the finger lifts somewhere else entirely — which is why there
    // is deliberately NO onPointerLeave handler below: with capture, boundary events still fire
    // at this element, so ending the stroke on leave would undo the capture's whole purpose.
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* older WebView; capture is an optimisation, not a requirement */ }
    drawing.current = true;
    strokes.current.push([pointFrom(e)]);
    setHasInk(true);
    redraw();
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const stroke = strokes.current[strokes.current.length - 1];
    if (!stroke) return;
    const point = pointFrom(e);
    // Drop samples closer than a pixel: they add nothing to the drawing and a lot to the array.
    const last = stroke[stroke.length - 1];
    if (last && Math.abs(last.x - point.x) < 1 && Math.abs(last.y - point.y) < 1) return;
    stroke.push(point);
    redraw();
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    strokes.current = [];
    setHasInk(false);
    redraw();
  }

  function undo() {
    strokes.current.pop();
    setHasInk(strokes.current.length > 0);
    redraw();
  }

  /** The drawn ink as a transparent, cropped PNG — or null if nothing was drawn. */
  async function toFile(): Promise<File | null> {
    const all = strokes.current.flat();
    if (!all.length) return null;

    // Bounding box from the POINTS rather than from pixel data: exact, cheap, and it cannot be
    // thrown off by antialiasing. Padded by the stroke's own half-width so the ink is not clipped.
    const pad = CROP_PADDING + LINE_WIDTH;
    const minX = Math.min(...all.map((p) => p.x)) - pad;
    const maxX = Math.max(...all.map((p) => p.x)) + pad;
    const minY = Math.min(...all.map((p) => p.y)) - pad;
    const maxY = Math.max(...all.map((p) => p.y)) + pad;
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);

    const out = document.createElement("canvas");
    out.width = Math.round(width * EXPORT_SCALE);
    out.height = Math.round(height * EXPORT_SCALE);
    const ctx = out.getContext("2d");
    if (!ctx) return null;

    // No fillRect anywhere: whatever is not drawn stays transparent.
    ctx.scale(EXPORT_SCALE, EXPORT_SCALE);
    ctx.translate(-minX, -minY);
    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokes.current) {
      if (!stroke.length) continue;
      if (stroke.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke[0].x, stroke[0].y, LINE_WIDTH / 2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length - 1; i++) {
        const mid = { x: (stroke[i].x + stroke[i + 1].x) / 2, y: (stroke[i].y + stroke[i + 1].y) / 2 };
        ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, mid.x, mid.y);
      }
      ctx.lineTo(stroke[stroke.length - 1].x, stroke[stroke.length - 1].y);
      ctx.stroke();
    }

    const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/png"));
    if (!blob) return null;
    return new File([blob], "signature.png", { type: "image/png" });
  }

  async function save() {
    const file = await toFile();
    // Guarded by the disabled button too; this is the belt to that pair of braces, because
    // uploading a blank PNG would leave the account looking signed while printing nothing.
    if (!file) return;
    await onSave(file);
  }

  return (
    <div className="space-y-3">
      {/* White, not a themed surface: this is a preview of ink on paper, and the same signature
          has to read the same way in dark mode as it will on the printed receipt. */}
      <div
        ref={wrapRef}
        className="relative overflow-hidden rounded-xl border border-dashed border-line/[0.18] bg-white"
      >
        <canvas
          ref={canvasRef}
          className="block w-full cursor-crosshair select-none touch-none"
          style={{ height: PAD_HEIGHT }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />
        {/* The signature line sits under the ink so there is something to sign ON, and it is
            pointer-events-none so it can never swallow the first touch of a stroke. */}
        <div className="pointer-events-none absolute inset-x-8 bottom-9 border-t border-slate-300" />
        {!hasInk && (
          <span className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] text-slate-400">
            {t("Sign above the line")}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" size="sm" icon={Undo2} onClick={undo} disabled={!hasInk}>
          Undo
        </Button>
        <Button type="button" variant="secondary" size="sm" icon={Eraser} onClick={clear} disabled={!hasInk}>
          Clear
        </Button>
        <Button type="button" className="ml-auto" onClick={save} loading={saving} disabled={!hasInk}>
          {saveLabel}
        </Button>
      </div>

      <p className="text-[11px] text-subtle">
        {t("Use your finger, a stylus or the mouse. Your signature is saved as a transparent image.")}
      </p>
    </div>
  );
}
