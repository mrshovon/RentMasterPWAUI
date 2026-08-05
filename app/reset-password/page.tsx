"use client";

import { useEffect, useState } from "react";
import { Lock, ArrowRight, CheckCircle2, TriangleAlert } from "lucide-react";
import { getSupabaseBrowser } from "../../lib/supabase-browser";
import { apiResetComplete } from "../../lib/api-service";
import { Button, PasswordInput } from "../../components/ui";
import { ThemeToggle } from "../../components/theme-toggle";

// Landing page for the password-recovery email link.
//
// Supabase has three ways of handing over a recovery session, and which one arrives depends on
// dashboard settings this codebase does not control (the project's flow type and whether the
// email template was customised). Handling only one of them means the page silently shows
// "link expired" for a link that is perfectly valid:
//
//   1. #access_token=…&type=recovery   — implicit flow, consumed by detectSessionInUrl
//   2. ?code=…                          — PKCE flow, needs exchangeCodeForSession
//   3. ?token_hash=…&type=recovery      — custom {{ .TokenHash }} template, needs verifyOtp
//
// Then the owner picks a new password, we apply it via updateUser, log it for the audit trail,
// and send them to sign in.
type Phase = "checking" | "ready" | "invalid" | "saving" | "done";

// "invalid" covers two very different situations that used to be indistinguishable: a genuinely
// dead link, and this app not being configured to talk to Supabase at all. The second is a
// deployment fault, and telling an owner their link expired sends everyone hunting in the wrong
// place — so it gets its own message.
type FailureKind = "link" | "config";

const MIN_LEN = 8;

// How long to wait for a session to materialise before calling the link dead. The old 1500 ms
// was a race: on a cold, service-worker-cached load over a slow connection the token exchange
// can lose to the timer, and a valid link renders as expired.
const SESSION_WAIT_MS = 8000;

export default function ResetPasswordPage() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [failure, setFailure] = useState<FailureKind>("link");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  // On mount, turn whichever link shape we were given into a live recovery session.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    let supabase: ReturnType<typeof getSupabaseBrowser>;
    try {
      supabase = getSupabaseBrowser();
    } catch (e: any) {
      setError(e.message);
      setFailure("config");
      setPhase("invalid");
      return;
    }

    const succeed = () => {
      if (cancelled) return;
      if (timer) clearTimeout(timer);
      setPhase("ready");
    };

    // A PASSWORD_RECOVERY (or SIGNED_IN) event fires once any of the three exchanges lands.
    // Subscribed before we start, so an exchange that completes immediately isn't missed.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session || event === "PASSWORD_RECOVERY") succeed();
    });

    (async () => {
      // Already have a session? (detectSessionInUrl consumes the hash as the client is built.)
      const { data: existing } = await supabase.auth.getSession();
      if (cancelled) return;
      if (existing.session) { succeed(); return; }

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      try {
        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) throw exErr;
        } else if (tokenHash) {
          const { error: otpErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: (type as "recovery") || "recovery",
          });
          if (otpErr) throw otpErr;
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(e.message || "");
        setFailure("link");
        setPhase("invalid");
        return;
      }

      if (cancelled) return;
      // Either an exchange just succeeded (the auth listener above will flip us to "ready"), or
      // the URL carried nothing we recognise. Either way, give it a bounded wait.
      timer = setTimeout(() => {
        if (cancelled) return;
        setFailure("link");
        setPhase((p) => (p === "checking" ? "invalid" : p));
      }, SESSION_WAIT_MS);
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
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
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[440px] w-[440px] rounded-full bg-accent/10 blur-[120px]" />

      <div className="z-10 w-full max-w-md space-y-8">
        {/* Same reason as the sign-in screen: the theme switch has to be reachable while signed out. */}
        <div className="flex justify-end">
          <ThemeToggle variant="icon" className="border border-line/[0.08]" />
        </div>

        <div className="flex items-center justify-center gap-3">
          <img src="/logo.png" alt="Bari360" className="h-9 w-9 rounded-xl object-cover" />
          <span className="text-sm font-black uppercase tracking-widest text-fg">Bari360</span>
        </div>

        <div className="rounded-2xl border border-line/[0.06] bg-surface/40 p-6 backdrop-blur-xl sm:p-8">
          {phase === "checking" && (
            <p className="text-center text-sm text-muted">Verifying your reset link…</p>
          )}

          {phase === "invalid" && (
            <div className="space-y-4 text-center">
              <TriangleAlert className="mx-auto h-8 w-8 text-danger" />
              <h2 className="text-xl font-extrabold text-heading">
                {failure === "config" ? "Password reset is unavailable" : "Link expired or invalid"}
              </h2>
              <p className="text-sm text-muted">
                {failure === "config"
                  ? "This app isn't configured to complete password resets. Please contact support — your link is probably fine."
                  : "This password reset link is no longer valid. Request a new one from the sign-in page."}
              </p>
              {/* The underlying message is shown only for a config fault, where it names the
                  missing variable and is the whole point. For a dead link it would just be
                  Supabase's wording of what we already said. */}
              {failure === "config" && error && (
                <p className="text-[11px] text-subtle">{error}</p>
              )}
              <Button className="w-full" onClick={() => window.location.replace("/")} icon={ArrowRight}>
                Back to sign in
              </Button>
            </div>
          )}

          {phase === "done" && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
              <h2 className="text-xl font-extrabold text-heading">Password updated</h2>
              <p className="text-sm text-muted">You can now sign in with your new password.</p>
              <Button className="w-full" onClick={() => window.location.replace("/")} icon={ArrowRight}>
                Go to sign in
              </Button>
            </div>
          )}

          {(phase === "ready" || phase === "saving") && (
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-1.5 text-center">
                <h2 className="text-2xl font-extrabold tracking-tight text-heading">Choose a new password</h2>
                <p className="text-sm text-muted">Enter and confirm your new password below.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  New password <span className="text-danger">*</span>
                </label>
                <PasswordInput leftIcon={Lock} placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} autoFocus />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Confirm password <span className="text-danger">*</span>
                </label>
                <PasswordInput leftIcon={Lock} placeholder="••••••••" value={confirm}
                  onChange={(e) => setConfirm(e.target.value)} />
              </div>
              {error && <p className="text-xs text-danger">{error}</p>}
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
