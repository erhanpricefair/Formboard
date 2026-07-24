import {
  SCORE_WEIGHTS,
  YIELD_NORMALISATION_RANGE,
  type CandidateListing,
  type InvestorPreferences,
  type MatchResult,
  type ScoreBreakdown,
} from "./types";

// Timeframe alignment lookup: how well a listing's completion window fits
// an investor's stated purchase timeframe. Values are fixed, not derived,
// per ARCHITECTURE.md §5.2 ("a fixed lookup table").
const TIMEFRAME_MONTHS: Record<InvestorPreferences["timeframe"], number> = {
  immediate: 1,
  within_3_months: 3,
  within_6_months: 6,
  within_12_months: 12,
  researching: 18,
};

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function monthsUntil(dateIso: string): number {
  const now = Date.now();
  const target = new Date(dateIso).getTime();
  return Math.max(0, (target - now) / (1000 * 60 * 60 * 24 * 30));
}

function normalisedYieldScore(listing: CandidateListing): number {
  const { min, max } = YIELD_NORMALISATION_RANGE;
  return clamp01((listing.expectedYield - min) / (max - min));
}

function normalisedGrowthDriverScore(listing: CandidateListing): number {
  return clamp01(listing.growthDriverScore / 100);
}

function timeframeAlignment(listing: CandidateListing, investor: InvestorPreferences): number {
  if (!listing.completionTimeline) return 0.5; // unknown timeline — neutral score
  const investorMonths = TIMEFRAME_MONTHS[investor.timeframe];
  const listingMonths = monthsUntil(listing.completionTimeline.start);
  const delta = Math.abs(investorMonths - listingMonths);
  // Perfect alignment (delta=0) scores 1; degrades linearly, floors at 0
  // once the gap exceeds 18 months either direction.
  return clamp01(1 - delta / 18);
}

function locationFit(listing: CandidateListing, investor: InvestorPreferences): number {
  const suburbMatch = investor.preferredSuburbs.some(
    (s) => s.toLowerCase() === listing.suburbName.toLowerCase()
  );
  if (investor.preferredSuburbs.length > 0) {
    // A stated suburb is a real preference, not a hint — only listings in
    // one of those suburbs earn any location credit.
    return suburbMatch ? 1.0 : 0.0;
  }
  if (investor.preferredStates.includes(listing.state)) {
    return 0.6;
  }
  return 0.0;
}

/**
 * Eligibility filter — a listing is only ever scored if it passes this,
 * per ARCHITECTURE.md §5.2 ("Eligibility filter (hard cut)").
 */
export function isEligible(listing: CandidateListing, investor: InvestorPreferences): boolean {
  return (
    listing.price <= investor.budgetMax && listing.depositRequired <= investor.depositAvailable
  );
}

export function scoreListing(
  listing: CandidateListing,
  investor: InvestorPreferences
): MatchResult {
  const growthWeight = investor.growthYieldScore / 100;
  const yieldWeight = 1 - growthWeight;

  const breakdown: ScoreBreakdown = {
    growthFit: normalisedGrowthDriverScore(listing) * growthWeight,
    yieldFit: normalisedYieldScore(listing) * yieldWeight,
    locationFit: locationFit(listing, investor),
    timeframeFit: timeframeAlignment(listing, investor),
  };

  const totalScore =
    breakdown.growthFit * SCORE_WEIGHTS.growth +
    breakdown.yieldFit * SCORE_WEIGHTS.yield +
    breakdown.locationFit * SCORE_WEIGHTS.location +
    breakdown.timeframeFit * SCORE_WEIGHTS.timeframe;

  return { listingId: listing.id, totalScore, breakdown };
}

/**
 * Filters to eligible listings, scores each, and returns results ranked
 * highest-first. Pure function — no I/O — so it can run inline on the
 * onboarding request path (ARCHITECTURE.md §5.4) or from the batch
 * re-match Edge Function against the same inputs.
 */
export function rankListings(
  listings: CandidateListing[],
  investor: InvestorPreferences
): MatchResult[] {
  return listings
    .filter((listing) => isEligible(listing, investor))
    .map((listing) => scoreListing(listing, investor))
    .sort((a, b) => b.totalScore - a.totalScore);
}
