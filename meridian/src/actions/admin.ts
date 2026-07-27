"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  brokerInviteSchema,
  slugifyAgency,
  type BrokerInviteInput,
} from "@/lib/validation/broker-invite";
import type { LeadStatus } from "@/types/database";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verified against the profiles table, not user_metadata — metadata is
  // self-writable at signup, so it can't be the authorisation source for
  // actions that go on to use the service-role client (which bypasses RLS
  // entirely and therefore has no second line of defence).
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") throw new Error("Admin role required");

  return { supabase, user };
}

export async function approveAndPublishListing(listingId: string) {
  const { supabase, user } = await requireAdmin();

  const { error } = await supabase
    .from("listings")
    .update({
      status: "published",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      published_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq("id", listingId);

  if (error) throw error;

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "listing.approved_and_published",
    entity_type: "listing",
    entity_id: listingId,
  });

  revalidatePath("/admin/approvals");
}

export async function rejectListing(listingId: string, reason: string) {
  const { supabase, user } = await requireAdmin();

  const { error } = await supabase
    .from("listings")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      rejection_reason: reason,
    })
    .eq("id", listingId);

  if (error) throw error;

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "listing.rejected",
    entity_type: "listing",
    entity_id: listingId,
    reason,
  });

  revalidatePath("/admin/approvals");
}

/**
 * Grants or revokes a broker's portal access. Self-registered brokers
 * (/broker-signup) land here inactive; until this flips them active the
 * broker layout shows a holding screen instead of any client data.
 */
export async function setBrokerActive(brokerId: string, isActive: boolean) {
  const { user } = await requireAdmin();

  const admin = createAdminClient();
  const { error } = await admin
    .from("broker_profiles")
    .update({ is_active: isActive })
    .eq("id", brokerId);
  if (error) throw error;

  await admin.from("audit_log").insert({
    actor_id: user.id,
    action: isActive ? "broker.activated" : "broker.deactivated",
    entity_type: "broker",
    entity_id: brokerId,
  });

  revalidatePath("/admin/brokers");
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const { supabase, user } = await requireAdmin();

  const { error } = await supabase.from("leads").update({ status }).eq("id", leadId);
  if (error) throw error;

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: `lead.marked_${status}`,
    entity_type: "lead",
    entity_id: leadId,
  });

  revalidatePath("/admin/leads");
}

export interface BrokerInviteState {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<keyof BrokerInviteInput, string>>;
}

/**
 * Invites a broker (PRD FR-15: broker accounts are an admin/ops action,
 * not self-service). Sends a Supabase invite email; the broker clicks
 * through to /set-password and chooses their own password — no password
 * is ever generated, transmitted, or known by the admin.
 *
 * Uses the service-role client because creating an auth user is a
 * privileged operation with no RLS equivalent. requireAdmin() above is
 * therefore the *only* authorisation gate on this path, and it verifies
 * the role against the profiles table rather than trusting metadata.
 */
export async function inviteBroker(input: BrokerInviteInput): Promise<BrokerInviteState> {
  const { user } = await requireAdmin();

  const parsed = brokerInviteSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: BrokerInviteState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0] as keyof BrokerInviteInput] = issue.message;
    }
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;

  const admin = createAdminClient();

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", data.email)
    .maybeSingle();
  if (existingProfile) {
    return { error: "An account already exists with that email address." };
  }

  // Build the invite redirect from the incoming request so this works on
  // localhost, preview deployments, and the live domain without another
  // environment variable to keep in sync.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const redirectTo = `${proto}://${host}/set-password`;

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    data.email,
    {
      data: { role: "broker", full_name: data.fullName },
      redirectTo,
    }
  );

  if (inviteError || !invited?.user) {
    console.error("[inviteBroker] invite failed:", inviteError);
    return { error: inviteError?.message ?? "Could not send the invite. Please try again." };
  }

  // handle_new_user() defaults role to 'investor' when metadata is absent;
  // it is present here, but set it explicitly so the profile is correct
  // regardless of how the trigger resolved it.
  await admin
    .from("profiles")
    .update({ role: "broker", full_name: data.fullName })
    .eq("id", invited.user.id);

  const baseSlug = slugifyAgency(data.agencyName);
  let slug = baseSlug;
  for (let attempt = 2; attempt <= 20; attempt++) {
    const { data: taken } = await admin
      .from("broker_profiles")
      .select("id")
      .eq("referral_link_slug", slug)
      .maybeSingle();
    if (!taken) break;
    slug = `${baseSlug}-${attempt}`;
  }

  const { error: profileError } = await admin.from("broker_profiles").insert({
    id: invited.user.id,
    agency_name: data.agencyName,
    acl_number: data.aclNumber || null,
    referral_link_slug: slug,
  });

  if (profileError) {
    console.error("[inviteBroker] broker_profiles insert failed:", profileError);
    return {
      error:
        "The invite email was sent, but setting up the broker profile failed. Contact support before they sign in.",
    };
  }

  await admin.from("audit_log").insert({
    actor_id: user.id,
    action: "broker.invited",
    entity_type: "broker",
    entity_id: invited.user.id,
  });

  revalidatePath("/admin/brokers");
  return { success: `Invite sent to ${data.email}.` };
}
