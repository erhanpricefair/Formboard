import { z } from "zod";

export const professionalVerificationSchema = z.object({
  status: z.enum(["pending_verification", "verified", "suspended", "rejected"]),
});
export type ProfessionalVerificationInput = z.infer<typeof professionalVerificationSchema>;

export const feeStatusUpdateSchema = z.object({
  status: z.enum(["pending", "invoiced", "paid", "disputed", "waived"]),
  invoiceReference: z.string().trim().max(120).optional(),
  disputeReason: z.string().trim().max(2000).optional(),
});
export type FeeStatusUpdateInput = z.infer<typeof feeStatusUpdateSchema>;
