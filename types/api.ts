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
  property_id: string;
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
  // Relational join (GET /api/admin/tenants)
  properties?: { id: string; name: string; owner_id: string };
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

export interface SubscriptionResponse {
  success: boolean;
  subscription: PlanState;
  usage: PlanUsage;
  disabled: { propertyIds: string[]; tenantIds: string[] };
  availableTiers: SubscriptionTier[];
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
}

// Generic envelope returned by every backend route
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
  message?: string;
}
