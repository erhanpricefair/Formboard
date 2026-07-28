"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { onboardingSchema, growthYieldScoreToPreference, type OnboardingInput } from "@/lib/validation/onboarding";
import { runMatchingForInvestor } from "@/lib/matching/run";
import { ROLE_HOME } from "@/lib/auth/roles";

export interface OnboardingActionState {
  error?: string;
  fieldErrors?: Partial<Record<keyof OnboardingInput, string>>;
}

function serviceRoleConfigured(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(key) && key !== "placeholder-service-role-key";
}

export async function submitOnboarding(
  input: OnboardingInput
): Promise<OnboardingActionState> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: OnboardingActionState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof OnboardingInput;
      fieldErrors[key] = issue.message;
    }
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;

  if (!serviceRoleConfigured()) {
    return {
      error:
        "Server is not fully configured (missing SUPABASE_SERVICE_ROLE_KEY). Add it to .env.local and restart the dev server.",
    };
  }

  // Session-scoped client: used for reading the current user and for
  // signUp (which sets the session cookie so the post-onboarding redirect
  // lands on an authenticated dashboard).
  const supabase = await createClient();

  // Service-role client: used for the privileged writes below. The RLS
  // design (DATABASE_SCHEMA.md §8) deliberately has NO client-insert policy
  // for property_matches or broker_clients, and the investor_profiles
  // self-insert can't rely on a session that isn't reliably attached during
  // the same request that creates the account. Everything written here has
  // already been validated server-side (Zod) and is scoped to the resolved
  // userId, so a service-role write is the correct, documented path
  // (ARCHITECTURE.md §4.2).
  const admin = createAdminClient();

  // Returning, already-authenticated investor editing their profile
  // (FR-2: "re-open and edit the questionnaire from their dashboard").
  const {
    data: { user: existingUser },
  } = await supabase.auth.getUser();

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
  } else {
    // Transparent account creation (FR-15/FR-2): the investor never sees a
    // password screen. A random password is generated and discarded — it
    // is never surfaced to the user or stored by application code beyond
    // this call. Email confirmation must be OFF on the Supabase project so
    // a session is established immediately (see ARCHITECTURE.md §4.4).
    const randomPassword = crypto.randomUUID() + crypto.randomUUID();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: randomPassword,
      options: {
        data: {
          role: "investor",
          full_name: data.fullName,
          phone: data.phone,
        },
      },
    });

    if (signUpError || !signUpData.user) {
      if (signUpError?.message.toLowerCase().includes("already registered")) {
        return {
          error:
            "An account already exists for this email. Please log in to update your investment profile.",
        };
      }
      return { error: signUpError?.message ?? "Could not create your account. Please try again." };
    }

    userId = signUpData.user.id;
  }

  const preference = growthYieldScoreToPreference(data.growthYieldScore);

  const { error: upsertError } = await admin.from("investor_profiles").upsert(
    {
      id: userId,
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
    console.error("[onboarding] investor_profiles upsert failed:", upsertError);
    return { error: "Could not save your investment profile. Please try again." };
  }

  // Broker-referred investor (PRD §4.3): link to the referring broker's
  // roster if a valid referral slug was carried through onboarding.
  if (data.referralSlug) {
    const { data: broker } = await admin
      .from("broker_profiles")
      .select("id")
      .eq("referral_link_slug", data.referralSlug)
      .maybeSingle();

    if (broker) {
      await admin
        .from("broker_clients")
        .upsert(
          { broker_id: broker.id, investor_id: userId, source: "referral_link" },
          { onConflict: "investor_id", ignoreDuplicates: true }
        );
    }
  }

  try {
    await runMatchingForInvestor(admin, userId, {
      budgetMax: data.budgetMax,
      depositAvailable: data.depositAvailable,
      preferredStates: data.preferredStates,
      preferredSuburbs: data.preferredSuburbs,
      growthYieldScore: data.growthYieldScore,
      growthYieldPreference: preference,
      timeframe: data.timeframe,
    });
  } catch (err) {
    // Matching failure must never block onboarding completion (PRD FR-3:
    // dashboard handles a sparse/empty match set gracefully) — the
    // investor still lands on their dashboard and can retry via profile
    // edit, which re-runs matching.
    console.error("[onboarding] matching run failed:", err);
  }

  redirect(ROLE_HOME.investor);
}
