import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { FilterBar } from "@/components/listings/filter-bar";
import { PublicListingCard } from "@/components/listings/public-listing-card";
import { SignupCta } from "@/components/marketing/signup-cta";
import { Card, CardContent } from "@/components/ui/card";
import { createPublicClient } from "@/lib/supabase/public";
import {
  fetchPublicListings,
  suburbIdsInState,
  type PublicListingFilters,
} from "@/lib/listings/public-listings";
import { absoluteUrl, jsonLd, suburbSlug } from "@/lib/seo";

const PAGE_SIZE = 24;

export const metadata: Metadata = {
  // No "| InvestorSource" suffix here — the root layout's title.template
  // appends it. Open Graph titles below are written out in full because
  // the template does not apply to them.
  title: "Australian Property Investment Opportunities",
  description:
    "Browse vetted house-and-land packages and investment properties across Australia. Compare price, deposit, rental estimate and expected yield on every listing — no account needed to look.",
  alternates: { canonical: absoluteUrl("/properties") },
  openGraph: {
    title: "Australian Property Investment Opportunities | InvestorSource",
    description:
      "Browse vetted house-and-land packages and investment properties across Australia.",
    url: absoluteUrl("/properties"),
    type: "website",
  },
};

function numberParam(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function PublicPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    state?: string;
    type?: string;
    minPrice?: string;
    maxPrice?: string;
    minYield?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = createPublicClient();

  const page = Math.max(1, numberParam(params.page) ?? 1);
  const filters: PublicListingFilters = {
    propertyType: params.type,
    minPrice: numberParam(params.minPrice),
    maxPrice: numberParam(params.maxPrice),
    minYield: numberParam(params.minYield),
  };
  if (params.state) {
    filters.suburbIds = await suburbIdsInState(supabase, params.state);
  }

  const { listings, total } = await fetchPublicListings(supabase, filters, {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(
    params.state || params.type || params.minPrice || params.maxPrice || params.minYield
  );

  // Suburb links give crawlers a path from this hub page into the
  // long-tail suburb pages, which is where the specific "house and land
  // <suburb>" searches actually land.
  const { data: suburbRows } = await supabase
    .from("suburbs")
    .select("name, state")
    .order("name", { ascending: true });
  const suburbs = (suburbRows ?? []).slice(0, 60);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Australian property investment opportunities",
    numberOfItems: total,
    itemListElement: listings.map((listing, index) => ({
      "@type": "ListItem",
      position: (page - 1) * PAGE_SIZE + index + 1,
      url: absoluteUrl(`/properties/${listing.id}`),
      name: listing.title,
    })),
  };

  return (
    <>
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(itemList) }} />

      <main className="flex-1 bg-[var(--color-paper)]">
        <div className="mx-auto max-w-7xl space-y-8 px-6 py-12 lg:px-8">
          <div>
            <h1 className="font-serif text-4xl font-medium text-[var(--color-ink)]">
              Property investment opportunities
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">
              Every listing below is sourced from a vetted developer and reviewed before it&rsquo;s
              published. Browse freely — create a free account when you want them scored against
              your own budget, deposit and investment goals.
            </p>
          </div>

          <FilterBar />

          <p className="text-sm text-[var(--color-muted)]">
            {total === 0
              ? "No properties match those filters."
              : `${total} ${total === 1 ? "property" : "properties"}${hasFilters ? " matching your filters" : " available"}`}
          </p>

          {listings.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-sm text-[var(--color-muted)]">
                Nothing matches those filters right now. Try widening the price range or clearing
                the state filter.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <PublicListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-4 pt-2" aria-label="Pagination">
              {page > 1 && (
                <Link
                  href={`/properties?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
                  className="text-sm font-medium text-[var(--color-accent-ink)] hover:underline"
                >
                  ← Previous
                </Link>
              )}
              <span className="text-sm text-[var(--color-muted)]">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/properties?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
                  className="text-sm font-medium text-[var(--color-accent-ink)] hover:underline"
                >
                  Next →
                </Link>
              )}
            </nav>
          )}

          <SignupCta />

          {suburbs.length > 0 && (
            <div className="border-t border-[var(--color-border)] pt-8">
              <h2 className="text-sm font-semibold text-[var(--color-ink)]">Browse by suburb</h2>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {suburbs.map((s) => (
                  <Link
                    key={`${s.name}-${s.state}`}
                    href={`/suburbs/${suburbSlug(s.name, s.state)}`}
                    className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:underline"
                  >
                    {s.name}, {s.state}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
