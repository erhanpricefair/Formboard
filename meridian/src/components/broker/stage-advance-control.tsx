"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { advanceJourneyStage } from "@/actions/broker";
import type { SettlementStage } from "@/types/database";

const STAGE_LABELS: Record<SettlementStage, string> = {
  investor_enquiry: "Investor Enquiry",
  strategy_consultation: "Strategy Consultation",
  finance_assessment: "Finance Assessment",
  property_selection: "Property Selection",
  contract_signed: "Contract Signed",
  construction_updates: "Construction Update",
  settlement_preparation: "Settlement Preparation",
  handover: "Handover",
  property_management: "Property Management",
};

export function StageAdvanceControl({
  journeyId,
  nextStage,
}: {
  journeyId: string;
  nextStage: SettlementStage;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function advance() {
    setError(null);
    startTransition(async () => {
      try {
        await advanceJourneyStage(journeyId, nextStage, note || undefined);
        setNote("");
        router.refresh();
      } catch {
        setError("Could not advance the journey. Please try again.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <p className="text-sm font-medium text-[var(--color-ink)]">
        Mark as: {STAGE_LABELS[nextStage]}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Optional note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="flex-1"
        />
        <Button variant="accent" size="sm" onClick={advance} disabled={isPending}>
          {isPending ? "Updating…" : "Advance"}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
