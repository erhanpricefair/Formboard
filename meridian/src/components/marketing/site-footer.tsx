import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-ink)] text-white/70">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <span className="font-serif text-lg font-semibold text-white">
              Meridian Property Partners
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
              <li><Link href="/get-started" className="hover:text-white">Find an opportunity</Link></li>
              <li><a href="#settlement-accelerator" className="hover:text-white">Settlement Accelerator</a></li>
              <li><a href="#faq" className="hover:text-white">FAQ</a></li>
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
            <p className="mt-3 text-sm leading-relaxed">
              Meridian provides general information only, not personal
              financial or credit advice. Speak with a licensed broker
              before making a finance decision.
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-white/50">
          © {new Date().getFullYear()} Meridian Property Partners. ABN placeholder. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
