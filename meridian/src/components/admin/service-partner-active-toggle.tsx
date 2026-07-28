"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setServicePartnerActive } from "@/actions/admin";

export function ServicePartnerActiveToggle({
  partnerId,
  isActive,
}: {
  partnerId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await setServicePartnerActive(partnerId, !isActive);
      router.refresh();
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} disabled={isPending}>
      {isPending ? "Saving…" : isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
