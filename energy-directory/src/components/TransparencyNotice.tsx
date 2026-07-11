/**
 * Mandatory transparency clause. Rendered on every public-facing page
 * that could be mistaken for a professional's own site: the homepage,
 * every profile page, and every lead capture form / confirmation screen.
 */
export function TransparencyNotice({ compact = false }: { compact?: boolean }) {
  return (
    <p className={compact ? "text-xs text-ink-500" : "text-sm text-ink-500"}>
      This platform is an independent directory. Leads are forwarded to participating professionals; we do not
      provide installation services or financial advice.{" "}
      <a href="/privacy-policy" className="underline hover:text-ink-700">
        Privacy policy
      </a>
      .
    </p>
  );
}
