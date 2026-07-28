import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface PublicListingSummary {
  id: string;
  title: string;
  suburbName: string;
  state: string;
  postcode: string;
  price: number;
  depositRequired: number;
  expectedYield: number;
  rentalEstimateWeekly: number;
  propertyType: string;
}

export interface PublicListingFilters {
  state?: string;
  suburbIds?: string[];
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minYield?: number;
}

type ListingRow = {
  id: string;
  title: string;
  price: number;
  deposit_required: number;
  expected_yield: number;
  rental_estimate_weekly: number;
  property_type: string;
  suburbs: SuburbRef | SuburbRef[] | null;
};

type SuburbRef = { name: string; state: string; postcode: string };

const SUMMARY_COLUMNS =
  "id, title, price, deposit_required, expected_yield, rental_estimate_weekly, property_type, suburbs:suburb_id(name, state, postcode)";

/**
 * Resolves a state abbreviation to the suburb IDs in it, so listings can be
 * filtered by state in the database rather than by post-filtering a capped
 * result set in JS (which silently drops matches beyond the row limit —
 * fine for a logged-in browse page, not fine for a page that needs to show
 * every property Google might rank).
 */
export async function suburbIdsInState(
  supabase: SupabaseClient<Database>,
  state: string
): Promise<string[]> {
  const { data } = await supabase.from("suburbs").select("id").eq("state", state.toUpperCase());
  return (data ?? []).map((s) => s.id);
}

function toSummary(row: ListingRow): PublicListingSummary {
  const suburb = Array.isArray(row.suburbs) ? row.suburbs[0] : row.suburbs;
  return {
    id: row.id,
    title: row.title,
    suburbName: suburb?.name ?? "",
    state: suburb?.state ?? "",
    postcode: suburb?.postcode ?? "",
    price: Number(row.price),
    depositRequired: Number(row.deposit_required),
    expectedYield: Number(row.expected_yield),
    rentalEstimateWeekly: Number(row.rental_estimate_weekly),
    propertyType: row.property_type,
  };
}

/**
 * Published listings for the public pages, with a total count so the
 * browse page can paginate rather than truncate. Runs as `anon` — RLS
 * (`listings_select`) is what restricts this to published rows; the
 * explicit `.eq("status", "published")` below is belt-and-braces so the
 * intent is readable at the call site.
 */
export async function fetchPublicListings(
  supabase: SupabaseClient<Database>,
  filters: PublicListingFilters,
  { limit, offset }: { limit: number; offset: number }
): Promise<{ listings: PublicListingSummary[]; total: number }> {
  let query = supabase
    .from("listings")
    .select(SUMMARY_COLUMNS, { count: "exact" })
    .eq("status", "published");

  if (filters.suburbIds) {
    if (filters.suburbIds.length === 0) return { listings: [], total: 0 };
    query = query.in("suburb_id", filters.suburbIds);
  }
  if (filters.propertyType) query = query.eq("property_type", filters.propertyType);
  if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);
  if (filters.minYield !== undefined) query = query.gte("expected_yield", filters.minYield);

  const { data, count } = await query
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return {
    listings: ((data as ListingRow[] | null) ?? []).map(toSummary),
    total: count ?? 0,
  };
}
