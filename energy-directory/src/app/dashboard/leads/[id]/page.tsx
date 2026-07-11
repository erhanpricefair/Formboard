import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import { LeadStatusUpdater } from "@/components/dashboard/LeadStatusUpdater";
import { categoryLabel } from "@/lib/categories";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();

  const { data: tracking } = await supabase
    .from("lead_tracking")
    .select("*, leads(full_name, email, phone, suburb, state, postcode, service_type, project_details)")
    .eq("id", params.id)
    .maybeSingle();

  if (!tracking) notFound();

  const { data: audit } = await supabase
    .from("lead_status_audit")
    .select("previous_status, new_status, changed_at, changed_by_role, note")
    .eq("lead_tracking_id", params.id)
    .order("changed_at", { ascending: true });

  const lead = Array.isArray(tracking.leads) ? tracking.leads[0] : tracking.leads;

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{lead?.full_name}</h1>
          <LeadStatusBadge status={tracking.status} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-ink-500">Email</dt>
            <dd>{lead?.email}</dd>
          </div>
          <div>
            <dt className="text-ink-500">Phone</dt>
            <dd>{lead?.phone}</dd>
          </div>
          <div>
            <dt className="text-ink-500">Location</dt>
            <dd>
              {lead?.suburb}, {lead?.state} {lead?.postcode}
            </dd>
          </div>
          <div>
            <dt className="text-ink-500">Service</dt>
            <dd>{lead ? categoryLabel(lead.service_type) : "—"}</dd>
          </div>
        </dl>
        {lead?.project_details && (
          <div className="mt-4">
            <p className="text-sm text-ink-500">Project details</p>
            <p className="mt-1 whitespace-pre-line text-sm">{lead.project_details}</p>
          </div>
        )}

        <div className="mt-6">
          <LeadStatusUpdater trackingId={tracking.id} currentStatus={tracking.status} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">Billing</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-500">Lead cost</dt>
            <dd>${tracking.lead_cost.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-500">Commission</dt>
            <dd>{tracking.commission_amount !== null ? `$${tracking.commission_amount.toFixed(2)}` : "Pending completion"}</dd>
          </div>
        </dl>

        <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-ink-500">Audit trail</h2>
        <ol className="space-y-3 border-l border-ink-700/10 pl-4 text-sm">
          {(audit ?? []).map((a, i) => (
            <li key={i}>
              <p className="font-medium">
                {a.previous_status ? `${a.previous_status} → ${a.new_status}` : a.new_status}
              </p>
              <p className="text-xs text-ink-500">
                {new Date(a.changed_at).toLocaleString("en-AU")} · {a.changed_by_role}
              </p>
              {a.note && <p className="mt-0.5 text-xs text-ink-700">{a.note}</p>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
