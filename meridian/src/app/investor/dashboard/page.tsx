import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ListingCard, type ListingCardData } from "@/components/listings/listing-card";
import { SettlementTracker } from "@/components/journey/settlement-tracker";
import { RequestConsultationButton } from "@/components/journey/request-consultation-button";
import { Card, CardContent } from "@/components/ui/card";
import type { SettlementStage } from "@/types/database";

export default async function InvestorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Matches, saved list, journey, and profile are fetched as flat queries
  // (no nested resource embeds) — embeds proved fragile under the
  // authenticated role's RLS, silently returning null listings. Fetching
  // the listing/suburb rows separately and joining in JS is bulletproof
  // and makes any real failure visible via the logged errors below.
  const [
    { data: profile },
    { data: matchRows, error: matchErr },
    { data: saved },
    { data: journey },
  ] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("property_matches")
      .select("total_score, explanation, listing_id")
      .eq("investor_id", user.id)
      .order("total_score", { ascending: false })
      .limit(9),
    supabase.from("saved_listings").select("listing_id").eq("investor_id", user.id),
    supabase.from("settlement_journeys").select("id").eq("investor_id", user.id).maybeSingle(),
  ]);

  if (matchErr) console.error("[dashboard] property_matches query failed:", matchErr);

  const savedIds = new Set((saved ?? []).map((s) => s.listing_id));

  let currentStage: SettlementStage | null = null;
  if (journey) {
    const { data: journeyView } = await supabase
      .from("investor_journey_view")
      .select("current_stage")
      .eq("journey_id", journey.id)
      .maybeSingle();
    currentStage = journeyView?.current_stage ?? null;
  }

  const orderedListingIds = (matchRows ?? []).map((m) => m.listing_id);
  const explanationByListingId = new Map(
    (matchRows ?? []).map((m) => [m.listing_id, m.explanation])
  );

  type ListingRow = {
    id: string;
    title: string;
    price: number;
    deposit_required: number;
    expected_yield: number;
    property_type: string;
    suburb_id: string;
  };

  let listingCards: ListingCardData[] = [];

  if (orderedListingIds.length > 0) {
    const { data: listingRows, error: listErr } = await supabase
      .from("listings")
      .select("id, title, price, deposit_required, expected_yield, property_type, suburb_id")
      .in("id", orderedListingIds);
    if (listErr) console.error("[dashboard] listings query failed:", listErr);

    const suburbIds = [...new Set((listingRows ?? []).map((l) => l.suburb_id))];
    const { data: suburbRows } =
      suburbIds.length > 0
        ? await supabase.from("suburbs").select("id, name, state").in("id", suburbIds)
        : { data: [] as { id: string; name: string; state: string }[] };
    const suburbById = new Map((suburbRows ?? []).map((s) => [s.id, s]));
    const listingById = new Map(((listingRows as ListingRow[] | null) ?? []).map((l) => [l.id, l]));

    // Preserve match ranking order (orderedListingIds is sorted by score).
    listingCards = orderedListingIds
      .map((id) => listingById.get(id))
      .filter((l): l is ListingRow => Boolean(l))
      .map((listing) => {
        const suburb = suburbById.get(listing.suburb_id);
        return {
          id: listing.id,
          title: listing.title,
          suburbName: suburb?.name ?? "",
          state: suburb?.state ?? "",
          price: Number(listing.price),
          depositRequired: Number(listing.deposit_required),
          expectedYield: Number(listing.expected_yield),
          propertyType: listing.property_type,
          explanation: explanationByListingId.get(listing.id),
          isSaved: savedIds.has(listing.id),
        };
      });
  }

  return (
    <div className="space-y-12">
      <div>
        <p className="text-sm text-[var(--color-muted)]">Welcome back,</p>
        <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">
          {profile?.full_name ?? "Investor"}
        </h1>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">Your Settlement Accelerator</h2>
          {!journey && <RequestConsultationButton />}
        </div>
        <Card>
          <CardContent className="pt-6">
            {journey ? (
              <SettlementTracker currentStage={currentStage} />
            ) : (
              <p className="text-sm text-[var(--color-muted)]">
                Your journey starts once you book a consultation with a broker — we&rsquo;ll track
                every step from there through to handover and property management.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">Recommended for you</h2>
          <div className="flex gap-4 text-sm">
            <Link href="/investor/saved" className="text-[var(--color-accent-ink)] hover:underline">
              Saved
            </Link>
            <Link href="/investor/compare" className="text-[var(--color-accent-ink)] hover:underline">
              Compare
            </Link>
          </div>
        </div>

        {listingCards.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-[var(--color-muted)]">
                We don&rsquo;t have a strong match for your criteria yet. Try widening your
                preferred states or price range from your{" "}
                <Link href="/investor/profile" className="text-[var(--color-accent-ink)] underline">
                  profile
                </Link>
                , or check back soon as new opportunities are published.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listingCards.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
