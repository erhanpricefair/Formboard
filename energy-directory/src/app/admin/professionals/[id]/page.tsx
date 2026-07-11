import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { categoryLabel } from "@/lib/categories";
import { VerificationActions } from "@/components/admin/VerificationActions";

export default async function AdminProfessionalDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: professional } = await supabase.from("professionals").select("*").eq("id", params.id).maybeSingle();

  if (!professional) notFound();

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{professional.business_name}</h1>
          <p className="text-sm text-ink-500">
            {professional.suburb}, {professional.state} {professional.postcode}
          </p>
        </div>
        <span className="rounded-full border border-ink-700/20 px-3 py-1 text-xs font-medium">
          {professional.verification_status.replace("_", " ")}
        </span>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-ink-500">ABN</dt>
          <dd>{professional.abn}</dd>
        </div>
        <div>
          <dt className="text-ink-500">License number</dt>
          <dd>{professional.license_number ?? "Not provided"}</dd>
        </div>
        <div>
          <dt className="text-ink-500">Phone</dt>
          <dd>{professional.phone}</dd>
        </div>
        <div>
          <dt className="text-ink-500">Public email</dt>
          <dd>{professional.public_email}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-ink-500">Categories</dt>
          <dd>{professional.categories.map(categoryLabel).join(", ")}</dd>
        </div>
        {professional.bio && (
          <div className="col-span-2">
            <dt className="text-ink-500">Bio</dt>
            <dd className="whitespace-pre-line">{professional.bio}</dd>
          </div>
        )}
      </dl>

      <p className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        Before verifying: confirm the ABN is registered and active (abr.business.gov.au) and, where the category
        requires it, that the license number is current with the relevant state authority. Verifying does not imply
        this platform vouches for the professional’s work — see COMPLIANCE_AND_SAFETY.md.
      </p>

      <div className="mt-4">
        <VerificationActions professionalId={professional.id} status={professional.verification_status} />
      </div>
    </div>
  );
}
