import { NextRequest, NextResponse } from "next/server";
import { leadCaptureRequestSchema } from "@/lib/validations/lead";
import { captureLead } from "@/lib/services/lead-service";

/**
 * POST /api/leads
 *
 * Public, unauthenticated. Captures a consumer enquiry (Stage 1:
 * "Captured") and sends an SMS verification code. Does NOT yet create a
 * lead_tracking row — the lead is not "Shared" with the professional, and
 * no fee is charged, until /api/leads/verify succeeds. This keeps
 * professionals from ever being billed for an unverified contact.
 *
 * Note: this route deliberately never selects/returns other people's
 * data and writes only through the service-role client after Zod
 * validation — it is the sole legitimate write path into `leads`.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = leadCaptureRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten() }, { status: 422 });
  }

  // Honeypot: a real user never fills this in.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true, leadId: null }, { status: 202 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = req.headers.get("user-agent");

  try {
    const { leadId } = await captureLead(parsed.data, { ip, userAgent });
    return NextResponse.json({ ok: true, leadId, professionalId: parsed.data.professionalId }, { status: 201 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Lead capture failed", err);
    return NextResponse.json({ error: "Could not submit your enquiry. Please try again." }, { status: 500 });
  }
}
