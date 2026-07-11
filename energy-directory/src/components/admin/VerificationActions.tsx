"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProfessionalStatus } from "@/lib/types/database";

const ACTIONS: Partial<Record<ProfessionalStatus, { label: string; target: ProfessionalStatus; style: string }[]>> = {
  pending_verification: [
    { label: "Verify", target: "verified", style: "bg-brand-600 text-white" },
    { label: "Reject", target: "rejected", style: "border border-red-300 text-red-700" },
  ],
  verified: [{ label: "Suspend", target: "suspended", style: "border border-red-300 text-red-700" }],
  suspended: [
    { label: "Reinstate", target: "verified", style: "bg-brand-600 text-white" },
    { label: "Reject", target: "rejected", style: "border border-red-300 text-red-700" },
  ],
  rejected: [{ label: "Move back to pending", target: "pending_verification", style: "border border-ink-700/20" }],
};

export function VerificationActions({ professionalId, status }: { professionalId: string; status: ProfessionalStatus }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actions = ACTIONS[status] ?? [];

  async function apply(target: ProfessionalStatus) {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/admin/professionals/${professionalId}/verification`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: target }),
    });
    const payload = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(payload.error ?? "Couldn’t update status.");
      return;
    }
    router.refresh();
  }

  if (actions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {actions.map((a) => (
          <button
            key={a.target}
            type="button"
            disabled={pending}
            onClick={() => apply(a.target)}
            className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${a.style}`}
          >
            {a.label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
