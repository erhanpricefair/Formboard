import { z } from "zod";
import { AU_STATES } from "./onboarding";

const AU_PHONE_REGEX = /^(\+?61|0)[2-478](?:[ -]?\d){8}$/;

/**
 * Same fields as the investor's own onboarding questionnaire
 * (lib/validation/onboarding.ts) minus referralSlug -- the broker IS the
 * source here, so there's no referral link to resolve. Kept as a
 * separate schema rather than reusing onboardingSchema directly because
 * the two forms serve different callers (self-service investor vs.
 * broker-on-behalf-of-client) and will likely diverge over time.
 */
export const brokerClientIntakeSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter the client's full name"),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    phone: z
      .string()
      .trim()
      .regex(AU_PHONE_REGEX, "Enter a valid Australian phone number")
      .optional()
      .or(z.literal("")),

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
      message: "Select the client's finance status",
    }),

    timeframe: z.enum(
      ["immediate", "within_3_months", "within_6_months", "within_12_months", "researching"],
      { message: "Select a timeframe" }
    ),
  })
  .refine((data) => data.depositAvailable <= data.budgetMax * 1.5, {
    message: "Deposit looks unusually high relative to the budget — please double-check",
    path: ["depositAvailable"],
  });

export type BrokerClientIntakeInput = z.infer<typeof brokerClientIntakeSchema>;
