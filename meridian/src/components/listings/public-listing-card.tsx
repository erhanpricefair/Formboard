import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { PublicListingSummary } from "@/lib/listings/public-listings";

/**
 * Server-rendered sibling of components/listings/listing-card.tsx. No save
 * button and no brochure download — both need a session — so this stays a
 * plain Server Component with nothing to hydrate, which is what makes the
 * public pages cheap to crawl.
 */
export function PublicListingCard({ listing }: { listing: PublicListingSummary }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="pt-6">
        <p className="text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">
          {listing.suburbName}, {listing.state}
        </p>
        <h3 className="mt-1 text-base font-semibold text-[var(--color-ink)]">
          <Link href={`/properties/${listing.id}`} className="hover:underline">
            {listing.title}
          </Link>
        </h3>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[var(--color-border)] pt-4 text-center">
          <div>
            <p className="text-xs text-[var(--color-muted)]">Price</p>
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              {formatCurrency(listing.price)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted)]">Est. yield</p>
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              {formatPercent(listing.expectedYield)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted)]">Deposit</p>
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              {formatCurrency(listing.depositRequired)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <Badge variant="outline">{listing.propertyType}</Badge>
          <Link
            href={`/properties/${listing.id}`}
            className="text-sm font-medium text-[var(--color-accent-ink)] hover:underline"
          >
            View details →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
