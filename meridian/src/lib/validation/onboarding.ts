import { z } from "zod";

// Accepts AU mobile/landline in common written forms: 04xx xxx xxx,
// +614xx xxx xxx, 0X xxxx xxxx, etc.
const AU_PHONE_REGEX = /^(\+?61|0)[2-478](?:[ -]?\d){8}$/;

export const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;

export const onboardingSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name"),
    email: z.string().trim().email("Enter a valid email address"),
    phone: z
      .string()
      .trim()
      .regex(AU_PHONE_REGEX, "Enter a valid Australian phone number"),

    experience: z.enum(["first_property", "experienced_investor"], {
      message: "Select an option",
    }),

    budgetMax: z.coerce.number().positive("Enter a budget above $0"),
    depositAvailable: z.coerce.number().nonnegative("Enter a deposit amount"),

    preferredStates: z.array(z.enum(AU_STATES)).min(1, "Select at least one state"),
    preferredSuburbs: z.array(z.string()).default([]),

    growthYieldScore: z.coerce.number().min(0).max(100),

    occupierIntent: z.enum(["investment", "owner_occupier"]),

    financeStatus: z.enum(["pre_approved", "applying", "not_started", "cash_buyer"], {
      message: "Select your finance status",
    }),

    timeframe: z.enum(
      ["immediate", "within_3_months", "within_6_months", "within_12_months", "researching"],
      { message: "Select a timeframe" }
    ),

    referralSlug: z.string().trim().optional(),
  })
  .refine((data) => data.depositAvailable <= data.budgetMax * 1.5, {
    // Soft guard, not a hard block (FR-2: deposit > budget is a warning,
    // not blocked — equity-release scenarios are legitimate). The 1.5x
    // ceiling catches obvious data-entry errors while staying permissive.
    message: "Deposit looks unusually high relative to your budget — please double-check",
    path: ["depositAvailable"],
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export function growthYieldScoreToPreference(
  score: number
): "growth_focused" | "balanced" | "yield_focused" {
  if (score >= 66) return "growth_focused";
  if (score <= 33) return "yield_focused";
  return "balanced";
}
