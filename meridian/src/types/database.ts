// Hand-authored Supabase types covering the tables/views this app's code
// actually touches (see supabase/migrations/*.sql for the full schema).
//
// TODO: once a Supabase project is linked, replace this file with the
// generated output of `supabase gen types typescript --linked` — this
// hand-written version exists so the app typechecks before that project
// exists (see ARCHITECTURE.md §3, "types/database.ts" row).
//
// `Relationships: []` on every table and `Functions: {}` on the schema are
// required to satisfy @supabase/postgrest-js's GenericTable/GenericSchema
// constraints — without them the client's generic row-type resolution
// silently collapses to `never` (see GenericSchema in
// node_modules/@supabase/postgrest-js/src/types/common/common.ts).

export type UserRole = "investor" | "broker" | "developer" | "admin";
export type ExperienceLevel = "first_property" | "experienced_investor";
export type GrowthYieldPreference = "growth_focused" | "balanced" | "yield_focused";
export type OccupierIntent = "investment" | "owner_occupier";
export type FinanceStatus = "pre_approved" | "applying" | "not_started" | "cash_buyer";
export type PurchaseTimeframe =
  | "immediate"
  | "within_3_months"
  | "within_6_months"
  | "within_12_months"
  | "researching";
export type ListingStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "published"
  | "rejected"
  | "paused"
  | "archived";
export type ListingDocumentType = "brochure" | "floor_plan" | "contract_template" | "other";
export type ClientLinkSource = "referral_link" | "manual_invite" | "admin_assigned";
export type BookingStatus = "requested" | "confirmed" | "completed" | "cancelled";
export type SettlementStage =
  | "investor_enquiry"
  | "strategy_consultation"
  | "finance_assessment"
  | "property_selection"
  | "contract_signed"
  | "construction_updates"
  | "settlement_preparation"
  | "handover"
  | "property_management";
export type ReferralStatus = "pending" | "confirmed" | "disputed" | "voided";

type Table<Row, RequiredInsertKeys extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, RequiredInsertKeys>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          role: UserRole;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        },
        "id" | "role" | "full_name" | "email"
      >;
      investor_profiles: Table<
        {
          id: string;
          budget_max: number;
          deposit_available: number;
          preferred_states: string[];
          preferred_suburbs: string[];
          experience: ExperienceLevel;
          growth_yield_preference: GrowthYieldPreference;
          growth_yield_score: number;
          occupier_intent: OccupierIntent;
          finance_status: FinanceStatus;
          timeframe: PurchaseTimeframe;
          onboarding_completed_at: string | null;
          referred_by_broker_id: string | null;
          created_at: string;
          updated_at: string;
        },
        | "id"
        | "budget_max"
        | "deposit_available"
        | "experience"
        | "growth_yield_preference"
        | "finance_status"
        | "timeframe"
      >;
      broker_profiles: Table<
        {
          id: string;
          agency_name: string;
          acl_number: string | null;
          referral_link_slug: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        },
        "id" | "agency_name" | "referral_link_slug"
      >;
      developers: Table<
        {
          id: string;
          legal_name: string;
          trading_name: string | null;
          abn: string;
          logo_url: string | null;
          standing_notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        },
        "legal_name" | "abn"
      >;
      projects: Table<
        {
          id: string;
          developer_id: string;
          name: string;
          description: string | null;
          primary_state: string;
          primary_suburb: string | null;
          created_at: string;
          updated_at: string;
        },
        "developer_id" | "name" | "primary_state"
      >;
      suburbs: Table<
        {
          id: string;
          name: string;
          state: string;
          postcode: string;
          growth_driver_notes: string | null;
        },
        "name" | "state" | "postcode"
      >;
      listings: Table<
        {
          id: string;
          project_id: string;
          suburb_id: string;
          title: string;
          status: ListingStatus;
          address_line: string | null;
          land_size_sqm: number;
          build_size_sqm: number;
          price: number;
          deposit_required: number;
          rental_estimate_weekly: number;
          expected_yield: number;
          growth_driver_score: number;
          growth_drivers: string[];
          nearby_infrastructure: string[];
          completion_timeline: string | null;
          property_type: string;
          submitted_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          rejection_reason: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        },
        | "project_id"
        | "suburb_id"
        | "title"
        | "land_size_sqm"
        | "build_size_sqm"
        | "price"
        | "deposit_required"
        | "rental_estimate_weekly"
        | "property_type"
      >;
      listing_images: Table<
        {
          id: string;
          listing_id: string;
          storage_path: string;
          sort_order: number;
          is_floor_plan: boolean;
          created_at: string;
        },
        "listing_id" | "storage_path"
      >;
      listing_documents: Table<
        {
          id: string;
          listing_id: string;
          storage_path: string;
          document_type: ListingDocumentType;
          file_name: string;
          created_at: string;
        },
        "listing_id" | "storage_path" | "document_type" | "file_name"
      >;
      property_matches: Table<
        {
          id: string;
          investor_id: string;
          listing_id: string;
          total_score: number;
          score_breakdown: Record<string, number>;
          explanation: string;
          scoring_version: string;
          generated_by: string;
          generated_at: string;
        },
        "investor_id" | "listing_id" | "total_score" | "score_breakdown" | "explanation" | "scoring_version"
      >;
      saved_listings: Table<
        { investor_id: string; listing_id: string; saved_at: string },
        "investor_id" | "listing_id"
      >;
      listing_comparisons: Table<
        { id: string; investor_id: string; name: string; created_at: string },
        "investor_id"
      >;
      comparison_items: Table<
        { comparison_id: string; listing_id: string; sort_order: number },
        "comparison_id" | "listing_id"
      >;
      broker_clients: Table<
        {
          id: string;
          broker_id: string;
          investor_id: string;
          source: ClientLinkSource;
          linked_at: string;
        },
        "broker_id" | "investor_id" | "source"
      >;
      shared_listings: Table<
        {
          id: string;
          broker_id: string;
          investor_id: string;
          listing_id: string;
          shared_at: string;
          note: string | null;
        },
        "broker_id" | "investor_id" | "listing_id"
      >;
      developer_team_members: Table<
        { id: string; developer_id: string; team_role: "owner" | "member"; created_at: string },
        "id" | "developer_id"
      >;
      document_download_events: Table<
        { id: string; document_id: string; investor_id: string; downloaded_at: string },
        "document_id" | "investor_id"
      >;
      consultation_bookings: Table<
        {
          id: string;
          investor_id: string;
          broker_id: string | null;
          requested_at: string;
          scheduled_at: string | null;
          status: BookingStatus;
          created_at: string;
          updated_at: string;
        },
        "investor_id"
      >;
      settlement_journeys: Table<
        {
          id: string;
          investor_id: string;
          broker_id: string | null;
          listing_id: string | null;
          created_at: string;
        },
        "investor_id"
      >;
      settlement_stage_events: Table<
        {
          id: string;
          journey_id: string;
          stage: SettlementStage;
          note: string | null;
          actor_id: string;
          is_correction: boolean;
          occurred_at: string;
        },
        "journey_id" | "stage" | "actor_id"
      >;
      referrals: Table<
        {
          id: string;
          broker_id: string;
          journey_id: string;
          status: ReferralStatus;
          commission_amount: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        },
        "broker_id" | "journey_id"
      >;
      leads: Table<
        {
          id: string;
          email: string | null;
          phone: string | null;
          partial_answers: Record<string, unknown> | null;
          utm_source: string | null;
          utm_campaign: string | null;
          created_at: string;
        },
        never
      >;
      audit_log: Table<
        {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          previous_value: Record<string, unknown> | null;
          new_value: Record<string, unknown> | null;
          reason: string | null;
          occurred_at: string;
        },
        "action" | "entity_type"
      >;
    };
    Views: {
      investor_journey_view: {
        Row: {
          journey_id: string;
          current_stage: SettlementStage;
          stage_entered_at: string;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
  };
}
