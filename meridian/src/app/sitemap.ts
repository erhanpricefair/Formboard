import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { SITE_URL, suburbSlug } from "@/lib/seo";

// Regenerate hourly rather than at build time — new stock is published
// from the admin portal, not by deploying, so a build-time-only sitemap
// would go stale the moment a listing is approved.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/properties`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/get-started`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/broker-signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const [{ data: listings }, { data: suburbs }] = await Promise.all([
    supabase
      .from("listings")
      .select("id, updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(5000),
    supabase.from("suburbs").select("name, state"),
  ]);

  const listingRoutes: MetadataRoute.Sitemap = (listings ?? []).map((listing) => ({
    url: `${SITE_URL}/properties/${listing.id}`,
    lastModified: listing.updated_at ? new Date(listing.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const suburbRoutes: MetadataRoute.Sitemap = (suburbs ?? []).map((s) => ({
    url: `${SITE_URL}/suburbs/${suburbSlug(s.name, s.state)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...listingRoutes, ...suburbRoutes];
}
