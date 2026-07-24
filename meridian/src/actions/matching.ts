"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runMatchingForInvestor } from "@/lib/matching/run";

export interface RefreshMatchesState {
  error?: string;
}

/**
 * Re-runs the matching engine against the investor's existing saved
 * preferences — no questionnaire required. Lets an investor pull in fresh
 * matches (e.g. after new listings are published, or after a scoring fix)
 * without re-doing onboarding. Uses the service-role client for the same
 * reason submitOnboarding does: property_matches has no client-insert RLS
 * policy (ARCHITECTURE.md §4.2).
 */
export async function refreshMatches(): Promise<RefreshMatchesState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("investor_profiles")
    .select(
      "budget_max, deposit_available, preferred_states, preferred_suburbs, growth_yield_score, growth_yield_preference, timeframe"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { error: "Complete your investment profile before refreshing matches." };
  }

  try {
    await runMatchingForInvestor(admin, user.id, {
      budgetMax: Number(profile.budget_max),
      depositAvailable: Number(profile.deposit_available),
      preferredStates: profile.preferred_states,
      preferredSuburbs: profile.preferred_suburbs,
      growthYieldScore: profile.growth_yield_score,
      growthYieldPreference: profile.growth_yield_preference,
      timeframe: profile.timeframe,
    });
  } catch (err) {
    console.error("[refreshMatches] matching run failed:", err);
    return { error: "Could not refresh matches. Please try again." };
  }

  revalidatePath("/investor/dashboard");
  return {};
}
