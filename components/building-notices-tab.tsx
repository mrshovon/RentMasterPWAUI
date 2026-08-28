"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Megaphone, PenLine, Printer, Trash2, Users, Home } from "lucide-react";
import { rentMasterFetch } from "../lib/api-service";
import { toast } from "./toast";
import { confirmDialog } from "./confirm";
import { formatDate } from "../lib/format";
import { buildNoticeLetterHtml } from "../lib/building-print";
import { Building, BuildingNotice, BuildingOwner } from "../types/api";
import { PrintModal } from "./print-modal";
import {
  Card, Badge, Button, Modal, Field, TextInput, TextArea, Select, PageHeader, EmptyState,
} from "./ui";
import { useT } from "../lib/i18n";

// =====================================================================================
// 🏢 BUILDING ADMIN — NOTICES
//
// Issue a notice, and print it on the building's letterhead with a reference number and an
// authorised signature. Publishing also delivers an in-app copy: the route fans the notice out
// into the ordinary `notices` table so it lands in the right feeds, and pushes.
//
// There is no edit. A published notice carrying a reference number is a document, not a draft —
// correcting one means issuing another. Delete removes the building's own record and says so;
// the copies already delivered stay in people's feeds, because silently retracting them would
// make the app lie about what was published.
//
// The three AUDIENCE_LABEL strings are BOTH screen text (the badge) and PRINTED text (the
// letter's To: line), so they are translated at the point of use rather than at definition —
// lib/building-print.ts calls tr() on audienceLabel, and the badge calls t().
// =====================================================================================

const AUDIENCE_LABEL: Record<string, string> = {
  all_owners: "All flat owners",
  all_tenants: "All tenants of the building's own spaces",
  individual_owner: "One owner",
};

export function BuildingNoticesTab({
  building,
  owners,
  signatureUrl,
}: {
  building: Building | null;
  owners: BuildingOwner[];
  /** Uploaded in Settings. Absent means "Print signed" is not offered at all. */
  signatureUrl?: string | null;
}) {
  const t = useT();
  const [notices, setNotices] = useState<BuildingNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [printing, setPrinting] =
    useState<{ html: string; name: string; signed: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await rentMasterFetch<{ data: BuildingNotice[] }>("/api/admin/building/notices");
      setNotices(res.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // `signed` only decides whether the signature image travels on the header. There is no flag in
  // the document builder — the unsigned copy is simply one with no signatureUrl on it.
  function printNotice(n: BuildingNotice, signed: boolean) {
    if (!building) { toast.error(t("Your building details are still loading.")); return; }
    const target = n.target_owner_id ? owners.find((o) => o.owner_id === n.target_owner_id) : null;
    const html = buildNoticeLetterHtml({
      building: {
        name: building.name,
        address: building.address,
        city: building.city,
        letterheadUrl: building.letterhead_url,
        signatoryName: building.signatory_name,
        signatoryTitle: building.signatory_title,
        signatureUrl: signed ? signatureUrl || null : null,
      },
      title: n.title,
      content: n.content,
      issuedOn: n.issued_on,
      referenceNo: n.reference_no,
      noticeNo: n.notice_no ?? null,
      audienceLabel: target
        ? `${target.name || target.email || t("Owner")}${target.unit_label ? ` (${target.unit_label})` : ""}`
        : AUDIENCE_LABEL[n.audience] || null,
    });
    setPrinting({
      html,
      name: `notice-${signed ? "signed-" : ""}${n.reference_no || n.notice_no || n.issued_on}`
        .replace(/[^\w.-]+/g, "-"),
      signed,
    });
  }

  async function remove(n: BuildingNotice) {
    const ok = await confirmDialog({
      title: t("Delete this notice?"),
      message:
        "It leaves your record here. Copies already delivered stay in people's feeds — this does not unpublish it.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await rentMasterFetch(`/api/admin/building/notices/${n.id}`, { method: "DELETE" });
      setNotices((list) => list.filter((x) => x.id !== n.id));
      toast.success(t("Removed from your notice record."));
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notices"
        subtitle="Publish to the building, and print the same notice on your letterhead."
        action={<Button icon={Plus} onClick={() => setComposing(true)}>Issue a notice</Button>}
      />

      {loading ? (
        <Card className="p-8 text-center text-sm text-muted">Loading…</Card>
      ) : notices.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No notices yet"
          hint="Publish one to the owners or your tenants. It appears in their app, and prints on your letterhead with a reference number and a signature line."
          action={<Button icon={Plus} onClick={() => setComposing(true)}>Issue a notice</Button>}
        />
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <Card key={n.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-heading">{n.title}</h3>
                    <Badge tone={n.audience === "all_tenants" ? "cyan" : "indigo"}>
                      {t(AUDIENCE_LABEL[n.audience] || n.audience)}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {t("Ref {0} · {1} · delivered to {2}")
                      .replace("{0}", n.reference_no || `#${n.notice_no ?? ""}`)
                      .replace("{1}", formatDate(n.issued_on))
                      .replace("{2}", String(n.delivered_count))}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-fg">{n.content}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" icon={Printer} onClick={() => printNotice(n, false)}>Print</Button>
                  {/* Only when there IS a signature — without one this would produce a document
                      identical to the plain Print beside it. */}
                  {signatureUrl && (
                    <Button size="sm" variant="secondary" icon={PenLine}
                      onClick={() => printNotice(n, true)}>Print signed</Button>
                  )}
                  <Button size="sm" variant="danger" icon={Trash2} onClick={() => remove(n)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ComposeNoticeModal
        open={composing}
        owners={owners.filter((o) => o.is_active)}
        onClose={() => setComposing(false)}
        onIssued={load}
      />
      <PrintModal
        open={!!printing}
        onClose={() => setPrinting(null)}
        html={printing?.html || ""}
        title={printing?.signed ? "Signed notice" : "Notice"}
        subtitle={
          printing?.signed
            ? "On your building's letterhead, with your signature."
            : "On your building's letterhead, with a blank signature line."
        }
        fileName={printing?.name}
      />
    </div>
  );
}

function ComposeNoticeModal({
  open, owners, onClose, onIssued,
}: {
  open: boolean;
  owners: BuildingOwner[];
  onClose: () => void;
  onIssued: () => Promise<void>;
}) {
  const t = useT();
  const empty = {
    title: "", content: "", audience: "all_owners", targetOwnerId: "",
    issuedOn: new Date().toISOString().slice(0, 10), referenceNo: "",
  };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setForm(empty); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error(t("A notice needs a title and some text."));
      return;
    }
    if (form.audience === "individual_owner" && !form.targetOwnerId) {
      toast.error(t("Choose which owner this is for."));
      return;
    }
    try {
      setSaving(true);
      const res = await rentMasterFetch<{ warnings?: string[] }>("/api/admin/building/notices", {
        method: "POST",
        body: JSON.stringify(form),
      });
      await onIssued();
      onClose();
      // The printable record is the deliverable; a failed fan-out is reported rather than hidden,
      // so nobody assumes a notice reached people when it did not.
      if (res.warnings?.length) res.warnings.forEach((w) => toast.warning(w));
      else toast.success(t("Notice published."));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Issue a notice"
      subtitle="Delivered in the app, and printable on your letterhead.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title" required>
          <TextInput required value={form.title} placeholder="Water supply interruption"
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Notice" required hint="Line breaks are kept exactly as you type them.">
          <TextArea required rows={7} value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </Field>
        <Field label="Who is it for?" required>
          <Select value={form.audience}
            onChange={(e) => setForm({ ...form, audience: e.target.value, targetOwnerId: "" })}>
            <option value="all_owners">{t("All flat owners")}</option>
            <option value="individual_owner">{t("One owner")}</option>
            <option value="all_tenants">{t("Tenants of the building's own spaces")}</option>
          </Select>
        </Field>
        {form.audience === "individual_owner" && (
          <Field label="Which owner?" required>
            <Select required value={form.targetOwnerId}
              onChange={(e) => setForm({ ...form, targetOwnerId: e.target.value })}>
              <option value="">{t("Choose an owner…")}</option>
              {owners.map((o) => (
                <option key={o.owner_id} value={o.owner_id}>
                  {`${o.name || o.email}${o.unit_label ? ` — ${o.unit_label}` : ""}`}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Issue date" required>
            <TextInput required type="date" value={form.issuedOn}
              onChange={(e) => setForm({ ...form, issuedOn: e.target.value })} />
          </Field>
          <Field label="Reference number" hint="Optional. Falls back to the notice number.">
            <TextInput value={form.referenceNo} placeholder="RT/2026/14"
              onChange={(e) => setForm({ ...form, referenceNo: e.target.value })} />
          </Field>
        </div>
        <Button type="submit" loading={saving} className="w-full">Publish notice</Button>
      </form>
    </Modal>
  );
}

/** Small helper the Reports tab reuses for its audience icons. Kept here so the two files agree
 *  on what an audience looks like. */
export const AUDIENCE_ICON = { all_owners: Users, all_tenants: Home, individual_owner: Users };
