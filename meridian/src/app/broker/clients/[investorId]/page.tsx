import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SettlementTracker } from "@/components/journey/settlement-tracker";
import { StageAdvanceControl } from "@/components/broker/stage-advance-control";
import { ShareListingForm } from "@/components/broker/share-listing-form";
import { formatCurrency } from "@/lib/utils";
import { SETTLEMENT_STAGES, canAdvanceStage } from "@/lib/settlement-accelerator/stages";

export default async function BrokerClientDetailPage({
  params,
}: {
  params: Promise<{ investorId: string }>;
}) {
  const { investorId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: link } = await supabase
    .from("broker_clients")
    .select("investor_id")
    .eq("broker_id", user.id)
    .eq("investor_id", investorId)
    .maybeSingle();
  if (!link) notFound();

  const [{ data: profile }, { data: investorProfile }, { data: journey }, { data: listings }] =
    await Promise.all([
      supabase.from("profiles").select("full_name, email, phone").eq("id", investorId).maybeSingle(),
      supabase.from("investor_profiles").select("*").eq("id", investorId).maybeSingle(),
      supabase.from("settlement_journeys").select("id").eq("investor_id", investorId).maybeSingle(),
      supabase.from("listings").select("id, title").eq("status", "published").limit(50),
    ]);

  let currentStage = null as string | null;
  if (journey) {
    const { data: journeyView } = await supabase
      .from("investor_journey_view")
      .select("current_stage")
      .eq("journey_id", journey.id)
      .maybeSingle();
    currentStage = journeyView?.current_stage ?? null;
  }

  const currentIndex = currentStage ? SETTLEMENT_STAGES.indexOf(currentStage as never) : -1;
  const nextStage = currentIndex >= 0 ? SETTLEMENT_STAGES[currentIndex + 1] : SETTLEMENT_STAGES[0];
  const brokerCanAdvance = journey && nextStage && canAdvanceStage("broker", nextStage);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">
          {profile?.full_name}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {profile?.email} {profile?.phone ? `· ${profile.phone}` : ""}
        </p>
      </div>

      {investorProfile && (
        <Card>
          <CardContent className="grid gap-6 pt-6 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">Budget</p>
              <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                {formatCurrency(Number(investorProfile.budget_max))}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">Deposit</p>
              <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                {formatCurrency(Number(investorProfile.deposit_available))}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">Finance status</p>
              <Badge variant="outline" className="mt-1 capitalize">
                {investorProfile.finance_status.replace(/_/g, " ")}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-ink)]">Settlement Accelerator</h2>
        <Card>
          <CardContent className="space-y-4 pt-6">
            {journey ? (
              <SettlementTracker currentStage={currentStage as never} />
            ) : (
              <p className="text-sm text-[var(--color-muted)]">
                This client hasn&rsquo;t started a Settlement Accelerator journey yet.
              </p>
            )}
            {brokerCanAdvance && journey && (
              <StageAdvanceControl journeyId={journey.id} nextStage={nextStage} />
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-ink)]">Share an opportunity</h2>
        <Card>
          <CardContent className="pt-6">
            <ShareListingForm investorId={investorId} listings={listings ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
