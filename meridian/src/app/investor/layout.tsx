import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/shared/sign-out-button";

const NAV = [
  { href: "/investor/dashboard", label: "Dashboard" },
  { href: "/investor/saved", label: "Saved" },
  { href: "/investor/compare", label: "Compare" },
  { href: "/investor/journey", label: "My Journey" },
  { href: "/investor/profile", label: "Profile" },
];

export default async function InvestorLayout({ children }: { children: React.ReactNode }) {
  // Belt-and-suspenders check alongside proxy.ts (ARCHITECTURE.md §4.2's
  // two-layer model) — RLS on every query below is the actual boundary.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "investor") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-paper)]">
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="font-serif text-lg font-semibold text-[var(--color-ink)]">
            Meridian
          </Link>
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
