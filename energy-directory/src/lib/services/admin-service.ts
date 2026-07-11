import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database, ProfessionalStatus, FeeStatus } from "@/lib/types/database";

/**
 * Every admin API route calls this first. It re-derives the caller's
 * identity from their own cookie-scoped session (never trusts a client-
 * supplied "I'm an admin" flag) and checks membership in `admins` — RLS
 * on that table means a user can only ever see their own row, so this is
 * exactly what the client itself could check, just done server-side
 * before any privileged write.
 *
 * Admin provisioning is intentionally not exposed here or anywhere in the
 * app — see README "Provisioning an admin." Nothing above the database
 * can turn a user into an admin.
 */
export async function requireAdmin(
  scopedClient: SupabaseClient<Database>
): Promise<{ userId: string } | { error: string; status: number }> {
  const {
    data: { user },
  } = await scopedClient.auth.getUser();

  if (!user) {
    return { error: "Sign in required.", status: 401 };
  }

  const { data: admin } = await scopedClient.from("admins").select("id").eq("auth_user_id", user.id).maybeSingle();

  if (!admin) {
    return { error: "Admin access required.", status: 403 };
  }

  return { userId: user.id };
}

const VERIFICATION_TRANSITIONS: Record<ProfessionalStatus, ProfessionalStatus[]> = {
  pending_verification: ["verified", "rejected"],
  verified: ["suspended", "rejected"],
  suspended: ["verified", "rejected"],
  rejected: ["pending_verification"],
};

export function isAllowedVerificationTransition(from: ProfessionalStatus, to: ProfessionalStatus): boolean {
  return from === to || VERIFICATION_TRANSITIONS[from].includes(to);
}

/**
 * Sets a professional's verification status via the service-role client
 * (the `protect_verification_fields` trigger rejects this from any other
 * role — see migration 0002). `active` is derived rather than settable
 * directly: only a verified profile can be publicly active; anything
 * else is pulled from the directory automatically.
 */
export async function setProfessionalVerification(professionalId: string, status: ProfessionalStatus, adminUserId: string) {
  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("professionals")
    .update({
      verification_status: status,
      verified_at: status === "verified" ? new Date().toISOString() : null,
      verified_by: adminUserId,
      active: status === "verified",
    })
    .eq("id", professionalId);

  if (error) throw new Error(error.message);
}

const FEE_TRANSITIONS: Record<FeeStatus, FeeStatus[]> = {
  pending: ["invoiced", "disputed", "waived"],
  invoiced: ["paid", "disputed"],
  paid: ["disputed"],
  disputed: ["pending", "invoiced", "paid", "waived"],
  waived: [],
};

export function isAllowedFeeTransition(from: FeeStatus, to: FeeStatus): boolean {
  return from === to || FEE_TRANSITIONS[from].includes(to);
}

export async function setFeeTransactionStatus(
  feeTransactionId: string,
  status: FeeStatus,
  invoiceReference: string | undefined,
  disputeReason: string | undefined
) {
  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("fee_transactions")
    .update({
      status,
      invoice_reference: invoiceReference,
      dispute_reason: status === "disputed" ? disputeReason : null,
    })
    .eq("id", feeTransactionId);

  if (error) throw new Error(error.message);
}
