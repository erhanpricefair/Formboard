import { createClient } from "@/lib/supabase/server";
import { ListingCard, type ListingCardData } from "@/components/listings/listing-card";
import { Card, CardContent } from "@/components/ui/card";

export default async function SavedListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: saved } = await supabase
    .from("saved_listings")
    .select(
      "listing_id, listing:listing_id(id, title, price, deposit_required, expected_yield, property_type, suburbs:suburb_id(name, state))"
    )
    .eq("investor_id", user.id);

  type SavedRow = {
    listing: {
      id: string;
      title: string;
      price: number;
      deposit_required: number;
      expected_yield: number;
      property_type: string;
      suburbs: { name: string; state: string } | { name: string; state: string }[] | null;
    } | null;
  };

  const listingCards: ListingCardData[] = ((saved as SavedRow[] | null) ?? [])
    .filter((s) => s.listing !== null)
    .map((s) => {
      const listing = s.listing!;
      const suburb = Array.isArray(listing.suburbs) ? listing.suburbs[0] : listing.suburbs;
      return {
        id: listing.id,
        title: listing.title,
        suburbName: suburb?.name ?? "",
        state: suburb?.state ?? "",
        price: Number(listing.price),
        depositRequired: Number(listing.deposit_required),
        expectedYield: Number(listing.expected_yield),
        propertyType: listing.property_type,
        isSaved: true,
      };
    });

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">Saved properties</h1>

      {listingCards.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <p className="text-sm text-[var(--color-muted)]">
              You haven&rsquo;t saved any opportunities yet — tap the heart icon on a match to
              keep it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listingCards.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
