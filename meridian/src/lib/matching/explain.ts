import { formatCurrency } from "@/lib/utils";
import type { CandidateListing, InvestorPreferences, MatchResult } from "./types";

/**
 * v1 template-based explanation generator. Consumes the same structured
 * score breakdown + listing facts a v2 LLM-based generator would consume
 * (see ARCHITECTURE.md §5.3) — callers never change when that swap
 * happens, only the implementation of this function does.
 */
export function explainMatch(
  listing: CandidateListing,
  investor: InvestorPreferences,
  result: MatchResult
): string {
  const isGrowthLeaning = result.breakdown.growthFit >= result.breakdown.yieldFit;

  const driverFact = isGrowthLeaning
    ? listing.growthDrivers.length > 0
      ? describeGrowthDrivers(listing.growthDrivers)
      : `this project is ranked in the top tier for growth potential in ${listing.suburbName}`
    : `this package returns an estimated ${listing.expectedYield.toFixed(1)}% yield, ahead of comparable listings`;

  const preferenceLabel = isGrowthLeaning ? "capital growth" : "cash flow";

  return (
    `This matches your ${formatCurrency(investor.budgetMax)} budget and ` +
    `${formatCurrency(investor.depositAvailable)} deposit, and is weighted ` +
    `toward ${preferenceLabel} — ${driverFact}, which is what you told us ` +
    `matters most to you.`
  );
}

function describeGrowthDrivers(drivers: string[]): string {
  const labels = drivers.map(humaniseDriverTag);
  if (labels.length === 1) return `this project sits in an area with ${labels[0]}`;
  const [last, ...rest] = [...labels].reverse();
  return `this project sits in an area with ${rest.reverse().join(", ")} and ${last}`;
}

const DRIVER_LABELS: Record<string, string> = {
  rail_upgrade: "confirmed rail infrastructure investment",
  new_town_centre: "a new town centre precinct under development",
  population_growth: "strong forecast population growth",
  upzoning: "recent upzoning approval",
  school_precinct: "a new school precinct",
  employment_hub: "a growing employment hub nearby",
};

function humaniseDriverTag(tag: string): string {
  return DRIVER_LABELS[tag] ?? tag.replace(/_/g, " ");
}
