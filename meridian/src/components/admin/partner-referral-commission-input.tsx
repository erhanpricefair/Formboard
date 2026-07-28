"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setPartnerReferralCommission } from "@/actions/admin";

export function PartnerReferralCommissionInput({
  referralId,
  commissionAmount,
}: {
  referralId: string;
  commissionAmount: number | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(commissionAmount?.toString() ?? "");
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await setPartnerReferralCommission(referralId, Number(value) || 0);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="0"
        className="h-8 w-24"
      />
      <Button variant="outline" size="sm" onClick={save} disabled={isPending}>
        {isPending ? "…" : "Save"}
      </Button>
    </div>
  );
}
