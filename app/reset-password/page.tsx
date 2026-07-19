"use client";

import { useEffect, useState } from "react";
import { Lock, ArrowRight, CheckCircle2, TriangleAlert } from "lucide-react";
import { getSupabaseBrowser } from "../../lib/supabase-browser";
import { apiResetComplete } from "../../lib/api-service";
import { Button } from "../../components/ui";

// Landing page for the password-recovery email link. Supabase drops a recovery session into the
// URL hash; the browser client (detectSessionInUrl) turns it into a live session on mount. We then
// let the owner pick a new password, apply it via updateUser, log it, and send them to sign in.
type Phase = "checking" | "ready" | "invalid" | "saving" | "done";

const MIN_LEN = 8;

export default function ResetPasswordPage() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  // On mount, wait for the recovery session to materialise from the URL hash.
  useEffect(() => {
    let cancelled = false;
    let supabase;
    try {
      supabase = getSupabaseBrowser();
    } catch (e: any) {
      setError(e.message);
      setPhase("invalid");
      return;
    }

    // A PASSWORD_RECOVERY event fires when the hash is parsed; also check for an existing session
    // in case the event already fired before this listener attached.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (session || event === "PASSWORD_RECOVERY") setPhase("ready");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) setPhase("ready");
      else {
        // Give the hash a beat to parse, then decide it's an invalid/expired link.
        setTimeout(() => {
          if (cancelled) return;
          setPhase((p) => (p === "checking" ? "invalid" : p));
        }, 1500);
      }
    });

    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < MIN_LEN) { setError(`Password must be at least ${MIN_LEN} characters.`); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    try {
      setPhase("saving");
      const supabase = getSupabaseBrowser();
      const { error: updErr } = await supabase.auth.updateUser({ password });
      if (updErr) throw updErr;

      // Record the reset for the admin audit log (best-effort), then end the recovery session.
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) await apiResetComplete(data.session.access_token);
      await supabase.auth.signOut();

      setPhase("done");
    } catch (err: any) {
      setError(err.message || "Could not update the password. The link may have expired.");
      setPhase("ready");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[440px] w-[440px] rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="z-10 w-full max-w-md space-y-8">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 text-sm font-black text-slate-950">RM</div>
          <span className="text-sm font-black uppercase tracking-widest text-slate-200">RentMaster</span>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/40 p-6 backdrop-blur-xl sm:p-8">
          {phase === "checking" && (
            <p className="text-center text-sm text-slate-400">Verifying your reset link…</p>
          )}

          {phase === "invalid" && (
            <div className="space-y-4 text-center">
              <TriangleAlert className="mx-auto h-8 w-8 text-rose-400" />
              <h2 className="text-xl font-extrabold text-white">Link expired or invalid</h2>
              <p className="text-sm text-slate-400">
                {error || "This password reset link is no longer valid. Request a new one from the sign-in page."}
              </p>
              <Button className="w-full" onClick={() => window.location.replace("/")} icon={ArrowRight}>
                Back to sign in
              </Button>
            </div>
          )}

          {phase === "done" && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
              <h2 className="text-xl font-extrabold text-white">Password updated</h2>
              <p className="text-sm text-slate-400">You can now sign in with your new password.</p>
              <Button className="w-full" onClick={() => window.location.replace("/")} icon={ArrowRight}>
                Go to sign in
              </Button>
            </div>
          )}

          {(phase === "ready" || phase === "saving") && (
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-1.5 text-center">
                <h2 className="text-2xl font-extrabold tracking-tight text-white">Choose a new password</h2>
                <p className="text-sm text-slate-400">Enter and confirm your new password below.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">New password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                  <input type="password" placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)} className="field-input pl-10" autoFocus />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Confirm password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                  <input type="password" placeholder="••••••••" value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} className="field-input pl-10" />
                </div>
              </div>
              {error && <p className="text-xs text-rose-400">{error}</p>}
              <Button type="submit" loading={phase === "saving"} className="w-full" icon={ArrowRight}>
                Update password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
