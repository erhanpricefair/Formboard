"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAdvanceStage } from "@/lib/settlement-accelerator/stages";
import { notifyAdmin } from "@/lib/email/notify";
import type { SettlementStage } from "@/types/database";

export interface BrokerActionState {
  error?: string;
}

/**
 * "Manual invite" (PRD FR-6/§4.3): links an *existing* investor account
 * (found by email) to this broker's roster. Inviting someone who has
 * never registered is out of scope for this pass — brokers should share
 * their referral link (client_link_source = 'referral_link') for that
 * case, which auto-links on onboarding completion (actions/onboarding.ts).
 */
export async function addClientByEmail(email: string): Promise<BrokerActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();

  if (!targetProfile || targetProfile.role !== "investor") {
    return {
      error:
        "No investor account found with that email. Share your referral link instead so they can onboard directly.",
    };
  }

  const { data: existingLink } = await supabase
    .from("broker_clients")
    .select("broker_id")
    .eq("investor_id", targetProfile.id)
    .maybeSingle();

  if (existingLink) {
    return { error: "This investor is already linked to a broker." };
  }

  const { error } = await supabase.from("broker_clients").insert({
    broker_id: user.id,
    investor_id: targetProfile.id,
    source: "manual_invite",
  });

  if (error) return { error: "Could not link this client. Please try again." };

  revalidatePath("/broker/clients");
  return {};
}

export async function shareListingWithClient(investorId: string, listingId: string, note?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("shared_listings")
    .insert({ broker_id: user.id, investor_id: investorId, listing_id: listingId, note });

  if (error) throw error;

  revalidatePath(`/broker/clients/${investorId}`);

  try {
    await notifyListingShared(user.id, investorId, listingId, note);
  } catch (err) {
    // Notification failure must never surface as a share failure.
    console.error("[shareListingWithClient] notifyAdmin lookup failed:", err);
  }
}

/**
 * Uses the admin client purely for the notification lookup — the broker's
 * own session can't read another user's `profiles` row (self_or_admin
 * only, see migration 0007), and this is a best-effort email, not the
 * write path the RLS boundary actually protects.
 */
async function notifyListingShared(
  brokerId: string,
  investorId: string,
  listingId: string,
  note?: string
) {
  const admin = createAdminClient();

  const [{ data: broker }, { data: investor }, { data: listing }] = await Promise.all([
    admin
      .from("profiles")
      .select("full_name")
      .eq("id", brokerId)
      .maybeSingle(),
    admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", investorId)
      .maybeSingle(),
    admin
      .from("listings")
      .select("title, suburbs:suburb_id(name, state)")
      .eq("id", listingId)
      .maybeSingle(),
  ]);

  type ListingRow = { title: string; suburbs: { name: string; state: string } | { name: string; state: string }[] | null };
  const listingRow = listing as ListingRow | null;
  const suburb = listingRow ? (Array.isArray(listingRow.suburbs) ? listingRow.suburbs[0] : listingRow.suburbs) : null;

  await notifyAdmin(
    `Listing shared: ${listingRow?.title ?? listingId}`,
    `<p><strong>${broker?.full_name ?? "A broker"}</strong> shared a listing with their client ` +
      `<strong>${investor?.full_name ?? "an investor"}</strong> (${investor?.email ?? "no email on file"}).</p>` +
      `<p><strong>Listing:</strong> ${listingRow?.title ?? "—"}${suburb ? ` — ${suburb.name}, ${suburb.state}` : ""}</p>` +
      (note ? `<p><strong>Note:</strong> ${note}</p>` : "")
  );
}

/**
 * Advances a client's Settlement Accelerator journey. Fast-fail check
 * against lib/settlement-accelerator/stages.ts mirrors — but does not
 * replace — the actor_allowed_for_stage() Postgres function that is the
 * actual security boundary (ARCHITECTURE.md §4.2); an insert a broker
 * isn't authorised for is rejected by RLS regardless of this check.
 */
export async function advanceJourneyStage(
  journeyId: string,
  stage: SettlementStage,
  note?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (!canAdvanceStage("broker", stage)) {
    throw new Error(`Brokers cannot advance a journey to "${stage}".`);
  }

  const { error } = await supabase
    .from("settlement_stage_events")
    .insert({ journey_id: journeyId, stage, actor_id: user.id, note });

  if (error) throw error;

  revalidatePath("/broker/clients");
}
