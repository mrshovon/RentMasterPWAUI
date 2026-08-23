"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Wrench, TrendingUp, Power } from "lucide-react";
import { rentMasterFetch } from "../lib/api-service";
import { toast } from "./toast";
import { confirmDialog } from "./confirm";
import { formatCurrency } from "../lib/format";
import { BuildingAmenity, BuildingIncomeSource } from "../types/api";
import {
  Card, StatCard, Badge, Button, Modal, Field, TextInput, TextArea, PageHeader, EmptyState,
} from "./ui";

// =====================================================================================
// 🏢 BUILDING ADMIN — SETUP
//
// Two config lists: the amenities the building runs (with what each costs to run) and the
// non-rent income sources it collects from. Both hold DEFINITIONS only — no money moves here.
// The actual transactions live in the Accounts tab, and these lists exist so the categories
// there stay consistent instead of being retyped every month.
//
// English-only, like the rest of the building console. See scripts/check-i18n.mjs.
// =====================================================================================

export function BuildingSetupTab() {
  const [amenities, setAmenities] = useState<BuildingAmenity[]>([]);
  const [sources, setSources] = useState<BuildingIncomeSource[]>([]);
  const [loading, setLoading] = useState(true);

  const [amenityOpen, setAmenityOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<BuildingAmenity | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<BuildingIncomeSource | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [a, s] = await Promise.allSettled([
        rentMasterFetch<{ data: BuildingAmenity[] }>("/api/admin/building/amenities"),
        rentMasterFetch<{ data: BuildingIncomeSource[] }>("/api/admin/building/income-sources"),
      ]);
      if (a.status === "fulfilled") setAmenities(a.value.data || []);
      else toast.error((a.reason as Error).message);
      if (s.status === "fulfilled") setSources(s.value.data || []);
      else toast.error((s.reason as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => ({
    runningCost: amenities.filter((a) => a.is_active).reduce((s, a) => s + Number(a.monthly_cost || 0), 0),
    expectedIncome: sources.filter((s) => s.is_active).reduce((sum, s) => sum + Number(s.default_amount || 0), 0),
  }), [amenities, sources]);

  async function removeAmenity(a: BuildingAmenity) {
    const ok = await confirmDialog({
      title: `Delete "${a.name}"?`,
      message: "Past expense entries keep their category text — this only removes the shortcut.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await rentMasterFetch(`/api/admin/building/amenities/${a.id}`, { method: "DELETE" });
      setAmenities((list) => list.filter((x) => x.id !== a.id));
      toast.success("Amenity deleted.");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function removeSource(s: BuildingIncomeSource) {
    const ok = await confirmDialog({
      title: `Delete "${s.name}"?`,
      message: "Past income entries keep their category text — this only removes the shortcut.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await rentMasterFetch(`/api/admin/building/income-sources/${s.id}`, { method: "DELETE" });
      setSources((list) => list.filter((x) => x.id !== s.id));
      toast.success("Income source deleted.");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function toggleAmenity(a: BuildingAmenity) {
    try {
      const res = await rentMasterFetch<{ data: BuildingAmenity }>(`/api/admin/building/amenities/${a.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !a.is_active }),
      });
      setAmenities((list) => list.map((x) => (x.id === a.id ? res.data : x)));
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function toggleSource(s: BuildingIncomeSource) {
    try {
      const res = await rentMasterFetch<{ data: BuildingIncomeSource }>(`/api/admin/building/income-sources/${s.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !s.is_active }),
      });
      setSources((list) => list.map((x) => (x.id === s.id ? res.data : x)));
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  if (loading) return <Card className="p-8 text-center text-sm text-muted">Loading…</Card>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Building setup"
        subtitle="What this building runs, and where its non-rent money comes from. Definitions only — no money moves here."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Monthly running cost" value={formatCurrency(totals.runningCost)}
          sub="Sum of the active amenities" icon={Wrench} accent="rose"
        />
        <StatCard
          label="Expected other income" value={formatCurrency(totals.expectedIncome)}
          sub="Sum of the active income sources" icon={TrendingUp} accent="emerald"
        />
      </div>

      {/* ---------------- amenities ---------------- */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-heading">
            <Wrench className="h-4 w-4 text-primary" /> Amenities
          </h3>
          <Button size="sm" icon={Plus} onClick={() => setAmenityOpen(true)}>Add</Button>
        </div>

        {amenities.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No amenities listed"
            hint="Add the lift, generator, guards, water pump — whatever this building runs and pays for."
          />
        ) : (
          <div className="space-y-2">
            {amenities.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-heading">{a.name}</span>
                    {!a.is_active && <Badge tone="slate">Inactive</Badge>}
                  </div>
                  <div className="text-xs text-muted">
                    {formatCurrency(Number(a.monthly_cost || 0))} / month
                    {a.description ? ` · ${a.description}` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="ghost" icon={Power} onClick={() => toggleAmenity(a)}>
                    {a.is_active ? "Disable" : "Enable"}
                  </Button>
                  <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditingAmenity(a)}>Edit</Button>
                  <Button size="sm" variant="danger" icon={Trash2} onClick={() => removeAmenity(a)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ---------------- income sources ---------------- */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-heading">
            <TrendingUp className="h-4 w-4 text-primary" /> Income sources
          </h3>
          <Button size="sm" icon={Plus} onClick={() => setSourceOpen(true)}>Add</Button>
        </div>

        {sources.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No income sources listed"
            hint="Rooftop rent, car parking, signboard space, community hall hire — anything the building earns beyond rent."
          />
        ) : (
          <div className="space-y-2">
            {sources.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-heading">{s.name}</span>
                    {!s.is_active && <Badge tone="slate">Inactive</Badge>}
                  </div>
                  <div className="text-xs text-muted">
                    {formatCurrency(Number(s.default_amount || 0))}
                    {s.category ? ` · ${s.category}` : ""}
                    {s.note ? ` · ${s.note}` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="ghost" icon={Power} onClick={() => toggleSource(s)}>
                    {s.is_active ? "Disable" : "Enable"}
                  </Button>
                  <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditingSource(s)}>Edit</Button>
                  <Button size="sm" variant="danger" icon={Trash2} onClick={() => removeSource(s)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <AmenityModal
        open={amenityOpen || !!editingAmenity}
        amenity={editingAmenity}
        onClose={() => { setAmenityOpen(false); setEditingAmenity(null); }}
        onSaved={load}
      />
      <IncomeSourceModal
        open={sourceOpen || !!editingSource}
        source={editingSource}
        onClose={() => { setSourceOpen(false); setEditingSource(null); }}
        onSaved={load}
      />
    </div>
  );
}

function AmenityModal({
  open, amenity, onClose, onSaved,
}: {
  open: boolean;
  amenity: BuildingAmenity | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", description: "", monthlyCost: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: amenity?.name || "",
      description: amenity?.description || "",
      monthlyCost: amenity ? String(amenity.monthly_cost ?? "") : "",
    });
  }, [amenity, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Give the amenity a name."); return; }
    try {
      setSaving(true);
      const payload = {
        name: form.name,
        description: form.description,
        monthlyCost: Number(form.monthlyCost || 0),
      };
      if (amenity) {
        await rentMasterFetch(`/api/admin/building/amenities/${amenity.id}`, {
          method: "PATCH", body: JSON.stringify(payload),
        });
      } else {
        await rentMasterFetch("/api/admin/building/amenities", {
          method: "POST", body: JSON.stringify(payload),
        });
      }
      await onSaved();
      onClose();
      toast.success(amenity ? "Amenity updated." : "Amenity added.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={amenity ? "Edit amenity" : "Add an amenity"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" required>
          <TextInput required value={form.name} placeholder="Lift"
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Monthly running cost" hint="Indicative only. Nothing is calculated from it.">
          <TextInput type="number" min="0" step="0.01" value={form.monthlyCost}
            onChange={(e) => setForm({ ...form, monthlyCost: e.target.value })} />
        </Field>
        <Field label="Description">
          <TextArea rows={2} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Button type="submit" loading={saving} className="w-full">
          {amenity ? "Save changes" : "Add amenity"}
        </Button>
      </form>
    </Modal>
  );
}

function IncomeSourceModal({
  open, source, onClose, onSaved,
}: {
  open: boolean;
  source: BuildingIncomeSource | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", category: "", defaultAmount: "", note: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: source?.name || "",
      category: source?.category || "",
      defaultAmount: source ? String(source.default_amount ?? "") : "",
      note: source?.note || "",
    });
  }, [source, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Give the income source a name."); return; }
    try {
      setSaving(true);
      const payload = {
        name: form.name,
        category: form.category,
        defaultAmount: Number(form.defaultAmount || 0),
        note: form.note,
      };
      if (source) {
        await rentMasterFetch(`/api/admin/building/income-sources/${source.id}`, {
          method: "PATCH", body: JSON.stringify(payload),
        });
      } else {
        await rentMasterFetch("/api/admin/building/income-sources", {
          method: "POST", body: JSON.stringify(payload),
        });
      }
      await onSaved();
      onClose();
      toast.success(source ? "Income source updated." : "Income source added.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={source ? "Edit income source" : "Add an income source"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" required>
          <TextInput required value={form.name} placeholder="Rooftop rent"
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" hint="Used when booking it in Accounts.">
            <TextInput value={form.category} placeholder="Other income"
              onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </Field>
          <Field label="Usual amount">
            <TextInput type="number" min="0" step="0.01" value={form.defaultAmount}
              onChange={(e) => setForm({ ...form, defaultAmount: e.target.value })} />
          </Field>
        </div>
        <Field label="Note">
          <TextArea rows={2} value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </Field>
        <Button type="submit" loading={saving} className="w-full">
          {source ? "Save changes" : "Add income source"}
        </Button>
      </form>
    </Modal>
  );
}
