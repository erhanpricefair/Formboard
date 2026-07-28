import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SettlementStage } from "@/types/database";

export interface RosterClient {
  investorId: string;
  fullName: string;
  email: string;
  onboardingComplete: boolean;
  budgetMax: number | null;
  matchCount: number;
  currentStage: SettlementStage | null;
  linkedAt: string;
}

/**
 * Assembles the broker's client roster (PRD FR-6) from several narrow
 * queries rather than one large join — keeps each query's row shape
 * simple against the hand-written Database types (see types/database.ts)
 * at InvestorSource's current scale (a broker's roster is not expected to be
 * large enough for this to matter perf-wise).
 */
export async function getBrokerRoster(
  supabase: SupabaseClient<Database>,
  brokerId: string
): Promise<RosterClient[]> {
  const { data: links } = await supabase
    .from("broker_clients")
    .select("investor_id, linked_at")
    .eq("broker_id", brokerId)
    .order("linked_at", { ascending: false });

  if (!links || links.length === 0) return [];
  const investorIds = links.map((l) => l.investor_id);

  const [{ data: profiles }, { data: investorProfiles }, { data: matches }, { data: journeys }] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name, email").in("id", investorIds),
      supabase
        .from("investor_profiles")
        .select("id, onboarding_completed_at, budget_max")
        .in("id", investorIds),
      supabase.from("property_matches").select("investor_id").in("investor_id", investorIds),
      supabase.from("settlement_journeys").select("id, investor_id").in("investor_id", investorIds),
    ]);

  const journeyIds = (journeys ?? []).map((j) => j.id);
  const { data: journeyStages } =
    journeyIds.length > 0
      ? await supabase
          .from("investor_journey_view")
          .select("journey_id, current_stage")
          .in("journey_id", journeyIds)
      : { data: [] as { journey_id: string; current_stage: SettlementStage }[] };

  const stageByJourneyId = new Map((journeyStages ?? []).map((j) => [j.journey_id, j.current_stage]));
  const journeyIdByInvestor = new Map((journeys ?? []).map((j) => [j.investor_id, j.id]));
  const matchCountByInvestor = new Map<string, number>();
  for (const m of matches ?? []) {
    matchCountByInvestor.set(m.investor_id, (matchCountByInvestor.get(m.investor_id) ?? 0) + 1);
  }
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const investorProfileById = new Map((investorProfiles ?? []).map((p) => [p.id, p]));

  return links.map((link) => {
    const profile = profileById.get(link.investor_id);
    const investorProfile = investorProfileById.get(link.investor_id);
    const journeyId = journeyIdByInvestor.get(link.investor_id);
    return {
      investorId: link.investor_id,
      fullName: profile?.full_name ?? "Unknown",
      email: profile?.email ?? "",
      onboardingComplete: Boolean(investorProfile?.onboarding_completed_at),
      budgetMax: investorProfile ? Number(investorProfile.budget_max) : null,
      matchCount: matchCountByInvestor.get(link.investor_id) ?? 0,
      currentStage: journeyId ? (stageByJourneyId.get(journeyId) ?? null) : null,
      linkedAt: link.linked_at,
    };
  });
}
