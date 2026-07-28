"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStatus } from "@/actions/admin";
import type { LeadStatus } from "@/types/database";

const STATUSES: LeadStatus[] = ["new", "contacted", "converted", "archived"];

export function LeadStatusSelect({
  leadId,
  status,
}: {
  leadId: string;
  status: LeadStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as LeadStatus;
        startTransition(async () => {
          await updateLeadStatus(leadId, next);
          router.refresh();
        });
      }}
      className="rounded-md border border-[var(--color-border)] bg-white px-2 py-1 text-sm text-[var(--color-ink)] disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
