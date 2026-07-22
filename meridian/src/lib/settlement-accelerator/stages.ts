import type { SettlementStage, UserRole } from "@/types/database";

export const SETTLEMENT_STAGES: SettlementStage[] = [
  "investor_enquiry",
  "strategy_consultation",
  "finance_assessment",
  "property_selection",
  "contract_signed",
  "construction_updates",
  "settlement_preparation",
  "handover",
  "property_management",
];

// Mirrors the allowed-actor matrix in USER_FLOWS.md §6 and the
// `actor_allowed_for_stage` Postgres function in
// supabase/migrations/0007_rls_policies.sql (the actual security
// boundary — this copy exists for fast-fail client/server UX only, per
// ARCHITECTURE.md §4.2's two-layer enforcement model).
export const STAGE_ALLOWED_ROLES: Record<SettlementStage, UserRole[]> = {
  investor_enquiry: ["investor", "admin"],
  strategy_consultation: ["broker", "admin"],
  finance_assessment: ["broker", "admin"],
  property_selection: ["investor", "broker", "admin"],
  contract_signed: ["broker", "admin"],
  construction_updates: ["developer", "admin"],
  settlement_preparation: ["broker", "admin"],
  handover: ["broker", "admin", "developer"],
  property_management: ["admin", "developer"],
};

export function canAdvanceStage(role: UserRole, stage: SettlementStage): boolean {
  return STAGE_ALLOWED_ROLES[stage].includes(role);
}

export function stageIndex(stage: SettlementStage): number {
  return SETTLEMENT_STAGES.indexOf(stage);
}
