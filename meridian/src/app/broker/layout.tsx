import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/shared/sign-out-button";

const NAV = [
  { href: "/broker/dashboard", label: "Dashboard" },
  { href: "/broker/clients", label: "Clients" },
  { href: "/broker/referrals", label: "Referrals" },
  { href: "/broker/marketing-material", label: "Marketing Material" },
];

export default async function BrokerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "broker") {
    redirect("/broker-login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-paper)]">
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <span className="font-serif text-lg font-semibold text-[var(--color-ink)]">
            Meridian for Brokers
          </span>
          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[var(--color-ink)]/80 hover:text-[var(--color-ink)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 lg:px-8">{children}</main>
    </div>
  );
}
