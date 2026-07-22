"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Investor-initiated consultation request (PRD FR-11/FR-4). Creates the
 * booking and, if the investor has no active Settlement Accelerator
 * journey yet, opens one at Stage 1 (Investor Enquiry) — the one stage an
 * investor is authorised to write themselves (see
 * lib/settlement-accelerator/stages.ts and the matching RLS policy).
 * Advancing to Stage 2 (Strategy Consultation) happens once the assigned
 * broker (or admin, if unassigned) confirms the booking — that action
 * ships with the broker portal, out of scope for this pass.
 */
export async function requestConsultation() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existingClient } = await supabase
    .from("broker_clients")
    .select("broker_id")
    .eq("investor_id", user.id)
    .maybeSingle();

  const { error: bookingError } = await supabase.from("consultation_bookings").insert({
    investor_id: user.id,
    broker_id: existingClient?.broker_id ?? null,
    status: "requested",
  });
  if (bookingError) throw bookingError;

  const { data: existingJourney } = await supabase
    .from("settlement_journeys")
    .select("id")
    .eq("investor_id", user.id)
    .maybeSingle();

  let journeyId = existingJourney?.id;

  if (!journeyId) {
    const { data: newJourney, error: journeyError } = await supabase
      .from("settlement_journeys")
      .insert({ investor_id: user.id, broker_id: existingClient?.broker_id ?? null })
      .select("id")
      .single();
    if (journeyError) throw journeyError;
    journeyId = newJourney.id;

    await supabase.from("settlement_stage_events").insert({
      journey_id: journeyId,
      stage: "investor_enquiry",
      actor_id: user.id,
      note: "Consultation requested via investor dashboard.",
    });
  }

  revalidatePath("/investor/dashboard");
  revalidatePath("/investor/journey");
}
