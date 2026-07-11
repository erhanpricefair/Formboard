import { z } from "zod";
import { findBannedClaim } from "./banned-claims";

export const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;

export const PROFESSIONAL_CATEGORIES = [
  "solar_pv",
  "battery_storage",
  "heat_pump_hot_water",
  "heat_pump_space_heating",
  "induction_cooktop",
  "ceiling_wall_insulation",
  "double_glazing",
  "draught_sealing",
  "ev_charger",
  "home_energy_assessment",
  "electrification_general",
] as const;

/** Attaches a banned-claims check to any free-text field. */
function noHype(field: string) {
  return (value: string, ctx: z.RefinementCtx) => {
    const reason = findBannedClaim(value);
    if (reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${field} contains a prohibited promotional claim: ${reason}`,
      });
    }
  };
}

export const professionalProfileSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Business name is required.")
    .max(120)
    .superRefine(noHype("Business name")),

  abn: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "ABN must be exactly 11 digits (no spaces)."),

  categories: z
    .array(z.enum(PROFESSIONAL_CATEGORIES))
    .min(1, "Select at least one service category."),

  suburb: z.string().trim().min(2).max(80),
  state: z.enum(AU_STATES),
  postcode: z.string().trim().regex(/^\d{4}$/, "Postcode must be 4 digits."),
  serviceAreaPostcodes: z
    .array(z.string().regex(/^\d{4}$/))
    .max(500)
    .default([]),

  licenseNumber: z.string().trim().max(60).optional(),
  licenseExpiry: z.string().date().optional(),

  phone: z
    .string()
    .trim()
    .regex(/^(\+?61|0)[2-478]\d{8}$/, "Enter a valid Australian phone number."),
  publicEmail: z.string().trim().email(),
  websiteUrl: z.string().trim().url().optional(),

  tagline: z
    .string()
    .trim()
    .max(140, "Tagline must be 140 characters or fewer.")
    .optional()
    .transform((v) => (v === "" ? undefined : v))
    .superRefine((value, ctx) => {
      if (value) noHype("Tagline")(value, ctx);
    }),

  bio: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v === "" ? undefined : v))
    .superRefine((value, ctx) => {
      if (value) noHype("Bio")(value, ctx);
    }),
});

export type ProfessionalProfileInput = z.infer<typeof professionalProfileSchema>;

/**
 * Professionals may move a lead forward through the funnel and leave a
 * note, but may never set commission_amount / lead_cost — those are
 * admin-only (also enforced at the database layer by the
 * protect_fee_fields trigger). This schema is what the dashboard status
 * update API accepts.
 */
export const leadStatusUpdateSchema = z.object({
  status: z.enum(["New", "Contacted", "Inspection", "Completed"]),
  note: z.string().trim().max(4000).optional(),
  outcomeValue: z
    .number()
    .nonnegative("Outcome value can't be negative.")
    .max(100_000_000)
    .optional(),
});

export type LeadStatusUpdateInput = z.infer<typeof leadStatusUpdateSchema>;
