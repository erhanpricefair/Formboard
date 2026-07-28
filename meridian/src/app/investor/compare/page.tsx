import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function ComparePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: saved } = await supabase
    .from("saved_listings")
    .select(
      "listing:listing_id(id, title, price, deposit_required, expected_yield, land_size_sqm, build_size_sqm, property_type, suburbs:suburb_id(name, state))"
    )
    .eq("investor_id", user.id)
    .limit(4);

  type Row = {
    listing: {
      id: string;
      title: string;
      price: number;
      deposit_required: number;
      expected_yield: number;
      land_size_sqm: number;
      build_size_sqm: number;
      property_type: string;
      suburbs: { name: string; state: string } | { name: string; state: string }[] | null;
    } | null;
  };

  const listings = ((saved as Row[] | null) ?? []).map((s) => s.listing).filter((l): l is NonNullable<typeof l> => l !== null);

  const attributes: { label: string; render: (l: (typeof listings)[number]) => string }[] = [
    {
      label: "Location",
      render: (l) => {
        const suburb = Array.isArray(l.suburbs) ? l.suburbs[0] : l.suburbs;
        return `${suburb?.name ?? "—"}, ${suburb?.state ?? ""}`;
      },
    },
    { label: "Property type", render: (l) => l.property_type },
    { label: "Price", render: (l) => formatCurrency(Number(l.price)) },
    { label: "Deposit required", render: (l) => formatCurrency(Number(l.deposit_required)) },
    { label: "Estimated yield", render: (l) => formatPercent(Number(l.expected_yield)) },
    { label: "Land size", render: (l) => `${l.land_size_sqm} sqm` },
    { label: "Build size", render: (l) => `${l.build_size_sqm} sqm` },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">Compare properties</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Comparing up to 4 of your saved properties side by side.
      </p>

      {listings.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <p className="text-sm text-[var(--color-muted)]">
              Save at least two properties to compare them here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                <th className="p-4 text-left font-medium text-[var(--color-muted)]">Attribute</th>
                {listings.map((l) => (
                  <th key={l.id} className="p-4 text-left font-semibold text-[var(--color-ink)]">
                    {l.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr) => (
                <tr key={attr.label} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="p-4 font-medium text-[var(--color-muted)]">{attr.label}</td>
                  {listings.map((l) => (
                    <td key={l.id} className="p-4 text-[var(--color-ink)]">
                      {attr.render(l)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
