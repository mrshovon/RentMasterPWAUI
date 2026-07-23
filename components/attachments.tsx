"use client";

import { Paperclip } from "lucide-react";
import { parseAttachments } from "../lib/format";

// Renders maintenance attachment(s) as a row of thumbnail links. Handles both the
// legacy single-URL string and the newer JSON-array-of-URLs storage shapes.
export function AttachmentStrip({ raw }: { raw: string | null | undefined }) {
  const urls = parseAttachments(raw);
  if (urls.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {urls.map((url, i) => (
        <a
          key={`${url}-${i}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          title={`Attachment ${i + 1}`}
          className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-line/[0.08] bg-overlay/[0.02]"
        >
          <Paperclip className="absolute h-4 w-4 text-subtle" />
          <img
            src={url}
            alt={`Attachment ${i + 1}`}
            loading="lazy"
            className="relative h-full w-full object-cover transition group-hover:scale-105"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </a>
      ))}
    </div>
  );
}
