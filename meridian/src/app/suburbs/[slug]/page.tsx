import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PublicListingCard } from "@/components/listings/public-listing-card";
import { SignupCta } from "@/components/marketing/signup-cta";
import { Card, CardContent } from "@/components/ui/card";
import { createPublicClient } from "@/lib/supabase/public";
import { fetchPublicListings } from "@/lib/listings/public-listings";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { absoluteUrl, jsonLd, suburbSlug } from "@/lib/seo";

type Suburb = {
  id: string;
  name: string;
  state: string;
  postcode: string;
  growth_driver_notes: string | null;
};

/**
 * Resolves a slug like "clyde-north-vic" back to a suburb row. The slug is
 * derived, not stored (see lib/seo.ts suburbSlug), so this recomputes it
 * for every suburb rather than trying to parse the slug apart — suburb
 * names contain hyphens and multi-word states, which makes splitting on
 * "-" ambiguous. The suburbs table is reference data of a few hundred rows
 * at most, so a full scan here is cheaper than a schema migration.
 */
async function getSuburb(slug: string): Promise<Suburb | null> {
  const supabase = createPublicClient();
  const { data } = await supabase.from("suburbs").select("id, name, state, postcode, growth_driver_notes");
  return (data ?? []).find((s) => suburbSlug(s.name, s.state) === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const suburb = await getSuburb(slug);
  if (!suburb) return { title: "Suburb not found" };

  // Bare title — the root layout's title.template appends "| InvestorSource".
  const title = `Investment Properties in ${suburb.name}, ${suburb.state} ${suburb.postcode}`;
  const description = `House and land packages and investment properties for sale in ${suburb.name}, ${suburb.state}. Compare price, deposit, rental estimate and expected yield on every vetted listing.`;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/suburbs/${slug}`) },
    openGraph: {
      title: `${title} | InvestorSource`,
      description,
      url: absoluteUrl(`/suburbs/${slug}`),
      type: "website",
    },
  };
}

export default async function SuburbPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const suburb = await getSuburb(slug);
  if (!suburb) notFound();

  const supabase = createPublicClient();
  const { listings, total } = await fetchPublicListings(
    supabase,
    { suburbIds: [suburb.id] },
    { limit: 48, offset: 0 }
  );

  const prices = listings.map((l) => l.price);
  const yields = listings.map((l) => l.expectedYield);
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;
  const highestYield = yields.length > 0 ? Math.max(...yields) : null;

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Properties", item: absoluteUrl("/properties") },
      {
        "@type": "ListItem",
        position: 2,
        name: `${suburb.name}, ${suburb.state}`,
        item: absoluteUrl(`/suburbs/${slug}`),
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />

      <main className="flex-1 bg-[var(--color-paper)]">
        <div className="mx-auto max-w-7xl space-y-8 px-6 py-12 lg:px-8">
          <Link
            href="/properties"
            className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            <ArrowLeft className="h-4 w-4" />
            All properties
          </Link>

          <div>
            <h1 className="font-serif text-4xl font-medium text-[var(--color-ink)]">
              Investment properties in {suburb.name}, {suburb.state}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">
              {total === 0
                ? `We don't have any published opportunities in ${suburb.name} right now. New stock is added regularly — create a free account and we'll match you as soon as something fits.`
                : `${total} vetted ${total === 1 ? "opportunity" : "opportunities"} in ${suburb.name} ${suburb.postcode}${
                    lowestPrice !== null ? `, from ${formatCurrency(lowestPrice)}` : ""
                  }${highestYield !== null ? ` with estimated yields up to ${formatPercent(highestYield)}` : ""}.`}
            </p>
          </div>

          {suburb.growth_driver_notes && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                  Why investors look at {suburb.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                  {suburb.growth_driver_notes}
                </p>
              </CardContent>
            </Card>
          )}

          {listings.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <PublicListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          <SignupCta
            heading={`Get matched in ${suburb.name} and nearby`}
            body="Tell us your budget, deposit and goals and we'll score every published opportunity against them — including new stock in this suburb as it lands."
          />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
