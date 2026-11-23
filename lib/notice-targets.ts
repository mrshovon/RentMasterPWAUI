// UI half of lib/notice-targets.ts in the backend. Values must match byte-for-byte: the admin's
// select sends these strings and the server validates them against the same allow-list.
// Labels are English only — the admin console is intentionally outside check-i18n.

export type NoticeAudience = "owner" | "tenant" | "building" | "admin" | "everyone";

export interface NoticeTargetOption {
  value: string;
  label: string;
}

export const NOTICE_TARGET_OPTIONS: Record<NoticeAudience, NoticeTargetOption[]> = {
  owner: [
    { value: "/owner", label: "Overview (home)" },
    { value: "/owner#overview", label: "Overview" },
    { value: "/owner#properties", label: "Properties" },
    { value: "/owner#tenants", label: "Tenants" },
    { value: "/owner#billing", label: "Billing" },
    { value: "/owner#maintenance", label: "Requests" },
    { value: "/owner#notices", label: "Notices" },
    { value: "/owner#reminders", label: "Reminders" },
    { value: "/owner#staff", label: "Staff" },
    { value: "/owner#accounts", label: "Accounts" },
    { value: "/owner#service-charge", label: "Service charge" },
    { value: "/owner#plan", label: "Plan" },
    { value: "/owner#support", label: "Support" },
    { value: "/owner#settings", label: "Settings" },
  ],
  tenant: [
    { value: "/tenant", label: "Home" },
    { value: "/tenant#overview", label: "Home" },
    { value: "/tenant#billing", label: "Rent" },
    { value: "/tenant#maintenance", label: "Requests" },
    { value: "/tenant#notices", label: "Notices" },
    { value: "/tenant#documents", label: "Documents" },
    { value: "/tenant#settings", label: "Settings" },
  ],
  building: [
    { value: "/building", label: "Overview (home)" },
    { value: "/building#overview", label: "Overview" },
    { value: "/building#plan", label: "Plan" },
    { value: "/building#owners", label: "Owners" },
    { value: "/building#invoices", label: "Service charge" },
    { value: "/building#spaces", label: "Spaces" },
    { value: "/building#staff", label: "Staff" },
    { value: "/building#accounts", label: "Accounts" },
    { value: "/building#notices", label: "Notices" },
    { value: "/building#reports", label: "Reports" },
    { value: "/building#setup", label: "Setup" },
    { value: "/building#settings", label: "Settings" },
  ],
  admin: [
    { value: "/admin", label: "Overview (home)" },
    { value: "/admin#overview", label: "Overview" },
    { value: "/admin#analytics", label: "Analytics" },
    { value: "/admin#owners", label: "Owners" },
    { value: "/admin#subscriptions", label: "Plans" },
    { value: "/admin#payments", label: "Payments" },
    { value: "/admin#buildings", label: "Buildings" },
    { value: "/admin#payment-setup", label: "Payment setup" },
    { value: "/admin#notices", label: "Circulate" },
    { value: "/admin#tickets", label: "Tickets" },
    { value: "/admin#messages", label: "Messages" },
    { value: "/admin#reset-log", label: "Reset log" },
    { value: "/admin#logs", label: "Logs" },
    { value: "/admin#settings", label: "Settings" },
  ],
  // A mixed audience cannot safely be sent to a role-specific dashboard.
  everyone: [{ value: "/", label: "App home" }],
};

export function noticeAudienceForScope(scope: string): NoticeAudience {
  if (scope === "all_tenants" || scope === "individual_tenant") return "tenant";
  if (scope === "all_owners" || scope === "individual_owner") return "owner";
  return "everyone";
}

export function noticeAudienceForWelcome(audience: string): NoticeAudience {
  if (audience === "new_owners") return "owner";
  if (audience === "new_tenants") return "tenant";
  return "everyone";
}
