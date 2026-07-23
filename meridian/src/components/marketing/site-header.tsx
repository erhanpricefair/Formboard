import Link from "next/link";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#settlement-accelerator", label: "Settlement Accelerator" },
  { href: "/broker-login", label: "For Brokers" },
  { href: "/developer-login", label: "For Developers" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-paper)]/90 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-xl font-semibold tracking-tight text-[var(--color-ink)]">
            InvestorSource
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--color-ink)]/80 transition-colors hover:text-[var(--color-ink)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/broker-login" className="hidden sm:block">
            <Button variant="outline" size="sm">
              Broker Login
            </Button>
          </Link>
          <Link href="/get-started">
            <Button variant="accent" size="sm">
              Find My Investment Opportunity
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
