"use client";

import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Search, Eye, EyeOff, type LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";
import { useT } from "../lib/i18n";

// NOTE ON TRANSLATION: the primitives below take their text as plain string props, so they
// translate it themselves. That is what makes the dashboards translatable without editing every
// PageHeader/Field/EmptyState call — pages keep passing English, which doubles as the lookup key.
// Strings with no dictionary entry (all of the admin console) render unchanged.

// -----------------------------------------------------------------------------
// Spinner
// -----------------------------------------------------------------------------
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}

export function FullScreenLoader({ label, sub }: { label: string; sub?: string }) {
  const t = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3 text-center animate-fade-in">
        <Spinner className="h-7 w-7 text-primary" />
        <div className="text-lg font-semibold text-fg">{t(label)}</div>
        {sub && <div className="text-xs font-mono text-subtle">{t(sub)}</div>}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Search input
// -----------------------------------------------------------------------------
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field-input pl-9 pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-subtle transition hover:text-fg"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Button
// -----------------------------------------------------------------------------
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md";
  loading?: boolean;
  icon?: LucideIcon;
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon: Icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-primary hover:bg-primary/90 text-btn-ink shadow-lg shadow-primary/20 border border-primary/40",
    secondary:
      "bg-overlay/[0.06] hover:bg-overlay/[0.1] text-fg border border-line/[0.12]",
    ghost: "bg-transparent hover:bg-overlay/[0.06] text-muted",
    danger:
      "bg-danger hover:bg-danger/90 text-btn-ink shadow-lg shadow-danger/20 border border-danger/40",
    success:
      "bg-success hover:bg-success/90 text-btn-ink shadow-lg shadow-success/20 border border-success/40",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
    md: "px-4 py-2.5 text-sm rounded-xl gap-2",
  };
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? <Spinner /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

// -----------------------------------------------------------------------------
// Card
// -----------------------------------------------------------------------------
export function Card({
  className,
  children,
  hover,
}: {
  className?: string;
  children: ReactNode;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "card-surface",
        hover && "transition-all hover:border-primary/30 hover:bg-surface-2",
        className
      )}
    >
      {children}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Stat tile
// -----------------------------------------------------------------------------
const accentMap = {
  indigo: "text-primary",
  emerald: "text-success",
  amber: "text-warning",
  cyan: "text-accent",
  rose: "text-danger",
  violet: "text-accent",
} as const;

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "indigo",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: LucideIcon;
  accent?: keyof typeof accentMap;
}) {
  const t = useT();
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
          {t(label)}
        </div>
        {Icon && (
          <div className={cn("rounded-lg bg-overlay/[0.04] p-1.5", accentMap[accent])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className={cn("mt-3 text-2xl font-black tracking-tight sm:text-3xl", accentMap[accent])}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-subtle">{sub}</div>}
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Badge
// -----------------------------------------------------------------------------
export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: "slate" | "emerald" | "amber" | "rose" | "indigo" | "cyan";
  className?: string;
}) {
  const tones = {
    slate: "bg-overlay/[0.06] text-muted border-line/[0.12]",
    emerald: "bg-success/10 text-success border-success/20",
    amber: "bg-warning/10 text-warning border-warning/20",
    rose: "bg-danger/10 text-danger border-danger/20",
    indigo: "bg-primary/10 text-primary border-primary/20",
    cyan: "bg-accent/10 text-accent border-accent/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

// -----------------------------------------------------------------------------
// Page header
// -----------------------------------------------------------------------------
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const t = useT();
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-heading">{t(title)}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{t(subtitle)}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Empty state
// -----------------------------------------------------------------------------
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  const t = useT();
  return (
    <Card className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="rounded-2xl border border-line/[0.08] bg-overlay/[0.03] p-4 text-subtle">
        <Icon className="h-7 w-7" />
      </div>
      <div className="text-sm font-semibold text-fg">{t(title)}</div>
      {hint && <div className="max-w-sm text-xs text-subtle">{t(hint)}</div>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Alert banner
// -----------------------------------------------------------------------------
export function Alert({ children }: { children: ReactNode }) {
  return (
    <div className="animate-fade-in rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
      {children}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Modal
// -----------------------------------------------------------------------------
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = "md",
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  size?: "md" | "lg";
  /** false = no close button at all, so the dialog cannot be dismissed (e.g. maintenance). */
  dismissible?: boolean;
}) {
  const t = useT();
  // Portal to <body> so the modal escapes any transformed ancestor (e.g. the
  // dashboard's `animate-slide-up` wrapper retains a transform, which would otherwise
  // make it the containing block for our `position: fixed` overlay and shrink it).
  //
  // Safe areas: `body` carries the inset padding (globals.css), but this overlay is
  // `position: fixed`, so it is sized against the VIEWPORT and ignores that padding entirely.
  // On a phone the modal is a bottom sheet, so without its own insets the footer buttons sit
  // underneath the Android gesture bar. Hence the explicit env() padding below.
  //
  // Dismissal: the ✕ button only. The backdrop deliberately carries no onClick — a stray click
  // or a text-selection drag that ended outside the panel used to discard a half-filled form.
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-scrim/80 backdrop-blur-sm animate-fade-in">
      {/* min-h-full wrapper: centers when short, lets the whole thing scroll from the
          true top when tall — so the modal header is never clipped. */}
      <div
        className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div
          // The insets go through CSS vars so the max-height can still differ per breakpoint
          // (inline `max-height` would win over every class and flatten that distinction).
          style={{
            "--safe-t": "env(safe-area-inset-top)",
            "--safe-b": "env(safe-area-inset-bottom)",
          } as CSSProperties}
          className={cn(
            "flex w-full animate-scale-in flex-col overflow-hidden rounded-t-3xl border border-line/[0.1] bg-surface shadow-2xl",
            "max-h-[calc(100dvh-var(--safe-t)-var(--safe-b))] sm:max-h-[calc(100dvh-2rem-var(--safe-t)-var(--safe-b))] sm:rounded-2xl",
            size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md"
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line/[0.08] p-5">
            <div>
              <h2 className="text-lg font-bold text-heading">{t(title)}</h2>
              {subtitle && <p className="mt-0.5 text-xs text-muted">{t(subtitle)}</p>}
            </div>
            {dismissible && (
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted transition hover:bg-overlay/[0.06] hover:text-heading"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <div
            className="flex-1 overflow-y-auto p-5"
            // Clears the phone's gesture bar so the last control in a bottom sheet stays tappable.
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// -----------------------------------------------------------------------------
// Form fields
// -----------------------------------------------------------------------------
export function Field({
  label,
  hint,
  children,
  required,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  const t = useT();
  return (
    <label className="block space-y-1.5">
      {/* Every field says which it is: a red asterisk when it must be filled in, a quiet
          "optional" when it need not be. Silence used to mean optional, which only reads that
          way once you already know the form. The tag drops out of the label's bold uppercase so
          it reads as an aside rather than part of the name. */}
      <span className="block text-[11px] font-bold uppercase tracking-wider text-muted">
        {t(label)}{" "}
        {required ? (
          <span className="text-danger">*</span>
        ) : (
          <span className="text-[10px] font-normal normal-case tracking-normal text-faint">{t("optional")}</span>
        )}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-subtle">{t(hint)}</span>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("field-input", props.className)} />;
}

/**
 * A password box with a reveal toggle. Typing a password blind is the main way people mistype
 * one, and this app asks for them on screens with no "try again" affordance (reset links expire).
 *
 * `leftIcon` exists because the sign-in and reset screens already draw a Lock inside the box;
 * passing it here keeps that markup in one place instead of each caller positioning its own.
 */
export function PasswordInput({
  leftIcon: Left,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { leftIcon?: LucideIcon }) {
  const [show, setShow] = useState(false);
  const t = useT();
  const label = show ? t("Hide password") : t("Show password");

  return (
    <div className="relative">
      {Left && (
        <Left className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
      )}
      <input
        {...props}
        type={show ? "text" : "password"}
        // field-input reserves no room on the right, so without pr-11 the toggle sits on top of
        // a long value.
        className={cn("field-input pr-11", Left && "pl-10", className)}
      />
      <button
        type="button" // never submits the form it lives in
        onClick={() => setShow((s) => !s)}
        aria-label={label}
        title={label}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted transition hover:text-heading"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("field-input resize-none", props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn("field-input appearance-none cursor-pointer", props.className)}
    />
  );
}
