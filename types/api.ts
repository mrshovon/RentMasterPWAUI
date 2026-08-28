// =============================================================================
// RentMaster API Schema Types — mirrors the REAL backend (rent-master-pwa)
// Kept in sync with Supabase tables: properties, tenants, billing_ledgers,
// maintenance_logs, notices.
// =============================================================================

// 'partial' is DERIVED on the server from the payment log — clients never write it.
export type PaymentStatus = "unpaid" | "sent" | "partial" | "paid";
export type PriorityLevel = "low" | "medium" | "high" | "urgent";
export type ResolutionStatus = "reported" | "in_progress" | "resolved";
// "everyone" = every owner AND every tenant on the platform (admin circulations only).
export type NoticeScope =
  | "everyone" | "all_owners" | "all_tenants" | "individual_tenant" | "individual_owner";

export interface Property {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  flat_no: string;
  // Name printed on this property's receipts. Null = use the owner's account name.
  receipt_name: string | null;
  owner_phone: string | null;
  is_vacant: boolean;
  created_at: string;
}

export interface Tenant {
  id: string;
  // null when the tenant is unassigned — moved out, or between units.
  property_id: string | null;
  name: string;
  phone: string;
  family_members: number;
  // Decrypted server-side for the OWNER only (GET /api/admin/tenants). Null for tenants
  // onboarded before NIDs were stored reversibly — their old hash can't be recovered.
  nid?: string | null;
  // Legacy: the one-way hash NIDs used to be stored as. Nothing reads it, and it is no longer
  // sent to the client. Kept on the type only to describe the column.
  nid_hash?: string | null;
  password_hash?: string | null;
  monthly_rent: number;
  due_date: number; // day of month (1-31)
  rented_date: string | null;
  service_charge: number;
  advance_amount: number;
  created_at: string;
  // Owner override: lets a tenant with no property still sign in. Unassigned tenants are
  // blocked by default, so this is only meaningful when property_id is null.
  allow_login_unassigned: boolean;
  // Relational join (GET /api/admin/tenants) — null when unassigned.
  properties?: { id: string; name: string; owner_id: string } | null;
}

export interface BillingLedger {
  id: string;
  tenant_id: string;
  property_id: string;
  billing_month: string; // "YYYY-MM"
  rent_amount: number;
  service_charge: number;
  extra_charge: number;
  extra_charge_remarks: string | null;
  discount: number;
  total_payable: number;
  payment_status: PaymentStatus;
  created_by_owner: string;
  created_at: string;
  // Derived from billing_payments by recalcLedger() on the server — never written by hand.
  amount_paid: number;
  paid_at?: string | null; // the LAST payment's date
  // Relational joins
  properties?: { name: string } | null;
  tenants?: { name: string; phone: string } | null;
}

/** One installment against an invoice. Rent is often paid in parts, so an invoice has a list. */
export interface BillingPayment {
  id: string;
  payment_no: number;
  ledger_id: string;
  owner_id: string;
  tenant_id: string | null;
  amount: number;
  paid_on: string; // "YYYY-MM-DD"
  method: StaffPaymentMethod;
  note: string | null;
  created_at: string;
}

export interface MaintenanceLog {
  id: string;
  property_id: string;
  tenant_id: string | null;
  issue_title: string;
  issue_description: string | null;
  priority_level: PriorityLevel;
  resolution_status: ResolutionStatus;
  resolution_remarks: string | null;
  attachment_file_url: string | null;
  estimated_cost: number;
  created_at: string;
  // Relational joins
  properties?: { name: string; owner_id: string } | null;
  tenants?: { name: string; phone: string } | null;
}

export interface Notice {
  id: string;
  sender_type: "system_admin" | "owner" | "tenant";
  sender_id: string;
  target_scope: NoticeScope;
  target_tenant_id: string | null;
  target_owner_id: string | null;
  title: string;
  content: string;
  created_at: string;
}

// ---- Signed-in owner/admin account (Supabase auth user; email is read-only) ----
export interface AccountProfile {
  email: string | null;
  name: string | null;
  phone: string | null;
  role: string;
}

// ---- Platform maintenance window (admin-declared, app_settings.maintenance_mode) ----
export interface MaintenanceMode {
  enabled: boolean;
  startAt: string | null;
  endAt: string | null;
  message: string;
}

// ---- Rent reminders (owner-scheduled, to tenants) ----
export type ReminderRecurrence = "once" | "monthly";
export type ReminderStatus = "pending" | "sent" | "canceled";

export interface Reminder {
  id: string;
  reminder_no: number;
  owner_id: string;
  target_all: boolean;
  tenant_ids: string[];
  message: string;
  scheduled_date: string; // "YYYY-MM-DD"
  recurrence: ReminderRecurrence;
  status: ReminderStatus;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

// Tenant self-profile (GET /api/admin/tenants/me)
export interface OwnerContact {
  name: string | null;
  phone: string | null;
  email: string | null;
  signature_url: string | null;
}

export interface TenantProfile {
  tenant: {
    id: string;
    name: string;
    phone: string;
    family_members: number;
    monthly_rent: number;
    due_date: number;
    rented_date: string | null;
    service_charge: number;
    advance_amount: number;
    property_id: string;
  };
  property: {
    id: string;
    name: string;
    address: string;
    flat_no: string;
    is_vacant: boolean;
    owner_phone: string | null;
    receipt_name: string | null;
  } | null;
  owner: OwnerContact | null;
}

// Archived occupancy record — GET /api/admin/occupancy?propertyId=
export interface OccupancyHistory {
  id: number;
  property_id: string;
  tenant_name: string;
  tenant_phone: string;
  lease_start: string | null;
  lease_end: string | null;
  total_rent_paid: number | null;
  archived_at: string;
}

// Rent revision audit entry — GET /api/admin/rent-revisions
export interface RentRevision {
  id: number;
  tenant_id: string;
  property_id: string;
  tenant_name: string;
  old_rent: number;
  new_rent: number;
  changed_by: string | null;
  changed_at: string;
}

// Per-property service charge component breakdown — GET /api/admin/service-charge
export interface ServiceChargeBreakdown {
  property_id: string;
  caretaker: number;
  common_electricity: number;
  common_gas: number;
  dust_collectors: number;
  lift_maintenance: number;
  security_guard: number;
  water: number;
  updated_at?: string;
}

// Per-tenant document (deed, agreement, etc.) — GET/POST /api/admin/documents
export interface Document {
  id: string;
  tenant_id: string;
  title: string;
  doc_type: string | null;
  file_url: string;
  uploaded_by: string | null;
  created_at: string;
}

// ---- Admin module ----
export interface SubscriptionTier {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  // 'month' | 'year' | 'days' (custom tenure) | 'custom' (enterprise "Contact us" tier).
  // 'days' and 'custom' are deliberately different values — see ADD_PLAN_TENURE.sql.
  billing_interval: string;
  // Tenure in days when billing_interval === 'days'; null otherwise.
  duration_days?: number | null;
  max_properties_allowed: number;
  max_tenants_allowed: number;
  is_active?: boolean;
  // False = hidden: not listed to owners and not self-selectable, but still admin-assignable,
  // and still visible to an owner already on it so they can renew. Distinct from is_active,
  // which retires a plan for everyone. Absent on databases predating ADD_PLAN_VISIBILITY.sql.
  is_public?: boolean;
  // False = one-time (a trial): the owner may take it once, then must choose another plan, and
  // falls back to the free plan when it expires. Absent on databases predating
  // ADD_PLAN_RECURRING.sql, where every plan is renewable as before.
  is_recurring?: boolean;
  // COMPUTED by GET /api/admin/subscription — not a database column. True when this is a
  // one-time plan the signed-in owner has already had, so the UI can grey it and say why.
  oneTimeUsed?: boolean;
  discount_percent?: number;
  // Whether this tier bundles the Staff module (true on the Whole Building / 'custom' tiers).
  staff_included?: boolean;
  // Whether this tier bundles the Accounts module (true on the Whole Building / 'custom' tiers).
  accounts_included?: boolean;
}

export interface OwnerSubscription {
  tier_id: string;
  status: string;
  expiry_date: string | null;
  subscription_tiers?: { name: string; price: number } | null;
}

// ---- Owner plan state (GET /api/admin/subscription) ----
export interface PlanState {
  tierId: string;
  tierName: string;
  interval: string;
  price: number;
  isFree: boolean;
  status: "active" | "grace" | "locked";
  expiryDate: string | null;
  daysUntilExpiry: number | null;
  graceEndsAt: string | null;
  daysLeftInGrace: number | null;
  warnExpiringSoon: boolean;
  limits: { maxProperties: number; maxTenants: number };
  permissionsRevoked: boolean;
  lockReason: "expired" | "revoked" | null;
  /**
   * Set when a paid plan ran out and the owner has been dropped to Free — null the rest of the
   * time, including during grace. Note the shape this implies: a downgraded owner has
   * `status: "active"` on `free_tier`, because they genuinely can work again, just within the
   * free limits. Check this field, not `status`, to know a plan ended.
   */
  downgradedFrom: { tierId: string; tierName: string; endedAt: string | null } | null;
  /**
   * Whole Building only. The building has never paid and is still inside its pay-by window:
   * full access, with a countdown. Set on the building admin and inherited by its flat owners.
   */
  unpaidWindow?: boolean;
  /** Whole Building only. Days left to pay before the first lock. Null once payment has landed. */
  daysToPay?: number | null;
  /** Whole Building only. The pay-by deadline, so the UI can name the date, not just the count. */
  payBy?: string | null;
}

/** A lifecycle transition the owner has not acknowledged yet. Drives the one-time modal. */
export type PlanEventKind = "expiring_soon" | "grace_started" | "downgraded";

export interface PendingPlanEvent {
  id: string;
  event: PlanEventKind;
  tierName: string | null;
  endedAt: string | null;
}

export interface PlanUsage {
  properties: { current: number; limit: number };
  tenants: { current: number; limit: number };
}

// Optional paid modules. `source` says why it's on: bundled with the plan, or granted as
// an add-on by an admin. See the backend lib/features.ts.
export interface FeatureState {
  enabled: boolean;
  source: "plan" | "addon" | null;
}

export interface FeatureMap {
  staff: FeatureState;
  accounts: FeatureState;
}

export interface SubscriptionResponse {
  success: boolean;
  subscription: PlanState;
  pendingEvent: PendingPlanEvent | null;
  usage: PlanUsage;
  disabled: { propertyIds: string[]; tenantIds: string[] };
  /** Empty for an owner under a building — there is nothing for them to switch to. */
  availableTiers: SubscriptionTier[];
  features: FeatureMap;
  /** Set when this owner is a flat owner inside a Whole Building plan. Their building admin is
   *  the billing party, so the Plan tab shows who covers them instead of a price list. */
  building?: { id: string; name: string; unitLabel: string | null } | null;
}

/* ---------- Whole Building ---------- */

export interface Building {
  id: string;
  building_no?: number;
  admin_id: string;
  name: string;
  /** Street/holding number. Null on a building created before system login identifiers —
   * which is exactly what keeps its owners signing in with a typed email. */
  house_no: string | null;
  address: string | null;
  city: string | null;
  letterhead_url: string | null;
  signatory_name: string | null;
  signatory_title: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** Only on GET /api/admin/building — how many owners are on the roster. */
  owner_count?: number;
}

export type BuildingNoticeAudience = "all_owners" | "all_tenants" | "individual_owner";

/** The canonical PRINTABLE record of a building notice. Its in-app copies live in the ordinary
 *  `notices` table, written by the fan-out in the POST route — this row is what carries the
 *  reference number and issue date a physical notice needs. */
export interface BuildingNotice {
  id: string;
  notice_no?: number;
  building_id: string;
  title: string;
  content: string;
  audience: BuildingNoticeAudience;
  target_owner_id: string | null;
  issued_on: string;
  reference_no: string | null;
  /** How many in-app notices the fan-out actually created. */
  delivered_count: number;
  created_at: string;
}

/** GET /api/admin/building/reports?kind=income_expense */
export interface BuildingPeriodReport {
  success: boolean;
  kind: "income_expense";
  building: BuildingReportHeader;
  period: { from: string; to: string };
  income: { total: number; lines: { category: string; amount: number }[] };
  expense: { total: number; lines: { category: string; amount: number }[] };
  net: number;
  entryCount: number;
}

/** GET /api/admin/building/reports?kind=owner_statement */
export interface BuildingOwnerReport {
  success: boolean;
  kind: "owner_statement";
  building: BuildingReportHeader;
  owner: {
    id: string;
    name: string | null;
    email: string | null;
    unitLabel: string | null;
    defaultServiceCharge: number;
    joinedAt: string | null;
  };
  invoices: BuildingServiceInvoice[];
  totals: { billed: number; received: number; due: number };
}

/** camelCase on purpose — this is the report API's shape, not a database row. */
export interface BuildingReportHeader {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  letterheadUrl: string | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
}

/** A definition, not a ledger entry: `monthly_cost` is an indicative running cost the building
 *  admin types in, and nothing derives from it. See ADD_BUILDING_EXTRAS.sql. */
export interface BuildingAmenity {
  id: string;
  building_id: string;
  name: string;
  description: string | null;
  monthly_cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Also a definition. The money itself lives in account_transactions; this exists so it arrives
 *  under a consistent category instead of differently-typed free text each month. */
export interface BuildingIncomeSource {
  id: string;
  building_id: string;
  name: string;
  category: string | null;
  default_amount: number;
  note: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** unpaid -> partial -> paid. Deliberately has no 'sent': that value exists on a rent invoice
 *  because a tenant can claim "I've paid" from their own app. Service charges are recorded by
 *  the building admin alone. */
export type BuildingInvoiceStatus = "unpaid" | "partial" | "paid";

export interface BuildingServicePayment {
  id: string;
  payment_no?: number;
  invoice_id: string;
  building_id: string;
  owner_id: string;
  amount: number;
  paid_on: string;
  method: StaffPaymentMethod;
  note: string | null;
  created_at: string;
}

export interface BuildingServiceInvoice {
  id: string;
  invoice_no?: number;
  building_id: string;
  admin_id: string;
  owner_id: string;
  /** Which flat this bills. Null only on invoices written before flats existed. */
  flat_id: string | null;
  /**
   * The flat's label AS IT WAS when the invoice was issued. A snapshot, not a join — it is what
   * every receipt, cutting slip and accounts note prints, and it still reads correctly once the
   * flat row is gone. See ADD_BUILDING_OWNER_FLATS.sql.
   */
  flat_label: string | null;
  billing_month: string; // "YYYY-MM"
  service_charge: number;
  extra_charge: number;
  extra_charge_remarks: string | null;
  discount: number;
  total_payable: number;
  // Derived server-side by recalcBuildingInvoice() — never written by hand.
  amount_paid: number;
  payment_status: BuildingInvoiceStatus;
  paid_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  /** Present on the single-invoice GET and on the owner's statement, not on the list. */
  payments?: BuildingServicePayment[];
}

/** GET /api/admin/building/statement — the flat owner's read of their own service charges.
 *  `building` is null when this owner is not in a building, which is how the owner dashboard
 *  decides whether to show the tab at all. */
export interface BuildingStatementResponse {
  success: boolean;
  /** The building's PRINTABLE identity, not just its name: a flat owner prints their own service
   *  charge receipt and statement from this screen, and an unsigned one proves nothing.
   *  `signatureUrl` is the building ADMIN's signature image, exposed downward the same way
   *  /api/admin/tenants/me exposes an owner's to their tenant. */
  building: {
    id: string;
    name: string;
    unitLabel: string | null;
    address: string | null;
    city: string | null;
    letterheadUrl: string | null;
    signatoryName: string | null;
    signatoryTitle: string | null;
    signatureUrl: string | null;
  } | null;
  /** The caller's own name, for the party row on their receipt. */
  owner?: { name: string | null };
  /** Every flat they hold. building.unitLabel stays their primary, for back-compat. */
  flats?: BuildingOwnerFlat[];
  count: number;
  data: BuildingServiceInvoice[];
}

/**
 * One flat an owner holds. An owner may hold several under a single login; the roster row
 * (BuildingOwner) stays one per person.
 */
export interface BuildingOwnerFlat {
  id: string;
  building_id: string;
  owner_id: string;
  unit_label: string | null;
  flat_no: string | null;
  default_service_charge: number;
  /** The flat their login was built from, and the fallback for owner-keyed reads. */
  is_primary: boolean;
  /** properties.id — the rentable unit behind this flat, if one was created. */
  property_id: string | null;
  is_active: boolean;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface BuildingOwner {
  building_id: string;
  owner_id: string;
  /** Their PRIMARY flat's label — login provenance and the owner-keyed fallback. See `flats`. */
  unit_label: string | null;
  /** The normalised flat token that went into their login ("4b"). Display uses unit_label. */
  flat_no: string | null;
  /** Frozen. The real charge is per flat — a shop and a three-bed are not billed the same. */
  default_service_charge: number;
  /** Every flat they hold, active and inactive. Present on the roster GET. */
  flats?: BuildingOwnerFlat[];
  joined_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined from the auth user behind the roster row, server-side.
  email: string | null;
  name: string | null;
  phone: string | null;
  suspended: boolean;
}

/* ---------- Whole Building: the commercial contract ---------- */

/** The stored facts of a building's contract. Status is never stored — see BuildingPlanState. */
export interface BuildingSubscription {
  building_id: string;
  admin_id: string;
  term_months: number;
  /** Both null until the first payment: the term starts the day money is recorded. */
  term_starts_on: string | null;
  expiry_date: string | null;
  /** Deadline to pay while the building has never paid. Past it, with nothing paid, it locks. */
  pay_by: string;
  first_paid_at: string | null;
  grace_days: number;
  warn_days: number;
  canceled_at: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Derived from the row above at read time, by the same function the backend gates on. */
export interface BuildingPlanState {
  status: "active" | "grace" | "locked";
  lockReason: "expired" | "revoked" | null;
  expiryDate: string | null;
  daysUntilExpiry: number | null;
  graceEndsAt: string | null;
  daysLeftInGrace: number | null;
  warnExpiringSoon: boolean;
  unpaidWindow: boolean;
  daysToPay: number | null;
  payBy: string | null;
}

export type BuildingPlanInvoiceKind = "initial" | "renewal";
export type BuildingPlanInvoiceStatus = "draft" | "sent" | "settled" | "void";
export type BuildingPlanPaymentStatus = "unpaid" | "partial" | "paid";
export type BuildingPlanMethod = "cash" | "bkash" | "nagad" | "bank" | "card" | "other";

/** One priced line on a quote. The line items ARE the pricing model — see ADD_BUILDING_PLANS.sql. */
export interface BuildingPlanInvoiceItem {
  id: string;
  label: string;
  amount: number;
  sort_order: number;
}

export interface BuildingPlanInvoice {
  id: string;
  invoice_no: number;
  building_id: string;
  admin_id: string;
  kind: BuildingPlanInvoiceKind;
  term_months: number;
  period_start: string | null;
  period_end: string | null;
  currency: string;
  subtotal: number;
  discount: number;
  total_payable: number;
  /** Derived from the payments — never written by hand. */
  amount_paid: number;
  payment_status: BuildingPlanPaymentStatus;
  paid_at: string | null;
  terms: string | null;
  /** Optional link we attach so the building can pay itself. No gateway sits behind it. */
  payment_url: string | null;
  status: BuildingPlanInvoiceStatus;
  issued_at: string | null;
  due_on: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  items?: BuildingPlanInvoiceItem[];
  /** Server-computed money still owed. Never negative. */
  balance?: number;
  /** Identity snapshotted when the invoice was raised. This row OUTLIVES its building — see
   *  ADD_DELETION_AUDIT.sql — and once the buildings row is gone there is nothing left to join
   *  to for a name. Null on invoices raised before that migration. */
  building_name?: string | null;
  admin_email?: string | null;
}

export interface BuildingPlanPayment {
  id: string;
  payment_no: number;
  invoice_id: string;
  building_id: string;
  admin_id: string;
  amount: number;
  paid_on: string;
  method: BuildingPlanMethod;
  reference: string | null;
  /** Null when the money came from confirming the building's own claim rather than our entry. */
  recorded_by: string | null;
  note: string | null;
  created_at: string;
}

export type BuildingPlanRequestKind = "renewal" | "payment_claim";
export type BuildingPlanRequestStatus = "new" | "in_progress" | "quoted" | "closed" | "rejected";

export interface BuildingPlanRequest {
  id: string;
  request_no: number;
  building_id: string;
  admin_id: string;
  kind: BuildingPlanRequestKind;
  message: string | null;
  /** Populated on a payment_claim only. A claim is not a payment until an admin confirms it. */
  claim_amount: number | null;
  claim_method: string | null;
  claim_reference: string | null;
  status: BuildingPlanRequestStatus;
  /** Visible to the building, not an internal note. */
  admin_notes: string | null;
  invoice_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** GET /api/admin/building/plan — the building's own view of its contract. */
export interface BuildingPlanResponse {
  subscription: BuildingSubscription | null;
  state: BuildingPlanState | null;
  currentInvoiceId?: string | null;
  invoices: BuildingPlanInvoice[];
  payments: BuildingPlanPayment[];
  requests: BuildingPlanRequest[];
}

/** One row of the super admin's Buildings menu. */
export interface AdminBuildingRow extends Building {
  owner_count: number;
  amount_owed: number;
  open_requests: number;
  admin_login: string | null;
  admin_name: string | null;
  admin_phone: string | null;
  subscription: BuildingSubscription | null;
  state: BuildingPlanState | null;
}

/** GET /api/super-admin/buildings/[id] — everything about one building's contract. */
export interface AdminBuildingDetail {
  building: Building;
  admin_login: string | null;
  admin_name: string | null;
  admin_phone: string | null;
  subscription: BuildingSubscription | null;
  state: BuildingPlanState | null;
  invoices: BuildingPlanInvoice[];
  payments: BuildingPlanPayment[];
  requests: BuildingPlanRequest[];
}

export interface AdminOwner {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  suspended: boolean;
  permissions_revoked: boolean;
  subscription: OwnerSubscription | null;
  // Presence, from the client heartbeat (lib/presence.ts). `online` means the app is open
  // right now (seen in the last 5 minutes) — distinct from `last_sign_in_at`, which only
  // moves at login. Both are null/false until ADD_PRESENCE.sql has been run.
  online?: boolean;
  last_seen_at?: string | null;
}

// One device an account has been seen on.
export interface PresenceDevice {
  deviceId: string;
  platform: string | null;
  userAgent: string | null;
  lastSeenAt: string;
  firstSeenAt: string;
  online: boolean;
}

export interface AdminOwnerDetail extends AdminOwner {
  propertyCount: number;
  tenantCount: number;
  devices?: PresenceDevice[];
  // Staff module access. `staff_included_in_plan` wins — when it's true the per-owner
  // grant is moot and the admin toggle is disabled.
  staff_addon: boolean;
  staff_addon_granted_at: string | null;
  staff_included_in_plan: boolean;
  // Accounts module access — same shape as staff.
  accounts_addon: boolean;
  accounts_addon_granted_at: string | null;
  accounts_included_in_plan: boolean;
  /** Whole Building context. `admin` = they RUN this building and `ownerCount` is its roster
   *  size, which is what the delete flow has to ask about; `member` = they are a flat owner in
   *  someone else's building and `ownerCount` is 0. Null for an ordinary owner. The route has
   *  returned this since the Whole Building tier shipped. */
  building?: { id: string; name: string; role: "admin" | "member"; ownerCount: number } | null;
}

// ---- Staff (owner module; paid add-on) ----
export type StaffPaymentMethod = "cash" | "bkash" | "nagad" | "bank" | "other";

export interface Staff {
  id: string;
  staff_no: number;
  owner_id: string;
  name: string;
  phone: string | null;
  designation: string | null;
  // properties.id is TEXT ("UNIT-1234"), not a uuid. Null when unassigned.
  property_id: string | null;
  monthly_salary: number;
  joining_date: string | null;
  nid_number: string | null;
  nid_doc_url: string | null;
  photo_url: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relational join (GET /api/admin/staff) — null when unassigned.
  properties?: { id: string; name: string; flat_no: string } | null;
}

export interface StaffPayment {
  id: string;
  payment_no: number;
  staff_id: string;
  owner_id: string;
  amount: number;
  paid_on: string;
  method: StaffPaymentMethod;
  note: string | null;
  created_at: string;
  // Relational join (GET /api/admin/staff/payments).
  staff?: { id: string; name: string; designation: string | null } | null;
}

// ---- Accounts (owner module; paid add-on) ----
export type AccountType = "cash" | "bank" | "mfs" | "other";
export type TxnDirection = "income" | "expense";
// How an income/expense row was created: by hand, or auto-booked by an automation.
export type TxnSource = "manual" | "billing" | "staff_salary";

export interface Account {
  id: string;
  account_no: number;
  owner_id: string;
  name: string;
  type: AccountType;
  opening_balance: number;
  is_default: boolean;
  is_active: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountTransaction {
  id: string;
  txn_no: number;
  owner_id: string;
  account_id: string;
  // properties.id is TEXT ("UNIT-1234"). Null when not tied to a property.
  property_id: string | null;
  direction: TxnDirection;
  amount: number;
  category: string | null;
  txn_date: string;
  note: string | null;
  source: TxnSource;
  source_ref: string | null;
  created_at: string;
  // Relational joins (GET /api/admin/accounts/transactions).
  properties?: { id: string; name: string; flat_no: string } | null;
  accounts?: { id: string; name: string; type: AccountType } | null;
}

export interface AccountTransfer {
  id: string;
  transfer_no: number;
  owner_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  txn_date: string;
  note: string | null;
  created_at: string;
  // Relational joins (GET /api/admin/accounts/transfers).
  from_account?: { id: string; name: string; type: AccountType } | null;
  to_account?: { id: string; name: string; type: AccountType } | null;
}

// ---- Support tickets (owner -> system admin) ----
export type TicketStatus = "submitted" | "assigned" | "in_progress" | "done";
export type TicketCategory = "billing" | "technical" | "account" | "feature_request" | "other";

export interface SupportTicket {
  id: string;
  ticket_no: number;
  owner_id: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: PriorityLevel;
  status: TicketStatus;
  attachment_file_url: string | null; // one URL, or several JSON-encoded (see parseAttachments)
  admin_remarks: string | null;
  assigned_to: string | null;
  assigned_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  // Attached by the admin queue endpoint only (owners are auth users, not a table).
  owner?: { name: string | null; email: string | null; phone: string | null } | null;
}

// ---- Password reset history (admin-only audit view) ----
export type ResetMethod = "admin_reset" | "self_service_email" | "self_change";

export interface PasswordResetRecord {
  id: string;
  reset_no: number;
  owner_id: string;
  owner_email: string | null;
  reset_by: string | null;
  reset_method: ResetMethod;
  ip: string | null;
  created_at: string;
  // Attached by the admin queue endpoint (owners/admins are auth users, not a table).
  owner?: { name: string | null; email: string | null } | null;
  actor?: { name: string | null; email: string | null } | null;
}

// ---- Application log (admin-only diagnostic view) ----
export type LogLevel = "error" | "warn" | "info";
export type LogSource = "api" | "client" | "cron" | "email" | "push";

export interface LogRecord {
  id: string;
  log_no: number;
  level: LogLevel;
  source: LogSource;
  route: string | null;
  method: string | null;
  status: number | null;
  code: string | null;
  message: string;
  /** Stack trace or raw provider error. Can be long — the table shows it on row expand. */
  detail: string | null;
  /** The reference shown to the user, e.g. "req_7f3k9q". The join key for a support request. */
  request_id: string | null;
  user_id: string | null;
  user_role: string | null;
  /** Snapshot taken at write time — no auth lookup is needed to read the log. */
  user_email: string | null;
  ip: string | null;
  user_agent: string | null;
  context: Record<string, unknown> | null;
  created_at: string;
}

/** Keyset-paginated envelope from /api/super-admin/logs. `nextBefore` is the cursor. */
export interface LogsResponse {
  success: boolean;
  count: number;
  hasMore: boolean;
  nextBefore: string | null;
  data: LogRecord[];
}

// ---- Contact-us messages (owner -> system admin, from the custom plan card) ----
export type ContactStatus = "new" | "in_progress" | "resolved" | "archived";

export interface ContactMessage {
  id: string;
  message_no: number;
  owner_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  tier_id: string | null;
  message: string;
  status: ContactStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  // Attached by the admin queue endpoint only.
  owner?: { name: string | null; email: string | null; phone: string | null } | null;
}

// ---- Payment submissions (owner manual bKash payment -> admin approval) ----
// NB: distinct from the billing PaymentStatus (unpaid/sent/paid) defined above.
export type PaymentSubmissionStatus = "pending" | "approved" | "rejected";

export interface PaymentSubmission {
  id: string;
  payment_no: number;
  owner_id: string;
  owner_email: string | null;
  provider: string;
  tier_id: string;
  amount: number | null;
  sender_msisdn: string | null;
  txn_id: string | null;
  status: PaymentSubmissionStatus;
  admin_notes: string | null; // rejection remarks; visible to the owner
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Attached by the admin queue endpoint only. `deleted` means the account is gone but the
  // payment was KEPT for financial audit (lib/account-purge.ts), so `email` is the snapshot
  // taken at submit time and there is no name or phone left to show.
  owner?: { name: string | null; email: string | null; phone: string | null; deleted?: boolean } | null;
  tier_name?: string;
}

// ---- Payment setup (admin-configured MFS pay-to details) ----
export interface PaymentConfig {
  provider: string; // which MFS: bKash, Nagad, Rocket, …
  walletNumber: string;
  instructions: string;
  qrUrl: string | null;
}

// Generic envelope returned by every backend route
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
  message?: string;
}

// ---------------------------------------------------------------------------
// Admin analytics (GET /api/super-admin/analytics)
// ---------------------------------------------------------------------------

export interface DayCount {
  date: string;   // YYYY-MM-DD
  count: number;
}

export interface AnalyticsSummary {
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  totals: { owners: number; admins: number; tenants: number; allUsers: number };
  // Users seen in the last 5 minutes. `byPlatform` counts a user under each platform they
  // are currently active on, so its sum can exceed `total`.
  onlineNow: { total: number; byRole: Record<string, number>; byPlatform: Record<string, number> };
  activeUsers: { current: number; previous: number; byRole: Record<string, number> };
  // "New users" = signups. There is no anonymous-visitor tracking in the platform.
  newUsers: {
    owners: number;
    tenants: number;
    total: number;
    previousTotal: number;
    ownerSeries: DayCount[];
    tenantSeries: DayCount[];
  };
}

/**
 * One deleted building's preserved money, from GET /api/super-admin/buildings/archived.
 *
 * Grouped by the building it belonged to even though that building no longer exists: the
 * `building_id` column survives as a plain uuid, which is what keeps a deleted building's
 * invoices and payments together instead of becoming an undifferentiated heap.
 */
export interface AdminArchivedBuilding {
  buildingId: string;
  /** The name snapshotted onto the invoice when it was raised; null on pre-migration rows. */
  buildingName: string | null;
  adminId: string | null;
  adminEmail: string | null;
  invoices: BuildingPlanInvoice[];
  payments: BuildingPlanPayment[];
  totals: { billed: number; received: number; due: number };
}

/**
 * One plan as the PUBLIC pricing page sees it (GET /api/app/plans).
 *
 * Deliberately a narrower type than `SubscriptionTier`: the route is unauthenticated and returns
 * only what a price card renders — no `is_active`/`is_public` (they are the filter, not content)
 * and nothing describing how entitlements are enforced.
 */
export interface PublicPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  /** 'month' | 'year' | 'days' | 'custom'. 'custom' is the "Contact us" tier. */
  billing_interval: string;
  duration_days: number | null;
  discount_percent: number;
  is_recurring: boolean;
  staff_included: boolean;
  accounts_included: boolean;
  /** -1 means unlimited, matching subscription_tiers. */
  max_properties_allowed: number;
  max_tenants_allowed: number;
}
