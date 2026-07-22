import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("investor_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">
          Your investment profile
        </h1>
        <Link href="/get-started">
          <Button variant="outline">Update profile</Button>
        </Link>
      </div>

      {!profile ? (
        <p className="mt-6 text-sm text-[var(--color-muted)]">
          You haven&rsquo;t completed onboarding yet.
        </p>
      ) : (
        <Card className="mt-6">
          <CardContent className="grid gap-6 pt-6 sm:grid-cols-2">
            <Field label="Experience" value={profile.experience.replace(/_/g, " ")} />
            <Field label="Budget" value={formatCurrency(Number(profile.budget_max))} />
            <Field label="Deposit available" value={formatCurrency(Number(profile.deposit_available))} />
            <Field label="Preferred states" value={profile.preferred_states.join(", ") || "—"} />
            <Field label="Preferred suburbs" value={profile.preferred_suburbs.join(", ") || "Any"} />
            <Field label="Growth vs. yield" value={profile.growth_yield_preference.replace(/_/g, " ")} />
            <Field label="Intent" value={profile.occupier_intent.replace(/_/g, " ")} />
            <Field label="Finance status" value={profile.finance_status.replace(/_/g, " ")} />
            <Field label="Timeframe" value={profile.timeframe.replace(/_/g, " ")} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">{label}</p>
      <p className="mt-1 text-sm font-medium text-[var(--color-ink)] capitalize">{value}</p>
    </div>
  );
}
