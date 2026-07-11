import "server-only";
import { createHash, randomInt } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getEmailProvider } from "@/lib/integrations/email";
import { getSmsProvider } from "@/lib/integrations/sms";

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function hashCode(code: string, leadId: string): string {
  // Salted with the lead id so a leaked hash from one row is useless
  // against another; codes are short-lived (10 min) and single-use.
  return createHash("sha256").update(`${leadId}:${code}:${process.env.UNSUBSCRIBE_TOKEN_SECRET ?? "dev-secret"}`).digest("hex");
}

/**
 * Basic contact verification (email or SMS OTP). This exists because
 * performance-based billing requires high-intent, real leads — an
 * unverified email/phone is not billable to a professional as a "New"
 * lead. Generates and dispatches a 6-digit code, storing only its hash.
 */
export async function sendVerificationCode(leadId: string, channel: "email" | "sms", destination: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

  const { error } = await admin
    .from("leads")
    .update({
      verification_channel: channel,
      verification_code_hash: hashCode(code, leadId),
      verification_expires_at: expiresAt,
      verification_attempts: 0,
      verification_status: "pending",
    })
    .eq("id", leadId);

  if (error) throw new Error(`Failed to store verification code: ${error.message}`);

  const message = `Your verification code is ${code}. It expires in ${CODE_TTL_MINUTES} minutes. This platform is an independent directory — leads are forwarded to participating professionals; we do not provide installation services or financial advice.`;

  if (channel === "email") {
    await getEmailProvider().send({ to: destination, subject: "Verify your enquiry", text: message });
  } else {
    await getSmsProvider().send({ to: destination, body: message });
  }
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "expired" | "too_many_attempts" | "incorrect_code" };

export async function verifyCode(leadId: string, code: string): Promise<VerifyResult> {
  const admin = createSupabaseAdminClient();

  const { data: lead, error } = await admin
    .from("leads")
    .select("id, verification_code_hash, verification_expires_at, verification_attempts, verification_status")
    .eq("id", leadId)
    .maybeSingle();

  if (error || !lead || !lead.verification_code_hash || !lead.verification_expires_at) {
    return { ok: false, reason: "not_found" };
  }

  if (lead.verification_status === "verified") {
    return { ok: true };
  }

  if (lead.verification_attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: "too_many_attempts" };
  }

  if (new Date(lead.verification_expires_at).getTime() < Date.now()) {
    await admin.from("leads").update({ verification_status: "failed" }).eq("id", leadId);
    return { ok: false, reason: "expired" };
  }

  const candidateHash = hashCode(code, leadId);
  if (candidateHash !== lead.verification_code_hash) {
    await admin
      .from("leads")
      .update({ verification_attempts: lead.verification_attempts + 1 })
      .eq("id", leadId);
    return { ok: false, reason: "incorrect_code" };
  }

  await admin
    .from("leads")
    .update({
      verification_status: "verified",
      verified_at: new Date().toISOString(),
      status: "verified",
    })
    .eq("id", leadId);

  return { ok: true };
}
