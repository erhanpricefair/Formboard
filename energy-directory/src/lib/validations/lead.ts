import { z } from "zod";
import { AU_STATES, PROFESSIONAL_CATEGORIES } from "./professional";

/**
 * Lead capture form schema.
 *
 * Privacy-by-design: consentContact and consentDataShare are both
 * `z.literal(true)` — the form cannot be submitted, server-side, without
 * an explicit, unticked-by-default opt-in for both. consentMarketing is a
 * genuinely optional, separate opt-in (not required to submit the lead).
 */
export const leadCaptureSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?61|0)[2-478]\d{8}$/, "Enter a valid Australian phone number."),

  suburb: z.string().trim().min(2).max(80),
  postcode: z.string().trim().regex(/^\d{4}$/, "Postcode must be 4 digits."),
  state: z.enum(AU_STATES),

  serviceType: z.enum(PROFESSIONAL_CATEGORIES),
  projectDetails: z.string().trim().max(2000).optional(),

  consentContact: z.literal(true, {
    errorMap: () => ({ message: "You must consent to being contacted to submit an enquiry." }),
  }),
  consentDataShare: z.literal(true, {
    errorMap: () => ({
      message: "You must consent to your details being shared with a matched professional to submit an enquiry.",
    }),
  }),
  consentMarketing: z.boolean().default(false),

  privacyPolicyVersion: z.string().min(1),

  // Honeypot field — must stay empty. Not shown to real users via CSS;
  // bots that autofill every field trip this.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;

export const leadCaptureRequestSchema = leadCaptureSchema.extend({
  professionalId: z.string().uuid(),
});
export type LeadCaptureRequestInput = z.infer<typeof leadCaptureRequestSchema>;

export const verifyLeadSchema = z.object({
  leadId: z.string().uuid(),
  professionalId: z.string().uuid(),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export type VerifyLeadInput = z.infer<typeof verifyLeadSchema>;
