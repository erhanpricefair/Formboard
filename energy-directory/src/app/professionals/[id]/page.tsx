import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { categoryLabel } from "@/lib/categories";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { TransparencyNotice } from "@/components/TransparencyNotice";

export const revalidate = 60;

export default async function ProfessionalProfilePage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: professional } = await supabase
    .from("public_professional_directory")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!professional) notFound();

  const privacyPolicyVersion = process.env.NEXT_PUBLIC_PRIVACY_POLICY_VERSION ?? "2026-07-11";

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div>
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-semibold">{professional.business_name}</h1>
          {professional.is_verified && (
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              Verified professional
            </span>
          )}
        </div>
        <p className="mt-1 text-ink-500">
          {professional.suburb}, {professional.state} {professional.postcode}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {professional.categories.map((c) => (
            <span key={c} className="rounded-full bg-ink-900/5 px-3 py-1 text-xs text-ink-700">
              {categoryLabel(c)}
            </span>
          ))}
        </div>

        {professional.tagline && <p className="mt-6 text-lg text-ink-700">{professional.tagline}</p>}
        {professional.bio && <p className="mt-4 whitespace-pre-line text-ink-700">{professional.bio}</p>}

        <div className="mt-8 rounded-md border border-ink-700/10 bg-ink-900/[0.02] p-4 text-sm text-ink-500">
          Reviews, star ratings, and any statements about savings, pricing, or outcomes on this page are provided by
          or self-reported by the professional and are not verified or endorsed by this directory. Always get an
          independent, itemised quote before committing to any work.
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">Send an enquiry</h2>
        <LeadCaptureForm
          professionalId={professional.id}
          defaultServiceType={professional.categories[0]}
          privacyPolicyVersion={privacyPolicyVersion}
        />
        <div className="mt-4">
          <TransparencyNotice compact />
        </div>
      </div>
    </div>
  );
}
