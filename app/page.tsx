"use client";

import { useState } from "react";
import { ArrowRight, Phone, Lock, Mail } from "lucide-react";
import { apiLogin } from "../lib/api-service";
import { Button } from "../components/ui";

export default function EntryGatewayPage() {
  const [tab, setTab] = useState<"tenant" | "owner">("tenant");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [email, setEmail] = useState("");
  const [ownerPass, setOwnerPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect immediately. Push setup deliberately does NOT happen here: PushToggle (rendered
  // in DashboardShell) re-registers permitted devices on every dashboard mount and otherwise
  // prompts from an explicit button. Awaiting it here stalled the redirect for seconds —
  // navigator.serviceWorker.ready never resolves in `next dev`, where the SW is disabled.
  // `replace` (not `href`) so Back doesn't land on the login screen while signed in.
  function persist(role: "owner" | "tenant" | "admin", userId: string, name: string, token?: string) {
    localStorage.setItem("rentmaster_session", JSON.stringify({ role, userId, name, token }));
    window.location.replace(`/${role}`);
  }

  // NOTE: `loading` is intentionally left true on success — the button must keep spinning until
  // the page navigates away, or the UI looks idle-but-done while the redirect is in flight.
  async function loginTenant(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone.trim() || !pass.trim()) return;
    try {
      setLoading(true);
      const r = await apiLogin({ mode: "tenant", phone: phone.trim(), passcode: pass.trim() });
      persist("tenant", r.id, r.name, r.token);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function loginOwner(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !ownerPass.trim()) return;
    try {
      setLoading(true);
      const r = await apiLogin({ mode: "owner", email: email.trim(), password: ownerPass });
      persist(r.role === "admin" ? "admin" : "owner", r.id, r.name, r.token);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[440px] w-[440px] rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="z-10 grid min-h-screen w-full lg:grid-cols-2">
        {/* Brand panel */}
        <div className="hidden flex-col justify-between border-r border-white/[0.06] p-12 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 text-sm font-black text-slate-950">
              RM
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-slate-200">
              RentMaster
            </span>
          </div>

          <div className="max-w-md space-y-5">
            <span className="inline-block rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-indigo-400">
              Property Management, Reimagined
            </span>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white">
              Properties, tenants, billing and requests — one calm dashboard.
            </h1>
            <p className="text-sm leading-relaxed text-slate-400">
              Track occupancy, generate rent invoices, resolve maintenance
              tickets and broadcast notices from a single, mobile-ready portal.
            </p>
          </div>

          <div className="font-mono text-xs text-slate-600">RentMaster PWA · v3.0</div>
        </div>

        {/* Form panel */}
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-1.5 text-center lg:text-left">
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                Welcome back
              </h2>
              <p className="text-sm text-slate-400">
                Choose your access portal to continue.
              </p>
            </div>

            {/* Segmented control */}
            <div className="flex rounded-xl border border-white/[0.06] bg-slate-950/60 p-1">
              {(["tenant", "owner"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                    tab === t
                      ? t === "tenant"
                        ? "bg-slate-900 text-emerald-400 shadow"
                        : "bg-slate-900 text-indigo-400 shadow"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t === "tenant" ? "Resident" : "Owner / Admin"}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-slate-900/40 p-6 backdrop-blur-xl sm:p-8">
              {tab === "tenant" ? (
                <form onSubmit={loginTenant} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Registered phone
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                      <input
                        type="tel"
                        placeholder="01712345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="field-input pl-10 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Passcode
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                      <input
                        type="password"
                        placeholder="••••"
                        value={pass}
                        onChange={(e) => setPass(e.target.value)}
                        className="field-input pl-10 font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Tip: your passcode was provided by your landlord.
                    </p>
                  </div>
                  {error && <p className="text-xs text-rose-400">{error}</p>}
                  <Button type="submit" loading={loading} variant="success" className="w-full" icon={ArrowRight}>
                    Enter resident portal
                  </Button>
                </form>
              ) : (
                <form onSubmit={loginOwner} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Email</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                      <input type="email" placeholder="owner@example.com" value={email}
                        onChange={(e) => setEmail(e.target.value)} className="field-input pl-10" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                      <input type="password" placeholder="••••••••" value={ownerPass}
                        onChange={(e) => setOwnerPass(e.target.value)} className="field-input pl-10" />
                    </div>
                  </div>
                  {error && <p className="text-xs text-rose-400">{error}</p>}
                  <Button type="submit" loading={loading} className="w-full" icon={ArrowRight}>
                    Sign in
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
