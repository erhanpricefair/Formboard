import { NextRequest, NextResponse } from "next/server";
import { professionalVerificationSchema } from "@/lib/validations/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin, isAllowedVerificationTransition, setProfessionalVerification } from "@/lib/services/admin-service";

/**
 * PATCH /api/admin/professionals/[id]/verification
 *
 * Admin-only. This is the only path by which a professional profile can
 * move to `verified` (and therefore become publicly visible in the
 * directory) or be suspended/rejected — the `protect_verification_fields`
 * trigger (migration 0002) blocks the professional's own session from
 * doing this to themselves, no matter what the client sends.
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

  const parsed = professionalVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten() }, { status: 422 });
  }

  const { data: professional, error: fetchError } = await supabase
    .from("professionals")
    .select("verification_status")
    .eq("id", params.id)
    .maybeSingle();

  if (fetchError || !professional) {
    return NextResponse.json({ error: "Professional not found." }, { status: 404 });
  }

  if (!isAllowedVerificationTransition(professional.verification_status, parsed.data.status)) {
    return NextResponse.json(
      { error: `Cannot move a profile from "${professional.verification_status}" to "${parsed.data.status}" directly.` },
      { status: 409 }
    );
  }

  try {
    await setProfessionalVerification(params.id, parsed.data.status, auth.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update verification status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
