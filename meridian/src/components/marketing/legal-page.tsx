import type { ReactNode } from "react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

/**
 * Shared chrome for /privacy and /terms. Prose styling is applied here
 * rather than with a plugin so the documents stay plain semantic HTML —
 * easier to keep accurate when the platform's data handling changes.
 */
export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
          <h1 className="font-serif text-4xl font-medium text-[var(--color-ink)]">{title}</h1>
          <p className="mt-3 text-sm text-[var(--color-muted)]">Last updated: {lastUpdated}</p>

          <div
            className="mt-10 space-y-6 text-sm leading-relaxed text-[var(--color-ink)]/85
              [&_a]:text-[var(--color-accent-ink)] [&_a]:underline [&_a]:underline-offset-2
              [&_h2]:mt-12 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-[var(--color-ink)]
              [&_h3]:mt-8 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[var(--color-ink)]
              [&_li]:mt-1.5
              [&_strong]:font-semibold [&_strong]:text-[var(--color-ink)]
              [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6"
          >
            {children}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
