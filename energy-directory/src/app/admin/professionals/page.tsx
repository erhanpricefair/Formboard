import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { categoryLabel } from "@/lib/categories";
import type { ProfessionalStatus } from "@/lib/types/database";

const STATUS_STYLES: Record<ProfessionalStatus, string> = {
  pending_verification: "bg-amber-50 text-amber-700 border-amber-200",
  verified: "bg-brand-50 text-brand-700 border-brand-100",
  suspended: "bg-red-50 text-red-700 border-red-200",
  rejected: "bg-ink-900/5 text-ink-500 border-ink-700/10",
};

export default async function AdminProfessionalsPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = createSupabaseServerClient();
  const statusFilter = (searchParams.status as ProfessionalStatus | "all" | undefined) ?? "pending_verification";

  let query = supabase.from("professionals").select("*").order("created_at", { ascending: false });
  if (statusFilter !== "all") {
    query = query.eq("verification_status", statusFilter);
  }
  const { data: professionals, error } = await query;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Professionals</h1>
      <p className="mb-4 text-sm text-ink-500">Verify ABN/license details before a profile can appear in the public directory.</p>

      <div className="mb-4 flex gap-2 text-sm">
        {(["pending_verification", "verified", "suspended", "rejected", "all"] as const).map((s) => (
          <Link
            key={s}
            href={`/admin/professionals?status=${s}`}
            className={`rounded-full border px-3 py-1 ${statusFilter === s ? "border-brand-600 bg-brand-50 text-brand-700" : "border-ink-700/20"}`}
          >
            {s === "all" ? "All" : s.replace("_", " ")}
          </Link>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">Couldn’t load professionals: {error.message}</p>}

      <div className="space-y-3">
        {(professionals ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/admin/professionals/${p.id}`}
            className="block rounded-lg border border-ink-700/10 p-4 hover:border-brand-500"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium">{p.business_name}</p>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[p.verification_status]}`}>
                {p.verification_status.replace("_", " ")}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-500">
              ABN {p.abn} · {p.suburb}, {p.state} {p.postcode}
            </p>
            <p className="mt-1 text-xs text-ink-500">{p.categories.map(categoryLabel).join(", ")}</p>
          </Link>
        ))}
        {professionals && professionals.length === 0 && <p className="text-sm text-ink-500">No professionals in this state.</p>}
      </div>
    </div>
  );
}
