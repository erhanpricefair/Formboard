import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Service-role client — bypasses Row-Level Security entirely. Use ONLY for
// the narrow, audited server-only paths described in ARCHITECTURE.md §4.2
// (e.g. admin impersonation-view, the batch re-match job, notification
// fan-out). Every call site using this client must write an audit_log
// entry. Never import this from a Client Component or expose the key to
// the browser bundle — the `server-only` import above enforces that at
// build time.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
