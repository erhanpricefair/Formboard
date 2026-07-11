import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendVerificationCode } from "@/lib/services/verification-service";
import { chargeLeadFee } from "@/lib/services/fee-service";
import type { LeadCaptureInput } from "@/lib/validations/lead";

export interface CaptureLeadContext {
  ip: string | null;
  userAgent: string | null;
}

/**
 * Stage 1 of the audit trail: "Captured". Persists the lead with its
 * consent flags, writes append-only consent_log rows (so we retain
 * history even though `leads` only holds current state), and kicks off
 * contact verification. The lead is NOT shared with the professional
 * yet — that happens in shareLeadWithProfessional once verification
 * succeeds, so a professional is never billed for an unverified contact.
 */
export async function captureLead(input: LeadCaptureInput, ctx: CaptureLeadContext) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: lead, error } = await admin
    .from("leads")
    .insert({
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      suburb: input.suburb,
      postcode: input.postcode,
      state: input.state,
      service_type: input.serviceType,
      project_details: input.projectDetails ?? null,
      source: "directory_web",
      consent_contact: input.consentContact,
      consent_data_share: input.consentDataShare,
      consent_marketing: input.consentMarketing,
      privacy_policy_version: input.privacyPolicyVersion,
      consent_captured_at: now,
      consent_ip: ctx.ip,
      consent_user_agent: ctx.userAgent,
      status: "captured",
    })
    .select("id")
    .single();

  if (error || !lead) {
    throw new Error(`Failed to capture lead: ${error?.message ?? "unknown error"}`);
  }

  const consentRows = [
    { lead_id: lead.id, consent_type: "contact" as const, granted: input.consentContact, policy_version: input.privacyPolicyVersion, ip_address: ctx.ip, user_agent: ctx.userAgent },
    { lead_id: lead.id, consent_type: "data_share" as const, granted: input.consentDataShare, policy_version: input.privacyPolicyVersion, ip_address: ctx.ip, user_agent: ctx.userAgent },
    { lead_id: lead.id, consent_type: "marketing" as const, granted: input.consentMarketing, policy_version: input.privacyPolicyVersion, ip_address: ctx.ip, user_agent: ctx.userAgent },
  ];
  const { error: consentError } = await admin.from("consent_log").insert(consentRows);
  if (consentError) throw new Error(`Failed to write consent log: ${consentError.message}`);

  await sendVerificationCode(lead.id, "sms", input.phone);

  return { leadId: lead.id as string };
}

/**
 * Stage 2: "Shared". Called once contact verification succeeds. Creates
 * the lead_tracking row (status New) for the chosen professional, charges
 * the flat lead fee, and flips the lead's lifecycle status.
 */
export async function shareLeadWithProfessional(leadId: string, professionalId: string) {
  const admin = createSupabaseAdminClient();

  const { data: lead, error: leadError } = await admin
    .from("leads")
    .select("id, verification_status")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError || !lead) throw new Error("Lead not found.");
  if (lead.verification_status !== "verified") {
    throw new Error("Lead must be verified before it can be shared with a professional.");
  }

  const { data: tracking, error: trackingError } = await admin
    .from("lead_tracking")
    .insert({ lead_id: leadId, professional_id: professionalId, status: "New" })
    .select("id")
    .single();

  if (trackingError || !tracking) {
    throw new Error(`Failed to share lead: ${trackingError?.message ?? "unknown error"}`);
  }

  await chargeLeadFee(tracking.id, professionalId);

  await admin.from("leads").update({ status: "shared" }).eq("id", leadId);

  return { leadTrackingId: tracking.id as string };
}
