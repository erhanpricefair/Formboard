"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { referClientToPartner } from "@/actions/broker";

export interface PartnerOption {
  id: string;
  businessName: string;
  partnerType: string;
}

export function ReferToPartnerForm({
  investorId,
  partners,
}: {
  investorId: string;
  partners: PartnerOption[];
}) {
  const router = useRouter();
  const [partnerId, setPartnerId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await referClientToPartner(investorId, partnerId, note);
      if (result.error) {
        setError(result.error);
        return;
      }
      setPartnerId("");
      setNote("");
      router.refresh();
    });
  }

  if (partners.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        No service partners in the directory yet — ask an admin to add one.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="sm:max-w-xs">
        <option value="" disabled>
          Select a partner
        </option>
        {partners.map((p) => (
          <option key={p.id} value={p.id}>
            {p.businessName} ({p.partnerType.replace(/_/g, " ")})
          </option>
        ))}
      </Select>
      <Input
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="flex-1"
      />
      <Button variant="outline" onClick={submit} disabled={isPending || !partnerId}>
        {isPending ? "Referring…" : "Refer"}
      </Button>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
