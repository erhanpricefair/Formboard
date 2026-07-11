import { NextRequest, NextResponse } from "next/server";
import { leadStatusUpdateSchema } from "@/lib/validations/professional";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordSuccessCommission } from "@/lib/services/fee-service";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  New: ["Contacted"],
  Contacted: ["Inspection", "Completed"],
  Inspection: ["Completed"],
  Completed: [],
};

/**
 * PATCH /api/leads/tracking/[id]/status
 *
 * Authenticated professional endpoint — this is the "transparent Lead
 * Status dashboard" write path. Uses the cookie-scoped Supabase client
 * (NOT the admin client), so Row Level Security (`lead_tracking_update_own`)
 * guarantees a professional can only touch their own lead_tracking rows,
 * and the `protect_fee_fields` trigger guarantees they can never set
 * commission_amount/lead_cost themselves — those are computed
 * server-side from a self-reported outcome value and go through the
 * fee-service admin path below, which only runs after this RLS-scoped
 * update has already succeeded.
 *
 * Every transition is also written to lead_status_audit by the
 * `stamp_and_audit_lead_tracking` database trigger, independent of this
 * route — so the audit trail holds even if this handler is bypassed via
 * a direct authenticated Supabase call.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = leadStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten() }, { status: 422 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("lead_tracking")
    .select("id, status, professional_id")
    .eq("id", params.id)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Lead not found, or it doesn't belong to you." }, { status: 404 });
  }

  if (existing.status !== parsed.data.status && !ALLOWED_TRANSITIONS[existing.status]?.includes(parsed.data.status)) {
    return NextResponse.json(
      { error: `Cannot move a lead from "${existing.status}" to "${parsed.data.status}" directly.` },
      { status: 409 }
    );
  }

  const { error: updateError } = await supabase
    .from("lead_tracking")
    .update({
      status: parsed.data.status,
      notes: parsed.data.note ?? undefined,
      ...(parsed.data.status === "Completed" && parsed.data.outcomeValue !== undefined
        ? { outcome_value: parsed.data.outcomeValue }
        : {}),
    })
    .eq("id", params.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Self-reported outcome value on Completion generates the pending
  // success-commission ledger entry. This is provisional — see
  // COMPLIANCE_AND_SAFETY.md — and subject to admin verification before
  // being invoiced, exactly like PropertyConnect's self-reported outcome
  // model.
  if (parsed.data.status === "Completed" && parsed.data.outcomeValue !== undefined) {
    await recordSuccessCommission(existing.id, existing.professional_id, parsed.data.outcomeValue);
  }

  return NextResponse.json({ ok: true });
}
