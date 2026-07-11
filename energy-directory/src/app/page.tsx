import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { categoryLabel } from "@/lib/categories";
import type { ProfessionalCategory } from "@/lib/types/database";

export const revalidate = 60;

export default async function DirectoryHomePage({
  searchParams,
}: {
  searchParams: { category?: string; postcode?: string };
}) {
  const supabase = createSupabaseServerClient();

  let query = supabase.from("public_professional_directory").select("*").order("business_name");
  if (searchParams.category) {
    query = query.contains("categories", [searchParams.category]);
  }
  if (searchParams.postcode) {
    query = query.or(`postcode.eq.${searchParams.postcode},service_area_postcodes.cs.{${searchParams.postcode}}`);
  }

  const { data: professionals, error } = await query;

  return (
    <div>
      <section className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Find a home energy &amp; retrofit professional</h1>
        <p className="mt-2 max-w-2xl text-ink-500">
          Browse verified solar, battery, heat pump, insulation and electrification professionals across Australia.
          Compare profiles and send an enquiry directly — no obligation, no cost to you.
        </p>
      </section>

      <form className="mb-8 flex flex-wrap gap-3 rounded-lg border border-ink-700/10 bg-ink-900/[0.02] p-4" method="get">
        <select name="category" defaultValue={searchParams.category ?? ""} className="rounded-md border border-ink-700/20 px-3 py-2 text-sm">
          <option value="">All categories</option>
          {(
            [
              "solar_pv",
              "battery_storage",
              "heat_pump_hot_water",
              "heat_pump_space_heating",
              "induction_cooktop",
              "ceiling_wall_insulation",
              "double_glazing",
              "draught_sealing",
              "ev_charger",
              "home_energy_assessment",
              "electrification_general",
            ] as ProfessionalCategory[]
          ).map((c) => (
            <option key={c} value={c}>
              {categoryLabel(c)}
            </option>
          ))}
        </select>
        <input
          name="postcode"
          defaultValue={searchParams.postcode ?? ""}
          placeholder="Postcode"
          className="w-32 rounded-md border border-ink-700/20 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white">
          Search
        </button>
      </form>

      {error && <p className="text-sm text-red-600">Couldn’t load professionals right now. Please try again shortly.</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {(professionals ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/professionals/${p.id}`}
            className="block rounded-lg border border-ink-700/10 p-5 transition hover:border-brand-500 hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <h2 className="font-semibold">{p.business_name}</h2>
              {p.is_verified && (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">Verified</span>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-500">
              {p.suburb}, {p.state} {p.postcode}
            </p>
            <p className="mt-2 flex flex-wrap gap-1">
              {p.categories.slice(0, 3).map((c) => (
                <span key={c} className="rounded-full bg-ink-900/5 px-2 py-0.5 text-xs text-ink-700">
                  {categoryLabel(c)}
                </span>
              ))}
            </p>
            {p.tagline && <p className="mt-3 text-sm text-ink-700">{p.tagline}</p>}
          </Link>
        ))}
      </div>

      {professionals && professionals.length === 0 && (
        <p className="text-sm text-ink-500">No professionals match that search yet. Try a different category or postcode.</p>
      )}
    </div>
  );
}
