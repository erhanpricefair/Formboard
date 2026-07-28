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
  if (!user) redirect("/broker-login");

  // Checked against profiles.role, not user_metadata.role -- the latter
  // is attacker-controlled at signup (see migration 0012) and must never
  // gate anything on its own.
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "broker") redirect("/broker-login");

  // Self-registered brokers (/broker-signup) start inactive. Until an
  // admin activates them they get the holding screen below instead of the
  // portal — brokers can see linked investors' contact and finance
  // details, so signing up must not be what grants that access.
  const { data: brokerProfile } = await supabase
    .from("broker_profiles")
    .select("is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!brokerProfile?.is_active) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--color-paper)]">
        <header className="border-b border-[var(--color-border)] bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
            <span className="font-serif text-lg font-semibold text-[var(--color-ink)]">
              InvestorSource for Brokers
            </span>
            <SignOutButton />
          </div>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-20 lg:px-8">
          <h1 className="font-serif text-2xl font-medium text-[var(--color-ink)]">
            Your account is awaiting approval
          </h1>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            Thanks for registering. We review every broker account before granting access to client
            data — you&rsquo;ll be able to sign in and use the portal as soon as that&rsquo;s done.
          </p>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            If this is taking longer than expected, contact us at{" "}
            <a
              href="mailto:erhan@newpfproperty.com.au"
              className="text-[var(--color-accent-ink)] hover:underline"
            >
              erhan@newpfproperty.com.au
            </a>
            .
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-paper)]">
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <span className="font-serif text-lg font-semibold text-[var(--color-ink)]">
            InvestorSource for Brokers
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
