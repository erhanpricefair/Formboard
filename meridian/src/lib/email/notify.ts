import "server-only";
import { Resend } from "resend";

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? "erhan@newpfproperty.com.au";

function resendConfigured(): boolean {
  const key = process.env.RESEND_API_KEY;
  return Boolean(key) && key !== "placeholder-resend-api-key";
}

/**
 * Fire-and-forget admin notification email. Never throws — a notification
 * failure must never block the broker/investor action that triggered it
 * (same principle as the matching run in actions/onboarding.ts). Logs to
 * the server console on failure or when unconfigured so it's diagnosable
 * without silently vanishing.
 */
export async function notifyAdmin(subject: string, html: string): Promise<void> {
  if (!resendConfigured()) {
    console.warn(`[notifyAdmin] RESEND_API_KEY not configured, skipping email: "${subject}"`);
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "InvestorSource <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject,
      html,
    });
  } catch (err) {
    console.error(`[notifyAdmin] failed to send "${subject}":`, err);
  }
}
