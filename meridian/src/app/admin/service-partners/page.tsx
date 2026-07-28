import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddServicePartnerForm } from "@/components/admin/add-service-partner-form";
import { ServicePartnerActiveToggle } from "@/components/admin/service-partner-active-toggle";
import { PartnerReferralCommissionInput } from "@/components/admin/partner-referral-commission-input";
import { formatCurrency } from "@/lib/utils";
import type { PartnerReferralStatus } from "@/types/database";

const STATUS_VARIANT: Record<PartnerReferralStatus, "default" | "accent" | "outline" | "success" | "warning"> = {
  recommended: "outline",
  contacted: "warning",
  engaged: "accent",
  completed: "success",
  declined: "outline",
};

export default async function AdminServicePartnersPage() {
  const supabase = await createClient();

  const { data: partners } = await supabase
    .from("service_partners")
    .select("id, partner_type, business_name, contact_name, email, phone, default_commission_rate, is_active")
    .order("business_name", { ascending: true });

  const { data: referrals } = await supabase
    .from("partner_referrals")
    .select("id, investor_id, broker_id, partner_id, status, commission_amount, notes, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const investorIds = [...new Set((referrals ?? []).map((r) => r.investor_id))];
  const brokerIds = [...new Set((referrals ?? []).map((r) => r.broker_id).filter((id): id is string => Boolean(id)))];

  const [{ data: investorProfiles }, { data: brokerProfiles }] = await Promise.all([
    investorIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", investorIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    brokerIds.length > 0
      ? supabase.from("broker_profiles").select("id, agency_name").in("id", brokerIds)
      : Promise.resolve({ data: [] as { id: string; agency_name: string }[] }),
  ]);

  const investorNameById = new Map((investorProfiles ?? []).map((p) => [p.id, p.full_name]));
  const agencyById = new Map((brokerProfiles ?? []).map((b) => [b.id, b.agency_name]));
  const partnerById = new Map((partners ?? []).map((p) => [p.id, p]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">Service partners</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Conveyancers, building inspectors, insurers, and property managers brokers can refer
          clients to during their settlement journey.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <AddServicePartnerForm />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-ink)]">Directory</h2>
        {(partners ?? []).length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-[var(--color-muted)]">
              No service partners yet — add one above.
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                  <th className="p-4 text-left font-medium text-[var(--color-muted)]">Business</th>
                  <th className="p-4 text-left font-medium text-[var(--color-muted)]">Type</th>
                  <th className="p-4 text-left font-medium text-[var(--color-muted)]">Contact</th>
                  <th className="p-4 text-left font-medium text-[var(--color-muted)]">Commission</th>
                  <th className="p-4 text-left font-medium text-[var(--color-muted)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {(partners ?? []).map((partner) => (
                  <tr key={partner.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="p-4 font-medium text-[var(--color-ink)]">{partner.business_name}</td>
                    <td className="p-4">
                      <Badge variant="outline">{partner.partner_type.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="p-4">
                      <p className="text-[var(--color-ink)]">{partner.contact_name ?? "—"}</p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {partner.email ?? ""} {partner.phone ? `· ${partner.phone}` : ""}
                      </p>
                    </td>
                    <td className="p-4 text-[var(--color-ink)]">
                      {partner.default_commission_rate ? `${partner.default_commission_rate}%` : "—"}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={partner.is_active ? "success" : "outline"}>
                          {partner.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <ServicePartnerActiveToggle partnerId={partner.id} isActive={partner.is_active} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-ink)]">Referrals</h2>
        {(referrals ?? []).length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-[var(--color-muted)]">
              No referrals recorded yet.
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                  <th className="p-4 text-left font-medium text-[var(--color-muted)]">Date</th>
                  <th className="p-4 text-left font-medium text-[var(--color-muted)]">Client</th>
                  <th className="p-4 text-left font-medium text-[var(--color-muted)]">Broker</th>
                  <th className="p-4 text-left font-medium text-[var(--color-muted)]">Partner</th>
                  <th className="p-4 text-left font-medium text-[var(--color-muted)]">Status</th>
                  <th className="p-4 text-left font-medium text-[var(--color-muted)]">Commission</th>
                </tr>
              </thead>
              <tbody>
                {(referrals ?? []).map((r) => (
                  <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="p-4 whitespace-nowrap text-[var(--color-muted)]">
                      {new Date(r.created_at).toLocaleDateString("en-AU")}
                    </td>
                    <td className="p-4 text-[var(--color-ink)]">
                      {investorNameById.get(r.investor_id) ?? "—"}
                    </td>
                    <td className="p-4 text-[var(--color-ink)]">
                      {r.broker_id ? (agencyById.get(r.broker_id) ?? "—") : "—"}
                    </td>
                    <td className="p-4 text-[var(--color-ink)]">
                      {partnerById.get(r.partner_id)?.business_name ?? "—"}
                    </td>
                    <td className="p-4">
                      <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                    </td>
                    <td className="p-4">
                      {r.status === "completed" ? (
                        <PartnerReferralCommissionInput
                          referralId={r.id}
                          commissionAmount={r.commission_amount}
                        />
                      ) : r.commission_amount ? (
                        formatCurrency(Number(r.commission_amount))
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
