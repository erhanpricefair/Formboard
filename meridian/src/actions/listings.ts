"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleSavedListing(listingId: string, save: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (save) {
    await supabase.from("saved_listings").upsert({ investor_id: user.id, listing_id: listingId });
  } else {
    await supabase
      .from("saved_listings")
      .delete()
      .eq("investor_id", user.id)
      .eq("listing_id", listingId);
  }

  revalidatePath("/investor/dashboard");
  revalidatePath("/investor/saved");
}
