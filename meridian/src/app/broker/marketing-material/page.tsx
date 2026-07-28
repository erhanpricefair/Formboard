import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export default async function MarketingMaterialPage() {
  const supabase = await createClient();
  const { data: developers } = await supabase
    .from("developers")
    .select("id, legal_name, trading_name")
    .eq("is_active", true)
    .order("legal_name");

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">Marketing material</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Developer-supplied logos and collateral, organised by developer. Individual asset uploads
        and downloads land with the developer portal&rsquo;s document-management work.
      </p>

      {!developers || developers.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="pt-6 text-sm text-[var(--color-muted)]">
            No developer partners yet.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {developers.map((d) => (
            <Card key={d.id}>
              <CardContent className="pt-6">
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {d.trading_name ?? d.legal_name}
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">No assets uploaded yet.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
