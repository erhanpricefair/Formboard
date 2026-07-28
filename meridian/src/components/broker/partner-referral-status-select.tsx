"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePartnerReferralStatus } from "@/actions/broker";
import type { PartnerReferralStatus } from "@/types/database";

const STATUSES: PartnerReferralStatus[] = ["recommended", "contacted", "engaged", "completed", "declined"];

export function PartnerReferralStatusSelect({
  referralId,
  investorId,
  status,
}: {
  referralId: string;
  investorId: string;
  status: PartnerReferralStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as PartnerReferralStatus;
        startTransition(async () => {
          await updatePartnerReferralStatus(referralId, next, investorId);
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
