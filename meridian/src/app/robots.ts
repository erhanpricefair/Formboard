import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The portals are all session-gated and would only ever serve a
      // crawler a login redirect — listing them keeps that noise out of
      // crawl budget and out of Search Console's coverage report.
      disallow: [
        "/admin/",
        "/broker/",
        "/developer/",
        "/investor/",
        "/api/",
        "/admin-login",
        "/broker-login",
        "/developer-login",
        "/set-password",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
