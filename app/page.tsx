"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Phone, Lock, Mail, User, UserPlus, Tag } from "lucide-react";
import {
  apiLogin, apiForgotPassword, apiSignup, apiTermsVersion,
  getStoredSession, setStoredSession, clearSession, ensureValidToken, sessionRoleFor,
} from "../lib/api-service";
import { LegalLinks } from "../components/legal-links";
import { LEGAL_VERSION } from "../content/legal/generated";
import { Button, Modal, Field, TextInput, PasswordInput, EmailField, PhoneField } from "../components/ui";
import { validateEmail, validatePhone, isSystemLogin } from "../lib/validate";
import { toast } from "../components/toast";
import { DownloadAndroid } from "../components/download-android";
import { LanguageToggle } from "../components/language-toggle";
import { ThemeToggle } from "../components/theme-toggle";
import { APP_VERSION } from "../lib/app-config";
import { useT } from "../lib/i18n";

// True when the current URL carries a Supabase password-recovery token in any of its three
// shapes (implicit hash, PKCE ?code, or a {{ .TokenHash }} template link).
function hasRecoveryToken(): boolean {
  if (typeof window === "undefined") return false;
  const { search, hash } = window.location;
  const both = search + hash;
  return (
    /[?&#]code=/.test(both) ||
    /[?&#]token_hash=/.test(both) ||
    /type=recovery/.test(both) ||
    /[?&#]access_token=/.test(hash)
  );
}

export default function EntryGatewayPage() {
  const t = useT();
  // Owners are the primary audience, so their portal is the default and the leftmost tab.
  const [tab, setTab] = useState<"tenant" | "owner">("owner");
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

  // A password-recovery link that lands HERE instead of /reset-password is forwarded, carrying
  // its query and hash intact.
  //
  // Supabase silently ignores a redirectTo that isn't on its Redirect URLs allow-list and
  // substitutes the project's Site URL — which is this page. The recovery token then arrives
  // attached to a screen that has no idea what to do with it, so the user clicks their link and
  // sees a plain login form: the exact "the email arrives but nothing happens" report. Rather
  // than depend on that dashboard setting being right, recognise the token and route it.
  useEffect(() => {
    if (!hasRecoveryToken()) return;
    const { search, hash } = window.location;
    window.location.replace(`/reset-password${search}${hash}`);
  }, []);

  // /plans sends people here with ?signup=1 so the pricing page's buttons land straight in the
  // signup form rather than on a login screen the visitor then has to decode. The parameter is
  // stripped afterwards so a refresh (or a shared URL) does not reopen the modal.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("signup") !== "1") return;
    setSignupOpen(true);
    params.delete("signup");
    const rest = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (rest ? `?${rest}` : ""));
  }, []);

  // On open: if a session already exists, refresh its token if needed and forward to the
  // dashboard. Only fall back to the login form when there's no session (or the refresh failed).
  useEffect(() => {
    // Deferred to the redirect above. Both effects run before either navigation commits, so
    // without this an owner who is still signed in elsewhere gets sent to their dashboard and
    // the recovery token is thrown away.
    if (hasRecoveryToken()) return;
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
    role: "owner" | "tenant" | "admin" | "building", userId: string, name: string,
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
    // Catch a mistyped number here rather than spending a login attempt (and a slot in the
    // per-identifier throttle) on something that cannot match any row.
    const parsedPhone = validatePhone(phone, { required: true });
    if (!parsedPhone.ok) { setError(parsedPhone.error); return; }
    if (!pass.trim()) { setError("Enter your passcode."); return; }
    try {
      setLoading(true);
      // Send the canonical form; the backend also tries the other spellings a row might be
      // stored under, so an old record still matches.
      const r = await apiLogin({ mode: "tenant", phone: parsedPhone.value, passcode: pass.trim() });
      persist("tenant", r.id, r.name, r.token);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function loginOwner(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsedEmail = validateEmail(email, { required: true });
    if (!parsedEmail.ok) { setError(parsedEmail.error); return; }
    if (!ownerPass.trim()) { setError("Enter your password."); return; }
    try {
      setLoading(true);
      const r = await apiLogin({ mode: "owner", email: parsedEmail.value, password: ownerPass });
      // sessionRoleFor maps the auth metadata role onto the stored role AND the route segment.
      // This line used to collapse everything that was not "admin" into "owner", which is where a
      // new role silently lands on the wrong dashboard.
      persist(sessionRoleFor(r.role), r.id, r.name, r.token, r.refreshToken, r.expiresAt);
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
            <img src="/logo.png" alt="Bari360" className="h-9 w-9 rounded-xl object-cover" />
            <span className="text-sm font-black uppercase tracking-widest text-fg">
              Bari360
            </span>
          </div>

          <div className="max-w-md space-y-5">
            <span className="inline-block rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
              {t("Property Management, Reimagined")}
            </span>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-heading">
              {t("Properties, tenants, billing and requests — one calm dashboard.")}
            </h1>
            <p className="text-sm leading-relaxed text-muted">
              {t("Track occupancy, generate rent invoices, resolve maintenance tickets and broadcast notices from a single, mobile-ready portal.")}
            </p>

            <EntryCtas onSignup={() => setSignupOpen(true)} />
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-faint">Bari360 · v{APP_VERSION}</span>
            <DownloadAndroid variant="icon" />
            <LegalLinks />
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-md space-y-8">
            {/* The language and theme switches have to be reachable BEFORE signing in, or they're
                out of reach for exactly the users who need them. */}
            <div className="flex items-center justify-center gap-2 lg:justify-end">
              <LanguageToggle variant="icon" className="border border-line/[0.08]" />
              <ThemeToggle variant="icon" className="border border-line/[0.08]" />
            </div>

            <div className="space-y-1.5 text-center lg:text-left">
              <h2 className="text-3xl font-extrabold tracking-tight text-heading">
                {t("Welcome back")}
              </h2>
              <p className="text-sm text-muted">
                {t("Choose your access portal to continue.")}
              </p>
            </div>

            {/* Segmented control */}
            <div className="flex rounded-xl border border-line/[0.06] bg-bg/60 p-1">
              {(["owner", "tenant"] as const).map((portal) => (
                <button
                  key={portal}
                  onClick={() => setTab(portal)}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                    tab === portal
                      ? portal === "tenant"
                        ? "bg-surface text-success shadow"
                        : "bg-surface text-primary shadow"
                      : "text-subtle hover:text-fg"
                  }`}
                >
                  {portal === "tenant" ? t("Resident") : t("Owner")}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-line/[0.06] bg-surface/40 p-6 backdrop-blur-xl sm:p-8">
              {tab === "tenant" ? (
                <form onSubmit={loginTenant} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted">
                      {t("Registered phone")} <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                      <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={20}
                        required
                        placeholder="01712345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="field-input pl-10 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted">
                      {t("Passcode")} <span className="text-danger">*</span>
                    </label>
                    <PasswordInput
                      leftIcon={Lock}
                      placeholder="••••"
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      className="font-mono"
                    />
                    <p className="text-[11px] text-subtle">
                      {t("Tip: your passcode was provided by your landlord.")}
                    </p>
                  </div>
                  {error && <p className="text-xs text-danger">{error}</p>}
                  <Button type="submit" loading={loading} variant="success" className="w-full" icon={ArrowRight}>
                    {t("Enter resident portal")}
                  </Button>
                </form>
              ) : (
                <form onSubmit={loginOwner} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted">
                      {t("Email or login ID")} <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                      {/* Still type="email": a building login ID is a valid address, so native
                          validation accepts it and the keyboard stays the right one for the far
                          larger population of owners who really do sign in with an email. */}
                      <input type="email" inputMode="email" autoComplete="username" autoCapitalize="none"
                        spellCheck={false} maxLength={254} required
                        placeholder="owner@example.com" value={email}
                        onChange={(e) => setEmail(e.target.value)} className="field-input pl-10" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted">
                      {t("Password")} <span className="text-danger">*</span>
                    </label>
                    <PasswordInput leftIcon={Lock} placeholder="••••••••" value={ownerPass}
                      onChange={(e) => setOwnerPass(e.target.value)} />
                  </div>
                  {error && <p className="text-xs text-danger">{error}</p>}
                  <Button type="submit" loading={loading} className="w-full" icon={ArrowRight}>
                    {t("Sign in")}
                  </Button>
                  <button type="button" onClick={() => setForgotOpen(true)}
                    className="block w-full text-center text-xs font-medium text-muted transition hover:text-primary">
                    {t("Forgot password?")}
                  </button>
                  <p className="text-center text-xs text-subtle">
                    {t("New here?")}{" "}
                    <button type="button" onClick={() => setSignupOpen(true)}
                      className="font-semibold text-primary transition hover:text-primary">
                      {t("Create an owner account")}
                    </button>
                  </p>
                </form>
              )}
            </div>

            {/* Mobile download affordance (the brand panel's is desktop-only). Browser-only.
                The legal links ride along here for the same reason: on a phone the brand panel
                never renders, so this is the ONLY place an unauthenticated visitor can reach them. */}
            <div className="flex flex-col items-center gap-3 lg:hidden">
              {/* The brand panel never renders on a phone, so without this second copy the two
                  calls to action would be invisible to most visitors. Same reason DownloadAndroid
                  and LegalLinks appear twice on this page. */}
              <EntryCtas onSignup={() => setSignupOpen(true)} className="w-full" />
              <DownloadAndroid variant="icon" />
              <LegalLinks />
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

/**
 * The two front-page calls to action.
 *
 * Rendered TWICE — once in the desktop-only brand panel under the hero, once in the `lg:hidden`
 * block below the login card — because the brand panel does not exist on a phone and that is
 * where most visitors arrive. `DownloadAndroid` and `LegalLinks` already do exactly this.
 *
 * Sign up opens the modal that is already mounted on this page rather than navigating; "See
 * plans" is a real link so it can be opened in a new tab, shared, and crawled.
 */
function EntryCtas({ onSignup, className = "" }: { onSignup: () => void; className?: string }) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${className}`}>
      <Button icon={UserPlus} onClick={onSignup} className="sm:flex-1">
        Sign up with us
      </Button>
      <Link href="/plans" className="sm:flex-1">
        <Button variant="secondary" icon={Tag} className="w-full">
          See plans
        </Button>
      </Link>
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
  const [accepted, setAccepted] = useState(false);
  // The edition of the documents this form is showing. Echoed back on submit so the consent row
  // records the text the person actually saw, not whatever the server considers current later.
  const [termsVersion, setTermsVersion] = useState(LEGAL_VERSION);
  const [submitting, setSubmitting] = useState(false);
  const t = useT();

  // Only worth asking once the modal is actually open.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    apiTermsVersion().then((v) => { if (!cancelled) setTermsVersion(v); });
    return () => { cancelled = true; };
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error(t("Enter your name.")); return; }
    const parsedEmail = validateEmail(email, { required: true });
    if (!parsedEmail.ok) { toast.error(t(parsedEmail.error)); return; }
    // Optional field, but a number that IS given has to be usable — the account's phone is how
    // rent reminders and receipts reach the owner.
    const parsedPhone = validatePhone(phone);
    if (!parsedPhone.ok) { toast.error(t(parsedPhone.error)); return; }
    if (password.length < 8) { toast.error(t("Password must be at least 8 characters.")); return; }
    // The button is disabled until this is ticked, so this guard is for the paths that bypass it
    // (Enter in a text field). The backend enforces it independently — a client-side tick-box is
    // not a consent record.
    if (!accepted) { toast.error(t("Please accept the Terms and Privacy Policy.")); return; }
    try {
      setSubmitting(true);
      const r = await apiSignup({
        name: name.trim(), email: parsedEmail.value, phone: parsedPhone.value, password,
        acceptedTerms: true, termsVersion,
      });
      toast.success(t("Welcome to Bari360!"));
      onSuccess(r.id, r.name, r.token, r.refreshToken, r.expiresAt);
    } catch (err: any) {
      toast.error(err.message);
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("Create your owner account")}
      subtitle={t("Start free — you can upgrade your plan anytime.")}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t("Your name")} required>
          <TextInput required placeholder="Jane Landlord" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <EmailField label={t("Email")} required value={email} onChange={setEmail} />
          <PhoneField label={t("Phone")} value={phone} onChange={setPhone} />
        </div>
        <Field label={t("Password")} required hint={t("At least 8 characters.")}>
          <PasswordInput required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {/* Consent. The sentence is ONE translation key with {terms}/{privacy} placeholders rather
            than three concatenated fragments — Bangla puts the noun phrases in a different order,
            and fragment-joining produces nonsense there. */}
        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--primary))]"
          />
          <span>
            {t("I agree to the {terms} and the {privacy}.")
              .split(/(\{terms\}|\{privacy\})/)
              .map((part, i) => {
                if (part === "{terms}") {
                  return (
                    <Link key={i} href="/terms" target="_blank"
                      className="font-semibold text-primary underline underline-offset-2 hover:opacity-80">
                      {t("Terms & Conditions")}
                    </Link>
                  );
                }
                if (part === "{privacy}") {
                  return (
                    <Link key={i} href="/privacy" target="_blank"
                      className="font-semibold text-primary underline underline-offset-2 hover:opacity-80">
                      {t("Privacy Policy")}
                    </Link>
                  );
                }
                return <span key={i}>{part}</span>;
              })}
          </span>
        </label>
        <Button type="submit" loading={submitting} disabled={!accepted} className="w-full" icon={User}>
          {t("Create account")}
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
  // A building login has no inbox, so it gets an explanation instead of the "check your inbox"
  // panel. Promising a link that can never arrive is the worst copy this screen could show.
  const [blocked, setBlocked] = useState(false);
  const t = useT();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = validateEmail(email, { required: true });
    if (!parsed.ok) { toast.error(t(parsed.error)); return; }
    // Advice, not the rule — the backend refuses this domain too, and that is the one that counts.
    if (isSystemLogin(parsed.value)) { setBlocked(true); return; }
    try {
      setSending(true);
      await apiForgotPassword(parsed.value);
      setSent(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  function close() { setSent(false); setBlocked(false); onClose(); }

  return (
    <Modal open={open} onClose={close} title={t("Reset your password")}
      subtitle={t("We'll email you a secure link to set a new password.")}>
      {blocked ? (
        <div className="space-y-5">
          <p className="text-sm text-fg">
            {t("Building accounts can't reset their own password.")}
          </p>
          <p className="text-sm text-fg">
            {t("Ask your building administrator to set a new one for you — or the platform administrator, if you run the building.")}
          </p>
          <Button className="w-full" onClick={close}>{t("Done")}</Button>
        </div>
      ) : sent ? (
        <div className="space-y-5">
          <p className="text-sm text-fg">
            {t("If an account exists for")} <span className="font-semibold text-heading">{email.trim()}</span>
            {t(", a password reset link is on its way. Check your inbox (and spam folder).")}
          </p>
          <Button className="w-full" onClick={close}>{t("Done")}</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <EmailField label={t("Account email")} required placeholder="owner@example.com"
            value={email} onChange={setEmail} />
          <Button type="submit" loading={sending} className="w-full" icon={ArrowRight}>
            {t("Send reset link")}
          </Button>
        </form>
      )}
    </Modal>
  );
}
