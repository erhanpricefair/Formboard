"use client";

import { useTransition } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleSavedListing } from "@/actions/listings";

export function SaveListingButton({
  listingId,
  isSaved,
}: {
  listingId: string;
  isSaved: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(() => toggleSavedListing(listingId, !isSaved));
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} disabled={isPending}>
      <Heart
        className={cn("h-4 w-4", isSaved ? "fill-[var(--color-accent)] text-[var(--color-accent)]" : "")}
      />
      {isSaved ? "Saved" : "Save"}
    </Button>
  );
}
