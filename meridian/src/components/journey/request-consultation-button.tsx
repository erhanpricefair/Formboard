"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requestConsultation } from "@/actions/settlement-accelerator";

export function RequestConsultationButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await requestConsultation();
      router.refresh();
    });
  }

  return (
    <Button variant="accent" onClick={handleClick} disabled={isPending}>
      {isPending ? "Requesting…" : "Book a consultation"}
    </Button>
  );
}
