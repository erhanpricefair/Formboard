import { NextRequest, NextResponse } from "next/server";
import { feeStatusUpdateSchema } from "@/lib/validations/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin, isAllowedFeeTransition, setFeeTransactionStatus } from "@/lib/services/admin-service";

/**
 * PATCH /api/admin/fees/[id]/status
 *
 * Admin-only. Moves a fee_transactions row through pending -> invoiced ->
 * paid (or disputed at any point). This is the reconciliation step that
 * turns a professional's self-reported "Completed" outcome (see
 * /api/leads/tracking/[id]/status) into an actual invoiced/paid amount —
 * see COMPLIANCE_AND_SAFETY.md §3 "Provisional vs. verified outcomes."
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const auth = await requireAdmin(supabase);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = feeStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten() }, { status: 422 });
  }

  if (parsed.data.status === "disputed" && !parsed.data.disputeReason) {
    return NextResponse.json({ error: "A dispute reason is required when marking a fee disputed." }, { status: 422 });
  }

  const { data: fee, error: fetchError } = await supabase
    .from("fee_transactions")
    .select("status")
    .eq("id", params.id)
    .maybeSingle();

  if (fetchError || !fee) {
    return NextResponse.json({ error: "Fee transaction not found." }, { status: 404 });
  }

  if (!isAllowedFeeTransition(fee.status, parsed.data.status)) {
    return NextResponse.json(
      { error: `Cannot move a fee from "${fee.status}" to "${parsed.data.status}" directly.` },
      { status: 409 }
    );
  }

  try {
    await setFeeTransactionStatus(params.id, parsed.data.status, parsed.data.invoiceReference, parsed.data.disputeReason);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update fee status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
