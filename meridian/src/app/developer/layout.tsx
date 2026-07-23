import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/shared/sign-out-button";

export default async function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "developer") {
    redirect("/developer-login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-paper)]">
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <span className="font-serif text-lg font-semibold text-[var(--color-ink)]">
            InvestorSource Developer Portal
          </span>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/developer/dashboard" className="text-sm font-medium text-[var(--color-ink)]/80 hover:text-[var(--color-ink)]">
              Dashboard
            </Link>
            <Link href="/developer/projects" className="text-sm font-medium text-[var(--color-ink)]/80 hover:text-[var(--color-ink)]">
              Projects
            </Link>
          </nav>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 lg:px-8">{children}</main>
    </div>
  );
}
