import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Success-fee defaults. In production these would likely move to a
 * per-professional negotiated rate stored on the `professionals` table
 * or a separate `rate_cards` table; flat/global defaults are enough for
 * an MVP and keep the ledger schema (fee_transactions) doing the real
 * work of being the audit trail.
 */
export const DEFAULT_LEAD_FEE_AUD = 45;
export const DEFAULT_COMMISSION_RATE = 0.05; // 5% of self-reported outcome value

export function computeSuccessCommission(outcomeValueAud: number): number {
  return Math.round(outcomeValueAud * DEFAULT_COMMISSION_RATE * 100) / 100;
}

/**
 * Charges the flat lead fee at share time. Admin-only path (service-role
 * client) — this is billing, not something a professional's own session
 * should be able to trigger or alter.
 */
export async function chargeLeadFee(leadTrackingId: string, professionalId: string, amount = DEFAULT_LEAD_FEE_AUD) {
  const admin = createSupabaseAdminClient();

  const { error: feeError } = await admin.from("fee_transactions").insert({
    lead_tracking_id: leadTrackingId,
    professional_id: professionalId,
    fee_type: "lead_fee",
    amount,
    status: "pending",
  });
  if (feeError) throw new Error(`Failed to record lead fee: ${feeError.message}`);

  const { error: trackingError } = await admin
    .from("lead_tracking")
    .update({ lead_cost: amount })
    .eq("id", leadTrackingId);
  if (trackingError) throw new Error(`Failed to update lead_tracking.lead_cost: ${trackingError.message}`);
}

/**
 * Records the performance commission once an admin (or a professional's
 * self-reported outcome, pending admin verification) confirms a deal
 * closed. Writes both the ledger entry (fee_transactions) and the
 * denormalized commission_amount on lead_tracking for quick display.
 */
export async function recordSuccessCommission(leadTrackingId: string, professionalId: string, outcomeValueAud: number) {
  const admin = createSupabaseAdminClient();
  const commission = computeSuccessCommission(outcomeValueAud);

  const { error: feeError } = await admin.from("fee_transactions").insert({
    lead_tracking_id: leadTrackingId,
    professional_id: professionalId,
    fee_type: "success_commission",
    amount: commission,
    status: "pending",
  });
  if (feeError) throw new Error(`Failed to record success commission: ${feeError.message}`);

  const { error: trackingError } = await admin
    .from("lead_tracking")
    .update({ commission_amount: commission, outcome_value: outcomeValueAud })
    .eq("id", leadTrackingId);
  if (trackingError) throw new Error(`Failed to update lead_tracking commission: ${trackingError.message}`);

  return commission;
}
