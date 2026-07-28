"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAdvanceStage } from "@/lib/settlement-accelerator/stages";
import { notifyAdmin } from "@/lib/email/notify";
import { runMatchingForInvestor } from "@/lib/matching/run";
import {
  brokerClientIntakeSchema,
  type BrokerClientIntakeInput,
} from "@/lib/validation/broker-client-intake";
import { growthYieldScoreToPreference } from "@/lib/validation/onboarding";
import type { SettlementStage } from "@/types/database";

export interface BrokerActionState {
  error?: string;
  fieldErrors?: Partial<Record<keyof BrokerClientIntakeInput, string>>;
}

/**
 * Every action in this file acts on client data (contact details, budget,
 * finance status) on behalf of a broker, so each one needs to actually
 * be one — none of them checked this before, relying only on
 * `if (!user) throw`, which just confirms *someone* is logged in. Checked
 * against profiles.role, not user_metadata.role (attacker-controlled at
 * signup, see migration 0012). Also enforces the same is_active gate the
 * broker portal layout shows a holding screen for, so a pending
 * self-registration (actions/broker-signup.ts) can't reach client data
 * via a direct server action call even though the UI wouldn't offer it.
 */
async function requireActiveBroker() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "broker") throw new Error("Broker role required");

  const { data: brokerProfile } = await supabase
    .from("broker_profiles")
    .select("is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (!brokerProfile?.is_active) throw new Error("Your broker account is pending approval");

  return { supabase, user };
}

/**
 * "Manual invite" (PRD FR-6/§4.3): links an *existing* investor account
 * (found by email) to this broker's roster.
 */
export async function addClientByEmail(email: string): Promise<BrokerActionState> {
  const { user } = await requireActiveBroker();
  const admin = createAdminClient();

  const { data: targetProfile } = await admin
    .from("profiles")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();

  if (!targetProfile || targetProfile.role !== "investor") {
    return {
      error:
        "No investor account found with that email. Use \"Add a new client\" instead if they haven't signed up.",
    };
  }

  const { data: existingLink } = await admin
    .from("broker_clients")
    .select("broker_id")
    .eq("investor_id", targetProfile.id)
    .maybeSingle();

  if (existingLink) {
    return { error: "This investor is already linked to a broker." };
  }

  // broker_clients has no client-insert RLS policy by design (migration
  // 0007) -- provenance (referral link vs. manual lookup vs. direct
  // intake) is validated here, server-side, not by a policy a browser
  // could satisfy directly.
  const { error } = await admin.from("broker_clients").insert({
    broker_id: user.id,
    investor_id: targetProfile.id,
    source: "manual_invite",
  });

  if (error) return { error: "Could not link this client. Please try again." };

  revalidatePath("/broker/clients");
  return {};
}

/**
 * Full client intake on behalf of someone who has never signed up.
 * Creates a real investor account (so the rest of the platform --
 * matching, dashboard, Settlement Accelerator -- works identically to a
 * self-onboarded investor), links it to this broker, and runs the
 * matching engine immediately so matches are ready the moment the broker
 * looks at the new client's page.
 *
 * The client never sees a password screen, same as self-service
 * onboarding (actions/onboarding.ts) -- a random password is generated
 * and discarded. They can claim the account later via "Forgot password?"
 * on /login using this email, or the broker can tell them to.
 */
export async function addClientDirectly(input: BrokerClientIntakeInput): Promise<BrokerActionState> {
  const parsed = brokerClientIntakeSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: BrokerActionState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0] as keyof BrokerClientIntakeInput] = issue.message;
    }
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;

  const { user } = await requireActiveBroker();
  const admin = createAdminClient();

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", data.email)
    .maybeSingle();
  if (existingProfile) {
    return {
      error: "An account already exists with that email. Use \"Link existing client\" instead.",
    };
  }

  const randomPassword = crypto.randomUUID() + crypto.randomUUID();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: data.email,
    password: randomPassword,
    email_confirm: true,
    user_metadata: { full_name: data.fullName, phone: data.phone || null },
  });

  if (createError || !created?.user) {
    console.error("[addClientDirectly] createUser failed:", createError);
    return { error: "Could not create the client record. Please try again." };
  }

  const preference = growthYieldScoreToPreference(data.growthYieldScore);

  const { error: upsertError } = await admin.from("investor_profiles").upsert(
    {
      id: created.user.id,
      budget_max: data.budgetMax,
      deposit_available: data.depositAvailable,
      preferred_states: data.preferredStates,
      preferred_suburbs: data.preferredSuburbs,
      experience: data.experience,
      growth_yield_preference: preference,
      growth_yield_score: data.growthYieldScore,
      occupier_intent: data.occupierIntent,
      finance_status: data.financeStatus,
      timeframe: data.timeframe,
      onboarding_completed_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (upsertError) {
    console.error("[addClientDirectly] investor_profiles upsert failed:", upsertError);
    // Don't leave an orphaned auth user with no profile behind — a retry
    // with the same email would otherwise hit the "already exists" check
    // above and be stuck.
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "Could not save this client's profile. Please try again." };
  }

  const { error: linkError } = await admin.from("broker_clients").insert({
    broker_id: user.id,
    investor_id: created.user.id,
    source: "broker_added",
  });

  if (linkError) {
    console.error("[addClientDirectly] broker_clients insert failed:", linkError);
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "Could not link this client to your roster. Please try again." };
  }

  try {
    await runMatchingForInvestor(admin, created.user.id, {
      budgetMax: data.budgetMax,
      depositAvailable: data.depositAvailable,
      preferredStates: data.preferredStates,
      preferredSuburbs: data.preferredSuburbs,
      growthYieldScore: data.growthYieldScore,
      growthYieldPreference: preference,
      timeframe: data.timeframe,
    });
  } catch (err) {
    // Matching failure must never block the client record being created —
    // the broker can retry matching from the client's page.
    console.error("[addClientDirectly] matching run failed:", err);
  }

  revalidatePath("/broker/clients");
  return {};
}

export async function shareListingWithClient(investorId: string, listingId: string, note?: string) {
  const { supabase, user } = await requireActiveBroker();

  // Session client, not admin — shared_listings_insert_broker (migration
  // 0007) checks is_broker_of(investorId), i.e. that this investor is
  // actually on this broker's roster. That's the real authorization
  // boundary for *which* investor a share can target; requireActiveBroker
  // above only confirms the caller is an active broker at all.
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
  const { supabase, user } = await requireActiveBroker();

  if (!canAdvanceStage("broker", stage)) {
    throw new Error(`Brokers cannot advance a journey to "${stage}".`);
  }

  const { error } = await supabase
    .from("settlement_stage_events")
    .insert({ journey_id: journeyId, stage, actor_id: user.id, note });

  if (error) throw error;

  revalidatePath("/broker/clients");
}
