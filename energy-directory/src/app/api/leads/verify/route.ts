import { NextRequest, NextResponse } from "next/server";
import { verifyLeadSchema } from "@/lib/validations/lead";
import { verifyCode } from "@/lib/services/verification-service";
import { shareLeadWithProfessional } from "@/lib/services/lead-service";

const REASON_MESSAGES: Record<string, string> = {
  not_found: "We couldn't find that enquiry. Please start again.",
  expired: "That code has expired. Request a new one and try again.",
  too_many_attempts: "Too many incorrect attempts. Request a new code.",
  incorrect_code: "That code isn't right. Check your SMS and try again.",
};

/**
 * POST /api/leads/verify
 *
 * Public. Confirms the 6-digit SMS code, then — on success — performs
 * Stage 2 of the audit trail ("Shared"): creates the lead_tracking row
 * for the professional the consumer originally enquired with, and
 * charges the flat lead fee. This is the only path that creates a
 * lead_tracking row from the public surface.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = verifyLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten() }, { status: 422 });
  }

  const result = await verifyCode(parsed.data.leadId, parsed.data.code);
  if (!result.ok) {
    return NextResponse.json({ error: REASON_MESSAGES[result.reason] }, { status: 400 });
  }

  try {
    const { leadTrackingId } = await shareLeadWithProfessional(parsed.data.leadId, parsed.data.professionalId);
    return NextResponse.json({ ok: true, leadTrackingId });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Lead share failed", err);
    return NextResponse.json({ error: "Verified, but we couldn't finish sharing your enquiry. Our team has been notified." }, { status: 500 });
  }
}
