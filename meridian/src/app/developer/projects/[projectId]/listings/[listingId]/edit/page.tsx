import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDeveloperId } from "@/lib/developer/get-developer-id";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MediaUploader } from "@/components/developer/media-uploader";
import { SubmitForReviewButton } from "@/components/developer/submit-for-review-button";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ projectId: string; listingId: string }>;
}) {
  const { projectId, listingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const developerId = await getDeveloperId(supabase, user.id);
  if (!developerId) notFound();

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, title, status, price, deposit_required, rental_estimate_weekly, expected_yield, land_size_sqm, build_size_sqm, property_type, rejection_reason, project_id"
    )
    .eq("id", listingId)
    .maybeSingle();
  if (!listing || listing.project_id !== projectId) notFound();

  const [{ data: images }, { data: documents }] = await Promise.all([
    supabase.from("listing_images").select("id, storage_path").eq("listing_id", listingId),
    supabase.from("listing_documents").select("id, file_name, document_type").eq("listing_id", listingId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">{listing.title}</h1>
          <Badge variant="outline" className="mt-2 capitalize">
            {listing.status.replace(/_/g, " ")}
          </Badge>
        </div>
        {listing.status === "draft" && (
          <SubmitForReviewButton listingId={listing.id} projectId={projectId} />
        )}
      </div>

      {listing.status === "rejected" && listing.rejection_reason && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-700">
            Rejected by admin: {listing.rejection_reason}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="grid gap-6 pt-6 sm:grid-cols-3">
          <Field label="Price" value={formatCurrency(Number(listing.price))} />
          <Field label="Deposit required" value={formatCurrency(Number(listing.deposit_required))} />
          <Field label="Estimated yield" value={formatPercent(Number(listing.expected_yield))} />
          <Field label="Land size" value={`${listing.land_size_sqm} sqm`} />
          <Field label="Build size" value={`${listing.build_size_sqm} sqm`} />
          <Field label="Property type" value={listing.property_type} />
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-semibold text-[var(--color-ink)]">Images</p>
            <ul className="mt-3 space-y-1 text-xs text-[var(--color-muted)]">
              {(images ?? []).map((img) => (
                <li key={img.id}>{img.storage_path.split("/").pop()}</li>
              ))}
              {(!images || images.length === 0) && <li>No images uploaded yet.</li>}
            </ul>
            <div className="mt-4">
              <MediaUploader listingId={listing.id} kind="image" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-semibold text-[var(--color-ink)]">Documents</p>
            <ul className="mt-3 space-y-1 text-xs text-[var(--color-muted)]">
              {(documents ?? []).map((doc) => (
                <li key={doc.id}>
                  {doc.file_name} ({doc.document_type})
                </li>
              ))}
              {(!documents || documents.length === 0) && <li>No documents uploaded yet.</li>}
            </ul>
            <div className="mt-4">
              <MediaUploader listingId={listing.id} kind="document" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">{label}</p>
      <p className="mt-1 text-sm font-medium text-[var(--color-ink)] capitalize">{value}</p>
    </div>
  );
}
