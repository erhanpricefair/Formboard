import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalInvestors },
    { count: completedOnboarding },
    { count: totalMatches },
    { count: totalConsultations },
    { data: listingStatusRows },
    { count: pendingReferrals },
    { count: confirmedReferrals },
  ] = await Promise.all([
    supabase.from("investor_profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("investor_profiles")
      .select("id", { count: "exact", head: true })
      .not("onboarding_completed_at", "is", null),
    supabase.from("property_matches").select("id", { count: "exact", head: true }),
    supabase.from("consultation_bookings").select("id", { count: "exact", head: true }),
    supabase.from("listings").select("status"),
    supabase.from("referrals").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("referrals").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
  ]);

  const listingsByStatus: Record<string, number> = {};
  for (const row of listingStatusRows ?? []) {
    listingsByStatus[row.status] = (listingsByStatus[row.status] ?? 0) + 1;
  }

  const onboardingRate =
    totalInvestors && totalInvestors > 0
      ? Math.round(((completedOnboarding ?? 0) / totalInvestors) * 100)
      : 0;

  const topStats = [
    { label: "Investor signups", value: totalInvestors ?? 0 },
    { label: "Onboarding completion", value: `${onboardingRate}%` },
    { label: "Matches generated", value: totalMatches ?? 0 },
    { label: "Consultations booked", value: totalConsultations ?? 0 },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">Admin dashboard</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Platform-wide analytics and controls.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-4">
        {topStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">
                {stat.label}
              </p>
              <p className="mt-2 font-serif text-3xl font-medium text-[var(--color-ink)]">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-semibold text-[var(--color-ink)]">Listings by status</p>
            <ul className="mt-4 space-y-2 text-sm">
              {["draft", "pending_review", "approved", "published", "rejected", "paused", "archived"].map(
                (status) => (
                  <li key={status} className="flex items-center justify-between">
                    <span className="capitalize text-[var(--color-muted)]">{status.replace(/_/g, " ")}</span>
                    <span className="font-medium text-[var(--color-ink)]">{listingsByStatus[status] ?? 0}</span>
                  </li>
                )
              )}
            </ul>
            <Link href="/admin/approvals" className="mt-4 inline-block text-sm text-[var(--color-accent-ink)] hover:underline">
              Go to approval queue →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-semibold text-[var(--color-ink)]">Referral pipeline</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-[var(--color-muted)]">Pending</span>
                <span className="font-medium text-[var(--color-ink)]">{pendingReferrals ?? 0}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[var(--color-muted)]">Confirmed</span>
                <span className="font-medium text-[var(--color-ink)]">{confirmedReferrals ?? 0}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 text-sm">
        <Link href="/admin/investors" className="text-[var(--color-accent-ink)] hover:underline">
          Manage investors →
        </Link>
        <Link href="/admin/brokers" className="text-[var(--color-accent-ink)] hover:underline">
          Manage brokers →
        </Link>
        <Link href="/admin/developers" className="text-[var(--color-accent-ink)] hover:underline">
          Manage developers →
        </Link>
      </div>
    </div>
  );
}
