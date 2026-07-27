import { z } from "zod";

export const brokerInviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  fullName: z.string().trim().min(2, "Enter the broker's full name"),
  agencyName: z.string().trim().min(2, "Enter the agency name"),
  aclNumber: z.string().trim().optional(),
});
export type BrokerInviteInput = z.infer<typeof brokerInviteSchema>;

/**
 * Self-service broker registration (/broker-signup). Same shape as the
 * admin invite plus the broker's own password and phone — the account is
 * created inactive and needs admin activation before the portal opens,
 * since brokers can see linked investors' contact and finance details.
 */
export const brokerSignupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  fullName: z.string().trim().min(2, "Enter your full name"),
  phone: z.string().trim().max(40).optional(),
  agencyName: z.string().trim().min(2, "Enter your agency name"),
  aclNumber: z.string().trim().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type BrokerSignupInput = z.infer<typeof brokerSignupSchema>;

/**
 * Referral-link slug derived from the agency name — this becomes the
 * broker's /get-started?ref=<slug> link, so it must be URL-safe and
 * unique (enforced by broker_profiles.referral_link_slug's unique
 * constraint; the action retries with a numeric suffix on collision).
 */
export function slugifyAgency(agencyName: string): string {
  return (
    agencyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "broker"
  );
}
