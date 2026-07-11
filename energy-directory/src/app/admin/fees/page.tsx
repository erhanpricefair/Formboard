import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FeeActions } from "@/components/admin/FeeActions";
import type { FeeStatus } from "@/lib/types/database";

const STATUS_STYLES: Record<FeeStatus, string> = {
  pending: "bg-blue-50 text-blue-700 border-blue-200",
  invoiced: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-brand-50 text-brand-700 border-brand-100",
  disputed: "bg-red-50 text-red-700 border-red-200",
  waived: "bg-ink-900/5 text-ink-500 border-ink-700/10",
};

export default async function AdminFeesPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = createSupabaseServerClient();
  const statusFilter = (searchParams.status as FeeStatus | "all" | undefined) ?? "pending";

  let query = supabase
    .from("fee_transactions")
    .select("*, professionals(business_name), lead_tracking(id, status, leads(full_name, service_type))")
    .order("created_at", { ascending: false });
  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }
  const { data: fees, error } = await query;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Fees</h1>
      <p className="mb-4 text-sm text-ink-500">
        Reconcile lead fees and success commissions. Self-reported completion values are provisional until invoiced here.
      </p>

      <div className="mb-4 flex gap-2 text-sm">
        {(["pending", "invoiced", "paid", "disputed", "waived", "all"] as const).map((s) => (
          <Link
            key={s}
            href={`/admin/fees?status=${s}`}
            className={`rounded-full border px-3 py-1 ${statusFilter === s ? "border-brand-600 bg-brand-50 text-brand-700" : "border-ink-700/20"}`}
          >
            {s === "all" ? "All" : s}
          </Link>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">Couldn’t load fees: {error.message}</p>}

      <div className="space-y-3">
        {(fees ?? []).map((fee) => {
          const professional = Array.isArray(fee.professionals) ? fee.professionals[0] : fee.professionals;
          const tracking = Array.isArray(fee.lead_tracking) ? fee.lead_tracking[0] : fee.lead_tracking;
          const lead = tracking ? (Array.isArray(tracking.leads) ? tracking.leads[0] : tracking.leads) : null;

          return (
            <div key={fee.id} className="rounded-lg border border-ink-700/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {professional?.business_name ?? "Unknown professional"} — {fee.fee_type === "lead_fee" ? "Lead fee" : "Success commission"}
                  </p>
                  <p className="text-sm text-ink-500">
                    {lead?.full_name ?? "Unknown lead"} · tracking status: {tracking?.status ?? "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${fee.amount.toFixed(2)}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[fee.status]}`}>{fee.status}</span>
                </div>
              </div>
              {fee.dispute_reason && <p className="mt-2 text-xs text-red-600">Dispute: {fee.dispute_reason}</p>}
              <div className="mt-3">
                <FeeActions feeId={fee.id} status={fee.status} />
              </div>
            </div>
          );
        })}
        {fees && fees.length === 0 && <p className="text-sm text-ink-500">No fee transactions in this state.</p>}
      </div>
    </div>
  );
}
