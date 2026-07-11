"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadTrackingStatus } from "@/lib/types/database";

const NEXT_STATUS: Partial<Record<LeadTrackingStatus, LeadTrackingStatus[]>> = {
  New: ["Contacted"],
  Contacted: ["Inspection", "Completed"],
  Inspection: ["Completed"],
};

export function LeadStatusUpdater({ trackingId, currentStatus }: { trackingId: string; currentStatus: LeadTrackingStatus }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [outcomeValue, setOutcomeValue] = useState("");
  const [pendingStatus, setPendingStatus] = useState<LeadTrackingStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextOptions = NEXT_STATUS[currentStatus] ?? [];

  async function submit(status: LeadTrackingStatus) {
    setSubmitting(true);
    setError(null);

    const body: Record<string, unknown> = { status, note: note || undefined };
    if (status === "Completed" && outcomeValue) {
      body.outcomeValue = Number(outcomeValue);
    }

    const res = await fetch(`/api/leads/tracking/${trackingId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(payload.error ?? "Couldn't update status.");
      return;
    }
    setPendingStatus(null);
    router.refresh();
  }

  if (currentStatus === "Completed") {
    return <p className="text-sm text-ink-500">This lead is marked Completed. No further status changes are possible.</p>;
  }

  if (nextOptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border border-ink-700/10 p-4">
      <p className="text-sm font-medium">Move this lead forward</p>
      <div className="flex gap-2">
        {nextOptions.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setPendingStatus(status)}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              pendingStatus === status ? "border-brand-600 bg-brand-50 text-brand-700" : "border-ink-700/20"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {pendingStatus && (
        <div className="space-y-2 border-t border-ink-700/10 pt-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note (e.g. inspection date, contact outcome)"
            rows={2}
            className="w-full rounded-md border border-ink-700/20 px-3 py-2 text-sm"
          />
          {pendingStatus === "Completed" && (
            <div>
              <label className="text-xs text-ink-500">
                Self-reported deal value (AUD, optional — used to calculate your commission, subject to admin
                verification)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={outcomeValue}
                onChange={(e) => setOutcomeValue(e.target.value)}
                className="mt-1 w-full rounded-md border border-ink-700/20 px-3 py-2 text-sm"
              />
            </div>
          )}
          <button
            type="button"
            disabled={submitting}
            onClick={() => submit(pendingStatus)}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Saving…" : `Confirm: ${pendingStatus}`}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
