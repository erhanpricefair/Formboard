/**
 * Hand-written types mirroring supabase/migrations/0001_init.sql.
 * In production, regenerate with `supabase gen types typescript` once the
 * project is linked, and replace this file with the generated output.
 */

export type ProfessionalCategory =
  | "solar_pv"
  | "battery_storage"
  | "heat_pump_hot_water"
  | "heat_pump_space_heating"
  | "induction_cooktop"
  | "ceiling_wall_insulation"
  | "double_glazing"
  | "draught_sealing"
  | "ev_charger"
  | "home_energy_assessment"
  | "electrification_general";

export type ProfessionalStatus = "pending_verification" | "verified" | "suspended" | "rejected";
export type LeadLifecycleStatus = "captured" | "verified" | "shared" | "archived";
export type VerificationStatus = "unverified" | "pending" | "verified" | "failed";
export type LeadTrackingStatus = "New" | "Contacted" | "Inspection" | "Completed";
export type FeeType = "lead_fee" | "success_commission";
export type FeeStatus = "pending" | "invoiced" | "paid" | "disputed" | "waived";

export type Professional = {
  id: string;
  auth_user_id: string | null;
  business_name: string;
  abn: string;
  categories: ProfessionalCategory[];
  suburb: string;
  state: string;
  postcode: string;
  service_area_postcodes: string[];
  license_number: string | null;
  license_expiry: string | null;
  phone: string;
  public_email: string;
  website_url: string | null;
  tagline: string | null;
  bio: string | null;
  verification_status: ProfessionalStatus;
  verified_at: string | null;
  verified_by: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Lead = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  suburb: string;
  postcode: string;
  state: string;
  service_type: ProfessionalCategory;
  project_details: string | null;
  source: string;
  consent_contact: boolean;
  consent_data_share: boolean;
  consent_marketing: boolean;
  privacy_policy_version: string;
  consent_captured_at: string;
  consent_ip: string | null;
  consent_user_agent: string | null;
  verification_status: VerificationStatus;
  verification_channel: "email" | "sms" | null;
  verification_code_hash: string | null;
  verification_expires_at: string | null;
  verification_attempts: number;
  verified_at: string | null;
  status: LeadLifecycleStatus;
  unsubscribed_at: string | null;
};

export type LeadTracking = {
  id: string;
  lead_id: string;
  professional_id: string;
  status: LeadTrackingStatus;
  assigned_at: string;
  first_contacted_at: string | null;
  inspection_booked_at: string | null;
  completed_at: string | null;
  lead_cost: number;
  commission_amount: number | null;
  outcome_value: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadStatusAudit = {
  id: string;
  lead_tracking_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by: string | null;
  changed_by_role: string;
  note: string | null;
  changed_at: string;
};

export type FeeTransaction = {
  id: string;
  lead_tracking_id: string;
  professional_id: string;
  fee_type: FeeType;
  amount: number;
  currency: string;
  status: FeeStatus;
  invoice_reference: string | null;
  dispute_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type ConsentLogEntry = {
  id: string;
  lead_id: string;
  consent_type: "contact" | "data_share" | "marketing" | "withdrawal";
  granted: boolean;
  policy_version: string;
  captured_at: string;
  ip_address: string | null;
  user_agent: string | null;
  method: string;
};

export type Unsubscribe = {
  id: string;
  email: string | null;
  phone: string | null;
  scope: "marketing" | "all";
  token: string;
  requested_at: string;
};

export type Admin = {
  id: string;
  auth_user_id: string;
  created_at: string;
};

type NoRelationships = { Relationships: [] };

// Lets `.select("*, leads(...), professionals(...)")` on lead_tracking
// resolve — matches the `lead_tracking.lead_id -> leads.id` and
// `lead_tracking.professional_id -> professionals.id` foreign keys from
// migration 0001 (default Postgres constraint name: `<table>_<column>_fkey`).
type LeadTrackingRelationships = {
  Relationships: [
    {
      foreignKeyName: "lead_tracking_lead_id_fkey";
      columns: ["lead_id"];
      isOneToOne: false;
      referencedRelation: "leads";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "lead_tracking_professional_id_fkey";
      columns: ["professional_id"];
      isOneToOne: false;
      referencedRelation: "professionals";
      referencedColumns: ["id"];
    },
  ];
};

// Lets admin fee-ledger queries embed `lead_tracking(...)` and
// `professionals(...)` off fee_transactions.
type FeeTransactionRelationships = {
  Relationships: [
    {
      foreignKeyName: "fee_transactions_lead_tracking_id_fkey";
      columns: ["lead_tracking_id"];
      isOneToOne: false;
      referencedRelation: "lead_tracking";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "fee_transactions_professional_id_fkey";
      columns: ["professional_id"];
      isOneToOne: false;
      referencedRelation: "professionals";
      referencedColumns: ["id"];
    },
  ];
};

export type Database = {
  public: {
    Tables: {
      professionals: { Row: Professional; Insert: Partial<Professional>; Update: Partial<Professional> } & NoRelationships;
      leads: { Row: Lead; Insert: Partial<Lead>; Update: Partial<Lead> } & NoRelationships;
      lead_tracking: {
        Row: LeadTracking;
        Insert: Partial<LeadTracking>;
        Update: Partial<LeadTracking>;
      } & LeadTrackingRelationships;
      lead_status_audit: { Row: LeadStatusAudit; Insert: Partial<LeadStatusAudit>; Update: Partial<LeadStatusAudit> } & NoRelationships;
      fee_transactions: {
        Row: FeeTransaction;
        Insert: Partial<FeeTransaction>;
        Update: Partial<FeeTransaction>;
      } & FeeTransactionRelationships;
      consent_log: { Row: ConsentLogEntry; Insert: Partial<ConsentLogEntry>; Update: Partial<ConsentLogEntry> } & NoRelationships;
      unsubscribes: { Row: Unsubscribe; Insert: Partial<Unsubscribe>; Update: Partial<Unsubscribe> } & NoRelationships;
      admins: { Row: Admin; Insert: Partial<Admin>; Update: Partial<Admin> } & NoRelationships;
    };
    Views: {
      public_professional_directory: {
        Row: Omit<Professional, "abn" | "auth_user_id" | "verified_by" | "license_number" | "license_expiry" | "verification_status" | "active"> & { is_verified: boolean };
      } & NoRelationships;
    };
    Functions: Record<string, never>;
  };
};
