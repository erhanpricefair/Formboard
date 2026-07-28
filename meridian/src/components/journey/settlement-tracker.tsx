import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SettlementStage } from "@/types/database";

const STAGES: { key: SettlementStage; label: string }[] = [
  { key: "investor_enquiry", label: "Investor Enquiry" },
  { key: "strategy_consultation", label: "Strategy Consultation" },
  { key: "finance_assessment", label: "Finance Assessment" },
  { key: "property_selection", label: "Property Selection" },
  { key: "contract_signed", label: "Contract Signed" },
  { key: "construction_updates", label: "Construction Updates" },
  { key: "settlement_preparation", label: "Settlement Preparation" },
  { key: "handover", label: "Handover" },
  { key: "property_management", label: "Property Management" },
];

export function SettlementTracker({ currentStage }: { currentStage: SettlementStage | null }) {
  const currentIndex = currentStage ? STAGES.findIndex((s) => s.key === currentStage) : -1;

  return (
    <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-9">
      {STAGES.map((stage, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <li key={stage.key} className="flex flex-col items-start gap-2 lg:items-center lg:text-center">
            <span
              className={cn(
                "flex h-8 w-8 flex-none items-center justify-center rounded-full border text-xs font-semibold",
                isDone && "border-[var(--color-accent)] bg-[var(--color-accent)] text-white",
                isCurrent && "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]",
                !isDone && !isCurrent && "border-[var(--color-border)] text-[var(--color-muted)]"
              )}
            >
              {isDone ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                isCurrent ? "text-[var(--color-ink)]" : "text-[var(--color-muted)]"
              )}
            >
              {stage.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
