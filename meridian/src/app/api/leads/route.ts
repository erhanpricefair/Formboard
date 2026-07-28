import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmin } from "@/lib/email/notify";
import { leadCaptureSchema } from "@/lib/validation/lead";

/**
 * Server-to-server lead capture for external lead-generation front-ends
 * (referwise.com.au today, any future site tomorrow).
 *
 * Auth is a shared secret in the Authorization header, NOT a user
 * session — the calling site has no InvestorSource login. This means the
 * caller must be that site's *server*: putting LEAD_CAPTURE_SECRET in
 * browser-side JavaScript would publish it to anyone who views source.
 *
 * Writes go through the service-role client because there is no
 * authenticated user to satisfy RLS with, and the secret check below is
 * the authorisation gate in its place.
 */

function isAuthorised(request: Request): boolean {
  const secret = process.env.LEAD_CAPTURE_SECRET;
  if (!secret || secret === "placeholder-lead-capture-secret") {
    console.error("[api/leads] LEAD_CAPTURE_SECRET is not configured; rejecting request");
    return false;
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!provided) return false;

  // Compare over fixed-length digests so the comparison time doesn't leak
  // how many leading characters of the secret were guessed correctly.
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!isAuthorised(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = leadCaptureSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Validation failed",
        details: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const admin = createAdminClient();

  const { data: lead, error } = await admin
    .from("leads")
    .insert({
      full_name: data.fullName ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      message: data.message ?? null,
      source: data.source,
      utm_source: data.utmSource ?? null,
      utm_campaign: data.utmCampaign ?? null,
      partial_answers: data.partialAnswers ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[api/leads] insert failed:", error);
    return Response.json({ error: "Could not record the lead" }, { status: 500 });
  }

  // Notification is best-effort: the lead is already safely stored, so a
  // mail failure must not make the calling site think capture failed and
  // retry (which would duplicate the lead).
  await notifyAdmin(
    `New lead from ${data.source}: ${data.fullName ?? data.email ?? data.phone}`,
    `<p><strong>${data.fullName ?? "Someone"}</strong> submitted an enquiry on <strong>${data.source}</strong>.</p>` +
      `<p><strong>Email:</strong> ${data.email ?? "—"}<br/>` +
      `<strong>Phone:</strong> ${data.phone ?? "—"}</p>` +
      (data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : "") +
      (data.utmSource || data.utmCampaign
        ? `<p><strong>Campaign:</strong> ${data.utmSource ?? "—"} / ${data.utmCampaign ?? "—"}</p>`
        : "") +
      `<p>View it in the admin portal under Leads.</p>`
  );

  return Response.json({ id: lead.id, status: "recorded" }, { status: 201 });
}
