import type { LeadTrackingStatus } from "@/lib/types/database";

const STYLES: Record<LeadTrackingStatus, string> = {
  New: "bg-blue-50 text-blue-700 border-blue-200",
  Contacted: "bg-amber-50 text-amber-700 border-amber-200",
  Inspection: "bg-purple-50 text-purple-700 border-purple-200",
  Completed: "bg-brand-50 text-brand-700 border-brand-100",
};

export function LeadStatusBadge({ status }: { status: LeadTrackingStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {status}
    </span>
  );
}
