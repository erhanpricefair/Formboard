import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDeveloperId } from "@/lib/developer/get-developer-id";
import { Card, CardContent } from "@/components/ui/card";
import { CreateProjectForm } from "@/components/developer/create-project-form";

export default async function DeveloperProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const developerId = await getDeveloperId(supabase, user.id);

  if (!developerId) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-[var(--color-muted)]">
          Your account isn&rsquo;t linked to a developer company yet — contact Meridian to
          complete setup.
        </CardContent>
      </Card>
    );
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, primary_state, primary_suburb")
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">Your projects</h1>

      <Card>
        <CardContent className="pt-6">
          <CreateProjectForm />
        </CardContent>
      </Card>

      {!projects || projects.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-[var(--color-muted)]">
            No projects yet — create one above.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/developer/projects/${p.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{p.name}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {p.primary_suburb ? `${p.primary_suburb}, ` : ""}
                    {p.primary_state}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
