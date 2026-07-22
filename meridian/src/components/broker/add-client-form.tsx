"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addClientByEmail } from "@/actions/broker";

export function AddClientForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await addClientByEmail(email);
      if (res.error) {
        setError(res.error);
        return;
      }
      setEmail("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        <Input
          type="email"
          placeholder="client@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
      </div>
      <Button variant="outline" onClick={submit} disabled={isPending || !email}>
        {isPending ? "Linking…" : "Link existing investor"}
      </Button>
    </div>
  );
}
