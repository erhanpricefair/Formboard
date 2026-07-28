import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Anonymous, cookie-free Supabase client for the public marketing and SEO
 * pages (/properties, /suburbs, sitemap.ts).
 *
 * Deliberately NOT the `@supabase/ssr` server client used everywhere else:
 * that one reads session cookies, which makes any page using it dynamic
 * and uncacheable. Public listing pages have no per-user content, so they
 * should render the same for a crawler as for a signed-out visitor and be
 * cacheable.
 *
 * Safe because it runs as the `anon` role, so RLS still applies —
 * `listings_select` (migration 0007) exposes only `status = 'published'`
 * rows to anon, and `listing_images_select` only images belonging to
 * those. Nothing here can reach an unpublished listing or any user data.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
