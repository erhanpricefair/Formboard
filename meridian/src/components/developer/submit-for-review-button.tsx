"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { submitListingForReview } from "@/actions/developer";

export function SubmitForReviewButton({
  listingId,
  projectId,
}: {
  listingId: string;
  projectId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      await submitListingForReview(listingId, projectId);
      router.refresh();
    });
  }

  return (
    <Button variant="accent" onClick={submit} disabled={isPending}>
      {isPending ? "Submitting…" : "Submit for admin review"}
    </Button>
  );
}
