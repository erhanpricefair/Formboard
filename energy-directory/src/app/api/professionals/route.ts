import { NextRequest, NextResponse } from "next/server";
import { professionalProfileSchema } from "@/lib/validations/professional";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { upsertProfessionalProfile } from "@/lib/services/professional-service";

/**
 * POST /api/professionals
 *
 * Authenticated. Creates or updates the signed-in user's own
 * professional profile. Zod (`professionalProfileSchema`) rejects
 * promotional hype / absolute claims before anything reaches the
 * database; the `reject_promotional_hype` trigger is the backstop.
 * New/edited profiles go to `pending_verification` implicitly (the
 * database default) — an admin must verify (license/ABN check) before
 * the profile appears in the public directory.
 */
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = professionalProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const result = await upsertProfessionalProfile(user.id, parsed.data);
    return NextResponse.json({ ok: true, professional: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save profile.";
    // Bubble up the DB trigger's "prohibited promotional claim" message
    // verbatim so the same error surfaces regardless of which layer
    // caught it.
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
