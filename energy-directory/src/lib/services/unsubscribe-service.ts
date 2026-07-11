import "server-only";
import { createHmac, randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Lead } from "@/lib/types/database";

function sign(email: string): string {
  return createHmac("sha256", process.env.UNSUBSCRIBE_TOKEN_SECRET ?? "dev-secret").update(email.toLowerCase()).digest("hex");
}

/** One-click unsubscribe link token: {email}.{hmac}, no lookup required to validate. */
export function buildUnsubscribeUrl(baseUrl: string, email: string): string {
  const token = `${Buffer.from(email).toString("base64url")}.${sign(email)}`;
  return `${baseUrl}/unsubscribe?token=${token}`;
}

export function parseAndVerifyToken(token: string): { email: string } | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const email = Buffer.from(encoded, "base64url").toString("utf8");
  if (sign(email) !== signature) return null;
  return { email };
}

/**
 * Records the unsubscribe request (audit trail) and flips consent_marketing
 * off / marks the lead withdrawn for every lead matching this email —
 * required for APP 7 (direct marketing opt-out) and general withdrawal of
 * consent under the Privacy Act.
 */
export async function processUnsubscribe(email: string, scope: "marketing" | "all") {
  const admin = createSupabaseAdminClient();

  await admin.from("unsubscribes").insert({ email, scope, token: randomUUID() });

  const updates: Partial<Lead> = { consent_marketing: false };
  if (scope === "all") {
    updates.status = "archived";
    updates.unsubscribed_at = new Date().toISOString();
  }

  const { data: leads } = await admin.from("leads").select("id").eq("email", email);
  await admin.from("leads").update(updates).eq("email", email);

  if (leads) {
    await admin.from("consent_log").insert(
      leads.map((l) => ({
        lead_id: l.id,
        consent_type: "withdrawal" as const,
        granted: false,
        policy_version: process.env.NEXT_PUBLIC_PRIVACY_POLICY_VERSION ?? "unknown",
        method: "unsubscribe_link",
      }))
    );
  }
}
