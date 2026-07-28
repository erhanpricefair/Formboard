import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { LeadStatusSelect } from "@/components/admin/lead-status-select";
import type { LeadStatus } from "@/types/database";

const STATUS_VARIANT: Record<LeadStatus, "default" | "accent" | "outline" | "success" | "warning"> = {
  new: "warning",
  contacted: "accent",
  converted: "success",
  archived: "outline",
};

export default async function AdminLeadsPage() {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("id, full_name, email, phone, message, source, status, utm_source, utm_campaign, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">Leads</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Enquiries captured from InvestorSource and connected lead-generation sites.
      </p>

      {(leads ?? []).length === 0 ? (
        <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-white p-6 text-sm text-[var(--color-muted)]">
          No leads captured yet.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                <th className="p-4 text-left font-medium text-[var(--color-muted)]">Received</th>
                <th className="p-4 text-left font-medium text-[var(--color-muted)]">Name</th>
                <th className="p-4 text-left font-medium text-[var(--color-muted)]">Contact</th>
                <th className="p-4 text-left font-medium text-[var(--color-muted)]">Source</th>
                <th className="p-4 text-left font-medium text-[var(--color-muted)]">Message</th>
                <th className="p-4 text-left font-medium text-[var(--color-muted)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {(leads ?? []).map((lead) => (
                <tr key={lead.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="p-4 whitespace-nowrap text-[var(--color-muted)]">
                    {new Date(lead.created_at).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-4 font-medium text-[var(--color-ink)]">
                    {lead.full_name ?? "—"}
                  </td>
                  <td className="p-4">
                    <p className="text-[var(--color-ink)]">{lead.email ?? "—"}</p>
                    <p className="text-xs text-[var(--color-muted)]">{lead.phone ?? ""}</p>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">{lead.source}</Badge>
                    {(lead.utm_source || lead.utm_campaign) && (
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {lead.utm_source ?? "—"} / {lead.utm_campaign ?? "—"}
                      </p>
                    )}
                  </td>
                  <td className="max-w-xs p-4 text-[var(--color-muted)]">
                    {lead.message ? (
                      <span className="line-clamp-3">{lead.message}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANT[lead.status]}>{lead.status}</Badge>
                      <LeadStatusSelect leadId={lead.id} status={lead.status} />
                    </div>
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
