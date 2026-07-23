import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/shared/sign-out-button";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/approvals", label: "Approvals" },
  { href: "/admin/investors", label: "Investors" },
  { href: "/admin/brokers", label: "Brokers" },
  { href: "/admin/developers", label: "Developers" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "admin") {
    redirect("/admin-login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-paper)]">
      <header className="border-b border-white/10 bg-[var(--color-ink)] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <span className="font-serif text-lg font-semibold">InvestorSource Admin</span>
          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium text-white/70 hover:text-white">
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
