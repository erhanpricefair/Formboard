import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBrokerRoster } from "@/lib/broker/get-roster";
import { ReferralLinkCard } from "@/components/broker/referral-link-card";
import { AddClientForm } from "@/components/broker/add-client-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

const STAGE_LABELS: Record<string, string> = {
  investor_enquiry: "Enquiry",
  strategy_consultation: "Strategy Consultation",
  finance_assessment: "Finance Assessment",
  property_selection: "Property Selection",
  contract_signed: "Contract Signed",
  construction_updates: "Construction",
  settlement_preparation: "Settlement Prep",
  handover: "Handover",
  property_management: "Property Management",
};

export default async function BrokerClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: brokerProfile }, roster] = await Promise.all([
    supabase.from("broker_profiles").select("referral_link_slug").eq("id", user.id).maybeSingle(),
    getBrokerRoster(supabase, user.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">Your clients</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Add a client directly with their details, or share your referral link so they onboard
          themselves — either way they land on your roster with matches ready.
        </p>
      </div>

      {brokerProfile && <ReferralLinkCard slug={brokerProfile.referral_link_slug} />}

      <Card>
        <CardContent className="pt-6">
          <AddClientForm />
        </CardContent>
      </Card>

      {roster.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-[var(--color-muted)]">
            No clients yet — share your referral link to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                <th className="p-4 text-left font-medium text-[var(--color-muted)]">Client</th>
                <th className="p-4 text-left font-medium text-[var(--color-muted)]">Onboarding</th>
                <th className="p-4 text-left font-medium text-[var(--color-muted)]">Budget</th>
                <th className="p-4 text-left font-medium text-[var(--color-muted)]">Matches</th>
                <th className="p-4 text-left font-medium text-[var(--color-muted)]">Journey stage</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((client) => (
                <tr key={client.investorId} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="p-4">
                    <Link
                      href={`/broker/clients/${client.investorId}`}
                      className="font-medium text-[var(--color-accent-ink)] hover:underline"
                    >
                      {client.fullName}
                    </Link>
                    <p className="text-xs text-[var(--color-muted)]">{client.email}</p>
                  </td>
                  <td className="p-4">
                    <Badge variant={client.onboardingComplete ? "success" : "outline"}>
                      {client.onboardingComplete ? "Complete" : "Incomplete"}
                    </Badge>
                  </td>
                  <td className="p-4 text-[var(--color-ink)]">
                    {client.budgetMax ? formatCurrency(client.budgetMax) : "—"}
                  </td>
                  <td className="p-4 text-[var(--color-ink)]">{client.matchCount}</td>
                  <td className="p-4 text-[var(--color-ink)]">
                    {client.currentStage ? STAGE_LABELS[client.currentStage] : "Not started"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
