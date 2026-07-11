"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FeeStatus } from "@/lib/types/database";

const NEXT_STATUS: Partial<Record<FeeStatus, FeeStatus[]>> = {
  pending: ["invoiced", "disputed", "waived"],
  invoiced: ["paid", "disputed"],
  paid: ["disputed"],
  disputed: ["pending", "invoiced", "paid", "waived"],
};

export function FeeActions({ feeId, status }: { feeId: string; status: FeeStatus }) {
  const router = useRouter();
  const [target, setTarget] = useState<FeeStatus | null>(null);
  const [invoiceReference, setInvoiceReference] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = NEXT_STATUS[status] ?? [];
  if (options.length === 0) return null;

  async function submit() {
    if (!target) return;
    setPending(true);
    setError(null);
    const res = await fetch(`/api/admin/fees/${feeId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: target,
        invoiceReference: invoiceReference || undefined,
        disputeReason: target === "disputed" ? disputeReason : undefined,
      }),
    });
    const payload = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(payload.error ?? "Couldn’t update fee status.");
      return;
    }
    setTarget(null);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setTarget(s)}
            className={`rounded-md border px-3 py-1 text-xs font-medium ${target === s ? "border-brand-600 bg-brand-50 text-brand-700" : "border-ink-700/20"}`}
          >
            {s}
          </button>
        ))}
      </div>
      {target && (
        <div className="space-y-2 rounded-md border border-ink-700/10 p-3">
          {target === "invoiced" && (
            <input
              value={invoiceReference}
              onChange={(e) => setInvoiceReference(e.target.value)}
              placeholder="Invoice reference"
              className="w-full rounded-md border border-ink-700/20 px-2 py-1 text-sm"
            />
          )}
          {target === "disputed" && (
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Dispute reason (required)"
              rows={2}
              className="w-full rounded-md border border-ink-700/20 px-2 py-1 text-sm"
            />
          )}
          <button
            type="button"
            disabled={pending || (target === "disputed" && !disputeReason)}
            onClick={submit}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {pending ? "Saving…" : `Confirm: ${target}`}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
