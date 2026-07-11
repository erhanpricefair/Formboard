import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import { categoryLabel } from "@/lib/categories";

/**
 * Read-only, platform-wide view across every lead_tracking row — for
 * dispute resolution ("who has this lead and what happened to it").
 * Reassignment/override actions are deliberately not built here yet; see
 * COMPLIANCE_AND_SAFETY.md §5.
 */
export default async function AdminLeadsPage() {
  const supabase = createSupabaseServerClient();

  const { data: rows, error } = await supabase
    .from("lead_tracking")
    .select("id, status, assigned_at, lead_cost, commission_amount, leads(full_name, suburb, state, service_type), professionals(business_name)")
    .order("assigned_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">All leads</h1>
      <p className="mb-4 text-sm text-ink-500">Platform-wide view for dispute resolution. Most recent 200 shares.</p>

      {error && <p className="text-sm text-red-600">Couldn’t load leads: {error.message}</p>}

      <div className="overflow-hidden rounded-lg border border-ink-700/10">
        <table className="w-full text-sm">
          <thead className="bg-ink-900/[0.02] text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Consumer</th>
              <th className="px-4 py-3">Professional</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Lead cost</th>
              <th className="px-4 py-3">Commission</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((row) => {
              const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads;
              const professional = Array.isArray(row.professionals) ? row.professionals[0] : row.professionals;
              return (
                <tr key={row.id} className="border-t border-ink-700/10">
                  <td className="px-4 py-3">
                    {lead?.full_name ?? "—"}
                    <span className="block text-xs text-ink-500">
                      {lead?.suburb}, {lead?.state}
                    </span>
                  </td>
                  <td className="px-4 py-3">{professional?.business_name ?? "—"}</td>
                  <td className="px-4 py-3">{lead ? categoryLabel(lead.service_type) : "—"}</td>
                  <td className="px-4 py-3">
                    <LeadStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">${row.lead_cost.toFixed(2)}</td>
                  <td className="px-4 py-3">{row.commission_amount !== null ? `$${row.commission_amount.toFixed(2)}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
