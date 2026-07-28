import Link from "next/link";
import { COMPANY } from "@/lib/company";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-ink)] text-white/70">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <span className="font-serif text-lg font-semibold text-white">
              InvestorSource
            </span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed">
              An independent property investment marketplace. We source and
              match vetted opportunities from developers — we are not the
              developer or seller of any property listed here.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Investors</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/properties" className="hover:text-white">Browse properties</Link></li>
              <li><Link href="/get-started" className="hover:text-white">Find an opportunity</Link></li>
              <li><Link href="/#settlement-accelerator" className="hover:text-white">Settlement Accelerator</Link></li>
              <li><Link href="/#faq" className="hover:text-white">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Partners</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/broker-login" className="hover:text-white">Broker login</Link></li>
              <li><Link href="/developer-login" className="hover:text-white">Developer portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Legal</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white">Privacy policy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms of service</Link></li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed">
              InvestorSource provides general information only, not personal
              financial or credit advice. Speak with a licensed broker
              before making a finance decision.
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-white/50">
          © {new Date().getFullYear()} {COMPANY.legalName} (ABN {COMPANY.abn}) trading as{" "}
          {COMPANY.tradingName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
