import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default async function AdminInvestorsPage() {
  const supabase = await createClient();

  const { data: investors } = await supabase
    .from("investor_profiles")
    .select("id, budget_max, onboarding_completed_at, timeframe")
    .order("created_at", { ascending: false })
    .limit(100);

  const ids = (investors ?? []).map((i) => i.id);
  const [{ data: profiles }, { data: links }] = await Promise.all([
    ids.length > 0
      ? supabase.from("profiles").select("id, full_name, email").in("id", ids)
      : Promise.resolve({ data: [] as { id: string; full_name: string; email: string }[] }),
    ids.length > 0
      ? supabase.from("broker_clients").select("investor_id, broker_id").in("investor_id", ids)
      : Promise.resolve({ data: [] as { investor_id: string; broker_id: string }[] }),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const brokerByInvestor = new Map((links ?? []).map((l) => [l.investor_id, l.broker_id]));

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">Investors</h1>

      <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <th className="p-4 text-left font-medium text-[var(--color-muted)]">Name</th>
              <th className="p-4 text-left font-medium text-[var(--color-muted)]">Budget</th>
              <th className="p-4 text-left font-medium text-[var(--color-muted)]">Onboarding</th>
              <th className="p-4 text-left font-medium text-[var(--color-muted)]">Broker</th>
            </tr>
          </thead>
          <tbody>
            {(investors ?? []).map((inv) => {
              const profile = profileById.get(inv.id);
              return (
                <tr key={inv.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="p-4">
                    <p className="font-medium text-[var(--color-ink)]">{profile?.full_name ?? "—"}</p>
                    <p className="text-xs text-[var(--color-muted)]">{profile?.email}</p>
                  </td>
                  <td className="p-4 text-[var(--color-ink)]">{formatCurrency(Number(inv.budget_max))}</td>
                  <td className="p-4">
                    <Badge variant={inv.onboarding_completed_at ? "success" : "outline"}>
                      {inv.onboarding_completed_at ? "Complete" : "Incomplete"}
                    </Badge>
                  </td>
                  <td className="p-4 text-[var(--color-muted)]">
                    {brokerByInvestor.has(inv.id) ? "Linked" : "Unassigned"}
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
