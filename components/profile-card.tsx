"use client";

import { useEffect, useState } from "react";
import { UserRound, Mail, Phone } from "lucide-react";
import { Card, Button, Field, TextInput } from "./ui";
import { toast } from "./toast";
import { rentMasterFetch, getStoredSession, setStoredSession } from "../lib/api-service";
import type { AccountProfile, TenantProfile } from "../types/api";

// =============================================================================
// Profile editing, rendered from the Settings tab of each dashboard.
//
// Two shapes because the two identities live in different places: owners and the super-admin
// are Supabase auth users (name/phone in user_metadata, email on the auth user), while tenants
// are rows in the `tenants` table with no email at all — their sign-in identity is their phone.
//
// Neither card can change the field a user signs in with. That is a deliberate limit, not an
// oversight: changing a login address or number needs a verification/uniqueness flow that
// doesn't exist, and getting it wrong locks someone out of their own account.
// =============================================================================

/** Keeps the cached session name in step with the server so the UI updates without a re-login. */
function syncSessionName(name: string) {
  const session = getStoredSession();
  if (session) setStoredSession({ ...session, name });
}

/** A field the user can see but not edit, with the reason why. */
function ReadOnlyField({
  label, value, hint, icon: Icon,
}: { label: string; value: string; hint: string; icon: typeof Mail }) {
  return (
    <div className="space-y-1.5">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-muted">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-line/[0.08] bg-overlay/[0.03] px-3 py-2.5 text-sm text-fg">
        <Icon className="h-4 w-4 shrink-0 text-subtle" />
        <span className="truncate">{value || "—"}</span>
      </div>
      <span className="block text-[11px] text-subtle">{hint}</span>
    </div>
  );
}

/* ============================================================ OWNER / ADMIN */

export function OwnerProfileCard() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const role = getStoredSession()?.role;
  const apiRole = role === "admin" ? "admin" : "owner";

  useEffect(() => {
    (async () => {
      try {
        const res = await rentMasterFetch<{ data: AccountProfile }>("/api/admin/owner/profile", { role: apiRole });
        setProfile(res.data);
        setName(res.data.name ?? "");
        setPhone(res.data.phone ?? "");
      } catch (e: any) {
        toast.error(`Could not load your profile: ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
    // apiRole is derived from the stored session, which cannot change while this is mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name cannot be empty."); return; }
    try {
      setSaving(true);
      const res = await rentMasterFetch<{ data: AccountProfile }>("/api/admin/owner/profile", {
        method: "PATCH", role: apiRole,
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      setProfile(res.data);
      syncSessionName(res.data.name ?? name.trim());
      toast.success("Profile updated.");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2 text-primary"><UserRound className="h-4 w-4" /></div>
        <div>
          <h3 className="text-sm font-bold text-heading">Your profile</h3>
          <p className="text-xs text-subtle">The name and number shown to your tenants.</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-subtle">Loading…</p>
      ) : (
        <form onSubmit={submit} className="max-w-md space-y-4">
          <ReadOnlyField
            label="Email" icon={Mail} value={profile?.email ?? ""}
            hint="This is the account you sign in with. Contact support to change it."
          />
          <Field label="Full name" required>
            <TextInput required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Phone" hint="Used on receipts and for tenants to reach you.">
            <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
          </Field>
          <Button type="submit" loading={saving}>Save profile</Button>
        </form>
      )}
    </Card>
  );
}

/* ============================================================ TENANT */

export function TenantProfileCard() {
  const [tenant, setTenant] = useState<TenantProfile["tenant"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [familyMembers, setFamilyMembers] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await rentMasterFetch<{ data: TenantProfile }>("/api/admin/tenants/me", { role: "tenant" });
        const t = res.data.tenant;
        setTenant(t);
        setName(t.name ?? "");
        setFamilyMembers(t.family_members == null ? "" : String(t.family_members));
      } catch (e: any) {
        toast.error(`Could not load your profile: ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name cannot be empty."); return; }
    try {
      setSaving(true);
      const res = await rentMasterFetch<{ data: { name: string; family_members: number } }>(
        "/api/admin/tenants/me",
        {
          method: "PATCH", role: "tenant",
          body: JSON.stringify({
            name: name.trim(),
            familyMembers: familyMembers === "" ? undefined : Number(familyMembers),
          }),
        },
      );
      setTenant((t) => (t ? { ...t, ...res.data } : t));
      syncSessionName(res.data.name ?? name.trim());
      toast.success("Profile updated.");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2 text-primary"><UserRound className="h-4 w-4" /></div>
        <div>
          <h3 className="text-sm font-bold text-heading">Your profile</h3>
          <p className="text-xs text-subtle">Your details as your owner sees them.</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-subtle">Loading…</p>
      ) : (
        <form onSubmit={submit} className="max-w-md space-y-4">
          <ReadOnlyField
            label="Phone" icon={Phone} value={tenant?.phone ?? ""}
            hint="This is the number you sign in with. Ask your owner if it needs changing."
          />
          <Field label="Full name" required>
            <TextInput required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Family members" hint="How many people live in the unit.">
            <TextInput type="number" min="0" max="99" value={familyMembers}
              onChange={(e) => setFamilyMembers(e.target.value)} placeholder="e.g. 4" />
          </Field>
          <Button type="submit" loading={saving}>Save profile</Button>
        </form>
      )}
    </Card>
  );
}
