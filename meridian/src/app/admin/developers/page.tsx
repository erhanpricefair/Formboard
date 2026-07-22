import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export default async function AdminDevelopersPage() {
  const supabase = await createClient();

  const { data: developers } = await supabase
    .from("developers")
    .select("id, legal_name, trading_name, abn, is_active")
    .order("created_at", { ascending: false });

  const ids = (developers ?? []).map((d) => d.id);
  const { data: projects } =
    ids.length > 0
      ? await supabase.from("projects").select("id, developer_id").in("developer_id", ids)
      : { data: [] as { id: string; developer_id: string }[] };

  const projectIds = (projects ?? []).map((p) => p.id);
  const { data: listingStatusRows } =
    projectIds.length > 0
      ? await supabase.from("listings").select("project_id, status").in("project_id", projectIds)
      : { data: [] as { project_id: string; status: string }[] };

  const projectToDeveloper = new Map((projects ?? []).map((p) => [p.id, p.developer_id]));
  const publishedCountByDeveloper = new Map<string, number>();
  for (const row of listingStatusRows ?? []) {
    if (row.status !== "published") continue;
    const devId = projectToDeveloper.get(row.project_id);
    if (!devId) continue;
    publishedCountByDeveloper.set(devId, (publishedCountByDeveloper.get(devId) ?? 0) + 1);
  }
  const projectCountByDeveloper = new Map<string, number>();
  for (const p of projects ?? []) {
    projectCountByDeveloper.set(p.developer_id, (projectCountByDeveloper.get(p.developer_id) ?? 0) + 1);
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">Developers</h1>

      <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <th className="p-4 text-left font-medium text-[var(--color-muted)]">Developer</th>
              <th className="p-4 text-left font-medium text-[var(--color-muted)]">ABN</th>
              <th className="p-4 text-left font-medium text-[var(--color-muted)]">Projects</th>
              <th className="p-4 text-left font-medium text-[var(--color-muted)]">Published listings</th>
              <th className="p-4 text-left font-medium text-[var(--color-muted)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {(developers ?? []).map((dev) => (
              <tr key={dev.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="p-4 font-medium text-[var(--color-ink)]">
                  {dev.trading_name ?? dev.legal_name}
                </td>
                <td className="p-4 text-[var(--color-muted)]">{dev.abn}</td>
                <td className="p-4 text-[var(--color-ink)]">{projectCountByDeveloper.get(dev.id) ?? 0}</td>
                <td className="p-4 text-[var(--color-ink)]">{publishedCountByDeveloper.get(dev.id) ?? 0}</td>
                <td className="p-4">
                  <Badge variant={dev.is_active ? "success" : "outline"}>
                    {dev.is_active ? "Active" : "Suspended"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
