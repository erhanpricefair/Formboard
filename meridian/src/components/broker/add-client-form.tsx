"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addClientByEmail } from "@/actions/broker";
import { AddNewClientForm } from "@/components/broker/add-new-client-form";
import { cn } from "@/lib/utils";

function LinkExistingClientForm() {
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

export function AddClientForm() {
  const [mode, setMode] = useState<"new" | "existing">("new");

  return (
    <div>
      <div className="mb-4 flex gap-2 border-b border-[var(--color-border)]">
        <TabButton active={mode === "new"} onClick={() => setMode("new")}>
          Add a new client
        </TabButton>
        <TabButton active={mode === "existing"} onClick={() => setMode("existing")}>
          Link existing investor
        </TabButton>
      </div>

      {mode === "new" ? (
        <AddNewClientForm />
      ) : (
        <>
          <p className="mb-3 text-sm text-[var(--color-muted)]">
            Use this only if the client already has an InvestorSource account (e.g. they onboarded
            via your referral link separately). Otherwise, add them as a new client above.
          </p>
          <LinkExistingClientForm />
        </>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mb-px border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
        active
          ? "border-[var(--color-accent)] text-[var(--color-ink)]"
          : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"
      )}
    >
      {children}
    </button>
  );
}
