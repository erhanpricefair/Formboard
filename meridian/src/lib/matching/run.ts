import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { rankListings } from "./score";
import { explainMatch } from "./explain";
import { SCORING_VERSION, type CandidateListing, type InvestorPreferences } from "./types";

/**
 * Runs the matching engine for one investor against all published listings
 * and upserts the results into property_matches. Called inline from the
 * onboarding Server Action (ARCHITECTURE.md §5.4, "Inline (request path)")
 * and, in v2, from the scheduled batch re-match Edge Function against the
 * same inputs.
 */
export async function runMatchingForInvestor(
  supabase: SupabaseClient<Database>,
  investorId: string,
  investor: InvestorPreferences,
  limit = 12
) {
  const { data: listings, error } = await supabase
    .from("listings")
    .select(
      "id, title, price, deposit_required, expected_yield, growth_driver_score, growth_drivers, completion_timeline, suburbs:suburb_id(name, state)"
    )
    .eq("status", "published");

  if (error) throw error;
  if (!listings || listings.length === 0) return [];

  type RawListingRow = {
    id: string;
    title: string;
    price: number;
    deposit_required: number;
    expected_yield: number;
    growth_driver_score: number;
    growth_drivers: string[] | null;
    completion_timeline: string | null;
    suburbs: { name: string; state: string } | { name: string; state: string }[] | null;
  };

  const candidates: CandidateListing[] = (listings as unknown as RawListingRow[]).map((l) => {
    const suburb = Array.isArray(l.suburbs) ? l.suburbs[0] : l.suburbs;
    return {
      id: l.id,
      title: l.title,
      state: suburb?.state ?? "",
      suburbName: suburb?.name ?? "",
      price: Number(l.price),
      depositRequired: Number(l.deposit_required),
      expectedYield: Number(l.expected_yield),
      growthDriverScore: l.growth_driver_score,
      growthDrivers: l.growth_drivers ?? [],
      completionTimeline: null, // daterange parsing intentionally deferred, see FR-5 filters
    };
  });

  const ranked = rankListings(candidates, investor).slice(0, limit);

  const rows = ranked.map((result) => {
    const listing = candidates.find((c) => c.id === result.listingId)!;
    return {
      investor_id: investorId,
      listing_id: result.listingId,
      total_score: Number(result.totalScore.toFixed(4)),
      score_breakdown: { ...result.breakdown },
      explanation: explainMatch(listing, investor, result),
      scoring_version: SCORING_VERSION,
      generated_by: "deterministic_v1",
    };
  });

  if (rows.length === 0) return [];

  const { error: upsertError } = await supabase
    .from("property_matches")
    .upsert(rows, { onConflict: "investor_id,listing_id,scoring_version" });

  if (upsertError) throw upsertError;

  return rows;
}
