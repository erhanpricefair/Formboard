import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ProfessionalProfileInput } from "@/lib/validations/professional";

/**
 * Creates or updates a professional's own profile. Zod validation
 * (including the banned-claims check) happens in the API route before
 * this is called; the database trigger `reject_promotional_hype` is the
 * backstop if this function is ever reached with unvalidated input.
 */
export async function upsertProfessionalProfile(authUserId: string, input: ProfessionalProfileInput) {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("professionals")
    .upsert(
      {
        auth_user_id: authUserId,
        business_name: input.businessName,
        abn: input.abn,
        categories: input.categories,
        suburb: input.suburb,
        state: input.state,
        postcode: input.postcode,
        service_area_postcodes: input.serviceAreaPostcodes,
        license_number: input.licenseNumber ?? null,
        license_expiry: input.licenseExpiry ?? null,
        phone: input.phone,
        public_email: input.publicEmail,
        website_url: input.websiteUrl ?? null,
        tagline: input.tagline ?? null,
        bio: input.bio ?? null,
      },
      { onConflict: "auth_user_id" }
    )
    .select("id, verification_status")
    .single();

  if (error) {
    // Surface the DB-level "promotional hype" rejection with the same
    // shape as a Zod validation error would produce.
    throw new Error(error.message);
  }

  return data;
}
