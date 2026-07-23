"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Phone, Lock, Mail, User } from "lucide-react";
import {
  apiLogin, apiForgotPassword, apiSignup,
  getStoredSession, setStoredSession, clearSession, ensureValidToken,
} from "../lib/api-service";
import { Button, Modal, Field, TextInput } from "../components/ui";
import { toast } from "../components/toast";
import { DownloadAndroid } from "../components/download-android";
import { APP_VERSION } from "../lib/app-config";

export default function EntryGatewayPage() {
  const [tab, setTab] = useState<"tenant" | "owner">("tenant");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [email, setEmail] = useState("");
  const [ownerPass, setOwnerPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  // True until we've checked for an existing session, so the login form never flashes for an
  // already-logged-in user (the PWA start_url is "/", so every launch lands here first).
  const [checking, setChecking] = useState(true);

  // On open: if a session already exists, refresh its token if needed and forward to the
  // dashboard. Only fall back to the login form when there's no session (or the refresh failed).
  useEffect(() => {
    const session = getStoredSession();
    if (!session) { setChecking(false); return; }
    (async () => {
      const token = await ensureValidToken();
      if (token || !session.refreshToken) {
        // Valid (or a tenant with a long-lived JWT and no refresh token) -> go to the dashboard.
        window.location.replace(`/${session.role}`);
      } else {
        clearSession();
        setChecking(false);
      }
    })();
  }, []);

  // Push setup deliberately does NOT happen here: PushToggle (rendered in DashboardShell)
  // re-registers permitted devices on every dashboard mount and otherwise prompts from an
  // explicit button. `replace` (not `href`) so Back doesn't land on the login screen while signed in.
  function persist(
    role: "owner" | "tenant" | "admin", userId: string, name: string,
    token?: string, refreshToken?: string, expiresAt?: number,
  ) {
    setStoredSession({ role, userId, name, token, refreshToken, expiresAt });
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
      persist(r.role === "admin" ? "admin" : "owner", r.id, r.name, r.token, r.refreshToken, r.expiresAt);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  // While checking for an existing session, show a neutral loader instead of the login form.
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-line/10 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[440px] w-[440px] rounded-full bg-accent/10 blur-[120px]" />

      <div className="z-10 grid min-h-screen w-full lg:grid-cols-2">
        {/* Brand panel */}
        <div className="hidden flex-col justify-between border-r border-line/[0.06] p-12 lg:flex">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="RentMaster" className="h-9 w-9 rounded-xl object-cover" />
            <span className="text-sm font-black uppercase tracking-widest text-fg">
              RentMaster
            </span>
          </div>

          <div className="max-w-md space-y-5">
            <span className="inline-block rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
              Property Management, Reimagined
            </span>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-heading">
              Properties, tenants, billing and requests — one calm dashboard.
            </h1>
            <p className="text-sm leading-relaxed text-muted">
              Track occupancy, generate rent invoices, resolve maintenance
              tickets and broadcast notices from a single, mobile-ready portal.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-faint">RentMaster · v{APP_VERSION}</span>
            <DownloadAndroid variant="link" />
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-1.5 text-center lg:text-left">
              <h2 className="text-3xl font-extrabold tracking-tight text-heading">
                Welcome back
              </h2>
              <p className="text-sm text-muted">
                Choose your access portal to continue.
              </p>
            </div>

            {/* Segmented control */}
            <div className="flex rounded-xl border border-line/[0.06] bg-bg/60 p-1">
              {(["tenant", "owner"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                    tab === t
                      ? t === "tenant"
                        ? "bg-surface text-success shadow"
                        : "bg-surface text-primary shadow"
                      : "text-subtle hover:text-fg"
                  }`}
                >
                  {t === "tenant" ? "Resident" : "Owner / Admin"}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-line/[0.06] bg-surface/40 p-6 backdrop-blur-xl sm:p-8">
              {tab === "tenant" ? (
                <form onSubmit={loginTenant} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted">
                      Registered phone
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
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
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted">
                      Passcode
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                      <input
                        type="password"
                        placeholder="••••"
                        value={pass}
                        onChange={(e) => setPass(e.target.value)}
                        className="field-input pl-10 font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-subtle">
                      Tip: your passcode was provided by your landlord.
                    </p>
                  </div>
                  {error && <p className="text-xs text-danger">{error}</p>}
                  <Button type="submit" loading={loading} variant="success" className="w-full" icon={ArrowRight}>
                    Enter resident portal
                  </Button>
                </form>
              ) : (
                <form onSubmit={loginOwner} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Email</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                      <input type="email" placeholder="owner@example.com" value={email}
                        onChange={(e) => setEmail(e.target.value)} className="field-input pl-10" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                      <input type="password" placeholder="••••••••" value={ownerPass}
                        onChange={(e) => setOwnerPass(e.target.value)} className="field-input pl-10" />
                    </div>
                  </div>
                  {error && <p className="text-xs text-danger">{error}</p>}
                  <Button type="submit" loading={loading} className="w-full" icon={ArrowRight}>
                    Sign in
                  </Button>
                  <button type="button" onClick={() => setForgotOpen(true)}
                    className="block w-full text-center text-xs font-medium text-muted transition hover:text-primary">
                    Forgot password?
                  </button>
                  <p className="text-center text-xs text-subtle">
                    New here?{" "}
                    <button type="button" onClick={() => setSignupOpen(true)}
                      className="font-semibold text-primary transition hover:text-primary">
                      Create an owner account
                    </button>
                  </p>
                </form>
              )}
            </div>

            {/* Mobile download link (the brand panel with its link is desktop-only). Browser-only. */}
            <div className="flex justify-center lg:hidden">
              <DownloadAndroid variant="link" />
            </div>
          </div>
        </div>
      </div>

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} initialEmail={email} />
      <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)}
        onSuccess={(id, name, token, refreshToken, expiresAt) => persist("owner", id, name, token, refreshToken, expiresAt)} />
    </div>
  );
}

// Owner self-signup. Creates an auto-confirmed owner (free tier by default) and, on success,
// persists the returned session so the new owner lands straight on their dashboard.
function SignupModal({
  open, onClose, onSuccess,
}: {
  open: boolean; onClose: () => void;
  onSuccess: (id: string, name: string, token?: string, refreshToken?: string, expiresAt?: number) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Enter your name."); return; }
    if (!email.trim() || !email.includes("@")) { toast.error("Enter a valid email."); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    try {
      setSubmitting(true);
      const r = await apiSignup({ name: name.trim(), email: email.trim(), phone: phone.trim(), password });
      toast.success("Welcome to RentMaster!");
      onSuccess(r.id, r.name, r.token, r.refreshToken, r.expiresAt);
    } catch (err: any) {
      toast.error(err.message);
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create your owner account"
      subtitle="Start free — you can upgrade your plan anytime.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Your name" required>
          <TextInput required placeholder="Jane Landlord" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" required>
            <TextInput type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Phone">
            <TextInput placeholder="01712345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        </div>
        <Field label="Password" required hint="At least 8 characters.">
          <TextInput type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button type="submit" loading={submitting} className="w-full" icon={User}>
          Create account
        </Button>
      </form>
    </Modal>
  );
}

// Owner self-service password reset, step 1. Posts the email to the backend, which emails a
// recovery link. The response is deliberately generic, so we always show the same confirmation.
function ForgotPasswordModal({
  open, onClose, initialEmail,
}: {
  open: boolean; onClose: () => void; initialEmail: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) { toast.error("Enter a valid email."); return; }
    try {
      setSending(true);
      await apiForgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  function close() { setSent(false); onClose(); }

  return (
    <Modal open={open} onClose={close} title="Reset your password"
      subtitle="We'll email you a secure link to set a new password.">
      {sent ? (
        <div className="space-y-5">
          <p className="text-sm text-fg">
            If an account exists for <span className="font-semibold text-heading">{email.trim()}</span>, a password
            reset link is on its way. Check your inbox (and spam folder).
          </p>
          <Button className="w-full" onClick={close}>Done</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Account email" required>
            <TextInput type="email" required placeholder="owner@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" loading={sending} className="w-full" icon={ArrowRight}>
            Send reset link
          </Button>
        </form>
      )}
    </Modal>
  );
}
