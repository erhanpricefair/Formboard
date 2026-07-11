import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import { categoryLabel } from "@/lib/categories";

export default async function DashboardLeadsPage() {
  const supabase = createSupabaseServerClient();

  // RLS (`lead_tracking_select_own`) already scopes this to the signed-in
  // professional's own rows — no manual professional_id filter needed.
  const { data: rows, error } = await supabase
    .from("lead_tracking")
    .select("id, status, assigned_at, lead_cost, commission_amount, outcome_value, leads(full_name, suburb, state, service_type)")
    .order("assigned_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Your leads</h1>
      <p className="mb-6 text-sm text-ink-500">
        Update status as your relationship with each enquiry progresses. Every change is timestamped and logged for
        billing and dispute-resolution purposes.
      </p>

      {error && <p className="text-sm text-red-600">Couldn’t load leads: {error.message}</p>}

      <div className="overflow-hidden rounded-lg border border-ink-700/10">
        <table className="w-full text-sm">
          <thead className="bg-ink-900/[0.02] text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Consumer</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Lead cost</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((row) => {
              const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads;
              return (
                <tr key={row.id} className="border-t border-ink-700/10">
                  <td className="px-4 py-3">{lead?.full_name ?? "—"}</td>
                  <td className="px-4 py-3">{lead ? categoryLabel(lead.service_type) : "—"}</td>
                  <td className="px-4 py-3">
                    {lead?.suburb}, {lead?.state}
                  </td>
                  <td className="px-4 py-3">
                    <LeadStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">${row.lead_cost.toFixed(2)}</td>
                  <td className="px-4 py-3">{row.commission_amount !== null ? `$${row.commission_amount.toFixed(2)}` : "—"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/leads/${row.id}`} className="text-brand-700 hover:underline">
                      Update
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows && rows.length === 0 && <p className="mt-4 text-sm text-ink-500">No leads yet.</p>}
    </div>
  );
}
