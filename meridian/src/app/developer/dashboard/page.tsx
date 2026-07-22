import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDeveloperId } from "@/lib/developer/get-developer-id";
import { Card, CardContent } from "@/components/ui/card";

export default async function DeveloperDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const developerId = await getDeveloperId(supabase, user.id);

  if (!developerId) {
    return (
      <div>
        <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">
          Developer dashboard
        </h1>
        <Card className="mt-6">
          <CardContent className="pt-6 text-sm text-[var(--color-muted)]">
            Your account isn&rsquo;t linked to a developer company yet — contact Meridian to
            complete setup.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: projectIds } = await supabase.from("projects").select("id").eq("developer_id", developerId);
  const ids = (projectIds ?? []).map((p) => p.id);

  const counts: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: statusRows } = await supabase.from("listings").select("status").in("project_id", ids);
    for (const row of statusRows ?? []) {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
    }
  }

  const stats = [
    { label: "Projects", value: ids.length },
    { label: "Published listings", value: counts.published ?? 0 },
    { label: "Pending review", value: counts.pending_review ?? 0 },
    { label: "Draft", value: counts.draft ?? 0 },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">Developer dashboard</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Submit house-and-land packages for admin review — nothing reaches investors until it&rsquo;s
        approved and published.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">
                {stat.label}
              </p>
              <p className="mt-2 font-serif text-3xl font-medium text-[var(--color-ink)]">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Link href="/developer/projects" className="mt-6 inline-block text-sm font-medium text-[var(--color-accent-ink)] hover:underline">
        View all projects →
      </Link>
    </div>
  );
}
