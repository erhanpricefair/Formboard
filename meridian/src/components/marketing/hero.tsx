import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Building2, Users } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-paper)]">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
        <div>
          <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">
            Independent property investment marketplace
          </span>

          <h1 className="mt-6 font-serif text-4xl leading-[1.1] font-medium text-[var(--color-ink)] sm:text-5xl lg:text-6xl">
            Access Australia&rsquo;s Property Investment Opportunities
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-muted)]">
            Discover carefully selected house and land packages matched to
            your investment goals — vetted, explained, and tracked end to
            end by our Settlement Accelerator.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/get-started">
              <Button variant="accent" size="lg" className="w-full sm:w-auto">
                Find My Investment Opportunity
              </Button>
            </Link>
            <Link href="/broker-login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Broker Login
              </Button>
            </Link>
          </div>

          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-[var(--color-border)] pt-6">
            <div className="flex flex-col gap-1">
              <ShieldCheck className="h-5 w-5 text-[var(--color-accent)]" />
              <dt className="text-xs text-[var(--color-muted)]">Every listing</dt>
              <dd className="text-sm font-semibold text-[var(--color-ink)]">Admin-vetted</dd>
            </div>
            <div className="flex flex-col gap-1">
              <Building2 className="h-5 w-5 text-[var(--color-accent)]" />
              <dt className="text-xs text-[var(--color-muted)]">Sourced from</dt>
              <dd className="text-sm font-semibold text-[var(--color-ink)]">Trusted developers</dd>
            </div>
            <div className="flex flex-col gap-1">
              <Users className="h-5 w-5 text-[var(--color-accent)]" />
              <dt className="text-xs text-[var(--color-muted)]">Guided by</dt>
              <dd className="text-sm font-semibold text-[var(--color-ink)]">Licensed brokers</dd>
            </div>
          </dl>
        </div>

        <div className="relative">
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-xl shadow-black/5">
            <p className="text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">
              Matched for you
            </p>
            <div className="mt-4 rounded-xl bg-[var(--color-surface-muted)] p-5">
              <p className="text-sm font-medium text-[var(--color-ink)]">
                Clyde North Townhouse Package
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Melbourne growth corridor · VIC
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Price</p>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">$612,000</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Est. Yield</p>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">4.6%</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Deposit</p>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">$61,200</p>
                </div>
              </div>
              <p className="mt-4 rounded-lg bg-[var(--color-accent-soft)] p-3 text-xs leading-relaxed text-[var(--color-accent-ink)]">
                &ldquo;Matches your growth-focused preference — this project
                sits in a designated growth corridor with confirmed rail
                and town-centre infrastructure investment.&rdquo;
              </p>
            </div>
            <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
              An example of how Meridian explains every match
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
