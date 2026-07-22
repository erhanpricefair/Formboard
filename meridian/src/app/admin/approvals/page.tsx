import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { ApprovalActions } from "@/components/admin/approval-actions";
import { formatCurrency } from "@/lib/utils";

export default async function ApprovalsPage() {
  const supabase = await createClient();

  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, title, price, submitted_at, property_type, project:project_id(name, developer:developer_id(legal_name, trading_name))"
    )
    .eq("status", "pending_review")
    .order("submitted_at", { ascending: true });

  type Row = {
    id: string;
    title: string;
    price: number;
    submitted_at: string | null;
    property_type: string;
    project:
      | {
          name: string;
          developer: { legal_name: string; trading_name: string | null } | { legal_name: string; trading_name: string | null }[] | null;
        }
      | {
          name: string;
          developer: { legal_name: string; trading_name: string | null } | { legal_name: string; trading_name: string | null }[] | null;
        }[]
      | null;
  };

  const rows = (listings as Row[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">Approval queue</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Nothing reaches an investor until it&rsquo;s approved here — the brand promise from the
          PRD.
        </p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-[var(--color-muted)]">
            Nothing pending review.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const project = Array.isArray(row.project) ? row.project[0] : row.project;
            const developer = project ? (Array.isArray(project.developer) ? project.developer[0] : project.developer) : null;
            return (
              <Card key={row.id}>
                <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{row.title}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {developer?.trading_name ?? developer?.legal_name ?? "Unknown developer"} ·{" "}
                      {project?.name} · {row.property_type}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {formatCurrency(Number(row.price))} · submitted{" "}
                      {row.submitted_at ? new Date(row.submitted_at).toLocaleDateString("en-AU") : "—"}
                    </p>
                  </div>
                  <ApprovalActions listingId={row.id} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
