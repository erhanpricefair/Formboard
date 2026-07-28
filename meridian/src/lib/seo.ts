/**
 * Canonical origin for the public site. Every absolute URL emitted for
 * search engines (canonical tags, Open Graph, sitemap entries, JSON-LD
 * `url` fields) must come from here — a mix of www/non-www or preview
 * hostnames leaking into a sitemap splits ranking signals across what
 * Google treats as separate sites.
 *
 * Override with NEXT_PUBLIC_SITE_URL for a staging domain; the default is
 * the live domain so a missing env var can never produce localhost URLs
 * in production metadata.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.investorsource.com.au"
).replace(/\/$/, "");

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * URL-safe identifier for a suburb landing page, e.g. "Clyde North" + VIC
 * -> "clyde-north-vic". Derived rather than stored: the `suburbs` table has
 * no slug column, and (name, state) is already unique enough in practice
 * for the stocklist. Resolution goes the other way in
 * app/suburbs/[slug]/page.tsx, which recomputes this for candidate rows
 * rather than parsing the slug back apart.
 */
export function suburbSlug(name: string, state: string): string {
  return `${name}-${state}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Renders a JSON-LD object as a <script> payload. */
export function jsonLd(data: Record<string, unknown>): string {
  // Escaping `<` prevents a value containing "</script>" from breaking out
  // of the tag — the standard XSS guard for inline JSON-LD.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
