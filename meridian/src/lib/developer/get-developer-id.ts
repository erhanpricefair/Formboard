import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Resolves the developer company a logged-in developer user belongs to.
 * Returns null if the account has no developer_team_members link yet —
 * account provisioning for the developer role is an admin/ops action out
 * of scope for this pass (see README "Status"), so a developer user can
 * legitimately exist without one until admin links them to a company.
 */
export async function getDeveloperId(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("developer_team_members")
    .select("developer_id")
    .eq("id", userId)
    .maybeSingle();
  return data?.developer_id ?? null;
}
