import { z } from "zod";
import { AU_STATES } from "./onboarding";

export const projectSchema = z.object({
  name: z.string().trim().min(2, "Enter a project name"),
  description: z.string().trim().optional(),
  primaryState: z.enum(AU_STATES),
  primarySuburb: z.string().trim().optional(),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const PROPERTY_TYPES = ["house", "townhouse", "duplex", "apartment", "land"] as const;

export const listingSchema = z.object({
  title: z.string().trim().min(2, "Enter a listing title"),
  suburbName: z.string().trim().min(1, "Enter a suburb"),
  state: z.enum(AU_STATES),
  postcode: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Enter a valid 4-digit postcode"),
  addressLine: z.string().trim().optional(),
  landSizeSqm: z.coerce.number().positive("Enter land size"),
  buildSizeSqm: z.coerce.number().positive("Enter build size"),
  price: z.coerce.number().positive("Enter a price"),
  depositRequired: z.coerce.number().nonnegative("Enter the required deposit"),
  rentalEstimateWeekly: z.coerce.number().positive("Enter an estimated weekly rent"),
  growthDriverScore: z.coerce.number().min(0).max(100),
  growthDrivers: z.array(z.string()).default([]),
  nearbyInfrastructure: z.array(z.string()).default([]),
  propertyType: z.enum(PROPERTY_TYPES),
  completionStart: z.string().optional(),
  completionEnd: z.string().optional(),
});
export type ListingInput = z.infer<typeof listingSchema>;
