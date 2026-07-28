"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { getListingBrochureUrl } from "@/actions/listings";

export function DownloadBrochureButton({ listingId }: { listingId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await getListingBrochureUrl(listingId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    });
  }

  return (
    <div className="flex-1">
      <Button
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? "Preparing…" : "Download brochure"}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
