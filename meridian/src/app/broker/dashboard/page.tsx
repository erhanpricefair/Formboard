import { Card, CardContent } from "@/components/ui/card";

export default function BrokerDashboardPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">
        Broker dashboard
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Your authenticated broker account is wired up (role-based auth + RLS
        are live). Client roster, referral tracking, and marketing-material
        downloads (FR-6/FR-7) build on this shell in the next implementation
        pass, per the project&rsquo;s build order.
      </p>
      <Card className="mt-6">
        <CardContent className="pt-6 text-sm text-[var(--color-muted)]">
          Coming next: client roster (add/link clients, view journey status),
          referral pipeline, and shared-listing tools.
        </CardContent>
      </Card>
    </div>
  );
}
