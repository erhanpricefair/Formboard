"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { shareListingWithClient } from "@/actions/broker";

export function ShareListingForm({
  investorId,
  listings,
}: {
  investorId: string;
  listings: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [listingId, setListingId] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!listingId) return;
    startTransition(async () => {
      await shareListingWithClient(investorId, listingId);
      setListingId("");
      router.refresh();
    });
  }

  if (listings.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="flex-1">
        <Select value={listingId} onChange={(e) => setListingId(e.target.value)}>
          <option value="">Share a listing directly…</option>
          {listings.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </Select>
      </div>
      <Button variant="outline" size="sm" onClick={submit} disabled={isPending || !listingId}>
        {isPending ? "Sharing…" : "Share"}
      </Button>
    </div>
  );
}
