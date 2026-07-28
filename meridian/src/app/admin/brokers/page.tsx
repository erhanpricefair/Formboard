import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { InviteBrokerForm } from "@/components/admin/invite-broker-form";
import { BrokerActiveToggle } from "@/components/admin/broker-active-toggle";

export default async function AdminBrokersPage() {
  const supabase = await createClient();

  const { data: brokers } = await supabase
    .from("broker_profiles")
    .select("id, agency_name, is_active, referral_link_slug")
    .order("created_at", { ascending: false });

  const ids = (brokers ?? []).map((b) => b.id);
  const [{ data: profiles }, { data: clientLinks }, { data: referrals }] = await Promise.all([
    ids.length > 0
      ? supabase.from("profiles").select("id, full_name, email").in("id", ids)
      : Promise.resolve({ data: [] as { id: string; full_name: string; email: string }[] }),
    ids.length > 0
      ? supabase.from("broker_clients").select("broker_id").in("broker_id", ids)
      : Promise.resolve({ data: [] as { broker_id: string }[] }),
    ids.length > 0
      ? supabase.from("referrals").select("broker_id, status").in("broker_id", ids)
      : Promise.resolve({ data: [] as { broker_id: string; status: string }[] }),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const clientCountByBroker = new Map<string, number>();
  for (const link of clientLinks ?? []) {
    clientCountByBroker.set(link.broker_id, (clientCountByBroker.get(link.broker_id) ?? 0) + 1);
  }
  const confirmedByBroker = new Map<string, number>();
  for (const r of referrals ?? []) {
    if (r.status === "confirmed") confirmedByBroker.set(r.broker_id, (confirmedByBroker.get(r.broker_id) ?? 0) + 1);
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">Brokers</h1>

      <div className="mt-6">
        <InviteBrokerForm />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <th className="p-4 text-left font-medium text-[var(--color-muted)]">Agency</th>
              <th className="p-4 text-left font-medium text-[var(--color-muted)]">Contact</th>
              <th className="p-4 text-left font-medium text-[var(--color-muted)]">Clients</th>
              <th className="p-4 text-left font-medium text-[var(--color-muted)]">Confirmed referrals</th>
              <th className="p-4 text-left font-medium text-[var(--color-muted)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {(brokers ?? []).map((broker) => {
              const profile = profileById.get(broker.id);
              return (
                <tr key={broker.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="p-4 font-medium text-[var(--color-ink)]">{broker.agency_name}</td>
                  <td className="p-4">
                    <p className="text-[var(--color-ink)]">{profile?.full_name ?? "—"}</p>
                    <p className="text-xs text-[var(--color-muted)]">{profile?.email}</p>
                  </td>
                  <td className="p-4 text-[var(--color-ink)]">{clientCountByBroker.get(broker.id) ?? 0}</td>
                  <td className="p-4 text-[var(--color-ink)]">{confirmedByBroker.get(broker.id) ?? 0}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={broker.is_active ? "success" : "warning"}>
                        {broker.is_active ? "Active" : "Pending approval"}
                      </Badge>
                      <BrokerActiveToggle brokerId={broker.id} isActive={broker.is_active} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
