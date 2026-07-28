import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export default async function BrokerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ count: clientCount }, { count: pendingReferrals }, { count: confirmedReferrals }] =
    await Promise.all([
      supabase
        .from("broker_clients")
        .select("id", { count: "exact", head: true })
        .eq("broker_id", user.id),
      supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("broker_id", user.id)
        .eq("status", "pending"),
      supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("broker_id", user.id)
        .eq("status", "confirmed"),
    ]);

  const stats = [
    { label: "Clients", value: clientCount ?? 0, href: "/broker/clients" },
    { label: "Pending referrals", value: pendingReferrals ?? 0, href: "/broker/referrals" },
    { label: "Confirmed referrals", value: confirmedReferrals ?? 0, href: "/broker/referrals" },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">Broker dashboard</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
        Give your clients access to property opportunities while keeping visibility throughout
        the journey.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <p className="text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">
                  {stat.label}
                </p>
                <p className="mt-2 font-serif text-3xl font-medium text-[var(--color-ink)]">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
