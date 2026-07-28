import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SignupCta } from "@/components/marketing/signup-cta";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createPublicClient } from "@/lib/supabase/public";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { formatCompletionTimeline } from "@/lib/format-timeline";
import { absoluteUrl, jsonLd, suburbSlug } from "@/lib/seo";

type SuburbRef = {
  name: string;
  state: string;
  postcode: string;
  growth_driver_notes: string | null;
};

type ListingDetail = {
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
  growth_drivers: string[];
  nearby_infrastructure: string[];
  completion_timeline: string | null;
  published_at: string | null;
  projects: { name: string; description: string | null } | { name: string; description: string | null }[] | null;
  suburbs: SuburbRef | SuburbRef[] | null;
};

const COLUMNS =
  "id, title, address_line, price, deposit_required, rental_estimate_weekly, expected_yield, land_size_sqm, build_size_sqm, property_type, growth_drivers, nearby_infrastructure, completion_timeline, published_at, projects:project_id(name, description), suburbs:suburb_id(name, state, postcode, growth_driver_notes)";

async function getListing(listingId: string): Promise<ListingDetail | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("listings")
    .select(COLUMNS)
    .eq("id", listingId)
    .eq("status", "published")
    .maybeSingle();
  return (data as ListingDetail | null) ?? null;
}

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ listingId: string }>;
}): Promise<Metadata> {
  const { listingId } = await params;
  const listing = await getListing(listingId);
  if (!listing) return { title: "Property not found" };

  const suburb = one(listing.suburbs);
  const location = suburb ? `${suburb.name}, ${suburb.state}` : "Australia";
  // Bare title — the root layout's title.template appends "| InvestorSource".
  const title = `${listing.title} — ${location}`;
  const description = `${listing.property_type} investment opportunity in ${location}. ${formatCurrency(
    Number(listing.price)
  )}, ${formatPercent(Number(listing.expected_yield))} estimated yield, ${formatCurrency(
    Number(listing.rental_estimate_weekly)
  )}/week estimated rent. Reviewed and published by InvestorSource.`;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/properties/${listing.id}`) },
    openGraph: {
      title: `${title} | InvestorSource`,
      description,
      url: absoluteUrl(`/properties/${listing.id}`),
      type: "website",
    },
  };
}

export default async function PublicListingDetailPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  const listing = await getListing(listingId);
  if (!listing) notFound();

  const supabase = createPublicClient();
  const project = one(listing.projects);
  const suburb = one(listing.suburbs);
  const timelineLabel = formatCompletionTimeline(listing.completion_timeline);

  const { data: images } = await supabase
    .from("listing_images")
    .select("storage_path")
    .eq("listing_id", listing.id)
    .order("sort_order", { ascending: true });

  const imageUrls = (images ?? []).map(
    (img) => supabase.storage.from("listing-images").getPublicUrl(img.storage_path).data.publicUrl
  );

  const canonical = absoluteUrl(`/properties/${listing.id}`);
  const location = suburb ? `${suburb.name}, ${suburb.state}` : "Australia";

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateListing",
        "@id": canonical,
        url: canonical,
        name: listing.title,
        description: project?.description ?? `Investment property in ${location}.`,
        ...(listing.published_at ? { datePosted: listing.published_at } : {}),
        ...(imageUrls.length > 0 ? { image: imageUrls } : {}),
        about: {
          "@type": "Residence",
          name: listing.title,
          address: {
            "@type": "PostalAddress",
            ...(listing.address_line ? { streetAddress: listing.address_line } : {}),
            addressLocality: suburb?.name ?? "",
            addressRegion: suburb?.state ?? "",
            postalCode: suburb?.postcode ?? "",
            addressCountry: "AU",
          },
          ...(Number(listing.build_size_sqm) > 0
            ? {
                floorSize: {
                  "@type": "QuantitativeValue",
                  value: Number(listing.build_size_sqm),
                  unitCode: "MTK",
                },
              }
            : {}),
        },
        offers: {
          "@type": "Offer",
          price: Number(listing.price),
          priceCurrency: "AUD",
          availability: "https://schema.org/InStock",
          url: canonical,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Properties", item: absoluteUrl("/properties") },
          ...(suburb
            ? [
                {
                  "@type": "ListItem",
                  position: 2,
                  name: location,
                  item: absoluteUrl(`/suburbs/${suburbSlug(suburb.name, suburb.state)}`),
                },
              ]
            : []),
          { "@type": "ListItem", position: suburb ? 3 : 2, name: listing.title, item: canonical },
        ],
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />

      <main className="flex-1 bg-[var(--color-paper)]">
        <div className="mx-auto max-w-5xl space-y-8 px-6 py-12 lg:px-8">
          <Link
            href="/properties"
            className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            <ArrowLeft className="h-4 w-4" />
            All properties
          </Link>

          {imageUrls.length > 0 && (
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
          )}

          <div>
            <p className="text-sm font-medium tracking-wide text-[var(--color-muted)] uppercase">
              {suburb ? (
                <Link
                  href={`/suburbs/${suburbSlug(suburb.name, suburb.state)}`}
                  className="hover:underline"
                >
                  {suburb.name}, {suburb.state} {suburb.postcode}
                </Link>
              ) : (
                "Australia"
              )}
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

          <Card>
            <CardContent className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Price" value={formatCurrency(Number(listing.price))} />
              <Stat
                label="Deposit required"
                value={formatCurrency(Number(listing.deposit_required))}
              />
              <Stat label="Est. yield" value={formatPercent(Number(listing.expected_yield))} />
              <Stat
                label="Est. rent"
                value={`${formatCurrency(Number(listing.rental_estimate_weekly))}/week`}
              />
              <Stat label="Land size" value={`${Number(listing.land_size_sqm)} m²`} />
              <Stat label="Build size" value={`${Number(listing.build_size_sqm)} m²`} />
              <Stat
                label="Property type"
                value={<Badge variant="outline">{listing.property_type}</Badge>}
              />
              {timelineLabel && <Stat label="Est. completion" value={timelineLabel} />}
            </CardContent>
          </Card>

          {project?.description && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-sm font-semibold text-[var(--color-ink)]">About this project</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                  {project.description}
                </p>
              </CardContent>
            </Card>
          )}

          {(listing.growth_drivers.length > 0 || suburb?.growth_driver_notes) && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-sm font-semibold text-[var(--color-ink)]">Growth drivers</h2>
                {suburb?.growth_driver_notes && (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                    {suburb.growth_driver_notes}
                  </p>
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
                <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                  Nearby infrastructure
                </h2>
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

          <SignupCta
            heading="Is this one right for you?"
            body="Create a free account and we'll score this property — and every other published opportunity — against your budget, deposit, timeframe and growth-vs-yield preference, then connect you with a licensed broker who can take it from here."
          />
        </div>
      </main>

      <SiteFooter />
    </>
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
