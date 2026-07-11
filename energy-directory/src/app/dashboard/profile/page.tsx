import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import type { ProfessionalProfileInput } from "@/lib/validations/professional";

export default async function DashboardProfilePage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: professional } = await supabase
    .from("professionals")
    .select("*")
    .eq("auth_user_id", user!.id)
    .maybeSingle();

  const defaultValues: Partial<ProfessionalProfileInput> | undefined = professional
    ? {
        businessName: professional.business_name,
        abn: professional.abn,
        categories: professional.categories,
        suburb: professional.suburb,
        state: professional.state as ProfessionalProfileInput["state"],
        postcode: professional.postcode,
        serviceAreaPostcodes: professional.service_area_postcodes,
        licenseNumber: professional.license_number ?? undefined,
        phone: professional.phone,
        publicEmail: professional.public_email,
        websiteUrl: professional.website_url ?? undefined,
        tagline: professional.tagline ?? undefined,
        bio: professional.bio ?? undefined,
      }
    : undefined;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Your profile</h1>
      <ProfileForm defaultValues={defaultValues} />
    </div>
  );
}
