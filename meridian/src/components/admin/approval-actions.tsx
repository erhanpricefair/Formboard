"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { approveAndPublishListing, rejectListing } from "@/actions/admin";

export function ApprovalActions({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [isPending, startTransition] = useTransition();

  function approve() {
    startTransition(async () => {
      await approveAndPublishListing(listingId);
      router.refresh();
    });
  }

  function reject() {
    if (!reason.trim()) return;
    startTransition(async () => {
      await rejectListing(listingId, reason);
      setReason("");
      setShowReject(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button variant="accent" size="sm" onClick={approve} disabled={isPending}>
          {isPending ? "Working…" : "Approve & publish"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowReject((v) => !v)} disabled={isPending}>
          Reject
        </Button>
      </div>
      {showReject && (
        <div className="flex gap-2">
          <Input
            placeholder="Reason for rejection"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button variant="outline" size="sm" onClick={reject} disabled={isPending || !reason.trim()}>
            Confirm
          </Button>
        </div>
      )}
    </div>
  );
}
