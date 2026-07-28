import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "outline" | "success" | "warning"> = {
  pending: "warning",
  confirmed: "success",
  disputed: "outline",
  voided: "outline",
};

export default async function BrokerReferralsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: referrals } = await supabase
    .from("referrals")
    .select("id, status, commission_amount, notes, created_at, journey_id")
    .eq("broker_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">Referral pipeline</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Referral records are created once a client&rsquo;s journey reaches Contract Signed, and
        confirmed by admin against the developer-reported outcome. Commission automation is a
        planned follow-up — amounts shown here are entered manually by admin.
      </p>

      {!referrals || referrals.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="pt-6 text-sm text-[var(--color-muted)]">
            No referrals yet.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                <th className="p-4 text-left font-medium text-[var(--color-muted)]">Date</th>
                <th className="p-4 text-left font-medium text-[var(--color-muted)]">Status</th>
                <th className="p-4 text-left font-medium text-[var(--color-muted)]">Commission</th>
                <th className="p-4 text-left font-medium text-[var(--color-muted)]">Notes</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="p-4 text-[var(--color-ink)]">
                    {new Date(r.created_at).toLocaleDateString("en-AU")}
                  </td>
                  <td className="p-4">
                    <Badge variant={STATUS_VARIANT[r.status]} className="capitalize">
                      {r.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-[var(--color-ink)]">
                    {r.commission_amount ? formatCurrency(Number(r.commission_amount)) : "—"}
                  </td>
                  <td className="p-4 text-[var(--color-muted)]">{r.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
