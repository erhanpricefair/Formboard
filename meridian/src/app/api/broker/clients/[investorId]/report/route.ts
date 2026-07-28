import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { ClientReportDocument, type ReportListing } from "@/lib/pdf/client-report";

/**
 * Streams a branded PDF property report for one of the broker's clients.
 * Session client throughout -- the RLS boundary (broker_clients_select:
 * broker_id = auth.uid()) is what actually stops a broker fetching a
 * report for someone else's client, same as the client detail page.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ investorId: string }> }
) {
  const { investorId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: link } = await supabase
    .from("broker_clients")
    .select("investor_id")
    .eq("broker_id", user.id)
    .eq("investor_id", investorId)
    .maybeSingle();
  if (!link) return new Response("Not found", { status: 404 });

  const [{ data: brokerProfile }, { data: brokerAgency }, { data: clientProfile }, { data: investorProfile }] =
    await Promise.all([
      supabase.from("profiles").select("full_name, email, phone").eq("id", user.id).maybeSingle(),
      supabase.from("broker_profiles").select("agency_name, acl_number").eq("id", user.id).maybeSingle(),
      supabase.from("profiles").select("full_name").eq("id", investorId).maybeSingle(),
      supabase.from("investor_profiles").select("*").eq("id", investorId).maybeSingle(),
    ]);

  if (!brokerProfile || !brokerAgency || !clientProfile || !investorProfile) {
    return new Response("Client profile incomplete", { status: 404 });
  }

  const { data: matches } = await supabase
    .from("property_matches")
    .select("listing_id, explanation, total_score")
    .eq("investor_id", investorId)
    .order("total_score", { ascending: false })
    .limit(6);

  const listingIds = (matches ?? []).map((m) => m.listing_id);
  type ListingRow = {
    id: string;
    title: string;
    price: number;
    deposit_required: number;
    expected_yield: number;
    rental_estimate_weekly: number;
    property_type: string;
    suburbs: { name: string; state: string } | { name: string; state: string }[] | null;
  };

  const { data: listingRows } =
    listingIds.length > 0
      ? ((await supabase
          .from("listings")
          .select(
            "id, title, price, deposit_required, expected_yield, rental_estimate_weekly, property_type, suburbs:suburb_id(name, state)"
          )
          .in("id", listingIds)) as unknown as { data: ListingRow[] | null })
      : { data: [] as ListingRow[] };

  const listingById = new Map((listingRows ?? []).map((l) => [l.id, l]));
  const explanationByListingId = new Map((matches ?? []).map((m) => [m.listing_id, m.explanation]));

  const listings: ReportListing[] = (matches ?? [])
    .map((m) => listingById.get(m.listing_id))
    .filter((l): l is ListingRow => Boolean(l))
    .map((l) => {
      const suburb = Array.isArray(l.suburbs) ? l.suburbs[0] : l.suburbs;
      return {
        title: l.title,
        suburbName: suburb?.name ?? "",
        state: suburb?.state ?? "",
        propertyType: l.property_type,
        price: Number(l.price),
        depositRequired: Number(l.deposit_required),
        expectedYield: Number(l.expected_yield),
        rentalEstimateWeekly: Number(l.rental_estimate_weekly),
        explanation: explanationByListingId.get(l.id),
      };
    });

  const pdfBuffer = await renderToBuffer(
    ClientReportDocument({
      broker: {
        agencyName: brokerAgency.agency_name,
        fullName: brokerProfile.full_name,
        email: brokerProfile.email,
        phone: brokerProfile.phone,
        aclNumber: brokerAgency.acl_number,
      },
      client: {
        fullName: clientProfile.full_name,
        budgetMax: Number(investorProfile.budget_max),
        depositAvailable: Number(investorProfile.deposit_available),
        preferredStates: investorProfile.preferred_states,
        preferredSuburbs: investorProfile.preferred_suburbs,
        financeStatus: investorProfile.finance_status,
        timeframe: investorProfile.timeframe,
        growthYieldPreference: investorProfile.growth_yield_preference,
      },
      listings,
      generatedAt: new Date(),
    })
  );

  const fileName = `${clientProfile.full_name.replace(/[^a-z0-9]+/gi, "-")}-property-report.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
    },
  });
}
