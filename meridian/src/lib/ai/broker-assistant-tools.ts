import type { SupabaseClient } from "@supabase/supabase-js";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { Database } from "@/types/database";
import { getBrokerRoster } from "@/lib/broker/get-roster";

// Every tool here runs against the broker's own session-scoped Supabase
// client, never the service-role client. RLS is the real boundary
// (broker_clients_select / listings_select / investor_profiles_select
// already restrict rows to "this broker's own clients" and "published
// listings only" — see supabase/migrations/0007_rls_policies.sql and
// 0014_broker_reads_client_profiles.sql), so a bug in a tool's query
// logic can't leak another broker's data even if it tried to.

type ListingRow = {
  id: string;
  title: string;
  price: number;
  deposit_required: number;
  expected_yield: number;
  property_type: string;
  growth_driver_score: number;
  suburbs: { name: string; state: string } | { name: string; state: string }[] | null;
};

function flattenSuburb(row: ListingRow) {
  const suburb = Array.isArray(row.suburbs) ? row.suburbs[0] : row.suburbs;
  return { name: suburb?.name ?? "", state: suburb?.state ?? "" };
}

export function buildBrokerAssistantTools(
  supabase: SupabaseClient<Database>,
  brokerId: string
) {
  const searchListings = betaZodTool({
    name: "search_listings",
    description:
      "Search published property listings by state, suburb, property type, and price/yield range. Use this to find opportunities to share with a client.",
    inputSchema: z.object({
      state: z.string().optional().describe("Australian state abbreviation, e.g. QLD, NSW, VIC"),
      suburb: z.string().optional().describe("Suburb name, case-insensitive exact match"),
      propertyType: z.string().optional().describe("e.g. house, townhouse, apartment, duplex"),
      maxPrice: z.number().optional(),
      minYield: z.number().optional().describe("Minimum expected rental yield, e.g. 4.5"),
      limit: z.number().int().min(1).max(20).optional().default(10),
    }),
    run: async (input) => {
      let query = supabase
        .from("listings")
        .select(
          "id, title, price, deposit_required, expected_yield, property_type, growth_driver_score, suburbs:suburb_id(name, state)"
        )
        .eq("status", "published");

      if (input.propertyType) query = query.eq("property_type", input.propertyType);
      if (input.maxPrice) query = query.lte("price", input.maxPrice);
      if (input.minYield) query = query.gte("expected_yield", input.minYield);

      const { data, error } = await query
        .order("published_at", { ascending: false })
        .limit(50);
      if (error) return `Error searching listings: ${error.message}`;

      let rows = (data as ListingRow[] | null) ?? [];
      if (input.state) {
        rows = rows.filter((r) => flattenSuburb(r).state.toLowerCase() === input.state!.toLowerCase());
      }
      if (input.suburb) {
        rows = rows.filter((r) => flattenSuburb(r).name.toLowerCase() === input.suburb!.toLowerCase());
      }

      const results = rows.slice(0, input.limit).map((r) => {
        const suburb = flattenSuburb(r);
        return {
          id: r.id,
          title: r.title,
          suburb: suburb.name,
          state: suburb.state,
          price: Number(r.price),
          depositRequired: Number(r.deposit_required),
          expectedYield: Number(r.expected_yield),
          propertyType: r.property_type,
          growthDriverScore: Number(r.growth_driver_score),
        };
      });

      return results.length > 0
        ? JSON.stringify(results)
        : "No published listings matched those filters.";
    },
  });

  const listClients = betaZodTool({
    name: "list_clients",
    description:
      "List this broker's clients with their onboarding status, budget, match count, and settlement journey stage. Use this to find a client by name or to see who needs attention.",
    inputSchema: z.object({}),
    run: async () => {
      const roster = await getBrokerRoster(supabase, brokerId);
      if (roster.length === 0) return "This broker has no clients yet.";
      return JSON.stringify(
        roster.map((c) => ({
          investorId: c.investorId,
          fullName: c.fullName,
          email: c.email,
          onboardingComplete: c.onboardingComplete,
          budgetMax: c.budgetMax,
          matchCount: c.matchCount,
          currentStage: c.currentStage,
          linkedAt: c.linkedAt,
        }))
      );
    },
  });

  const getClientSummary = betaZodTool({
    name: "get_client_summary",
    description:
      "Get full detail on one client by investor ID: investor profile (budget, deposit, preferences, finance status), their top property matches, and any service-partner referrals in progress. Look up the investor ID first via list_clients if you only have a name.",
    inputSchema: z.object({
      investorId: z.string().uuid(),
    }),
    run: async (input) => {
      const { data: link } = await supabase
        .from("broker_clients")
        .select("investor_id")
        .eq("broker_id", brokerId)
        .eq("investor_id", input.investorId)
        .maybeSingle();
      if (!link) return "This investor is not one of your clients.";

      const [{ data: profile }, { data: investorProfile }, { data: matches }, { data: referrals }] =
        await Promise.all([
          supabase.from("profiles").select("full_name, email, phone").eq("id", input.investorId).maybeSingle(),
          supabase.from("investor_profiles").select("*").eq("id", input.investorId).maybeSingle(),
          supabase
            .from("property_matches")
            .select("listing_id, total_score, explanation, listings:listing_id(title)")
            .eq("investor_id", input.investorId)
            .order("total_score", { ascending: false })
            .limit(5),
          supabase
            .from("partner_referrals")
            .select("status, notes, service_partners:partner_id(business_name, partner_type)")
            .eq("investor_id", input.investorId),
        ]);

      if (!profile) return "Could not load this client's profile.";

      type MatchRow = {
        listing_id: string;
        total_score: number;
        explanation: string;
        listings: { title: string } | { title: string }[] | null;
      };
      type ReferralRow = {
        status: string;
        notes: string | null;
        service_partners:
          | { business_name: string; partner_type: string }
          | { business_name: string; partner_type: string }[]
          | null;
      };

      return JSON.stringify({
        fullName: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        investorProfile: investorProfile
          ? {
              budgetMax: Number(investorProfile.budget_max),
              depositAvailable: Number(investorProfile.deposit_available),
              preferredStates: investorProfile.preferred_states,
              preferredSuburbs: investorProfile.preferred_suburbs,
              experience: investorProfile.experience,
              growthYieldPreference: investorProfile.growth_yield_preference,
              financeStatus: investorProfile.finance_status,
              timeframe: investorProfile.timeframe,
              onboardingComplete: Boolean(investorProfile.onboarding_completed_at),
            }
          : null,
        topMatches: ((matches as MatchRow[] | null) ?? []).map((m) => {
          const listing = Array.isArray(m.listings) ? m.listings[0] : m.listings;
          return {
            listingId: m.listing_id,
            title: listing?.title ?? "",
            score: Number(m.total_score),
            explanation: m.explanation,
          };
        }),
        partnerReferrals: ((referrals as ReferralRow[] | null) ?? []).map((r) => {
          const partner = Array.isArray(r.service_partners) ? r.service_partners[0] : r.service_partners;
          return {
            partnerName: partner?.business_name ?? "",
            partnerType: partner?.partner_type ?? "",
            status: r.status,
            notes: r.notes,
          };
        }),
      });
    },
  });

  return [searchListings, listClients, getClientSummary];
}
