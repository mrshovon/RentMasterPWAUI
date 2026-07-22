// =============================================================================
// RentMaster API Schema Types — mirrors the REAL backend (rent-master-pwa)
// Kept in sync with Supabase tables: properties, tenants, billing_ledgers,
// maintenance_logs, notices.
// =============================================================================

export type PaymentStatus = "unpaid" | "sent" | "paid";
export type PriorityLevel = "low" | "medium" | "high" | "urgent";
export type ResolutionStatus = "reported" | "in_progress" | "resolved";
export type NoticeScope = "all_owners" | "all_tenants" | "individual_tenant" | "individual_owner";

export interface Property {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  flat_no: string;
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
  nid_hash: string | null;
  password_hash: string | null;
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
  paid_at?: string | null;
  // Relational joins
  properties?: { name: string } | null;
  tenants?: { name: string; phone: string } | null;
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
  title: string;
  content: string;
  created_at: string;
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
  billing_interval: string;
  max_properties_allowed: number;
  max_tenants_allowed: number;
  is_active?: boolean;
  discount_percent?: number;
  // Whether this tier bundles the Staff module (true on the Whole Building / 'custom' tiers).
  staff_included?: boolean;
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
}

export interface SubscriptionResponse {
  success: boolean;
  subscription: PlanState;
  usage: PlanUsage;
  disabled: { propertyIds: string[]; tenantIds: string[] };
  availableTiers: SubscriptionTier[];
  features: FeatureMap;
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
}

export interface AdminOwnerDetail extends AdminOwner {
  propertyCount: number;
  tenantCount: number;
  // Staff module access. `staff_included_in_plan` wins — when it's true the per-owner
  // grant is moot and the admin toggle is disabled.
  staff_addon: boolean;
  staff_addon_granted_at: string | null;
  staff_included_in_plan: boolean;
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
  // Attached by the admin queue endpoint only.
  owner?: { name: string | null; email: string | null; phone: string | null } | null;
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
