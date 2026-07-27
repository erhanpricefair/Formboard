"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setBrokerActive } from "@/actions/admin";

export function BrokerActiveToggle({
  brokerId,
  isActive,
}: {
  brokerId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await setBrokerActive(brokerId, !isActive);
      router.refresh();
    });
  }

  return (
    <Button
      variant={isActive ? "outline" : "accent"}
      size="sm"
      onClick={toggle}
      disabled={isPending}
    >
      {isPending ? "Saving…" : isActive ? "Deactivate" : "Approve"}
    </Button>
  );
}
