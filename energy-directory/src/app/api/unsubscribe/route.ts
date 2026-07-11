import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseAndVerifyToken, processUnsubscribe } from "@/lib/services/unsubscribe-service";

const bodySchema = z.object({
  token: z.string().min(1),
  scope: z.enum(["marketing", "all"]).default("all"),
});

/**
 * POST /api/unsubscribe
 *
 * Public, token-authenticated (HMAC-signed link, no login required — this
 * is the "clear, accessible unsubscribe logic" requirement). scope
 * "marketing" turns off optional marketing consent only; "all" also
 * withdraws contact/data-share consent and archives the lead.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed." }, { status: 422 });
  }

  const verified = parseAndVerifyToken(parsed.data.token);
  if (!verified) {
    return NextResponse.json({ error: "Invalid or tampered unsubscribe link." }, { status: 400 });
  }

  await processUnsubscribe(verified.email, parsed.data.scope);
  return NextResponse.json({ ok: true });
}
