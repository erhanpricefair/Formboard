"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
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
