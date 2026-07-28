import { z } from "zod";

export const servicePartnerSchema = z.object({
  partnerType: z.enum(["conveyancer", "building_inspector", "insurer", "property_manager", "other"], {
    message: "Select a partner type",
  }),
  businessName: z.string().trim().min(2, "Enter the business name"),
  contactName: z.string().trim().optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  defaultCommissionRate: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
});
export type ServicePartnerInput = z.infer<typeof servicePartnerSchema>;
