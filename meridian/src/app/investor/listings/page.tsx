import { createClient } from "@/lib/supabase/server";
import { FilterBar } from "@/components/listings/filter-bar";
import { ListingCard, type ListingCardData } from "@/components/listings/listing-card";
import { Card, CardContent } from "@/components/ui/card";

export default async function BrowseListingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    state?: string;
    type?: string;
    minPrice?: string;
    maxPrice?: string;
    minYield?: string;
  }>;
}) {
  const filters = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let query = supabase
    .from("listings")
    .select(
      "id, title, price, deposit_required, expected_yield, property_type, suburbs:suburb_id(name, state)"
    )
    .eq("status", "published");

  if (filters.type) query = query.eq("property_type", filters.type);
  if (filters.minPrice) query = query.gte("price", Number(filters.minPrice));
  if (filters.maxPrice) query = query.lte("price", Number(filters.maxPrice));
  if (filters.minYield) query = query.gte("expected_yield", Number(filters.minYield));

  const { data: listings } = await query.order("published_at", { ascending: false }).limit(60);

  type Row = {
    id: string;
    title: string;
    price: number;
    deposit_required: number;
    expected_yield: number;
    property_type: string;
    suburbs: { name: string; state: string } | { name: string; state: string }[] | null;
  };

  const { data: saved } = await supabase.from("saved_listings").select("listing_id").eq("investor_id", user.id);
  const savedIds = new Set((saved ?? []).map((s) => s.listing_id));

  let listingCards: ListingCardData[] = ((listings as Row[] | null) ?? []).map((l) => {
    const suburb = Array.isArray(l.suburbs) ? l.suburbs[0] : l.suburbs;
    return {
      id: l.id,
      title: l.title,
      suburbName: suburb?.name ?? "",
      state: suburb?.state ?? "",
      price: Number(l.price),
      depositRequired: Number(l.deposit_required),
      expectedYield: Number(l.expected_yield),
      propertyType: l.property_type,
      isSaved: savedIds.has(l.id),
    };
  });

  // suburbs.state filter applied client-side post-fetch — the embedded
  // resource can't be filtered in the same query builder chain as the
  // parent table's own columns with the hand-written types in this pass.
  if (filters.state) {
    listingCards = listingCards.filter((l) => l.state === filters.state);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">
          Browse opportunities
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Every listing here has passed admin review.
        </p>
      </div>

      <FilterBar />

      {listingCards.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-[var(--color-muted)]">
            No listings match those filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listingCards.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
