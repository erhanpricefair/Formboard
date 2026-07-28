// Postgres returns a `daterange` column as a string like
// `["2026-01-01","2026-04-01")`. Parses it into a human label, e.g.
// "Jan 2026 – Apr 2026". Returns null for null/unparseable input.
export function formatCompletionTimeline(daterange: string | null): string | null {
  if (!daterange) return null;
  const match = daterange.match(/^[[(]"?(\d{4}-\d{2}-\d{2})"?,"?(\d{4}-\d{2}-\d{2})"?[)\]]$/);
  if (!match) return null;

  const format = (iso: string) =>
    new Date(iso).toLocaleDateString("en-AU", { month: "short", year: "numeric" });

  return `${format(match[1])} – ${format(match[2])}`;
}
