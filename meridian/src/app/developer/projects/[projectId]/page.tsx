import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDeveloperId } from "@/lib/developer/get-developer-id";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "outline" | "success" | "warning"> = {
  draft: "outline",
  pending_review: "warning",
  approved: "success",
  published: "success",
  rejected: "outline",
  paused: "outline",
  archived: "outline",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const developerId = await getDeveloperId(supabase, user.id);
  if (!developerId) notFound();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, developer_id, primary_state, primary_suburb")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.developer_id !== developerId) notFound();

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, status, price, rejection_reason")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">{project.name}</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {project.primary_suburb ? `${project.primary_suburb}, ` : ""}
            {project.primary_state}
          </p>
        </div>
        <Link href={`/developer/projects/${projectId}/listings/new`}>
          <Button variant="accent">Add listing</Button>
        </Link>
      </div>

      {!listings || listings.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-[var(--color-muted)]">
            No listings in this project yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {listings.map((l) => (
            <Link key={l.id} href={`/developer/projects/${projectId}/listings/${l.id}/edit`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{l.title}</p>
                    <Badge variant={STATUS_VARIANT[l.status]} className="capitalize">
                      {l.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    {formatCurrency(Number(l.price))}
                  </p>
                  {l.status === "rejected" && l.rejection_reason && (
                    <p className="mt-2 text-xs text-red-700">Rejected: {l.rejection_reason}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
