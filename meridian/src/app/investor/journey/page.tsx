import { createClient } from "@/lib/supabase/server";
import { SettlementTracker } from "@/components/journey/settlement-tracker";
import { RequestConsultationButton } from "@/components/journey/request-consultation-button";
import { Card, CardContent } from "@/components/ui/card";
import type { SettlementStage } from "@/types/database";

const STAGE_LABELS: Record<SettlementStage, string> = {
  investor_enquiry: "Investor Enquiry",
  strategy_consultation: "Strategy Consultation",
  finance_assessment: "Finance Assessment",
  property_selection: "Property Selection",
  contract_signed: "Contract Signed",
  construction_updates: "Construction Update",
  settlement_preparation: "Settlement Preparation",
  handover: "Handover",
  property_management: "Property Management",
};

export default async function JourneyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: journey } = await supabase
    .from("settlement_journeys")
    .select("id")
    .eq("investor_id", user.id)
    .maybeSingle();

  if (!journey) {
    return (
      <div>
        <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">Your journey</h1>
        <Card className="mt-6">
          <CardContent className="flex flex-col items-start gap-4 pt-6">
            <p className="text-sm text-[var(--color-muted)]">
              Your Settlement Accelerator journey starts once you book your first consultation.
            </p>
            <RequestConsultationButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  const [{ data: journeyView }, { data: events }] = await Promise.all([
    supabase
      .from("investor_journey_view")
      .select("current_stage")
      .eq("journey_id", journey.id)
      .maybeSingle(),
    supabase
      .from("settlement_stage_events")
      .select("stage, note, occurred_at, is_correction")
      .eq("journey_id", journey.id)
      .order("occurred_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">Your journey</h1>

      <Card>
        <CardContent className="pt-6">
          <SettlementTracker currentStage={journeyView?.current_stage ?? null} />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-ink)]">History</h2>
        <ol className="space-y-4 border-l border-[var(--color-border)] pl-6">
          {(events ?? []).map((event, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[29px] top-1 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
              <p className="text-sm font-medium text-[var(--color-ink)]">
                {STAGE_LABELS[event.stage]}
                {event.is_correction && (
                  <span className="ml-2 text-xs font-normal text-[var(--color-muted)]">(correction)</span>
                )}
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                {new Date(event.occurred_at).toLocaleString("en-AU")}
              </p>
              {event.note && <p className="mt-1 text-sm text-[var(--color-muted)]">{event.note}</p>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
