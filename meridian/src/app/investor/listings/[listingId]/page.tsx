import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SaveListingButton } from "@/components/listings/save-listing-button";
import { DownloadBrochureButton } from "@/components/listings/download-brochure-button";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { formatCompletionTimeline } from "@/lib/format-timeline";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  type ListingDetailRow = {
    id: string;
    title: string;
    address_line: string | null;
    price: number;
    deposit_required: number;
    rental_estimate_weekly: number;
    expected_yield: number;
    land_size_sqm: number;
    build_size_sqm: number;
    property_type: string;
    growth_driver_score: number;
    growth_drivers: string[];
    nearby_infrastructure: string[];
    completion_timeline: string | null;
    status: string;
    projects: { name: string; description: string | null } | { name: string; description: string | null }[] | null;
    suburbs:
      | { name: string; state: string; postcode: string; growth_driver_notes: string | null }
      | { name: string; state: string; postcode: string; growth_driver_notes: string | null }[]
      | null;
  };

  const { data: listing } = (await supabase
    .from("listings")
    .select(
      "id, title, address_line, price, deposit_required, rental_estimate_weekly, expected_yield, land_size_sqm, build_size_sqm, property_type, growth_driver_score, growth_drivers, nearby_infrastructure, completion_timeline, status, projects:project_id(name, description), suburbs:suburb_id(name, state, postcode, growth_driver_notes)"
    )
    .eq("id", listingId)
    .eq("status", "published")
    .maybeSingle()) as { data: ListingDetailRow | null };

  if (!listing) notFound();

  const project = Array.isArray(listing.projects) ? listing.projects[0] : listing.projects;
  const suburb = Array.isArray(listing.suburbs) ? listing.suburbs[0] : listing.suburbs;

  const { data: saved } = await supabase
    .from("saved_listings")
    .select("listing_id")
    .eq("investor_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  const { data: images } = await supabase
    .from("listing_images")
    .select("storage_path")
    .eq("listing_id", listingId)
    .order("sort_order", { ascending: true });

  const imageUrls = (images ?? []).map(
    (img) => supabase.storage.from("listing-images").getPublicUrl(img.storage_path).data.publicUrl
  );

  const timelineLabel = formatCompletionTimeline(listing.completion_timeline);

  return (
    <div className="space-y-8">
      <Link
        href="/investor/listings"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to browse
      </Link>

      {imageUrls.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {imageUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={listing.title}
              className="h-64 w-full rounded-lg object-cover"
            />
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-muted)]">
            {suburb?.name}, {suburb?.state}
            {suburb?.postcode ? ` ${suburb.postcode}` : ""}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-medium text-[var(--color-ink)]">
            {listing.title}
          </h1>
          {listing.address_line && (
            <p className="mt-1 text-sm text-[var(--color-muted)]">{listing.address_line}</p>
          )}
          {project?.name && (
            <p className="mt-1 text-sm text-[var(--color-muted)]">by {project.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <SaveListingButton listingId={listing.id} isSaved={Boolean(saved)} />
          <DownloadBrochureButton listingId={listing.id} />
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Price" value={formatCurrency(Number(listing.price))} />
          <Stat label="Deposit required" value={formatCurrency(Number(listing.deposit_required))} />
          <Stat label="Est. yield" value={formatPercent(Number(listing.expected_yield))} />
          <Stat
            label="Est. rent"
            value={`${formatCurrency(Number(listing.rental_estimate_weekly))}/week`}
          />
          <Stat label="Land size" value={`${Number(listing.land_size_sqm)} m²`} />
          <Stat label="Build size" value={`${Number(listing.build_size_sqm)} m²`} />
          <Stat label="Property type" value={<Badge variant="outline">{listing.property_type}</Badge>} />
          {timelineLabel && <Stat label="Est. completion" value={timelineLabel} />}
        </CardContent>
      </Card>

      {project?.description && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">About this project</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{project.description}</p>
          </CardContent>
        </Card>
      )}

      {(listing.growth_drivers.length > 0 || suburb?.growth_driver_notes) && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">Growth drivers</h2>
            {suburb?.growth_driver_notes && (
              <p className="mt-2 text-sm text-[var(--color-muted)]">{suburb.growth_driver_notes}</p>
            )}
            {listing.growth_drivers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {listing.growth_drivers.map((driver) => (
                  <Badge key={driver} variant="accent">
                    {driver.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {listing.nearby_infrastructure.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">Nearby infrastructure</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {listing.nearby_infrastructure.map((item) => (
                <Badge key={item} variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{value}</p>
    </div>
  );
}
