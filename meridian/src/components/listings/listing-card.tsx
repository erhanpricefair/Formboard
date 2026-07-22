"use client";

import { useTransition } from "react";
import { Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import { toggleSavedListing } from "@/actions/listings";

export interface ListingCardData {
  id: string;
  title: string;
  suburbName: string;
  state: string;
  price: number;
  depositRequired: number;
  expectedYield: number;
  propertyType: string;
  explanation?: string;
  isSaved: boolean;
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const [isPending, startTransition] = useTransition();

  function toggleSave() {
    startTransition(() => toggleSavedListing(listing.id, !listing.isSaved));
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">
              {listing.suburbName}, {listing.state}
            </p>
            <h3 className="mt-1 text-base font-semibold text-[var(--color-ink)]">
              {listing.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={toggleSave}
            disabled={isPending}
            aria-label={listing.isSaved ? "Remove from saved" : "Save listing"}
            className="flex-none rounded-full p-1.5 hover:bg-[var(--color-surface-muted)]"
          >
            <Heart
              className={cn(
                "h-5 w-5",
                listing.isSaved ? "fill-[var(--color-accent)] text-[var(--color-accent)]" : "text-[var(--color-muted)]"
              )}
            />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[var(--color-border)] pt-4 text-center">
          <div>
            <p className="text-xs text-[var(--color-muted)]">Price</p>
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              {formatCurrency(listing.price)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted)]">Est. Yield</p>
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

        <div className="mt-3">
          <Badge variant="outline">{listing.propertyType}</Badge>
        </div>

        {listing.explanation && (
          <p className="mt-4 rounded-lg bg-[var(--color-accent-soft)] p-3 text-xs leading-relaxed text-[var(--color-accent-ink)]">
            {listing.explanation}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            View details
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            Download brochure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
