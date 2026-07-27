import { z } from "zod";

/**
 * Payload accepted by POST /api/leads. Deliberately permissive about
 * which contact field is present — a lead-gen form may collect only an
 * email, or only a phone — but requires at least one, since a lead with
 * no way to contact them is not a lead.
 */
export const leadCaptureSchema = z
  .object({
    fullName: z.string().trim().min(1).max(200).optional(),
    email: z.string().trim().toLowerCase().email("Enter a valid email address").optional(),
    phone: z.string().trim().min(6).max(40).optional(),
    message: z.string().trim().max(5000).optional(),
    source: z.string().trim().min(1).max(60).default("referwise"),
    utmSource: z.string().trim().max(120).optional(),
    utmCampaign: z.string().trim().max(120).optional(),
    partialAnswers: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: "Provide at least an email address or a phone number",
    path: ["email"],
  });

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;
