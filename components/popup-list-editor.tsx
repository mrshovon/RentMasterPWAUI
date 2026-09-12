"use client";

import { useEffect, useState, type ComponentType } from "react";
import { ArrowDown, ArrowUp, Eye, ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import {
  Card, Button, Badge, Field, TextInput, TextArea, Spinner,
} from "./ui";
import { PopupCarousel, type PopupItem, type PopupSet } from "./popup-carousel";
import { rentMasterFetch, uploadFile } from "../lib/api-service";
import { toast } from "./toast";
import { confirmDialog } from "./confirm";

// =============================================================================
// 📋 THE POPUP LIST EDITOR — one component, used for both the app-open announcements and the
// sign-in banners.
//
// They take the same payload, publish through the same rules and are managed side by side in the
// same settings tab, so a second near-identical form would drift in exactly the details a reader
// notices. Only the endpoint, the icon and the copy differ.
//
// ⭐ EVERYTHING IS LOCAL UNTIL SAVE — adding, deleting, reordering, editing. Delete asks first, but
// the real safety net is that leaving the page without saving discards the lot. An admin who
// mis-taps Delete on the wrong row of ten has a way back that does not involve retyping it.
//
// Preview renders the REAL PopupCarousel, so what is approved is literally what ships — the same
// reasoning that made the single-item version import its modal from the gate.
// =============================================================================

const MAX_ITEMS = 10;

/** A fresh blank item. The id is provisional: the server assigns the real one on save. */
const blankItem = (): PopupItem => ({
  id: `new-${Math.random().toString(36).slice(2)}`,
  active: false,
  titleEn: "", titleBn: "", bodyEn: "", bodyBn: "",
  imageUrl: null,
});

export function PopupListEditor({
  endpoint,
  uploadFolder,
  icon: Icon,
  heading,
  blurb,
  saveLabel,
  titlePlaceholder,
  bodyPlaceholder,
}: {
  endpoint: string;
  uploadFolder: string;
  icon: ComponentType<{ className?: string }>;
  heading: string;
  blurb: string;
  saveLabel: string;
  titlePlaceholder: { en: string; bn: string };
  bodyPlaceholder: { en: string; bn: string };
}) {
  const [items, setItems] = useState<PopupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [previewing, setPreviewing] = useState<"en" | "bn" | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await rentMasterFetch<{ data: PopupSet }>(endpoint, { role: "admin" });
        setItems(res.data?.items || []);
      } catch (e: any) { toast.error(e.message); }
      finally { setLoading(false); }
    })();
  }, [endpoint]);

  const update = (id: string, patch: Partial<PopupItem>) =>
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  function move(id: string, by: 1 | -1) {
    setItems((xs) => {
      const i = xs.findIndex((x) => x.id === id);
      const j = i + by;
      if (i < 0 || j < 0 || j >= xs.length) return xs;
      const next = [...xs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function remove(item: PopupItem) {
    const name = item.titleEn || item.titleBn || "this popup";
    const ok = await confirmDialog({
      title: `Delete ${name}?`,
      message: "It is removed from the list here. Nothing is saved until you press Save.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setItems((xs) => xs.filter((x) => x.id !== item.id));
  }

  async function onPickImage(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    try {
      setUploadingId(id);
      const url = await uploadFile(file, { role: "owner", folder: uploadFolder });
      update(id, { imageUrl: url });
      toast.success("Image uploaded — remember to Save.");
    } catch (e: any) { toast.error(e.message); }
    finally { setUploadingId(null); }
  }

  async function save() {
    try {
      setSaving(true);
      const res = await rentMasterFetch<{ data: PopupSet; warning?: string }>(endpoint, {
        method: "PUT", role: "admin", body: JSON.stringify({ items }),
      });
      // Take the server's list back: it assigns the real ids, so a newly added item stops carrying
      // its provisional one and a later reorder refers to something that exists.
      setItems(res.data?.items || []);
      const live = (res.data?.items || []).filter((i) => i.active).length;
      toast.success(live ? `Saved — ${live} showing.` : "Saved — nothing is showing.");
      // Surfaced rather than swallowed: publishing English-only to a bilingual audience is a
      // decision, and the admin should make it knowingly.
      if (res.warning) toast.warning(res.warning);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  const activeCount = items.filter((i) => i.active).length;
  // Preview shows what a user would actually get: the active ones, in order.
  const previewItems = items.filter((i) => i.active);

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div>
          <div>
            <h3 className="text-sm font-bold text-heading">{heading}</h3>
            <p className="text-xs text-subtle">{blurb}</p>
          </div>
        </div>
        <Badge tone={activeCount ? "emerald" : "slate"}>
          {activeCount ? `${activeCount} showing` : "None showing"}
        </Badge>
      </div>

      {loading ? (
        <p className="text-sm text-subtle">Loading…</p>
      ) : (
        <div className="space-y-4">
          {/* One language selector for the whole list rather than one per row: an admin writes all
              the English, then all the Bangla, and a per-row toggle would mean ten clicks to do it. */}
          <div className="flex gap-1 rounded-xl bg-overlay/[0.04] p-1">
            {(["en", "bn"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={
                  "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition " +
                  (lang === l ? "bg-primary text-btn-ink shadow-sm" : "text-muted hover:text-fg")
                }
              >
                {l === "en" ? "English" : "Bangla"}
              </button>
            ))}
          </div>

          {items.length === 0 && (
            <p className="rounded-xl border border-dashed border-line/[0.12] bg-overlay/[0.02] px-4 py-8 text-center text-sm text-subtle">
              Nothing here yet. Add one below.
            </p>
          )}

          {items.map((item, i) => {
            const title = lang === "bn" ? item.titleBn : item.titleEn;
            const body = lang === "bn" ? item.bodyBn : item.bodyEn;
            const otherLangWritten = lang === "bn"
              ? !!(item.titleEn || item.bodyEn)
              : !!(item.titleBn || item.bodyBn);

            return (
              <div key={item.id} className="rounded-xl border border-line/[0.08] bg-overlay/[0.02] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-subtle">#{i + 1}</span>
                    {/* The switch this whole feature exists for. Its own control per row, not a
                        mode of the list. */}
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-fg">
                      <input
                        type="checkbox"
                        checked={item.active}
                        onChange={(e) => update(item.id, { active: e.target.checked })}
                        className="h-4 w-4 accent-primary"
                      />
                      {item.active ? "Showing" : "Hidden"}
                    </label>
                    {!otherLangWritten && (title || body) && (
                      <Badge tone="amber">{lang === "en" ? "No Bangla" : "No English"}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => move(item.id, -1)} disabled={i === 0}
                      aria-label="Move up"
                      className="rounded-lg p-1.5 text-muted transition hover:bg-overlay/[0.06] hover:text-heading disabled:pointer-events-none disabled:opacity-30">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => move(item.id, 1)} disabled={i === items.length - 1}
                      aria-label="Move down"
                      className="rounded-lg p-1.5 text-muted transition hover:bg-overlay/[0.06] hover:text-heading disabled:pointer-events-none disabled:opacity-30">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => void remove(item)} aria-label="Delete"
                      className="rounded-lg p-1.5 text-muted transition hover:bg-danger/10 hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    <Field label="Title" hint="Leave the title and details blank to show only the image.">
                      <TextInput maxLength={120} value={title}
                        placeholder={titlePlaceholder[lang]}
                        onChange={(e) => update(item.id, lang === "bn" ? { titleBn: e.target.value } : { titleEn: e.target.value })} />
                    </Field>
                    <Field label="Details">
                      <TextArea rows={4} maxLength={1000} value={body}
                        placeholder={bodyPlaceholder[lang]}
                        onChange={(e) => update(item.id, lang === "bn" ? { bodyBn: e.target.value } : { bodyEn: e.target.value })} />
                    </Field>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-bold text-fg">
                      Image <span className="font-normal text-subtle">(shared by both languages)</span>
                    </div>
                    <div className="flex items-center justify-center rounded-xl border border-dashed border-line/[0.12] bg-overlay/[0.02] p-3">
                      {item.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={item.imageUrl} alt="" className="max-h-40 w-full rounded-lg object-contain" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-6 text-subtle">
                          <ImageIcon className="h-8 w-8" />
                          <span className="text-[11px]">No image</span>
                        </div>
                      )}
                    </div>
                    <label className="block">
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => void onPickImage(item.id, e)} />
                      <span className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-line/[0.1] bg-overlay/[0.03] px-3 py-2 text-xs font-semibold text-fg transition hover:bg-overlay/[0.06]">
                        {uploadingId === item.id ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                        {item.imageUrl ? "Replace image" : "Upload image"}
                      </span>
                    </label>
                    {item.imageUrl && (
                      <Button type="button" variant="secondary" icon={Trash2} className="w-full"
                        onClick={() => update(item.id, { imageUrl: null })}>
                        Remove image
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" icon={Plus}
              disabled={items.length >= MAX_ITEMS}
              onClick={() => setItems((xs) => [...xs, blankItem()])}>
              Add another
            </Button>
            <Button type="button" variant="secondary" icon={Eye} disabled={!previewItems.length}
              onClick={() => setPreviewing("en")}>
              Preview English
            </Button>
            <Button type="button" variant="secondary" icon={Eye} disabled={!previewItems.length}
              onClick={() => setPreviewing("bn")}>
              Preview Bangla
            </Button>
            <Button type="button" loading={saving} onClick={() => void save()}>{saveLabel}</Button>
          </div>

          <p className="text-xs text-subtle">
            {items.length >= MAX_ITEMS
              ? `That is the maximum of ${MAX_ITEMS}. Delete one to add another.`
              : "Adding, deleting and reordering only take effect when you press Save. Preview shows the ones that are switched on, in this order."}
          </p>
        </div>
      )}

      {previewing && previewItems.length > 0 && (
        <PopupCarousel items={previewItems} lang={previewing} onClose={() => setPreviewing(null)} />
      )}
    </Card>
  );
}
