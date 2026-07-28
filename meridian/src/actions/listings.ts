"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface BrochureResult {
  url?: string;
  error?: string;
}

/**
 * Issues a time-boxed signed URL for a listing's brochure (ARCHITECTURE.md
 * §7: "investors receive a time-boxed signed URL issued by a server
 * action ... that server-side path bypasses RLS by design and is the
 * only investor-facing access route"). Uses the service-role client
 * because the listing-documents bucket intentionally has no investor
 * read policy. Every issued URL is logged to document_download_events.
 */
export async function getListingBrochureUrl(listingId: string): Promise<BrochureResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  const { data: document } = await admin
    .from("listing_documents")
    .select("id, storage_path")
    .eq("listing_id", listingId)
    .eq("document_type", "brochure")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!document) {
    return { error: "No brochure has been uploaded for this listing yet." };
  }

  const { data: signed, error: signError } = await admin.storage
    .from("listing-documents")
    .createSignedUrl(document.storage_path, 300);

  if (signError || !signed) {
    return { error: "Could not generate a download link. Please try again." };
  }

  await supabase
    .from("document_download_events")
    .insert({ document_id: document.id, investor_id: user.id });

  return { url: signed.signedUrl };
}

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
