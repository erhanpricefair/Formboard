import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * The conversion point on every public page. Public pages deliberately show
 * the full property detail — hiding it would defeat the SEO purpose — so
 * what's held back is the thing the platform actually does: personalised
 * matching, saved lists, brochures, and a licensed broker.
 */
export function SignupCta({
  heading = "See which of these actually fit you",
  body = "Answer a few questions about your budget, deposit and goals — we'll score every published opportunity against them and explain why each one matched.",
}: {
  heading?: string;
  body?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] p-6 sm:p-8">
      <h2 className="font-serif text-xl font-medium text-[var(--color-ink)]">{heading}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-ink)]/80">{body}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/get-started">
          <Button variant="accent">Find my investment opportunity</Button>
        </Link>
        <Link href="/login">
          <Button variant="outline">I already have an account</Button>
        </Link>
      </div>
      <p className="mt-4 text-xs text-[var(--color-muted)]">
        Free, no obligation. InvestorSource provides general information only, not personal
        financial or credit advice.
      </p>
    </div>
  );
}
