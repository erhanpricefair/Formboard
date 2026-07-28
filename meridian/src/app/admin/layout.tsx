import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/shared/sign-out-button";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/approvals", label: "Approvals" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/investors", label: "Investors" },
  { href: "/admin/brokers", label: "Brokers" },
  { href: "/admin/developers", label: "Developers" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin-login");

  // Checked against profiles.role, not user_metadata.role -- the latter
  // is attacker-controlled at signup (see migration 0012) and must never
  // gate anything on its own.
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/admin-login");

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
