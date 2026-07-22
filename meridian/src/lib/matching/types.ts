import type { GrowthYieldPreference, PurchaseTimeframe } from "@/types/database";

export const SCORING_VERSION = "v1-deterministic-2026.07";

export interface InvestorPreferences {
  budgetMax: number;
  depositAvailable: number;
  preferredStates: string[];
  preferredSuburbs: string[];
  growthYieldScore: number; // 0 = full yield-focused, 100 = full growth-focused
  growthYieldPreference: GrowthYieldPreference;
  timeframe: PurchaseTimeframe;
}

export interface CandidateListing {
  id: string;
  title: string;
  state: string;
  suburbName: string;
  price: number;
  depositRequired: number;
  expectedYield: number; // percentage, e.g. 4.6
  growthDriverScore: number; // 0-100, developer-entered/admin-reviewed
  growthDrivers: string[];
  completionTimeline: { start: string; end: string } | null;
}

export interface ScoreBreakdown {
  growthFit: number;
  yieldFit: number;
  locationFit: number;
  timeframeFit: number;
}

export interface MatchResult {
  listingId: string;
  totalScore: number;
  breakdown: ScoreBreakdown;
}

// Named, single-source-of-truth weights — tuning is a one-file change.
// See ARCHITECTURE.md §5.2.
export const SCORE_WEIGHTS = {
  growth: 0.35,
  yield: 0.35,
  location: 0.2,
  timeframe: 0.1,
} as const;

// Reference points for normalising expected yield into a 0-1 "yield fit"
// score. Below MIN is treated as 0, above MAX is treated as 1.
export const YIELD_NORMALISATION_RANGE = { min: 2.5, max: 6.5 };
